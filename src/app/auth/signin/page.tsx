"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { DEMO_STUDENT, signInStudent } from "@/lib/demo";
import { AuthField, AuthLink, AuthShell, AuthSubmit, PasswordField } from "@/components/shell/AuthShell";

/** Mock sign-in: any credentials work and nothing leaves the browser. Demo credentials are pre-filled. */
function SignIn() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [email, setEmail] = useState(DEMO_STUDENT.email);
  const [password, setPassword] = useState(DEMO_STUDENT.password);
  const ready = Boolean(email.trim() && password);
  const go = () => router.push(next?.startsWith("/nclex") ? next : "/nclex");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    signInStudent(email === DEMO_STUDENT.email ? undefined : email);
    go();
  };

  return (
    <AuthShell
      title="Log in"
      onSubmit={submit}
      footer={<AuthSubmit disabled={!ready}>Log In</AuthSubmit>}
      below={
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
      }
    >
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
