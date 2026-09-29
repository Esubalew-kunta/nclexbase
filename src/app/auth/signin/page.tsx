"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useStore } from "@/lib/store";

/** Mock login: any credentials work; nothing leaves the browser. */
export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const ready = email.trim() && password;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    useStore.setState((s) => ({ user: { ...s.user, email: email.trim() } }));
    router.push("/nclex");
  };

  return (
    <div className="flex min-h-dvh flex-col items-center bg-brand-dark px-4 pt-16">
      <div className="flex items-center gap-2 text-white">
        <svg viewBox="0 0 36 36" className="size-11" aria-hidden>
          <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="18" cy="18" r="11" fill="currentColor" />
          <path d="M18 11.5l1.9 4.2 4.6.4-3.5 3 1.1 4.5-4.1-2.4-4.1 2.4 1.1-4.5-3.5-3 4.6-.4z" fill="#4a3ac8" />
        </svg>
        <span className="text-[28px] font-bold">Bootcamp.com</span>
      </div>

      <form onSubmit={submit} className="mt-8 w-full max-w-[528px] rounded-lg bg-white shadow-2xl">
        <div className="px-6 pt-10 pb-8 sm:px-16">
          <h1 className="text-center text-2xl font-semibold text-ink-strong">Log in</h1>
          <label className="mt-6 flex justify-between text-sm font-medium text-muted">
            Email / username <span className="text-faint">(Case Sensitive)</span>
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            aria-label="Email / username (Case Sensitive)"
            className="mt-2 h-[52px] w-full rounded-lg border border-transparent bg-[#f5f5f5] px-4 text-base text-ink outline-none focus:border-brand focus:bg-[#e3e5ff]"
          />
          <div className="mt-6 flex justify-between text-sm font-medium">
            <label htmlFor="pw" className="text-muted">Password</label>
            <a href="#" className="text-brand hover:underline">Forgot Password</a>
          </div>
          <div className="relative mt-2">
            <input
              id="pw"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="h-[52px] w-full rounded-lg border border-transparent bg-[#f5f5f5] px-4 pr-12 text-base text-ink outline-none focus:border-brand focus:bg-[#e3e5ff]"
            />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute top-1/2 right-4 -translate-y-1/2 text-faint">
              {show ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
            </button>
          </div>
          <p className="mt-10 text-center">
            <Link href="/nclex" className="text-lg font-semibold text-brand hover:underline">
              Create an account
            </Link>
          </p>
        </div>
        <div className="border-t border-line px-6 py-6 sm:px-16">
          <button
            disabled={!ready}
            className="h-14 w-full rounded-lg bg-brand text-lg font-semibold text-white shadow-press disabled:bg-[#c8c9ce] disabled:shadow-none"
          >
            Log In
          </button>
        </div>
      </form>
      <p className="mt-6 text-sm text-white/70">Prototype: any email and password will sign you in locally.</p>
    </div>
  );
}
