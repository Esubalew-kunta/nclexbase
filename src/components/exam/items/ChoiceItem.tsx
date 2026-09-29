"use client";

import clsx from "clsx";
import type { McqItem, SataItem, SelectNItem } from "@/lib/types";
import { ExamCheck, Mark, type ItemProps } from "./shared";

/** Multiple choice (radio), select all that apply, and select-N (checkbox). */
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
    <div role={single ? "radiogroup" : "group"} className="space-y-1">
      {item.options.map((opt, i) => {
        const on = chosen.includes(i);
        const isCorrect = correct.includes(i);
        // Mark every selected option, plus correct options the user missed.
        const showMark = reveal && (on || isCorrect);
        return (
          <div key={i} className="flex items-start">
            <Mark show={showMark} correct={isCorrect} className="mt-2.5 mr-1" />
            <button
              type="button"
              role={single ? "radio" : "checkbox"}
              aria-checked={on}
              disabled={locked}
              onClick={() => toggle(i)}
              className={clsx(
                "flex w-full items-start gap-4 rounded px-1 py-2.5 text-left disabled:cursor-default",
                !locked && "hover:bg-[#f3f7fb]",
              )}
            >
              <ExamCheck checked={on} round={single} disabled={locked} />
              <span className="w-6 shrink-0 text-right">{i + 1}.</span>
              <span className="flex-1">{opt}</span>
            </button>
          </div>
        );
      })}
      {item.type === "selectN" && !locked && (
        <p className="pt-2 pl-8 text-sm text-[#555]">
          {chosen.length} of {item.n} selected
        </p>
      )}
    </div>
  );
}
