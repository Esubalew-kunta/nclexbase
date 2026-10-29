"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState, type ComponentProps, type ReactNode } from "react";
import { LogoStacked } from "@/components/ui/Logo";

/**
 * Shared frame for /auth/signin, /auth/join and /auth/forgot:
 * off-white page, stacked NCLEXBase logo, 528px white card with a teal top edge.
 */
export function AuthShell({
  title,
  subtitle,
  onSubmit,
  children,
  footer,
  below,
}: {
  title: string;
  subtitle?: string;
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
  footer: ReactNode;
  below?: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <div className="mx-auto w-full max-w-[528px] px-4 pt-12 pb-10 sm:px-0">
        <div className="mb-8 flex justify-center">
          <Link href="/nclex">
            <LogoStacked width={200} />
          </Link>
        </div>
        <form onSubmit={onSubmit} className="overflow-hidden rounded-lg border border-line border-t-4 border-t-primary bg-white shadow-card">
          <div className="px-6 py-8 sm:px-16">
            <h2 className="text-center text-[26px] leading-[31.2px] font-bold text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-center text-base leading-6 text-muted">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          <div className="border-t border-line px-6 py-6 sm:px-16">{footer}</div>
          {below}
        </form>
        <p className="mt-6 text-center text-sm text-muted">Prototype: nothing you enter here leaves your browser.</p>
      </div>
    </div>
  );
}

const inputCls =
  "h-[53px] w-full rounded-lg border border-line bg-white px-4 py-3 text-lg leading-[27px] text-ink outline-none transition-[background,border,box-shadow] duration-100 hover:border-faint focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-light)]";

export function AuthField({ label, right, className, ...input }: { label: string; right?: ReactNode } & ComponentProps<"input">) {
  return (
    <label className={clsx("mb-6 block", className)}>
      <div className="mb-2 flex items-start justify-between">
        <h5 className="text-sm leading-[16.8px] font-medium text-muted">{label}</h5>
        {right && <h5 className="text-right text-sm leading-[16.8px] font-medium text-muted">{right}</h5>}
      </div>
      <input {...input} className={inputCls} />
    </label>
  );
}

export function PasswordField({ label, right, value, onChange, autoComplete }: { label: string; right?: ReactNode; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className="mb-6 block">
      <div className="mb-2 flex items-start justify-between">
        <h5 className="text-sm leading-[16.8px] font-medium text-muted">{label}</h5>
        {right && <h5 className="text-right text-sm leading-[16.8px] font-medium text-muted">{right}</h5>}
      </div>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} className={`${inputCls} pr-14`} />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-6 text-muted hover:text-primary"
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
  );
}

/** Full-width teal submit button (gray when disabled). */
export function AuthSubmit({ disabled, children }: { disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex h-14 w-full cursor-pointer items-center justify-center rounded-lg bg-primary px-4 text-lg leading-[18px] font-semibold text-white shadow-press transition-[background,transform] duration-[50ms] hover:bg-primary-hover active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:bg-faint disabled:shadow-none disabled:active:translate-y-0"
    >
      {children}
    </button>
  );
}

/** What the server said went wrong. Renders nothing when there is nothing to say. */
export function AuthError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-4 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
      {message}
    </p>
  );
}

/** Teal text link centered under a form section ("Create an account", "Go back to login"). */
export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="rounded-lg px-2 text-lg font-semibold text-primary transition-colors duration-100 hover:text-primary-hover">
      {children}
    </Link>
  );
}
