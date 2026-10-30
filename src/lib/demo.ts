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
  email: "demo.student@nclexbase.com",
  password: "nclexbase-demo-student-2026",
  home: "/nclex",
};

export const DEMO_ADMIN: DemoAccount = {
  label: "Admin",
  email: "demo.admin@nclexbase.com",
  password: "nclexbase-demo-admin-2026",
  home: "/admin",
};

/*
 * The two accounts behind the buttons on the sign-in page.
 *
 * They are rows in the API's own database, created by `DemoAccountsSeeder` (api/database/
 * seeders), so pressing a button is a real sign-in and the role on the account is what decides
 * where it lands: the admin button opens the admin, the student button opens the study app.
 * Without an API configured the same buttons fall back to a browser-local session.
 *
 * Neither is a secret. Both passwords ship in this bundle, which anyone can read, so these two
 * rows are published credentials: nothing may be attached to them that an anonymous visitor
 * should not have. They replaced a pair that used the owner's personal address and the
 * password "123456".
 */

/**
 * Whether to offer the buttons at all.
 *
 * **Set `NEXT_PUBLIC_DEMO_AUTH=0` once the content behind the admin stops being disposable.**
 * The button is one click into the admin, by design, for as long as there is nothing there
 * worth protecting.
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
