"use client";

import { useAdminStore } from "@/lib/admin/store";
import { useStore } from "@/lib/store";

/*
 * PROTOTYPE ONLY: one-click demo sign-in for both sides, so nobody has to type
 * credentials while the app has no backend. Remove when real authentication lands.
 */

export const DEMO_STUDENT = { email: "demo@nclexbase.com", password: "demo1234", name: "Demo Student" };

/** Sign the student side in: with the typed email, or as the demo student (keeping a real email already on this browser). */
export function signInStudent(email?: string) {
  useStore.setState((s) => {
    const placeholder = !s.user.email || s.user.email === "student@example.com";
    return {
      user: {
        ...s.user,
        signedIn: true,
        email: email?.trim() || (placeholder ? DEMO_STUDENT.email : s.user.email),
        name: s.user.name || (email ? "" : DEMO_STUDENT.name),
      },
    };
  });
}

export function signOutStudent() {
  useStore.setState((s) => ({ user: { ...s.user, signedIn: false } }));
}

/** Sign the single super admin in with the stored admin credentials. */
export function signInAdmin(): boolean {
  const s = useAdminStore.getState();
  if (s.session) return true;
  return s.login(s.credentials.email, s.credentials.password);
}
