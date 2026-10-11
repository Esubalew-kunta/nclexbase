"use client";

import clsx from "clsx";
import { useState, type ReactNode } from "react";
import type { DragClozeItem, DropdownClozeItem } from "@/lib/types";
import { Mark, type ItemProps } from "./shared";

/** Splits "text {0} text {1}" into text parts and blank indexes. */
function renderTemplate(template: string, blank: (i: number) => ReactNode) {
  return template.split(/(\{\d+\})/).map((part, k) => {
    const m = part.match(/^\{(\d+)\}$/);
    return m ? <span key={k}>{blank(Number(m[1]))}</span> : <span key={k}>{part}</span>;
  });
}

export function DragClozeItemView({ item, answer, onChange, locked, reveal }: ItemProps<DragClozeItem>) {
  const blanks = answer.type === "dragCloze" ? answer.blanks : item.answers.map(() => null);
  const [picked, setPicked] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const place = (blank: number, choice: number) => {
    if (locked) return;
    const next = blanks.map((b) => (b === choice ? null : b));
    next[blank] = choice;
    onChange({ type: "dragCloze", blanks: next });
    setPicked(null);
  };
  const clear = (blank: number) => {
    if (locked) return;
    const next = [...blanks];
    next[blank] = null;
    onChange({ type: "dragCloze", blanks: next });
  };
  const pickChoice = (choice: number) => {
    if (locked) return;
    // Clicking a choice drops it into the first empty blank (keyboard/touch friendly).
    const empty = blanks.findIndex((b) => b === null);
    if (empty >= 0) place(empty, choice);
    else setPicked(choice);
  };

  return (
    <div>
      <p className="leading-[2.6]">
        {renderTemplate(item.template, (i) => {
          const v = blanks[i];
          const ok = v === item.answers[i];
          return (
            <span className="inline-flex items-center gap-1 align-middle">
              {reveal && <Mark show correct={ok} />}
              <button
                type="button"
                disabled={locked && v === null}
                onClick={() => (picked !== null ? place(i, picked) : v !== null ? clear(i) : undefined)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(i);
                }}
                onDragLeave={() => setOver(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(null);
                  place(i, Number(e.dataTransfer.getData("text/plain")));
                }}
                aria-label={v === null ? `Blank ${i + 1}, empty` : `Blank ${i + 1}: ${item.choices[v]}. Click to clear.`}
                className={clsx(
                  "inline-flex min-h-9 min-w-[250px] items-center px-3 text-left align-middle leading-snug",
                  v === null ? "bg-primary-light" : "border border-primary bg-white",
                  over === i && "ring-2 ring-primary",
                  reveal && !ok && "border-error",
                )}
              >
                {v !== null ? item.choices[v] : ""}
              </button>
              {reveal && !ok && <span className="text-sm font-semibold text-success">({item.choices[item.answers[i]]})</span>}
            </span>
          );
        })}
      </p>

      <div className="mt-6 w-full max-w-[500px] border border-black">
        <div className="border-b border-black bg-primary-light py-5 text-center font-bold">Word Choices</div>
        <div className="space-y-1 p-2">
          {item.choices.map((c, i) => {
            const usedIn = blanks.indexOf(i);
            return (
              <button
                key={i}
                type="button"
                draggable={!locked && usedIn < 0}
                onDragStart={(e) => e.dataTransfer.setData("text/plain", String(i))}
                disabled={locked || usedIn >= 0}
                onClick={() => pickChoice(i)}
                className={clsx(
                  "block min-h-[62px] w-full px-2.5 text-left",
                  usedIn >= 0 ? "bg-white text-transparent" : "bg-primary-light hover:bg-primary/15",
                  picked === i && "ring-2 ring-primary",
                  !locked && usedIn < 0 && "cursor-grab active:cursor-grabbing",
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DropdownClozeItemView({ item, answer, onChange, locked, reveal }: ItemProps<DropdownClozeItem>) {
  const blanks = answer.type === "dropdown" ? answer.blanks : item.blanks.map(() => null);
  const set = (i: number, v: number | null) => {
    const next = [...blanks];
    next[i] = v;
    onChange({ type: "dropdown", blanks: next });
  };

  return (
    <p className="leading-[2]">
      {renderTemplate(item.template, (i) => {
        const b = item.blanks[i];
        const v = blanks[i];
        const ok = v === b.answer;
        return (
          <span className="inline-flex items-center gap-1 align-middle">
            {reveal && <Mark show correct={ok} />}
            <select
              value={v ?? ""}
              disabled={locked}
              onChange={(e) => set(i, e.target.value === "" ? null : Number(e.target.value))}
              aria-label={`Blank ${i + 1}`}
              className={clsx(
                "h-[25px] max-w-[320px] rounded-[2px] border bg-white px-1 align-middle text-base disabled:opacity-100",
                reveal && !ok ? "border-error" : "border-muted",
              )}
            >
              <option value="">Select...</option>
              {b.options.map((o, k) => (
                <option key={k} value={k}>
                  {o}
                </option>
              ))}
            </select>
            {reveal && !ok && <span className="text-sm font-semibold text-success">({b.options[b.answer]})</span>}
          </span>
        );
      })}
    </p>
  );
}
