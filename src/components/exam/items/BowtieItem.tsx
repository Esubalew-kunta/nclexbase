"use client";

import clsx from "clsx";
import { BRAND } from "@/lib/brand";
import type { BowtieItem as Bowtie } from "@/lib/types";
import { Mark, type ItemProps } from "./shared";

type Group = "actions" | "condition" | "parameters";

export function BowtieItemView({ item, answer, onChange, locked, reveal }: ItemProps<Bowtie>) {
  const a = answer.type === "bowtie" ? answer : { type: "bowtie" as const, condition: null, actions: [], parameters: [] };

  const toggle = (group: Group, i: number) => {
    if (locked) return;
    if (group === "condition") return onChange({ ...a, condition: a.condition === i ? null : i });
    const list = a[group];
    const next = list.includes(i) ? list.filter((x) => x !== i) : list.length < 2 ? [...list, i] : list;
    onChange({ ...a, [group]: next });
  };

  const slot = (group: Group, value: number | undefined | null, label: string) => {
    const options = group === "condition" ? item.conditions : group === "actions" ? item.actions : item.parameters;
    const correctSet =
      group === "condition" ? [item.answer.condition] : group === "actions" ? item.answer.actions : item.answer.parameters;
    const filled = value !== undefined && value !== null;
    return (
      <div className="flex items-center gap-1">
        {reveal && filled && <Mark show correct={correctSet.includes(value)} />}
        <button
          type="button"
          disabled={locked || !filled}
          onClick={() => filled && toggle(group, value)}
          aria-label={filled ? `${label}: ${options[value]}. Click to remove.` : `${label}, empty`}
          className={clsx(
            "flex min-h-[64px] w-full items-center justify-center px-3 py-2 text-center text-[15px] leading-snug",
            filled ? "border border-primary bg-white" : "border border-dashed border-faint bg-primary-light text-muted",
          )}
        >
          {filled ? options[value] : label}
        </button>
      </div>
    );
  };

  const column = (group: Group, title: string, options: string[]) => {
    const selected = group === "condition" ? (a.condition === null ? [] : [a.condition]) : a[group];
    return (
      <div className="border border-line">
        <div className="bg-primary-light px-3 py-2 text-center font-bold">{title}</div>
        <div className="space-y-1 p-2">
          {options.map((o, i) => {
            const on = selected.includes(i);
            return (
              <button
                key={i}
                type="button"
                disabled={locked}
                onClick={() => toggle(group, i)}
                aria-pressed={on}
                className={clsx(
                  "block w-full px-3 py-2.5 text-left text-[15px] leading-snug disabled:cursor-default",
                  on ? "bg-white text-faint outline outline-line" : "bg-primary-light hover:bg-primary/15",
                )}
              >
                {o}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[760px]">
      {/* The bow tie */}
      <div className="relative grid grid-cols-[1fr_1.1fr_1fr] items-center gap-x-8 gap-y-3 rounded border border-line bg-background p-4">
        <svg className="pointer-events-none absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden>
          <path d="M31 27 L50 50 L31 73 M69 27 L50 50 L69 73" stroke={BRAND.faint} strokeWidth="0.4" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="relative space-y-3">
          {slot("actions", a.actions[0], "Action to Take")}
          {slot("actions", a.actions[1], "Action to Take")}
        </div>
        <div className="relative">{slot("condition", a.condition, "Condition Most Likely Experiencing")}</div>
        <div className="relative space-y-3">
          {slot("parameters", a.parameters[0], "Parameter to Monitor")}
          {slot("parameters", a.parameters[1], "Parameter to Monitor")}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {column("actions", "Actions to Take", item.actions)}
        {column("condition", "Potential Conditions", item.conditions)}
        {column("parameters", "Parameters to Monitor", item.parameters)}
      </div>
    </div>
  );
}
