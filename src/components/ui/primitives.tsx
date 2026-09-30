"use client";

/*
 * Shared UI primitives. Sizes, colors, and hover/active states are copied from
 * the live app's computed styles (see research/walk/*.tree.txt).
 */

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { EXPERTS } from "@/data/catalog";
import { Icon } from "./Icon";

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "locked" | "glass" | "white" | "outline";

/** Pill button: 42px tall, radius 64px, 600 16px/16px, 50ms press animation. */
const pill =
  "inline-flex h-[42px] shrink-0 cursor-pointer select-none items-center justify-center rounded-[64px] p-4 text-base font-semibold leading-4 transition-[background,box-shadow,transform] duration-[50ms] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white shadow-[0_2px_0_0_#4a3ac8] hover:bg-[#6765ef]",
  locked: "bg-[#ededf0] text-muted hover:bg-[#c8c9ce]",
  glass: "border border-white/5 bg-white/10 text-white hover:bg-white/30",
  white: "bg-white text-ink-strong shadow-card hover:bg-[#f6f6f6]",
  outline: "border border-[#ededf0] bg-white px-4 py-3 font-normal text-ink-strong shadow-[0_2px_0_0_#ededf0] duration-100 hover:bg-[#fafafa]",
};

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button type="button" className={clsx(pill, variants[variant], className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={clsx(pill, variants[variant], className)} {...props} />;
}

/** Gray "Upgrade" pill shown on locked rows. */
export function UpgradeButton({ className, onClick }: { className?: string; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <Link
      href="/nclex/upgrade"
      onClick={onClick}
      className={clsx(pill, variants.locked, "gap-2", className)}
    >
      <Icon name="shield" size={16} />
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
  return <div className={clsx("bg-card rounded-lg shadow-card", className)} {...props} />;
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx("mb-4 flex items-center justify-between gap-4", className)}>
      <h2 className="text-2xl leading-[30px] font-bold text-white">{children}</h2>
      {action}
    </div>
  );
}

/** Info banner on the gradient (e.g. "The case studies below are based on..."). */
export function Banner({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("mb-4 flex items-center rounded-lg border border-white/5 bg-white/10 px-6 py-4 text-base leading-6 text-white", className)}>
      <p>{children}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Progress bars                                                       */
/* ------------------------------------------------------------------ */

const track =
  "flex h-[10px] overflow-hidden rounded-lg border border-transparent bg-[linear-gradient(rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.02)_100%)] shadow-[inset_0_2px_6px_0_rgba(0,0,0,0.07)]";

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
      <span className="bg-grad-good h-2 transition-[width] duration-500" style={{ width: pct(mastered) }} />
      <span className="bg-grad-warn h-2 transition-[width] duration-500" style={{ width: pct(reviewing) }} />
      <span className="bg-grad-bad h-2 transition-[width] duration-500" style={{ width: pct(learning) }} />
    </div>
  );
}

