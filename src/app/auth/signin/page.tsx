"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";

/* eslint-disable @next/next/no-img-element */

const input =
  "h-[53px] w-full rounded-lg border border-[#ededf0] bg-[#f6f6f6] px-4 py-3 text-lg leading-[27px] text-ink-strong outline-none transition-[background,border] duration-100 hover:border-faint focus:border-[#6366f1] focus:bg-[#e0e7ff]";

/** Mock sign-in (any credentials work; nothing leaves the browser). Values mirror app.bootcamp.com/auth. */
export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const ready = Boolean(email.trim() && password);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    useStore.setState((s) => ({ user: { ...s.user, email: email.trim() } }));
    router.push("/nclex");
  };

  return (
    <div className="min-h-dvh bg-brand-dark font-sans">
      <div className="mx-auto w-full max-w-[528px] px-4 pt-[66px] pb-10 sm:px-0">
        <div className="mb-[34px] flex items-center justify-center gap-2">
          <img src="/assets/brand/logo-mark.png" alt="" className="size-11" />
          <img src="/assets/brand/logo-word.png" alt="Bootcamp.com" className="h-8 w-auto" />
        </div>
        <form onSubmit={submit}>
          <div className="rounded-lg bg-white shadow-[0_16px_30px_rgba(0,0,0,0.24)]">
            <div className="px-6 py-8 sm:px-16">
              <h2 className="text-center text-[26px] leading-[31.2px] font-bold text-ink-strong">Log in</h2>
              <div className="mt-6">
                <label className="mb-6 block">
                  <div className="mb-2 flex">
                    <h5 className="flex-1 text-sm font-medium text-muted">Email / username</h5>
                    <h5 className="flex-1 text-right text-sm font-medium text-faint">(Case Sensitive)</h5>
                  </div>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoFocus aria-label="Email / username (Case Sensitive)" className={input} />
                </label>
                <label className="block">
                  <div className="mb-2 flex">
                    <h5 className="flex-1 text-sm font-medium text-muted">Password</h5>
                    <h5 className="flex-1 text-right text-sm font-medium">
                      <a href="#" className="text-[#6366f1] hover:text-[#818cf8]">
                        Forgot Password
                      </a>
                    </h5>
                  </div>
                  <div className="relative">
                    <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className={`${input} pr-14`} />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      aria-label={show ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-6 text-faint hover:text-muted"
                    >
                      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        {show ? (
                          <>
                            <path d="M2.04 12.32a1 1 0 0 1 0-.64C3.42 7.5 7.36 4.5 12 4.5s8.57 3 9.96 7.18a1 1 0 0 1 0 .64C20.58 16.5 16.64 19.5 12 19.5s-8.57-3-9.96-7.18Z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        ) : (
                          <path d="M3.98 8.22A10.48 10.48 0 0 0 1.93 12C3.23 16.34 7.24 19.5 12 19.5c.99 0 1.95-.14 2.86-.4M6.23 6.23A10.45 10.45 0 0 1 12 4.5c4.76 0 8.77 3.16 10.07 7.5a10.52 10.52 0 0 1-4.29 5.77M6.23 6.23 3 3m3.23 3.23 3.65 3.65m7.89 7.89L21 21m-3.23-3.23-3.65-3.65m0 0a3 3 0 1 0-4.24-4.24m4.24 4.24L9.88 9.88" />
                        )}
                      </svg>
                    </button>
                  </div>
                </label>
              </div>
              <div className="pt-4 pb-2 text-center">
                <Link href="/nclex" className="rounded-lg px-2 text-lg font-semibold text-[#6366f1] transition-colors duration-100 hover:text-[#818cf8]">
                  Create an account
                </Link>
              </div>
            </div>
            <div className="px-6 py-6 shadow-[0_-1px_0_0_#e5e4e8] sm:px-16">
              <button
                disabled={!ready}
                className="flex h-14 w-full cursor-pointer items-center justify-center rounded-lg bg-[#6366f1] px-4 text-lg leading-[18px] font-semibold text-white shadow-[0_2px_0_0_#4338ca] transition-[background,transform] duration-[50ms] hover:bg-[#818cf8] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:bg-faint disabled:shadow-none disabled:active:translate-y-0"
              >
                Log In
              </button>
            </div>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-white/60">Prototype: any email and password signs you in locally.</p>
      </div>
    </div>
  );
}
