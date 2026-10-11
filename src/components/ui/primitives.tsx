"use client";

/*
 * Shared UI primitives. Sizes, colors, and hover/active states are copied from
 * the live app's computed styles (see research/walk/*.tree.txt).
 */

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { Icon } from "./Icon";

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "premium" | "locked" | "glass" | "white" | "outline";

/** Pill button: 42px tall, radius 64px, 600 16px/16px, 50ms press animation. */
const pill =
  "inline-flex h-[42px] shrink-0 cursor-pointer select-none items-center justify-center rounded-[64px] p-4 text-base font-semibold leading-4 transition-[background,box-shadow,transform] duration-[50ms] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white shadow-press hover:bg-primary-hover",
  secondary: "border border-primary bg-white text-primary hover:bg-primary-light",
  /** Upgrade / unlock actions only. */
  premium: "bg-gold text-ink shadow-premium hover:brightness-95",
  locked: "bg-line text-muted hover:bg-primary-light hover:text-primary",
  /** Translucent white on the old gradient; on the light theme it is the secondary style. */
  glass: "border border-primary bg-white text-primary hover:bg-primary-light",
  white: "border border-line bg-white text-ink shadow-card hover:bg-primary-light",
  outline: "border border-line bg-white px-4 py-3 font-normal text-ink shadow-[0_2px_0_0_var(--color-line)] duration-100 hover:bg-primary-light",
};

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button type="button" className={clsx(pill, variants[variant], className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={clsx(pill, variants[variant], className)} {...props} />;
}

/** "Upgrade" pill shown on locked rows (gold shield marks the premium action). */
export function UpgradeButton({ className, onClick }: { className?: string; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <Link
      href="/nclex/upgrade"
      onClick={onClick}
      className={clsx(pill, variants.locked, "gap-2", className)}
    >
      <Icon name="shield" size={16} className="text-gold" />
      Upgrade
    </Link>
  );
}

export function PlusSquareIcon({ size = 20 }: { size?: number }) {
  return <Icon name="plusSquare" size={size} />;
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={clsx("bg-white rounded-lg shadow-card", className)} {...props} />;
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx("mb-4 flex items-center justify-between gap-4", className)}>
      <h2 className="text-2xl leading-[30px] font-bold text-ink">{children}</h2>
      {action}
    </div>
  );
}

