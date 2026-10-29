"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiMode } from "@/lib/api/client";
import { login } from "@/lib/api/auth";
import { DEMO_STUDENT, signInStudent } from "@/lib/demo";
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
  // Pre-filling only makes sense for the prototype account.
  const [email, setEmail] = useState(live ? "" : DEMO_STUDENT.email);
  const [password, setPassword] = useState(live ? "" : DEMO_STUDENT.password);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const ready = Boolean(email.trim() && password) && !pending;
  const go = () => router.push(next?.startsWith("/nclex") ? next : "/nclex");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;

    if (!live) {
      signInStudent(email === DEMO_STUDENT.email ? undefined : email);
      return go();
    }

    setPending(true);
    setError(undefined);
    const result = await login(email.trim(), password);
    setPending(false);

    if (result.ok) return go();
    setError(result.message ?? "That email and password did not match.");
  };

  return (
    <AuthShell
      title="Log in"
      onSubmit={submit}
      footer={<AuthSubmit disabled={!ready}>{pending ? "Logging in…" : "Log In"}</AuthSubmit>}
      below={
        live ? undefined : (
          <div className="border-t border-line px-6 py-4 text-center sm:px-16">
            <p className="mb-2 text-sm text-muted">
              Prototype demo account: <span className="font-semibold text-ink">{DEMO_STUDENT.email}</span> / <span className="font-semibold text-ink">{DEMO_STUDENT.password}</span>
            </p>
            <button
              type="button"
              onClick={() => (signInStudent(), go())}
              className="h-11 w-full cursor-pointer rounded-lg border border-primary bg-white font-semibold text-primary transition-colors hover:bg-primary-light"
            >
              Log in as the demo student
            </button>
          </div>
        )
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
