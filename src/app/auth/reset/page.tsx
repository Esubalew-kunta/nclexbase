"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { resetPassword } from "@/lib/api/auth";
import { MIN_LENGTH } from "@/lib/api/useChangePassword";
import { AuthError, AuthLink, AuthNotice, AuthShell, AuthSubmit, PasswordField } from "@/components/shell/AuthShell";

/**
 * Where the link in the reset email lands: /auth/reset/?token=...&email=...
 *
 * The token and the address ride in the link, so the person only chooses a password. A link that
 * is missing either (typed by hand, or cut short by a mail client) is told so rather than shown
 * a form that cannot work.
 */
function Reset() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);

  const hint = password && password.length < MIN_LENGTH ? `Use at least ${MIN_LENGTH} characters.` : repeat && password !== repeat ? "The two passwords do not match." : "";
  const ready = Boolean(token && email && password && repeat) && !hint && !pending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setPending(true);
    setError(undefined);
    const result = await resetPassword({ token, email, password });
    setPending(false);
    // A used or expired link says so under `token`; a password found in a breach list, under `password`.
    if (!result.ok) return setError(result.errors?.password?.[0] ?? result.errors?.token?.[0] ?? result.message ?? "We could not change the password.");
    setDone(true);
  };

  if (done) {
    return (
      <AuthShell title="Password changed" onSubmit={(e) => e.preventDefault()} footer={<AuthLink href="/auth/signin">Log in with your new password</AuthLink>}>
        <AuthNotice message="Your password has been changed. Your other devices have been signed out." />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle={email || undefined}
      onSubmit={submit}
      footer={<AuthSubmit disabled={!ready}>{pending ? "Saving…" : "Save New Password"}</AuthSubmit>}
    >
      {!token || !email ? <AuthError message="This reset link is incomplete. Open the link from your email again, or ask for a new one." /> : null}
      <AuthError message={error ?? (hint || undefined)} />
      <PasswordField label="New password" right={`${MIN_LENGTH}+ characters`} value={password} onChange={setPassword} autoComplete="new-password" />
      <PasswordField label="Repeat new password" value={repeat} onChange={setRepeat} autoComplete="new-password" />
      <div className="-mt-2 pt-4 pb-2 text-center">
        <AuthLink href="/auth/forgot">Send me a new link</AuthLink>
      </div>
    </AuthShell>
  );
}

export default function ResetPage() {
  return (
    <Suspense>
      <Reset />
    </Suspense>
  );
}
