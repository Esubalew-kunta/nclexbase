"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiMode } from "@/lib/api/client";
import { login } from "@/lib/api/auth";
import { DEMO_ADMIN, DEMO_STUDENT, demoAuthEnabled, signInAdmin, signInStudent, type DemoAccount } from "@/lib/demo";
import { AuthError, AuthField, AuthLink, AuthShell, AuthSubmit, PasswordField } from "@/components/shell/AuthShell";

/**
 * Sign in. With an API configured the credentials are checked by the server and the session
 * lives in a cookie; without one this stays the prototype, where any credentials work and
 * nothing leaves the browser.
 */
function SignIn() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const live = apiMode();
  const [email, setEmail] = useState(live ? "" : DEMO_STUDENT.email);
  const [password, setPassword] = useState(live ? "" : DEMO_STUDENT.password);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState<string>();
  const ready = Boolean(email.trim() && password) && !pending;

  const go = (home: string) => router.push(next?.startsWith("/nclex") ? next : home);

  /** One path for both the form and the demo buttons, so they cannot behave differently. */
  const signIn = async (account: { email: string; password: string; home: string }, busy: string) => {
    setPending(busy);
    setError(undefined);

    if (!live) {
      // No API: fall back to the bundled demo behaviour.
      if (account.home === DEMO_ADMIN.home) signInAdmin();
      else signInStudent(account.email === DEMO_STUDENT.email ? undefined : account.email);
      setPending(undefined);
      return go(account.home);
    }

    const result = await login(account.email.trim(), account.password);
    setPending(undefined);

    if (result.ok) return go(account.home);
    setError(result.message ?? "That email and password did not match.");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    // A typed sign-in goes to the student app; an admin account lands on /admin by its role.
    void signIn({ email, password, home: DEMO_STUDENT.home }, "form");
  };

  const quick = (account: DemoAccount) => (
    <button
      key={account.label}
      type="button"
      disabled={Boolean(pending)}
      onClick={() => void signIn(account, account.label)}
      className="h-11 w-full cursor-pointer rounded-lg border border-primary bg-white font-semibold text-primary transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending === account.label ? "Signing in…" : account.label}
    </button>
  );

  return (
    <AuthShell
      title="Log in"
      onSubmit={submit}
      footer={<AuthSubmit disabled={!ready}>{pending === "form" ? "Logging in…" : "Log In"}</AuthSubmit>}
      aside={
        demoAuthEnabled() ? (
          <div className="rounded-lg border border-line bg-white p-4 shadow-card">
            <p className="mb-3 text-sm font-semibold text-ink">Demo accounts</p>
            <div className="flex flex-col gap-2">
              {quick(DEMO_STUDENT)}
              {quick(DEMO_ADMIN)}
            </div>
            <p className="mt-3 text-xs leading-4 text-muted">Signs in for real. What you can do is set by the account, not the button.</p>
          </div>
        ) : undefined
      }
    >
      <AuthError message={error} />
      <AuthField label="Email / username" right="(Case Sensitive)" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
      <PasswordField
        label="Password"
        right={
          <Link href="/auth/forgot" className="text-primary hover:text-primary-hover">
            Forgot Password
          </Link>
        }
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />
      <div className="-mt-2 pt-4 pb-2 text-center">
        <AuthLink href="/auth/join">Create an account</AuthLink>
      </div>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}
