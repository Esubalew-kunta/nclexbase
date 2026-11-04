"use client";

import { api, ApiError } from "@/lib/api/client";

/*
 * The admin's view of the people with accounts: list them, filter to admins, create one.
 * The server decides who may call this (admins only) and what each role costs in password
 * strength; this file only carries the request.
 */

export type UserRole = "student" | "admin";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "disabled";
  plan: "free" | "premium";
  emailVerified: boolean;
  createdAt: string | null;
  lastActive: string | null;
}

export interface UserList {
  data: AdminUser[];
  /** `total` matches the filters, `admins` is every admin account, `shown` is how many came back. */
  meta: { total: number; admins: number; shown: number };
}

export async function fetchUsers(filters: { role?: UserRole; q?: string }): Promise<UserList> {
  const query = new URLSearchParams();
  if (filters.role) query.set("role", filters.role);
  if (filters.q?.trim()) query.set("q", filters.q.trim());
  const qs = query.toString();
  return api<UserList>(`/admin/users${qs ? `?${qs}` : ""}`);
}

export interface CreateUserResult {
  ok: boolean;
  message?: string;
  /** Laravel's field errors, e.g. { email: ["..."] }. */
  errors?: Record<string, string[]>;
  user?: AdminUser;
}

export async function createUser(input: { name: string; email: string; password: string; role: UserRole }): Promise<CreateUserResult> {
  try {
    const { data } = await api<{ data: AdminUser }>("/admin/users", { body: input });
    return { ok: true, user: data };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, message: err.message, errors: err.errors };
    return { ok: false, message: "We could not reach the server. Check your connection and try again." };
  }
}