/** Info callout (e.g. "The case studies below are based on..."). */
export function Banner({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("mb-4 flex items-center rounded-lg border border-l-4 border-line border-l-primary bg-primary-light px-6 py-4 text-base leading-6 text-ink", className)}>
      <p>{children}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Progress bars                                                       */
/* ------------------------------------------------------------------ */

const track =
  "flex h-[10px] overflow-hidden rounded-lg bg-primary-light shadow-[inset_0_1px_3px_0_rgba(14,90,92,0.1)]";

/** Question usage bar: mastered (green), reviewing (yellow), and learning (red) segments. */
export function UsageBar({
  total,
  mastered = 0,
  reviewing = 0,
  learning = 0,
  className,
}: {
  total: number;
  mastered?: number;
  reviewing?: number;
  learning?: number;
  className?: string;
}) {
  const pct = (n: number) => `${total ? Math.min(100, (n / total) * 100) : 0}%`;
  return (
    <div className={clsx(track, className)}>
      <span className="h-2.5 bg-success transition-[width] duration-500" style={{ width: pct(mastered) }} />
      <span className="h-2.5 bg-warning transition-[width] duration-500" style={{ width: pct(reviewing) }} />
      <span className="h-2.5 bg-error transition-[width] duration-500" style={{ width: pct(learning) }} />
    </div>
  );
}

/** Lessons bar (teal fill). */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={clsx(track, className)}>
      <span className="h-2.5 bg-primary transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/** "0 of 6 questions used" line under a bar. */
export function UsageText({ used, total, unit = "questions used" }: { used: number; total: number; unit?: string }) {
  return (
    <p className="text-base leading-6 text-muted">
      <strong className="font-bold">{used}</strong> of {total} {unit}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Count pill (Create Test)                                            */
/* ------------------------------------------------------------------ */

export function CountPill({ children, tone = "brand" }: { children: ReactNode; tone?: "brand" | "muted" | "warn" | "bad" | "good" }) {
  return (
    <span
      className={clsx(
        "inline-flex h-[22px] items-center rounded-full px-2 py-1 text-sm leading-[14px] font-semibold",
        tone === "brand" && "bg-primary-light text-primary",
        tone === "muted" && "bg-background text-muted",
        tone === "warn" && "bg-warning/15 text-ink",
        tone === "bad" && "bg-error/10 text-error",
        tone === "good" && "bg-success/10 text-success",
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

export function Breadcrumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center">
      <Link href="/nclex" className="text-lg font-semibold text-primary transition-colors duration-100 hover:text-primary-hover">
        Home
      </Link>
      {trail.map((t, i) => {
        const last = i === trail.length - 1;
        return (
          <span key={i} className="flex items-center">
            <Icon name="breadcrumbChevron" size={10} className="mx-2 text-muted" style={{ strokeWidth: 3 }} />
            {t.href && !last ? (
              <Link href={t.href} className="text-lg font-semibold text-primary transition-colors duration-100 hover:text-primary-hover">
                {t.label}
              </Link>
            ) : (
              <span className="text-lg font-semibold text-muted">{t.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  trail,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  trail: { label: string; href?: string }[];
  children?: ReactNode;
}) {
  return (
    <header className="mb-4">
      <Breadcrumbs trail={trail} />
      <h1 className="mb-2 text-[28px] leading-tight font-bold text-ink sm:text-4xl sm:leading-[43px]">{title}</h1>
      <div aria-hidden className="mb-3 h-[3px] w-12 rounded-full bg-gold" />
      {description && <p className="mb-3 max-w-[750px] text-lg leading-[27px] text-muted">{description}</p>}
      {children}
    </header>
  );
}

/** Kept for places that show a user initial avatar. */
export function Avatar({ initials, size = 40, className }: { initials: string; color?: string; size?: number; ring?: boolean; light?: boolean; className?: string }) {
  return (
    <span
      className={clsx("inline-flex shrink-0 items-center justify-center rounded-full bg-primary-light font-medium text-primary uppercase", className)}
      style={{ width: size, height: size, fontSize: 13 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

/** 32x18 switch (Create Test). */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode }) {
  return (
    <label className="mr-6 flex cursor-pointer items-center select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx("relative mr-2 h-[18px] w-8 shrink-0 rounded-2xl transition-colors duration-[400ms]", checked ? "bg-primary" : "bg-line")}
      >
        <span
          className={clsx(
            "absolute bottom-px left-px size-4 rounded-lg bg-white shadow-[0_3px_7px_rgba(0,0,0,0.12)] transition-transform duration-[400ms]",
            checked && "translate-x-[14px]",
          )}
        />
      </button>
      {label && <span className="text-base text-ink">{label}</span>}
    </label>
  );
}

/** 18px checkbox with the live app's heroicon check. */
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
  const on = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange?.(!checked);
      }}
      className={clsx(
        "inline-flex size-[18px] shrink-0 items-center justify-center rounded-[4px] transition-colors",
        on ? "bg-primary" : disabled ? "border border-line bg-background" : "border border-faint bg-white hover:border-primary hover:bg-primary-light",
        disabled ? "cursor-default" : "cursor-pointer",
        className,
      )}
    >
      {checked && !indeterminate && (
        <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="m4.5 12.75 6 6 9-13.5" />
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
  bodyClassName,
  allowOverflow,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  bodyClassName?: string;
  /** Let popovers (date pickers) extend past the modal edge. */
  allowOverflow?: boolean;
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
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-[rgba(9,68,72,0.35)]" onMouseDown={onClose}>
      <div className="flex max-h-full w-full items-center justify-center p-3 sm:p-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={clsx(
            "animate-pop-in flex w-full flex-col rounded-lg bg-white text-left shadow-card",
            allowOverflow ? "overflow-visible" : "max-h-[calc(100dvh-24px)] overflow-hidden sm:max-h-[calc(100dvh-64px)]",
          )}
          style={{ maxWidth: width }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="relative flex shrink-0 justify-center border-b border-line p-4">
            <h4 className="text-lg leading-[22.5px] font-semibold text-ink">{title}</h4>
            <button onClick={onClose} aria-label="Close" className="absolute inset-y-0 right-0 flex w-16 cursor-pointer items-center justify-center text-muted transition-colors hover:text-primary">
              <svg viewBox="0 0 48 48" className="size-4" fill="currentColor">
                <path d="M8.56 6.44a1.5 1.5 0 1 0-2.12 2.12L21.88 24 6.44 39.44a1.5 1.5 0 1 0 2.12 2.12L24 26.12l15.44 15.44a1.5 1.5 0 0 0 2.12-2.12L26.12 24 41.56 8.56a1.5 1.5 0 0 0-2.12-2.12L24 21.88 8.56 6.44Z" />
              </svg>
            </button>
          </div>
          <div className={clsx("min-h-0 flex-1", allowOverflow ? "overflow-visible" : "overflow-auto", bodyClassName)}>{children}</div>
          {footer}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ accordion                                                       */
/* ------------------------------------------------------------------ */

export function FaqList({ items, title = "FAQs" }: { items: readonly (readonly [string, string])[]; title?: string | null }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  return (
    <section className={title ? "mt-8" : undefined}>
      {title && <SectionTitle>{title}</SectionTitle>}
      <div>
        {items.map(([q, a], i) => {
          const isOpen = open.has(i);
          return (
            <div key={q} className="mb-2 rounded-lg border border-line bg-white last:mb-0">
              <button
                onClick={() =>
                  setOpen((s) => {
                    const n = new Set(s);
                    if (n.has(i)) n.delete(i);
                    else n.add(i);
                    return n;
                  })
                }
                aria-expanded={isOpen}
                className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg px-6 py-4 text-left transition-colors hover:bg-primary-light"
              >
                <p className="text-lg leading-[18px] font-semibold text-ink">{q}</p>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-light p-2 text-primary transition-colors duration-100 group-hover:bg-primary group-hover:text-white">
                  {isOpen ? (
                    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M19 13H5a1 1 0 0 1 0-2h14a1 1 0 0 1 0 2z" /></svg>
                  ) : (
                    <Icon name="plus" size={16} />
                  )}
                </span>
              </button>
              {isOpen && <div className="faq-answer animate-fade-in px-6 pb-4 text-lg leading-[27px] text-ink [&_a]:text-primary" dangerouslySetInnerHTML={{ __html: a }} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs (underline)                                                    */
/* ------------------------------------------------------------------ */

export function UnderlineTabs({ tabs, active }: { tabs: { label: string; href: string }[]; active: string }) {
  return (
    <div className="mb-6 flex overflow-x-auto border-b border-line [scrollbar-width:none]">
      {tabs.map((t, i) => {
        const on = active === t.href;
        return (
          <Link key={t.href} href={t.href} className={clsx("relative flex shrink-0 py-4", i < tabs.length - 1 && "mr-6")}>
            <h3 className={clsx("text-lg leading-6 font-semibold transition-colors hover:text-primary", on ? "text-primary" : "text-muted")}>{t.label}</h3>
            {on && <span className="absolute inset-x-0 bottom-0 h-1 rounded-t-lg rounded-b-sm bg-primary" />}
          </Link>
        );
      })}
    </div>
  );
}
