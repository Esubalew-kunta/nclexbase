"use client";

import clsx from "clsx";
import { useEffect, useRef } from "react";
import type { FitbItem, HighlightTextItem } from "@/lib/types";
import { Mark, type ItemProps } from "./shared";

/** Numeric fill-in-the-blank (dosage calculation). */
export function FitbItemView({ item, answer, onChange, locked, reveal }: ItemProps<FitbItem>) {
  const value = answer.type === "fitb" ? answer.value : "";
  const ok = Number(value) === Number(item.answer);
  return (
    <div className="flex flex-wrap items-center gap-3">
      {reveal && <Mark show correct={ok} />}
      <input
        type="number"
        inputMode="decimal"
        value={value}
        disabled={locked}
        onChange={(e) => onChange({ type: "fitb", value: e.target.value })}
        aria-label="Your answer"
        className="h-9 w-40 border border-muted bg-white px-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary-light disabled:bg-background"
      />
      {reveal && <span className="text-base">Correct Answer: {item.answer}</span>}
    </div>
  );
}

/** Passage with click-to-highlight segments (`span.hl[data-h]`). */
export function HighlightTextItemView({ item, answer, onChange, locked, reveal }: ItemProps<HighlightTextItem>) {
  const keys = answer.type === "highlightText" ? answer.keys : [];
  const ref = useRef<HTMLDivElement>(null);

  // Paint the segment states onto the injected HTML.
  useEffect(() => {
    ref.current?.querySelectorAll<HTMLElement>("span.hl").forEach((el) => {
      const key = el.dataset.h ?? "";
      const on = keys.includes(key);
      const isAnswer = item.answers.includes(key);
      el.className = clsx(
        "hl rounded-sm px-0.5",
        !locked && "cursor-pointer hover:bg-[#fff6b8]",
        on && !reveal && "bg-[#ffe95c]",
        reveal && on && isAnswer && "bg-success/20",
        reveal && on && !isAnswer && "bg-error/15 line-through decoration-error",
        reveal && !on && isAnswer && "outline-2 outline-success outline-dashed",
      );
    });
  });

  return (
    <div
      ref={ref}
      className="leading-6 [&_table]:my-3 [&_td]:py-1 [&_td]:pr-3 [&_td]:align-top"
      onClick={(e) => {
        if (locked) return;
        const el = (e.target as HTMLElement).closest<HTMLElement>("span.hl");
        if (!el) return;
        const key = el.dataset.h ?? "";
        onChange({ type: "highlightText", keys: keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key] });
      }}
      dangerouslySetInnerHTML={{ __html: item.html }}
    />
  );
}
