"use client";

import type { McqItem, SataItem, SelectNItem } from "@/lib/types";
import { Mark, NativeInput, type ItemProps } from "./shared";

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
    <div role={single ? "radiogroup" : "group"}>
      {item.options.map((opt, i) => {
        const on = chosen.includes(i);
        const isCorrect = correct.includes(i);
        return (
          <label key={i} className="flex min-h-[46px] cursor-pointer items-center py-1">
            <Mark show={reveal && (on || isCorrect)} correct={on ? isCorrect : true} className="-ml-7 mr-1" />
            <NativeInput type={single ? "radio" : "checkbox"} checked={on} disabled={locked} onChange={() => toggle(i)} label={opt} />
            <span className="ml-3 w-5 shrink-0">{i + 1}.</span>
            <span className="ml-4 flex-1">{opt}</span>
          </label>
        );
      })}
    </div>
  );
}
