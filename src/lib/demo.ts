"use client";

import { useAdminStore } from "@/lib/admin/store";
import { useStore } from "@/lib/store";

/*
 * One-click sign-in for the two demo accounts.
 *
 * These are real accounts now, not a prototype shortcut: pressing a button performs an actual
 * login against the API, and what the person can do afterwards is decided by the role stored
 * against their account, not by which button they pressed.
 *
 * With no API configured they fall back to the local behaviour, so the bundled demo still
 * works with nothing running behind it.
 */

export interface DemoAccount {
  label: string;
  email: string;
  password: string;
  /** Where this account belongs once signed in. */
  home: string;
}

export const DEMO_STUDENT: DemoAccount = {
  label: "Student",
  email: "demo@nclexbase.com",
  password: "nclexbase-demo-2026",
  home: "/nclex",
};

export const DEMO_ADMIN: DemoAccount = {
  label: "Admin",
  email: "esubalewkunta59@gmail.com",
  // Set directly against the account: the password rules refuse this one on sign-up and on
  // reset, because it is in every breach list. Fine for a local demo, and the reason the
  // buttons must be switched off before the site is public.
  password: "123456",
  home: "/admin",
};

/**
 * Whether to offer the buttons at all.
 *
 * **Set `NEXT_PUBLIC_DEMO_AUTH=0` before the site is public.** These credentials are in the
 * JavaScript bundle, so anyone who can open the page can read them; that is fine for a demo
 * everyone is meant to try and not fine for a live site with real students on it.
 */
export const demoAuthEnabled = () => process.env.NEXT_PUBLIC_DEMO_AUTH !== "0";

/** Sign the student side in locally (no API): used by the bundled demo. */
export function signInStudent(email?: string) {
  useStore.setState((s) => {
    const placeholder = !s.user.email || s.user.email === "student@example.com";
    return {
      user: {
        ...s.user,
        signedIn: true,
        email: email?.trim() || (placeholder ? DEMO_STUDENT.email : s.user.email),
        name: s.user.name || (email ? "" : "Demo Student"),
      },
    };
  });
}

export function signOutStudent() {
  useStore.setState((s) => ({ user: { ...s.user, signedIn: false } }));
}

/** Sign the single super admin in with the stored admin credentials (no API). */
export function signInAdmin(): boolean {
  const s = useAdminStore.getState();
  if (s.session) return true;
  return s.login(s.credentials.email, s.credentials.password);
}
