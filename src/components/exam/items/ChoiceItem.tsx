"use client";

import clsx from "clsx";
import type { McqItem, SataItem, SelectNItem } from "@/lib/types";
import { Mark, NativeInput, type ItemProps } from "./shared";

/**
 * Multiple choice (radio), select all that apply, and select-N (checkbox).
 * Options are white rows with a soft border; selected = pale teal + teal border; after
 * reveal, green/red borders plus a check/X mark and a text label (never color alone).
 */
export function ChoiceItem({ item, answer, onChange, locked, reveal }: ItemProps<McqItem | SataItem | SelectNItem>) {
  const single = item.type === "mcq";
  const chosen: number[] =
    answer.type === "mcq" ? (answer.choice == null ? [] : [answer.choice]) : answer.type === "sata" || answer.type === "selectN" ? answer.choices : [];
  const correct = item.type === "mcq" ? [item.answer] : item.answers;
  const limit = item.type === "selectN" ? item.n : Infinity;

  const toggle = (i: number) => {
    if (locked) return;
    if (item.type === "mcq") return onChange({ type: "mcq", choice: i });
    const has = chosen.includes(i);
    if (!has && chosen.length >= limit) return;
    onChange({ type: item.type, choices: has ? chosen.filter((c) => c !== i) : [...chosen, i].sort((a, b) => a - b) });
  };

  return (
    <div role={single ? "radiogroup" : "group"}>
      {item.options.map((opt, i) => {
        const on = chosen.includes(i);
        const isCorrect = correct.includes(i);
        const state = reveal ? (isCorrect ? "correct" : on ? "wrong" : "plain") : on ? "selected" : "plain";
        return (
          <label
            key={i}
            className={clsx(
              "my-1.5 flex min-h-[46px] items-center rounded-md border bg-white py-1 pr-3 text-exam-ink transition-colors",
              !locked && "cursor-pointer hover:bg-primary-light",
              state === "plain" && "border-line",
              state === "selected" && "border-primary bg-primary-light shadow-[inset_0_0_0_1px_var(--color-primary)]",
              state === "correct" && "border-success bg-success/10 shadow-[inset_0_0_0_1px_var(--color-success)]",
              state === "wrong" && "border-error bg-error/10 shadow-[inset_0_0_0_1px_var(--color-error)]",
            )}
          >
            <Mark show={reveal && (on || isCorrect)} correct={on ? isCorrect : true} className="-ml-8 mr-2" />
            <NativeInput type={single ? "radio" : "checkbox"} checked={on} disabled={locked} onChange={() => toggle(i)} label={opt} />
            <span className="ml-3 w-5 shrink-0">{i + 1}.</span>
            <span className="ml-4 flex-1">{opt}</span>
            {state === "correct" && <span className="ml-3 shrink-0 text-sm font-semibold text-success">{on ? "Correct" : "Correct answer"}</span>}
            {state === "wrong" && <span className="ml-3 shrink-0 text-sm font-semibold text-error">Incorrect</span>}
          </label>
        );
      })}
    </div>
  );
}
