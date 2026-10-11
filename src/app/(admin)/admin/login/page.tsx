"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminStore } from "@/lib/admin/store";
import { signInAdmin } from "@/lib/demo";
import { LogoStacked } from "@/components/ui/Logo";
import { Btn, Field, Input } from "@/components/admin/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/admin";
  const hydrated = useAdminStore((s) => s.hydrated);
  const creds = useAdminStore((s) => s.credentials);
  // Prototype: pre-filled with the admin account once the store has loaded.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [filled, setFilled] = useState(false);
  if (hydrated && !filled) {
    setFilled(true);
    setEmail(creds.email);
    setPassword(creds.password);
  }
  const target = next.startsWith("/admin") && next !== "/admin/login" ? next : "/admin";
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!useAdminStore.getState().login(email, password)) return setError("That email and password don't match the admin account.");
    router.replace(target);
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
          <Btn type="submit" variant="primary" className="h-10 w-full" disabled={!hydrated}>
            Sign in
          </Btn>
        </form>
        <div className="mt-4 rounded-md border border-line bg-white p-3 text-center">
          <p className="mb-2 text-xs text-muted">
            Prototype account (no server yet): <span className="font-semibold text-ink">{creds.email}</span> / <span className="font-semibold text-ink">{creds.password}</span>
          </p>
          <Btn variant="secondary" className="w-full" disabled={!hydrated} onClick={() => signInAdmin() && router.replace(target)}>
            Sign in as the demo admin
          </Btn>
        </div>
      </div>
    </div>
  );
}
