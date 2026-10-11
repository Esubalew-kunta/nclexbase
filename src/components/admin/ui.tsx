"use client";

/*
 * Admin UI kit: page frame, buttons, form fields, badges, dialogs and toasts.
 * Same brand tokens as the student app; denser layout for working screens.
 */

import clsx from "clsx";
import { useEffect, useId, type ComponentProps, type ReactNode } from "react";
import { create } from "zustand";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { Access, Status } from "@/lib/admin/types";

/* ------------------------------------------------------------------ */
/* Page frame                                                          */
/* ------------------------------------------------------------------ */

export function AdminPage({ title, description, actions, children, back }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; back?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      {back}
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl leading-8 font-bold text-ink">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm leading-5 text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

export function Panel({ title, description, actions, children, className, bodyClassName }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={clsx("rounded-lg border border-line bg-white", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3">
          <div>
            {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={clsx("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "premium";
/** Default size unless the caller passes its own height/size class (no tailwind-merge in this project). */
const has = (className: string | undefined, prefix: string) => ` ${className ?? ""}`.includes(` ${prefix}-`);

const btnBase =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 text-sm font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "border border-line bg-white text-ink hover:border-primary hover:bg-primary-light hover:text-primary",
  ghost: "text-primary hover:bg-primary-light",
  danger: "border border-error/40 bg-white text-error hover:bg-error/5",
  premium: "bg-gold text-ink hover:brightness-95",
};

export function Btn({ variant = "secondary", className, ...props }: ComponentProps<"button"> & { variant?: BtnVariant }) {
  return <button type="button" className={clsx(btnBase, !has(className, "h") && "h-9", btnVariants[variant], className)} {...props} />;
}

export function IconBtn({ label, className, ...props }: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(!has(className, "size") && "size-8", "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-primary-light hover:text-primary disabled:opacity-40", className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export function Badge({ tone = "neutral", children, className }: { tone?: "neutral" | "teal" | "gold" | "success" | "warning" | "error"; children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex h-5 shrink-0 items-center rounded-full border px-2 text-xs font-semibold whitespace-nowrap",
        tone === "neutral" && "border-line bg-background text-muted",
        tone === "teal" && "border-primary/25 bg-primary-light text-primary",
        tone === "gold" && "border-gold/50 bg-gold/10 text-ink",
        tone === "success" && "border-success/30 bg-success/10 text-success",
        tone === "warning" && "border-warning/50 bg-warning/15 text-ink",
        tone === "error" && "border-error/30 bg-error/10 text-error",
        className,
      )}
    >
      {children}
    </span>
  );
}

export const StatusBadge = ({ status }: { status: Status }) => (
  <Badge tone={status === "published" ? "success" : status === "draft" ? "warning" : "neutral"}>{status === "published" ? "Published" : status === "draft" ? "Draft" : "Archived"}</Badge>
);
export const AccessBadge = ({ access }: { access: Access }) => <Badge tone={access === "premium" ? "gold" : "teal"}>{access === "premium" ? "Premium" : "Free"}</Badge>;

/* ------------------------------------------------------------------ */
/* Form fields                                                         */
/* ------------------------------------------------------------------ */

const control =
  "w-full rounded-md border border-line bg-white px-3 text-sm text-ink transition-[border,box-shadow] outline-none placeholder:text-faint hover:border-faint focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-light)] disabled:bg-background disabled:text-muted";

export function Field({ label, hint, error, required, children, className }: { label: ReactNode; hint?: ReactNode; error?: string; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={clsx("block", className)}>
      <label className="block">
        <span className="mb-1 flex items-center gap-1 text-sm font-medium text-ink">
          {label}
          {required && <span className="text-error" aria-hidden>*</span>}
        </span>
        {children}
      </label>
      {/* Hint and error sit outside the <label> so they don't become part of the field's name. */}
      {error ? <span className="mt-1 block text-xs text-error" role="alert">{error}</span> : hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </div>
  );
}

export function Input({ className, invalid, ...props }: ComponentProps<"input"> & { invalid?: boolean }) {
  return <input className={clsx(control, !has(className, "h") && "h-9", invalid && "border-error", className)} aria-invalid={invalid || undefined} {...props} />;
}

export function TextArea({ className, invalid, ...props }: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return <textarea className={clsx(control, "min-h-[84px] py-2 leading-5", invalid && "border-error", className)} aria-invalid={invalid || undefined} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={clsx(control, !has(className, "h") && "h-9", "cursor-pointer pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; description?: ReactNode; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx("relative mt-0.5 h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50", checked ? "bg-primary" : "bg-line")}
      >
        <span className={clsx("absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform", checked && "translate-x-4")} />
      </button>
      {(label || description) && (
        <label htmlFor={id} className="min-w-0 cursor-pointer">
          {label && <span className="block text-sm font-medium text-ink">{label}</span>}
          {description && <span className="block text-xs text-muted">{description}</span>}
        </label>
      )}
    </div>
  );
}

/** Two-option segmented control (Free / Premium, Tutor / Timed ...). */
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-md border border-line bg-background p-0.5" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx("h-8 cursor-pointer rounded px-3 text-sm font-medium transition-colors", value === o.value ? "bg-white text-primary shadow-sm" : "text-muted hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({ title, body, action, icon }: { title: string; body?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-3 text-faint">{icon}</div>}
      <p className="text-base font-semibold text-ink">{title}</p>
      {body && <p className="mt-1 max-w-md text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dialogs                                                             */
/* ------------------------------------------------------------------ */

export function Dialog({ open, onClose, title, children, footer, width = 520 }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="animate-fade-in fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(9,68,72,0.35)] p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" className="animate-pop-in flex max-h-[calc(100dvh-32px)] w-full flex-col rounded-lg bg-white shadow-xl" style={{ maxWidth: width }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <IconBtn label="Close" onClick={onClose}>
            <X className="size-4" />
          </IconBtn>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/** Right-side drawer for editing small records without leaving the list. */
export function Drawer({ open, onClose, title, children, footer, width = 560 }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="animate-fade-in absolute inset-0 bg-[rgba(9,68,72,0.3)]" onClick={onClose} />
      <aside role="dialog" aria-modal="true" className="animate-slide-in-right absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl" style={{ maxWidth: width }}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h2 className="min-w-0 truncate text-base font-semibold text-ink">{title}</h2>
          <IconBtn label="Close" onClick={onClose}>
            <X className="size-4" />
          </IconBtn>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </aside>
    </div>
  );
}

/* Promise-based confirm, rendered once by the admin shell (no window.confirm). */
interface ConfirmReq {
  title: string;
  body?: ReactNode;
  confirm: string;
  danger?: boolean;
  /** User must type this text to enable the button (destructive resets). */
  typeToConfirm?: string;
  resolve: (ok: boolean) => void;
}
const useConfirmStore = create<{ req: ConfirmReq | null; typed: string }>(() => ({ req: null, typed: "" }));

export function confirmDialog(opts: Omit<ConfirmReq, "resolve">): Promise<boolean> {
  return new Promise((resolve) => useConfirmStore.setState({ req: { ...opts, resolve }, typed: "" }));
}

export function ConfirmHost() {
  const { req, typed } = useConfirmStore();
  const close = (ok: boolean) => {
    req?.resolve(ok);
    useConfirmStore.setState({ req: null, typed: "" });
  };
  const blocked = Boolean(req?.typeToConfirm && typed !== req.typeToConfirm);
  return (
    <Dialog
      open={Boolean(req)}
      onClose={() => close(false)}
      title={req?.title}
      width={460}
      footer={
        <>
          <Btn onClick={() => close(false)}>Cancel</Btn>
          <Btn variant={req?.danger ? "danger" : "primary"} disabled={blocked} onClick={() => close(true)}>
            {req?.confirm}
          </Btn>
        </>
      }
    >
      {req?.body && <div className="text-sm leading-6 text-ink">{req.body}</div>}
      {req?.typeToConfirm && (
        <Field label={`Type “${req.typeToConfirm}” to confirm`} className="mt-3">
          <Input value={typed} onChange={(e) => useConfirmStore.setState({ typed: e.target.value })} autoFocus />
        </Field>
      )}
    </Dialog>
  );
}

/* Toasts */
interface Toast {
  id: number;
  tone: "success" | "error" | "info";
  text: string;
}
const useToasts = create<{ list: Toast[] }>(() => ({ list: [] }));
let toastId = 0;
export function toast(text: string, tone: Toast["tone"] = "success") {
  const id = ++toastId;
  useToasts.setState((s) => ({ list: [...s.list, { id, tone, text }] }));
  setTimeout(() => useToasts.setState((s) => ({ list: s.list.filter((t) => t.id !== id) })), 3600);
}

export function Toaster() {
  const list = useToasts((s) => s.list);
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[70] flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-2" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className="animate-pop-in pointer-events-auto flex items-start gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink shadow-lg">
          {t.tone === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : t.tone === "error" ? <AlertTriangle className="mt-0.5 size-4 shrink-0 text-error" /> : <Info className="mt-0.5 size-4 shrink-0 text-primary" />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

/** Warn before leaving a page with unsaved edits (tab close and in-app links). */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href]");
      if (!a || a.getAttribute("target") === "_blank") return;
      if (!window.confirm("You have unsaved changes. Leave without saving?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}

/** Small label/value pair for detail panels. */
export function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}

export const fmtDate = (iso?: string) => (iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");
export const fmtDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
export const stripHtml = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

/** Deep-equal for editor dirty checks; ignores the store-managed `updatedAt`. */
export function sameRecord(a: unknown, b: unknown) {
  const strip = (x: unknown) => JSON.stringify(x, (k, v) => (k === "updatedAt" ? undefined : v));
  return strip(a) === strip(b);
}
