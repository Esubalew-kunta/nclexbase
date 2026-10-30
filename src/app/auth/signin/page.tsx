"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiMode } from "@/lib/api/client";
import { login } from "@/lib/api/auth";
import { useAdminStore } from "@/lib/admin/store";
import { DEMO_ADMIN, DEMO_STUDENT, demoAuthEnabled, signInAdmin, signInStudent, type DemoAccount } from "@/lib/demo";
import { AuthError, AuthField, AuthLink, AuthShell, AuthSubmit, PasswordField } from "@/components/shell/AuthShell";

/**
 * Sign in. One form for everybody: with an API configured the credentials are checked by the
 * server and the role it reports decides where you land, and without one this stays the
 * prototype, where the admin's password is checked against this browser's own store and
 * anything else signs in as a student. There is no second form for staff.
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

  /**
   * Where to land.
   *
   * `next` is only ever a student page — StudentGuard writes it when it bounces a signed-out
   * visitor, which is how nearly everyone arrives here — so it stands in for `/nclex` and for
   * nothing else. An admin goes to the admin whatever page sent them to this one; sending them
   * back to `/nclex` instead is the whole reason the Admin button appeared to do nothing.
   */
  const go = (home: string) => router.push(home === DEMO_STUDENT.home && next?.startsWith("/nclex") ? next : home);

  /** One path for both the form and the demo buttons, so they cannot behave differently. */
  const signIn = async (account: { email: string; password: string; home: string }, busy: string) => {
    setPending(busy);
    setError(undefined);

    if (!live) {
      // No API: fall back to the bundled demo behaviour. The demo admin cannot fail to sign
      // in, being a button rather than a credential check, so its destination is unconditional.
      if (account.home === DEMO_ADMIN.home) {
        signInAdmin();
        setPending(undefined);
        return go(DEMO_ADMIN.home);
      }

      /*
       * The admin signs in here as well, so there is one form in the product rather than two
       * asking for the same thing. Without an API the only place an administrator's password
       * can be checked is this browser's own admin store, so that is what is tried first; it
       * returns false for everybody else, who carry on into the student app.
       */
      if (useAdminStore.getState().login(account.email.trim(), account.password)) {
        setPending(undefined);
        return go(DEMO_ADMIN.home);
      }

      signInStudent(account.email === DEMO_STUDENT.email ? undefined : account.email);
      setPending(undefined);
      return go(DEMO_STUDENT.home);
    }

    const result = await login(account.email.trim(), account.password);
    setPending(undefined);

    if (!result.ok) return setError(result.message ?? "That email and password did not match.");

    // The role the API reports decides, not the button that was pressed and not the form: an
    // admin's credentials typed into the fields are a sign-in to the admin.
    return go(result.user?.role === "admin" ? DEMO_ADMIN.home : DEMO_STUDENT.home);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
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
            <p className="mb-1 text-sm font-semibold text-ink">Demo accounts</p>
            <p className="mb-3 text-xs leading-4 text-muted">Student opens the study app, Admin opens the admin.</p>
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
