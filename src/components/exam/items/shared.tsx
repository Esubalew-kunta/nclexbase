import clsx from "clsx";
import { BRAND } from "@/lib/brand";
import type { Answer, Item } from "@/lib/types";

export interface ItemProps<T extends Item> {
  item: T;
  answer: Answer;
  onChange: (a: Answer) => void;
  /** Answer can no longer change (submitted or review mode). */
  locked: boolean;
  /** Show correct/incorrect markers (tutor after submit, or review). */
  reveal: boolean;
}

/** Green check / red X shown next to options after submitting (Pearson style). */
export function Mark({ correct, show, className }: { correct: boolean; show: boolean; className?: string }) {
  return (
    <span className={clsx("inline-flex w-6 shrink-0 justify-center", className)} aria-hidden={!show}>
      {show &&
        (correct ? (
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke={BRAND.success} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke={BRAND.error} strokeWidth={2.5} strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        ))}
    </span>
  );
}

/** Native checkbox/radio, 20px, like the live exam (disabled = gray once submitted). */
export function NativeInput({
  type,
  checked,
  disabled,
  onChange,
  label,
}: {
  type: "checkbox" | "radio";
  checked: boolean;
  disabled?: boolean;
  onChange?: () => void;
  label?: string;
}) {
  return (
    <input
      type={type}
      checked={checked}
      disabled={disabled}
      onChange={() => onChange?.()}
      aria-label={label}
      className="mx-2 size-5 shrink-0 cursor-pointer align-middle accent-primary disabled:cursor-default"
    />
  );
}

export function Html({ html, className }: { html: string; className?: string }) {
  // Content comes from local, trusted mock data files.
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Live matrix table cell styling. */
export const tableCls = "border-collapse text-center text-base leading-6";
export const thCls = "border border-line bg-primary-light p-[5px] font-bold text-exam-ink";
export const tdCls = "border border-line p-[5px]";
