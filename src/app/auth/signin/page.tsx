"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { AuthField, AuthLink, AuthShell, AuthSubmit, PasswordField } from "@/components/shell/AuthShell";

/** Mock sign-in: any credentials work and nothing leaves the browser. */
export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const ready = Boolean(email.trim() && password);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    useStore.setState((s) => ({ user: { ...s.user, email: email.trim() } }));
    router.push("/nclex");
  };

  return (
    <AuthShell title="Log in" onSubmit={submit} footer={<AuthSubmit disabled={!ready}>Log In</AuthSubmit>}>
      <AuthField label="Email / username" right="(Case Sensitive)" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoFocus />
      <PasswordField
        label="Password"
        right={
          <Link href="/auth/forgot" className="text-[#6366f1] hover:text-[#818cf8]">
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
