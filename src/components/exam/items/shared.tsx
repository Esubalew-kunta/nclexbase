import clsx from "clsx";
import { Check, X } from "lucide-react";
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

export function Mark({ correct, show, className }: { correct: boolean; show: boolean; className?: string }) {
  return (
    <span className={clsx("inline-flex w-6 shrink-0 justify-center", className)} aria-hidden={!show}>
      {show && (correct ? <Check className="size-5 text-[#2e9d3a]" strokeWidth={3} /> : <X className="size-5 text-[#d0312d]" strokeWidth={3} />)}
    </span>
  );
}

/** Square Pearson-style checkbox / round radio. */
export function ExamCheck({ checked, round, disabled }: { checked: boolean; round?: boolean; disabled?: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex size-5 shrink-0 items-center justify-center border-[1.5px]",
        round ? "rounded-full" : "rounded-[3px]",
        checked ? "border-[#0b62b5] bg-[#0b62b5]" : "border-[#767676] bg-white",
        disabled && !checked && "bg-[#f1f1f1]",
        disabled && checked && "border-[#9fb6cc] bg-[#9fb6cc]",
      )}
    >
      {checked &&
        (round ? (
          <span className="size-2 rounded-full bg-white" />
        ) : (
          <svg viewBox="0 0 12 12" className="size-3.5" fill="none" stroke="white" strokeWidth={2.2}>
            <path d="M2.5 6.2l2.3 2.3 4.7-4.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ))}
    </span>
  );
}

export function Html({ html, className }: { html: string; className?: string }) {
  // Content comes from local, trusted mock data files.
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
