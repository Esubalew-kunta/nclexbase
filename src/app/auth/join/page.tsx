"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useConfig } from "@/lib/content";
import { recordReferralJoin } from "@/lib/promo";
import { apiMode } from "@/lib/api/client";
import { register } from "@/lib/api/auth";
import { AuthError, AuthField, AuthLink, AuthShell, AuthSubmit, PasswordField } from "@/components/shell/AuthShell";

/** Mock sign-up (live: app.bootcamp.com/auth#/join). Starts a fresh free account in this browser. */
export default function JoinPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const { termsUrl, privacyUrl } = useConfig().branding;
  const ready = /\S+@\S+\.\S+/.test(email) && password.length >= 8 && agree && !pending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    // Join links from Refer a friend carry ?ref=CODE.
    const ref = new URLSearchParams(window.location.search).get("ref");

    if (apiMode()) {
      setPending(true);
      setError(undefined);
      const result = await register({ email: email.trim(), password, ref });
      setPending(false);
      if (!result.ok) {
        // The API rejects a password found in a breach corpus, and says so per field.
        return setError(result.errors?.password?.[0] ?? result.errors?.email?.[0] ?? result.message ?? "We could not create that account.");
      }
      if (ref) recordReferralJoin(ref, email.trim());
      return router.push("/nclex");
    }

    useStore.getState().resetAll();
    useStore.setState((s) => ({ user: { ...s.user, name: "", email: email.trim(), plan: "free", signedIn: true } }));
    if (ref) recordReferralJoin(ref, email.trim());
    router.push("/nclex");
  };

  return (
    <AuthShell
      title="Start studying for free"
      onSubmit={submit}
      footer={<AuthSubmit disabled={!ready}>{pending ? "Creating your account…" : "Create My Free Account"}</AuthSubmit>}
      below={
        <div className="pt-2 pb-8 text-center">
          <AuthLink href="/auth/signin">I already have an account</AuthLink>
        </div>
      }
    >
      <AuthError message={error} />
      <AuthField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
      <PasswordField label="Password" right="8+ characters" value={password} onChange={setPassword} autoComplete="new-password" />
      <div className="mt-4 mb-2">
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-background p-3">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-px mr-[3px] mb-[3px] ml-1 size-6 cursor-pointer accent-primary" />
          <span className="text-base leading-[22.4px] text-muted">
            I agree to the{" "}
            <a href={termsUrl} target="_blank" rel="noreferrer" className="text-primary underline hover:text-primary-hover">
              Terms of Use
            </a>{" "}
            &amp;{" "}
            <a href={privacyUrl} target="_blank" rel="noreferrer" className="text-primary underline hover:text-primary-hover">
              Privacy Policy
            </a>
            .
          </span>
        </label>
      </div>
    </AuthShell>
  );
}
