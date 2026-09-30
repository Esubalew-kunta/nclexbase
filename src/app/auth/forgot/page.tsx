"use client";

import { useState } from "react";
import { AuthField, AuthLink, AuthShell, AuthSubmit } from "@/components/shell/AuthShell";

/** Mock password reset (live: app.bootcamp.com/auth#/forgot). */
export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <AuthShell
      title={sent ? "Check your email" : "Want to reset your password?"}
      subtitle={sent ? `If an account exists for ${email}, we sent a reset code.` : "We'll send a reset code to your contact email"}
      onSubmit={(e) => {
        e.preventDefault();
        if (email.trim()) setSent(true);
      }}
      footer={<AuthSubmit disabled={sent}>{sent ? "Code Sent" : "Send Me A Code"}</AuthSubmit>}
    >
      <AuthField label="Original email / username used to sign up (case sensitive)" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoFocus />
      <div className="-mt-2 pt-4 pb-2 text-center">
        <AuthLink href="/auth/signin">Go back to login</AuthLink>
      </div>
    </AuthShell>
  );
}
