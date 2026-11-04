"use client";

import { api, ApiError } from "@/lib/api/client";

/*
 * The admin's view of the people with accounts. The server decides who may call any of this
 * (admins only) and enforces every safety rule (nobody locks themselves out, the last active
 * admin stays, Premium is only given to a Free student); this file only carries the request
 * and turns a refusal into a sentence the screen can show.
 */

export type UserRole = "student" | "admin";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "disabled";
  /** An admin always reads "premium": full access, no plan. The screen shows "Full access". */
  plan: "free" | "premium";
  /** When a student's Premium ends. Null on Free, and always null for an admin. */
  premiumUntil: string | null;
  emailVerified: boolean;
  createdAt: string | null;
  lastActive: string | null;
}

export interface UserList {
  data: AdminUser[];
  /** `total` matches the filters, `admins` is every admin account, `shown` is how many came back. */
  meta: { total: number; admins: number; shown: number };
}

export const MAX_PREMIUM_DAYS = 365;

export async function fetchUsers(): Promise<UserList> {
  return api<UserList>("/admin/users");
}

/** What a write tells the screen: it worked, or here is why not. */
export interface Outcome<T = AdminUser> {
  ok: boolean;
  data?: T;
  /** One readable sentence, the server's own reason when it gave one. */
  message?: string;
  /** Laravel's field errors, e.g. { email: ["..."] }. */
  errors?: Record<string, string[]>;
}

async function attempt<T>(run: () => Promise<T>): Promise<Outcome<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (err) {
    if (err instanceof ApiError) {
      const first = err.errors ? Object.values(err.errors)[0]?.[0] : undefined;
      return { ok: false, message: first ?? err.message, errors: err.errors };
    }
    return { ok: false, message: "We could not reach the server. Check your connection and try again." };
  }
}

const one = async (call: Promise<{ data: AdminUser }>) => (await call).data;

export const createUser = (input: { name: string; email: string; password: string; role: UserRole }) =>
  attempt(() => one(api<{ data: AdminUser }>("/admin/users", { body: input })));

/** Send only what changed. */
export const updateUser = (id: string, changes: Partial<Pick<AdminUser, "name" | "email" | "role" | "status">>) =>
  attempt(() => one(api<{ data: AdminUser }>(`/admin/users/${id}`, { method: "PATCH", body: changes })));

export const deleteUser = (id: string) => attempt(() => api<{ deleted: string; email: string }>(`/admin/users/${id}`, { method: "DELETE" }));

export const givePremium = (id: string, days: number) =>
  attempt(() => one(api<{ data: AdminUser }>(`/admin/users/${id}/premium`, { body: { days } })));

export const removePremium = (id: string) => attempt(() => one(api<{ data: AdminUser }>(`/admin/users/${id}/premium`, { method: "DELETE" })));

export interface BulkResult {
  done: number;
  skipped: { id: string; email: string; reason: string }[];
}

export const bulkUsers = (action: "enable" | "disable" | "delete" | "premium" | "free", ids: string[], days?: number) =>
  attempt(() => api<BulkResult>("/admin/users/bulk", { body: { action, ids: ids.map(Number), ...(days ? { days } : {}) } }));
