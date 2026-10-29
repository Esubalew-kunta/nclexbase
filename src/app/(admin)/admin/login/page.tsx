"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminStore } from "@/lib/admin/store";
import { apiMode } from "@/lib/api/client";
import { login } from "@/lib/api/auth";
import { DEMO_ADMIN, demoAuthEnabled, signInAdmin } from "@/lib/demo";
import { LogoStacked } from "@/components/ui/Logo";
import { Btn, Field, Input } from "@/components/admin/ui";

/**
 * Sign in to the admin.
 *
 * With an API configured the password is checked by the server and the role it reports is what
 * decides whether this is an admin — the same rule /auth/signin follows. Without one this stays
 * the prototype, where the single super admin's credentials live in this browser.
 *
 * The two must not be confused: in API mode the stored prototype credentials are not the real
 * ones, so they are neither pre-filled nor advertised. Typing a real password into a form that
 * compares it against localStorage is a dead end with no visible cause.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/admin";
  const live = apiMode();
  const hydrated = useAdminStore((s) => s.hydrated);
  const creds = useAdminStore((s) => s.credentials);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [filled, setFilled] = useState(false);
  // Prototype only: pre-filled with the admin account once the store has loaded.
  if (!live && hydrated && !filled) {
    setFilled(true);
    setEmail(creds.email);
    setPassword(creds.password);
  }
  const target = next.startsWith("/admin") && next !== "/admin/login" ? next : "/admin";
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!live) {
      if (!useAdminStore.getState().login(email, password)) return setError("That email and password don't match the admin account.");
      return router.replace(target);
    }

    setPending(true);
    const result = await login(email.trim(), password);
    setPending(false);

    if (!result.ok) return setError(result.message ?? "That email and password did not match.");
    // Signed in, but not to here. `adoptUser` has already left the admin session empty.
    if (result.user?.role !== "admin") return setError("That account is not an administrator.");

    router.replace(target);
  };

  /** The demo admin, through whichever path is live. */
  const demo = async () => {
    setError("");

    if (!live) return signInAdmin() && router.replace(target);

    setPending(true);
    const result = await login(DEMO_ADMIN.email, DEMO_ADMIN.password);
    setPending(false);

    if (result.ok && result.user?.role === "admin") return router.replace(target);
    setError(result.message ?? "The demo admin account could not sign in.");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <LogoStacked width={170} />
          <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-bold tracking-wider text-gold uppercase">Admin</span>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-lg border border-line border-t-4 border-t-primary bg-white p-6 shadow-card">
          <h1 className="text-lg font-bold text-ink">Sign in to the admin</h1>
          <Field label="Email">
            <Input type="email" autoComplete="username" value={email} onChange={(e) => (setEmail(e.target.value), setError(""))} autoFocus required />
          </Field>
          <Field label="Password" error={error}>
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => (setPassword(e.target.value), setError(""))} invalid={Boolean(error)} required />
          </Field>
          <Btn type="submit" variant="primary" className="h-10 w-full" disabled={!hydrated || pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Btn>
        </form>
        {demoAuthEnabled() && (
          <div className="mt-4 rounded-md border border-line bg-white p-3 text-center">
            <p className="mb-2 text-xs text-muted">
              {live ? (
                <>
                  Demo admin: <span className="font-semibold text-ink">{DEMO_ADMIN.email}</span>
                </>
              ) : (
                <>
                  Prototype account (no server yet): <span className="font-semibold text-ink">{creds.email}</span> /{" "}
                  <span className="font-semibold text-ink">{creds.password}</span>
                </>
              )}
            </p>
            <Btn variant="secondary" className="w-full" disabled={!hydrated || pending} onClick={() => void demo()}>
              Sign in as the demo admin
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
