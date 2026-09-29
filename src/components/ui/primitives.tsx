"use client";

import clsx from "clsx";
import Link from "next/link";
import { ChevronRight, Plus, Minus, ShieldCheck, X } from "lucide-react";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { EXPERTS } from "@/data/catalog";

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "white" | "glass" | "locked" | "ghost";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white shadow-press hover:bg-[#6a5eef] active:translate-y-px active:shadow-none",
  white: "bg-white text-ink shadow-card hover:bg-[#fafafa]",
  glass: "bg-white/10 text-white hover:bg-white/15",
  locked: "bg-[#ececef] text-muted shadow-press-gray hover:bg-[#e4e4e8]",
  ghost: "text-white/80 hover:text-white",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background,transform,box-shadow] disabled:opacity-50",
        size === "sm" && "h-9 px-4 text-[15px]",
        size === "md" && "h-11 px-6 text-base",
        size === "lg" && "h-14 px-8 text-lg",
        buttonStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: "sm" | "md" | "lg" }) {
  return (
    <Link
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background,transform]",
        size === "sm" && "h-9 px-4 text-[15px]",
        size === "md" && "h-11 px-6 text-base",
        size === "lg" && "h-14 px-8 text-lg",
        buttonStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function UpgradeButton({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) {
  return (
    <ButtonLink href="/nclex/upgrade" variant="locked" size={size} className={clsx("min-w-[118px]", className)}>
      <ShieldCheck className="size-4" strokeWidth={2.5} />
      Upgrade
    </ButtonLink>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={clsx("bg-card rounded-lg shadow-card", className)} {...props} />;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mt-11 mb-4 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-bold leading-[30px] text-white">{children}</h2>
      {action}
    </div>
  );
}

export function ProgressBar({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "good" | "bad" }) {
  return (
    <div className={clsx("h-2.5 overflow-hidden rounded-full bg-track shadow-track", className)}>
      <div
        className={clsx(
          "h-full rounded-full transition-[width] duration-500",
          tone === "brand" && "bg-grad-brand",
          tone === "good" && "bg-grad-good",
          tone === "bad" && "bg-grad-bad",
        )}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function CountPill({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex h-6 min-w-8 items-center justify-center rounded-full px-2 text-[13px] font-semibold",
        muted ? "bg-[#f1f1f3] text-muted" : "bg-brand-tint text-brand",
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

export function Breadcrumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[17px] font-semibold">
      <Link href="/nclex" className="text-white hover:underline">
        Home
      </Link>
      {trail.map((t, i) => (
        <span key={i} className="flex items-center gap-2">
          <ChevronRight className="size-3.5 text-white/60" strokeWidth={3} />
          {t.href ? (
            <Link href={t.href} className="text-white hover:underline">
              {t.label}
            </Link>
          ) : (
            <span className="text-white/60">{t.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  trail,
  experts,
  children,
}: {
  title: string;
  description?: ReactNode;
  trail: { label: string; href?: string }[];
  experts?: string[];
  children?: ReactNode;
}) {
  return (
    <header className="mb-6">
      <Breadcrumbs trail={trail} />
      <h1 className="mt-3 text-[28px] font-bold leading-tight text-white sm:text-4xl sm:leading-[45px]">{title}</h1>
      {description && <p className="mt-3 max-w-3xl text-[17px] leading-7 text-white/70">{description}</p>}
      {experts && <ExpertRow ids={experts} className="mt-4" full />}
      {children}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export function Avatar({ initials, color, size = 40, ring = true, light }: { initials: string; color: string; size?: number; ring?: boolean; light?: boolean }) {
  return (
    <span
      className={clsx("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", light ? "text-ink" : "text-white", ring && "ring-2 ring-white")}
      style={{ width: size, height: size, background: color, fontSize: size * 0.34 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function ExpertRow({ ids, className, full, dark }: { ids: string[]; className?: string; full?: boolean; dark?: boolean }) {
  const experts = ids.map((id) => EXPERTS[id]);
  const names = full
    ? experts.map((e) => `${e.name}, ${e.credentials}`)
    : experts.map((e) => e.short);
  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <div className="flex -space-x-3">
        {experts.map((e) => (
          <Avatar key={e.id} initials={e.initials} color={e.color} size={full ? 44 : 40} />
        ))}
      </div>
      <div className="min-w-0 leading-tight">
        <div className={clsx("text-[10px] font-semibold uppercase tracking-wide", dark ? "text-muted" : "text-white/70")}>
          Content Experts
        </div>
        <div className={clsx("text-[15px] font-semibold", dark ? "text-ink" : "text-white")}>
          {full && names.length > 2
            ? `${names.slice(0, -1).join(", ")}, & ${names.at(-1)}`
            : names.join(" & ")}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

export function Toggle({ checked, onChange, label, size = "md" }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; size?: "sm" | "md" }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative shrink-0 rounded-full transition-colors",
          size === "md" ? "h-5 w-8" : "h-4 w-7",
          checked ? "bg-brand" : "bg-[#e3e3e8]",
        )}
      >
        <span
          className={clsx(
            "absolute top-0.5 rounded-full bg-white shadow transition-transform",
            size === "md" ? "left-0.5 size-4" : "left-0.5 size-3",
            checked && (size === "md" ? "translate-x-3" : "translate-x-3"),
          )}
        />
      </button>
      {label && <span className="text-base text-ink">{label}</span>}
    </label>
  );
}

export function Checkbox({
  checked,
  onChange,
  disabled,
  indeterminate,
  className,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  indeterminate?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={clsx(
        "inline-flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border transition-colors",
        checked || indeterminate ? "border-brand bg-brand text-white" : "border-[#d4d4da] bg-white",
        disabled && "opacity-50",
        className,
      )}
    >
      {checked && !indeterminate && (
        <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.2}>
          <path d="M2.5 6.2l2.3 2.3 4.7-4.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {indeterminate && <span className="h-0.5 w-2 rounded bg-white" />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 780,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#151a1e]/60 p-3 sm:p-8 animate-fade-in" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-pop-in flex max-h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-lg bg-white text-left shadow-2xl sm:max-h-[calc(100dvh-64px)]"
        style={{ maxWidth: width }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="relative flex h-14 shrink-0 items-center justify-center border-b border-line px-12">
          <h2 className="text-lg font-semibold text-ink-strong">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="absolute right-4 rounded-full p-1.5 text-ink hover:bg-[#f2f2f4]">
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="shrink-0 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ accordion (glass rows on the gradient)                          */
/* ------------------------------------------------------------------ */

export function FaqList({ items, title = "FAQs" }: { items: readonly (readonly [string, string])[]; title?: string | null }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section>
      {title && <SectionTitle>{title}</SectionTitle>}
      <div className="space-y-2">
        {items.map(([q, a], i) => {
          const isOpen = open === i;
          return (
            <div key={q} className="overflow-hidden rounded-lg border border-white/5 bg-white/10">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex min-h-[60px] w-full items-center justify-between gap-4 px-5 py-3 text-left text-[17px] font-semibold text-white hover:bg-white/5"
              >
                {q}
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10">
                  {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                </span>
              </button>
              {isOpen && <p className="px-5 pb-5 text-base leading-7 text-white/80 animate-fade-in">{a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs (underline, on gradient)                                       */
/* ------------------------------------------------------------------ */

export function UnderlineTabs({ tabs, active }: { tabs: { label: string; href: string }[]; active: string }) {
  return (
    <div className="mb-6 flex gap-7 overflow-x-auto border-b border-white/15 [scrollbar-width:none]">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={clsx(
            "relative shrink-0 pb-3 text-[17px] font-semibold transition-colors",
            active === t.href ? "text-white after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:rounded-full after:bg-white" : "text-white/60 hover:text-white",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
