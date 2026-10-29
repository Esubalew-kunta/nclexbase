"use client";

import { api, ApiError, apiMode } from "@/lib/api/client";
import { loadQuestionBank, useApiContent } from "@/lib/api/content";
import { useAdminStore } from "@/lib/admin/store";
import { useStore } from "@/lib/store";

/*
 * Real authentication, when there is an API to authenticate against.
 *
 * Sanctum keeps the session in a cookie, so nothing is stored in JavaScript and a page reload
 * stays signed in without the app persisting anything itself. With NEXT_PUBLIC_API_URL unset
 * these functions are not used at all and lib/demo.ts keeps its prototype behaviour.
 */

/** The user shape the API returns (UserResource). */
export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: "student" | "admin";
  status: string;
  plan: "free" | "premium";
  accessUntil: string | null;
  createdAt: string | null;
}

/** What a sign-in attempt tells the page: success, or something to show the person. */
export interface AuthResult {
  ok: boolean;
  message?: string;
  /** Field-level errors from Laravel validation, e.g. { email: ["..."] }. */
  errors?: Record<string, string[]>;
}

/**
 * Copy the API's user onto the stores the app reads.
 *
 * Whether someone may open /admin is decided by the `role` the API reports, not by which
 * button they pressed or what is typed into the admin login form. The admin area still keeps
 * its own session object, so that is filled in here from the authenticated user and cleared
 * for anyone who is not an admin. When the admin screens move onto the API they will read the
 * role directly and this bridge goes away.
 */
export function adoptUser(user: ApiUser): void {
  useStore.setState((s) => ({
    user: { ...s.user, name: user.name, email: user.email, plan: user.plan, signedIn: true },
  }));

  useAdminStore.setState({
    session: user.role === "admin"
      ? { email: user.email, name: user.name, at: new Date().toISOString() }
      : null,
  });
}

export async function login(email: string, password: string): Promise<AuthResult> {
  return attempt(async () => {
    const { data } = await api<{ data: ApiUser }>("/auth/login", { body: { email, password } });
    adoptUser(data);
    await loadQuestionBank();
  });
}

export async function register(input: { name?: string; email: string; password: string; ref?: string | null }): Promise<AuthResult> {
  return attempt(async () => {
    const { data } = await api<{ data: ApiUser }>("/auth/register", {
      body: {
        // The join form asks only for an email; the API wants a name, so the local part stands
        // in until the person sets one in their profile.
        name: input.name?.trim() || input.email.split("@")[0],
        email: input.email,
        password: input.password,
        ref: input.ref ?? undefined,
      },
    });
    adoptUser(data);
    await loadQuestionBank();
  });
}

export async function logout(): Promise<void> {
  try {
    await api("/auth/logout", { body: {} });
  } catch {
    // The session may already be gone; signing out locally is what matters.
  }
  useStore.setState((s) => ({ user: { ...s.user, signedIn: false } }));
  useAdminStore.setState({ session: null });
  useApiContent.setState({ questions: undefined });
}

/**
 * Who the cookie says we are. Called at boot so a refresh keeps the session, and so a
 * `signedIn` flag left in localStorage by the prototype cannot outlive the real session.
 */
export async function restoreSession(): Promise<ApiUser | null> {
  if (!apiMode()) return null;

  try {
    const { data } = await api<{ data: ApiUser }>("/auth/me");
    adoptUser(data);
    return data;
  } catch {
    useStore.setState((s) => ({ user: { ...s.user, signedIn: false } }));
    return null;
  }
}

async function attempt(run: () => Promise<void>): Promise<AuthResult> {
  try {
    await run();
    return { ok: true };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, message: err.message, errors: err.errors };
    return { ok: false, message: "We could not reach the server. Check your connection and try again." };
  }
}