/** Lessons bar (brand gradient). */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={clsx(track, className)}>
      <span className="bg-grad-brand h-2 transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
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
        tone === "brand" && "bg-[#eef1ff] text-brand",
        tone === "muted" && "bg-[#fafafa] text-muted",
        tone === "warn" && "bg-[#fffde9] text-[#d09528]",
        tone === "bad" && "bg-[#fef2f2] text-[#c43c35]",
        tone === "good" && "bg-[#f0fdf4] text-[#54964b]",
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
      <Link href="/nclex" className="text-lg font-semibold text-white transition-colors duration-100 hover:text-[#818cf8]">
        Home
      </Link>
      {trail.map((t, i) => {
        const last = i === trail.length - 1;
        return (
          <span key={i} className="flex items-center">
            <Icon name="breadcrumbChevron" size={10} className="mx-2 text-white/50" style={{ strokeWidth: 3 }} />
            {t.href && !last ? (
              <Link href={t.href} className="text-lg font-semibold text-white transition-colors duration-100 hover:text-[#818cf8]">
                {t.label}
              </Link>
            ) : (
              <span className="text-lg font-semibold text-white/50">{t.label}</span>
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
  experts,
  shortNames,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  trail: { label: string; href?: string }[];
  experts?: string[];
  /** Subject pages show "Dr. Emily & Dr. Amber"; list pages show full names. */
  shortNames?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className="mb-4">
      <Breadcrumbs trail={trail} />
      <h1 className="mb-2 text-[28px] leading-tight font-bold text-white sm:text-4xl sm:leading-[43px]">{title}</h1>
      {description && <p className="mb-3 max-w-[750px] text-lg leading-[27px] text-white/70">{description}</p>}
      {experts && <ExpertRow ids={experts} full={!shortNames} />}
      {children}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Content experts                                                     */
/* ------------------------------------------------------------------ */

export function ExpertPhotos({ ids, size = 48 }: { ids: string[]; size?: number }) {
  const step = size - 16;
  return (
    <div className="relative shrink-0" style={{ width: size + step * (ids.length - 1), height: size }}>
      {ids.map((id, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={id}
          src={EXPERTS[id].photo}
          alt={EXPERTS[id].name}
          className="absolute top-0 rounded-full border-2 border-white/60 object-cover"
          style={{ left: i * step, width: size, height: size, zIndex: ids.length - i }}
        />
      ))}
    </div>
  );
}

/** "CONTENT EXPERTS / Dr. Emily & Dr. Amber". `dark` = on white cards. */
export function ExpertRow({ ids, full, dark, className }: { ids: string[]; full?: boolean; dark?: boolean; className?: string }) {
  const experts = ids.map((id) => EXPERTS[id]);
  const names = full ? experts.map((e) => `${e.name}, ${e.credentials}`) : experts.map((e) => e.short);
  return (
    <div className={clsx("flex items-center", className)}>
      <div className="mr-2">
        <ExpertPhotos ids={ids} />
      </div>
      <div className="min-w-0">
        <p className={clsx("mb-1 text-[10px] leading-[10px] font-semibold uppercase", dark ? "text-muted" : "text-white/70")}>
          Content Expert{ids.length > 1 ? "s" : ""}
        </p>
        <div className="flex flex-wrap">
          {names.map((n, i) => (
            <h4 key={n} className={clsx("mr-1 text-base leading-4", dark ? "text-ink-strong" : "text-white")}>
              {i === 0 ? n : `${i === names.length - 1 ? "& " : ""}${n}`}
              {full && i < names.length - 1 ? "," : ""}
            </h4>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Kept for places that show a user initial avatar. */
export function Avatar({ initials, size = 40, className }: { initials: string; color?: string; size?: number; ring?: boolean; light?: boolean; className?: string }) {
  return (
    <span
      className={clsx("inline-flex shrink-0 items-center justify-center rounded-full bg-[#e0e6eb] font-medium text-[#2d3a46] uppercase", className)}
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
        className={clsx("relative mr-2 h-[18px] w-8 shrink-0 rounded-2xl transition-colors duration-[400ms]", checked ? "bg-brand" : "bg-[#e9e9ea]")}
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
        on ? "bg-brand" : disabled ? "border border-faint bg-[#f6f6f6]" : "border border-faint bg-white hover:bg-[#ededf0]",
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
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-[rgba(21,26,30,0.4)]" onMouseDown={onClose}>
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
          <div className="relative flex shrink-0 justify-center border-b border-[#ededf0] p-4">
            <h4 className="text-lg leading-[22.5px] font-semibold text-ink">{title}</h4>
            <button onClick={onClose} aria-label="Close" className="absolute inset-y-0 right-0 flex w-16 cursor-pointer items-center justify-center text-shell">
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
/* FAQ accordion (glass rows on the gradient)                          */
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
            <div key={q} className="mb-2 rounded-lg bg-white/10 last:mb-0">
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
                className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg px-6 py-4 text-left transition-colors hover:bg-white/20"
              >
                <p className="text-lg leading-[18px] font-semibold text-white">{q}</p>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 p-2 text-white transition-colors duration-100 group-hover:bg-white/20">
                  {isOpen ? (
                    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M19 13H5a1 1 0 0 1 0-2h14a1 1 0 0 1 0 2z" /></svg>
                  ) : (
                    <Icon name="plus" size={16} />
                  )}
                </span>
              </button>
              {isOpen && <div className="faq-answer animate-fade-in px-6 pb-4 text-lg leading-[27px] text-white" dangerouslySetInnerHTML={{ __html: a }} />}
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
    <div className="mb-6 flex overflow-x-auto border-b border-black/10 [scrollbar-width:none]">
      {tabs.map((t, i) => {
        const on = active === t.href;
        return (
          <Link key={t.href} href={t.href} className={clsx("relative flex shrink-0 py-4", i < tabs.length - 1 && "mr-6")}>
            <h3 className={clsx("text-lg leading-6 font-semibold transition-colors hover:text-white", on ? "text-white" : "text-white/70")}>{t.label}</h3>
            {on && <span className="absolute inset-x-0 bottom-0 h-1 rounded-t-lg rounded-b-sm bg-white" />}
          </Link>
        );
      })}
    </div>
  );
}
