"use client";

import { useState } from "react";
import { apiMode } from "@/lib/api/client";
import { requestPasswordReset } from "@/lib/api/auth";
import { AuthError, AuthField, AuthLink, AuthShell, AuthSubmit } from "@/components/shell/AuthShell";

/**
 * Ask for a password reset link (live: app.bootcamp.com/auth#/forgot).
 *
 * With an API this really sends the email. The wording is the server's own promise: the same
 * answer whether or not the address has an account, so it never says "no such user".
 */
export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || pending) return;
    if (apiMode()) {
      setPending(true);
      setError(undefined);
      const result = await requestPasswordReset(email);
      setPending(false);
      if (!result.ok) return setError(result.errors?.email?.[0] ?? result.message ?? "We could not send that. Try again.");
    }
    setSent(true);
  };

  return (
    <AuthShell
      title={sent ? "Check your email" : "Want to reset your password?"}
      subtitle={sent ? `If an account exists for ${email.trim()}, we sent a link to reset your password. It can take a few minutes; check your spam folder too.` : "We'll email you a link to choose a new password"}
      onSubmit={submit}
      footer={<AuthSubmit disabled={sent || pending}>{sent ? "Link Sent" : pending ? "Sending…" : "Send Me A Link"}</AuthSubmit>}
    >
      <AuthError message={error} />
      <AuthField label="Email you used to sign up" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoFocus readOnly={sent} />
      <div className="-mt-2 pt-4 pb-2 text-center">
        <AuthLink href="/auth/signin">Go back to login</AuthLink>
      </div>
    </AuthShell>
  );
}
