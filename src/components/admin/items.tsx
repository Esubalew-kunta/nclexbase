"use client";

/*
 * Question authoring: one form per Next Gen item type, validation, and a live preview
 * that renders the real exam component (so what the admin sees is what students get).
 */

import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { emptyAnswer } from "@/lib/scoring";
import type { Answer, Item, ItemType } from "@/lib/types";
import { ItemView } from "@/components/exam/items/ItemView";
import { Feedback } from "@/components/exam/Feedback";
import { Html } from "@/components/exam/items/shared";
import { Btn, Field, IconBtn, Input, Segmented, TextArea } from "./ui";

export const TYPE_LABELS: Record<ItemType, string> = {
  mcq: "Multiple choice",
  sata: "Select all that apply",
  selectN: "Select N",
  matrix: "Matrix (single)",
  matrixMulti: "Matrix (multiple)",
  dragCloze: "Drag and drop cloze",
  dropdown: "Drop-down cloze",
  highlight: "Highlight (table)",
  highlightText: "Highlight (passage)",
  bowtie: "Bowtie",
  dragTopN: "Drag top N",
  fitb: "Fill in the blank",
};

type Draft = Item;
type Patch = (patch: Partial<Item>) => void;

/* ------------------------------------------------------------------ */
/* New item templates                                                  */
/* ------------------------------------------------------------------ */

export function blankItem(type: ItemType, base: { id: string; subject: Item["subject"]; system: string }): Item {
  const common = { id: base.id, subject: base.subject, system: base.system, topic: "", stem: "", avgPercent: 60, rationale: { explanation: "", takeaway: [] as string[] } };
  switch (type) {
    case "mcq":
      return { ...common, type, options: ["", "", "", ""], answer: 0 };
    case "sata":
      return { ...common, type, options: ["", "", "", "", ""], answers: [] };
    case "selectN":
      return { ...common, type, n: 2, options: ["", "", "", "", ""], answers: [] };
    case "matrix":
      return { ...common, type, rowHeader: "Finding", columns: ["Option A", "Option B"], rows: ["", ""], answers: [0, 0] };
    case "matrixMulti":
      return { ...common, type, rowHeader: "Finding", columns: ["Option A", "Option B"], rows: ["", ""], answers: [[], []] };
    case "dragCloze":
      return { ...common, type, template: "The nurse should first {0}, then {1}.", choices: ["", "", ""], answers: [0, 1] };
    case "dropdown":
      return { ...common, type, template: "The client is most likely experiencing {0}.", blanks: [{ options: ["", "", ""], answer: 0 }] };
    case "highlight":
      return { ...common, type, headers: ["Body System", "Findings"], rows: [{ label: "", segments: [""] }], answers: [] };
    case "highlightText":
      return { ...common, type, html: '<p><span class="hl" data-h="a">First finding</span>. <span class="hl" data-h="b">Second finding</span>.</p>', answers: [] };
    case "bowtie":
      return { ...common, type, conditions: ["", "", "", ""], actions: ["", "", "", "", ""], parameters: ["", "", "", "", ""], answer: { condition: 0, actions: [0, 1], parameters: [0, 1] } };
    case "dragTopN":
      return { ...common, type, n: 3, sourceLabel: "Findings", targetLabel: "Priority findings", options: ["", "", "", "", ""], answers: [] };
    case "fitb":
      return { ...common, type, answer: "" };
  }
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

const blanks = (template: string) => [...template.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1]));
const textOf = (html: string) => html.replace(/<[^>]+>/g, "").trim();

/** Problems that block publishing. Empty array = valid. */
export function validateItem(it: Item): string[] {
  const e: string[] = [];
  if (!textOf(it.stem) && it.type !== "highlightText") e.push("Write the question stem.");
  if (!textOf(it.rationale.explanation)) e.push("Add the rationale explanation students see after answering.");
  const optsFilled = (opts: string[], what = "option") => opts.some((o) => !o.trim()) && e.push(`Fill in or remove every empty ${what}.`);
  switch (it.type) {
    case "mcq":
      optsFilled(it.options);
      if (it.options.length < 2) e.push("Multiple choice needs at least 2 options.");
      if (it.answer < 0 || it.answer >= it.options.length) e.push("Mark the correct option.");
      break;
    case "sata":
      optsFilled(it.options);
      if (!it.answers.length) e.push("Mark at least one correct option.");
      break;
    case "selectN":
      optsFilled(it.options);
      if (it.answers.length !== it.n) e.push(`Mark exactly ${it.n} correct options (now ${it.answers.length}).`);
      break;
    case "matrix":
    case "matrixMulti":
      optsFilled(it.rows, "row");
      optsFilled(it.columns, "column");
      if (it.columns.length < 2) e.push("A matrix needs at least 2 columns.");
      if (it.type === "matrixMulti" && it.answers.some((a) => !a.length)) e.push("Every row needs at least one correct column.");
      break;
    case "dragCloze": {
      optsFilled(it.choices, "word choice");
      const b = blanks(it.template);
      if (!b.length) e.push("Add blanks to the sentence with {0}, {1} …");
      if (b.some((i) => i >= it.answers.length)) e.push("Every blank in the sentence needs a correct word.");
      break;
    }
    case "dropdown": {
      const b = blanks(it.template);
      if (!b.length) e.push("Add drop-downs to the sentence with {0}, {1} …");
      if (b.some((i) => i >= it.blanks.length)) e.push("Every {n} in the sentence needs its drop-down options.");
      if (it.blanks.some((x) => x.options.some((o) => !o.trim()))) e.push("Fill in every drop-down option.");
      break;
    }
    case "highlight":
      if (!it.rows.length) e.push("Add at least one row.");
      if (it.rows.some((r) => !r.label.trim() || r.segments.some((s) => !s.trim()))) e.push("Fill in every row label and finding.");
      if (!it.answers.length) e.push("Mark at least one finding as correct.");
      break;
    case "highlightText":
      if (!it.answers.length) e.push("List at least one correct highlight key.");
      break;
    case "bowtie":
      optsFilled([...it.conditions, ...it.actions, ...it.parameters]);
      if (new Set(it.answer.actions).size !== 2 || new Set(it.answer.parameters).size !== 2) e.push("Pick 2 different correct actions and 2 different parameters.");
      break;
    case "dragTopN":
      optsFilled(it.options);
      if (it.answers.length !== it.n) e.push(`Mark exactly ${it.n} correct options (now ${it.answers.length}).`);
      break;
    case "fitb":
      if (!it.answer.trim()) e.push("Enter the correct answer.");
      break;
  }
  return e;
}

/* ------------------------------------------------------------------ */
/* Small list editor                                                   */
/* ------------------------------------------------------------------ */

function ListEditor({
  items,
  onChange,
  label,
  min = 1,
  marker,
  placeholder,
}: {
  items: string[];
  onChange: (next: string[], map: (i: number) => number) => void;
  label: string;
  min?: number;
  /** Left control for each row (correct-answer radio/checkbox). */
  marker?: (i: number) => ReactNode;
  placeholder?: (i: number) => string;
}) {
  // `map` translates old indexes to new ones so answer keys follow moved/removed rows (-1 = removed).
  const move = (i: number, d: number) => {
    const j = i + d;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next, (k) => (k === i ? j : k === j ? i : k));
  };
  return (
    <div className="space-y-1.5">
      {items.map((v, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {marker?.(i)}
          <span className="w-5 text-right text-xs text-muted tabular-nums">{i + 1}.</span>
          <Input value={v} onChange={(e) => onChange(items.map((x, k) => (k === i ? e.target.value : x)), (k) => k)} placeholder={placeholder?.(i) ?? `${label} ${i + 1}`} className="h-8" />
          <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
            <ArrowUp className="size-3.5" />
          </IconBtn>
          <IconBtn label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
            <ArrowDown className="size-3.5" />
          </IconBtn>
          <IconBtn label={`Remove ${label.toLowerCase()} ${i + 1}`} disabled={items.length <= min} onClick={() => onChange(items.filter((_, k) => k !== i), (k) => (k === i ? -1 : k > i ? k - 1 : k))} className="hover:text-error">
            <Trash2 className="size-3.5" />
          </IconBtn>
        </div>
      ))}
      <Btn variant="ghost" className="h-8" onClick={() => onChange([...items, ""], (k) => k)}>
        <Plus className="size-3.5" />
        Add {label.toLowerCase()}
      </Btn>
    </div>
  );
}

const Correct = ({ on, onClick, multi, label }: { on: boolean; onClick: () => void; multi?: boolean; label: string }) => (
  <button
    type="button"
    role={multi ? "checkbox" : "radio"}
    aria-checked={on}
    aria-label={label}
    onClick={onClick}
    title={on ? "Correct answer" : "Mark as correct"}
    className={clsx(
      "flex size-6 shrink-0 cursor-pointer items-center justify-center border text-xs font-bold transition-colors",
      multi ? "rounded" : "rounded-full",
      on ? "border-success bg-success text-white" : "border-faint bg-white text-transparent hover:border-success",
    )}
  >
    ✓
  </button>
);

const remap = (list: number[], map: (i: number) => number) => list.map(map).filter((i) => i >= 0);

/* ------------------------------------------------------------------ */
/* Type-specific answer setup                                          */
/* ------------------------------------------------------------------ */

export function AnswerSetup({ item, set }: { item: Draft; set: Patch }) {
  switch (item.type) {
    case "mcq":
      return (
        <Field label="Options" hint="Click the circle to mark the one correct option.">
          <ListEditor
            label="Option"
            min={2}
            items={item.options}
            marker={(i) => <Correct on={item.answer === i} onClick={() => set({ answer: i } as Partial<Item>)} label={`Option ${i + 1} is correct`} />}
            onChange={(options, map) => set({ options, answer: Math.max(0, map(item.answer)) } as Partial<Item>)}
          />
        </Field>
      );
    case "sata":
    case "selectN":
    case "dragTopN": {
      const toggle = (i: number) => set({ answers: item.answers.includes(i) ? item.answers.filter((x) => x !== i) : [...item.answers, i].sort((a, b) => a - b) } as Partial<Item>);
      return (
        <div className="space-y-3">
          {item.type !== "sata" && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="N (how many to pick)">
                <Input type="number" min={1} value={item.n} onChange={(e) => set({ n: Math.max(1, Number(e.target.value) || 1) } as Partial<Item>)} />
              </Field>
              {item.type === "dragTopN" && (
                <>
                  <Field label="Source column label">
                    <Input value={item.sourceLabel} onChange={(e) => set({ sourceLabel: e.target.value } as Partial<Item>)} />
                  </Field>
                  <Field label="Target column label">
                    <Input value={item.targetLabel} onChange={(e) => set({ targetLabel: e.target.value } as Partial<Item>)} />
                  </Field>
                </>
              )}
            </div>
          )}
          <Field label="Options" hint="Tick every correct option.">
            <ListEditor
              label="Option"
              min={2}
              items={item.options}
              marker={(i) => <Correct multi on={item.answers.includes(i)} onClick={() => toggle(i)} label={`Option ${i + 1} is correct`} />}
              onChange={(options, map) => set({ options, answers: remap(item.answers, map) } as Partial<Item>)}
            />
          </Field>
        </div>
      );
    }
    case "matrix":
    case "matrixMulti": {
      const multi = item.type === "matrixMulti";
      return (
        <div className="space-y-3">
          <Field label="Row header">
            <Input value={item.rowHeader} onChange={(e) => set({ rowHeader: e.target.value } as Partial<Item>)} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Columns">
              <ListEditor
                label="Column"
                min={2}
                items={item.columns}
                onChange={(columns, map) =>
                  set({ columns, answers: multi ? (item.answers as number[][]).map((a) => remap(a, map)) : (item.answers as number[]).map((a) => Math.max(0, map(a))) } as Partial<Item>)
                }
              />
            </Field>
            <Field label="Rows">
              <ListEditor
                label="Row"
                items={item.rows}
                onChange={(rows, map) => {
                  const old = item.answers as (number | number[])[];
                  const answers = rows.map((_, newIdx) => {
                    const from = old.findIndex((_, k) => map(k) === newIdx);
                    return from >= 0 ? old[from] : multi ? [] : 0;
                  });
                  set({ rows, answers } as Partial<Item>);
                }}
              />
            </Field>
          </div>
          <Field label="Correct answers" hint={multi ? "Tick every correct cell in each row." : "Pick the correct column for each row."}>
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="w-full text-sm">
                <thead className="bg-background">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-xs text-muted">{item.rowHeader}</th>
                    {item.columns.map((c, i) => (
                      <th key={i} className="px-2 py-1.5 text-center text-xs text-muted">
                        {c || `Column ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {item.rows.map((r, ri) => (
                    <tr key={ri} className="border-t border-line">
                      <td className="px-2 py-1.5">{r || `Row ${ri + 1}`}</td>
                      {item.columns.map((_, ci) => {
                        const on = multi ? (item.answers as number[][])[ri]?.includes(ci) : (item.answers as number[])[ri] === ci;
                        return (
                          <td key={ci} className="px-2 py-1.5">
                            <div className="flex justify-center">
                              <Correct
                                multi={multi}
                                on={Boolean(on)}
                                label={`Row ${ri + 1}, column ${ci + 1}`}
                                onClick={() => {
                                  if (multi) {
                                    const a = (item.answers as number[][]).map((x) => [...x]);
                                    a[ri] = a[ri]?.includes(ci) ? a[ri].filter((x) => x !== ci) : [...(a[ri] ?? []), ci].sort();
                                    set({ answers: a } as Partial<Item>);
                                  } else {
                                    const a = [...(item.answers as number[])];
                                    a[ri] = ci;
                                    set({ answers: a } as Partial<Item>);
                                  }
                                }}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Field>
        </div>
      );
    }
    case "dragCloze": {
      const ids = [...new Set(blanks(item.template))].sort((a, b) => a - b);
      return (
        <div className="space-y-3">
          <Field label="Sentence" hint="Mark each blank with {0}, {1}, {2} … in order.">
            <TextArea value={item.template} onChange={(e) => set({ template: e.target.value } as Partial<Item>)} rows={3} />
          </Field>
          <Field label="Word choices">
            <ListEditor label="Choice" min={2} items={item.choices} onChange={(choices, map) => set({ choices, answers: item.answers.map((a) => Math.max(0, map(a))) } as Partial<Item>)} />
          </Field>
          <Field label="Correct word for each blank">
            <div className="space-y-1.5">
              {ids.map((b) => (
                <div key={b} className="flex items-center gap-2 text-sm">
                  <span className="w-12 font-mono text-muted">{`{${b}}`}</span>
                  <select
                    value={item.answers[b] ?? 0}
                    onChange={(e) => {
                      const a = [...item.answers];
                      a[b] = Number(e.target.value);
                      set({ answers: a } as Partial<Item>);
                    }}
                    className="h-8 flex-1 rounded-md border border-line px-2"
                  >
                    {item.choices.map((c, i) => (
                      <option key={i} value={i}>
                        {c || `Choice ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </Field>
        </div>
      );
    }
    case "dropdown": {
      const ids = [...new Set(blanks(item.template))].sort((a, b) => a - b);
      const ensure = (i: number) => item.blanks[i] ?? { options: ["", ""], answer: 0 };
      const setBlank = (i: number, b: { options: string[]; answer: number }) => {
        const next = [...item.blanks];
        while (next.length <= i) next.push({ options: ["", ""], answer: 0 });
        next[i] = b;
        set({ blanks: next } as Partial<Item>);
      };
      return (
        <div className="space-y-3">
          <Field label="Sentence" hint="Mark each drop-down with {0}, {1} … in order.">
            <TextArea value={item.template} onChange={(e) => set({ template: e.target.value } as Partial<Item>)} rows={3} />
          </Field>
          {ids.map((b) => {
            const blank = ensure(b);
            return (
              <Field key={b} label={`Drop-down {${b}}`} hint="Click the circle to mark the correct option.">
                <ListEditor
                  label="Option"
                  min={2}
                  items={blank.options}
                  marker={(i) => <Correct on={blank.answer === i} onClick={() => setBlank(b, { ...blank, answer: i })} label={`Option ${i + 1} is correct`} />}
                  onChange={(options, map) => setBlank(b, { options, answer: Math.max(0, map(blank.answer)) })}
                />
              </Field>
            );
          })}
        </div>
      );
    }
    case "highlight": {
      const keyOf = (r: number, s: number) => `${r}-${s}`;
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Left column header">
              <Input value={item.headers[0]} onChange={(e) => set({ headers: [e.target.value, item.headers[1]] } as Partial<Item>)} />
            </Field>
            <Field label="Right column header">
              <Input value={item.headers[1]} onChange={(e) => set({ headers: [item.headers[0], e.target.value] } as Partial<Item>)} />
            </Field>
          </div>
          <Field label="Rows" hint="Each row has a label and findings students can highlight. Tick the findings that are correct.">
            <div className="space-y-3">
              {item.rows.map((row, r) => (
                <div key={r} className="rounded-md border border-line p-2">
                  <div className="mb-2 flex items-center gap-2">
                    <Input
                      value={row.label}
                      placeholder={`Row ${r + 1} label`}
                      className="h-8"
                      onChange={(e) => set({ rows: item.rows.map((x, k) => (k === r ? { ...x, label: e.target.value } : x)) } as Partial<Item>)}
                    />
                    <IconBtn
                      label={`Remove row ${r + 1}`}
                      disabled={item.rows.length <= 1}
                      onClick={() =>
                        set({
                          rows: item.rows.filter((_, k) => k !== r),
                          answers: item.answers.filter((a) => !a.startsWith(`${r}-`)).map((a) => {
                            const [rr, ss] = a.split("-").map(Number);
                            return rr > r ? keyOf(rr - 1, ss) : a;
                          }),
                        } as Partial<Item>)
                      }
                      className="hover:text-error"
                    >
                      <Trash2 className="size-3.5" />
                    </IconBtn>
                  </div>
                  <ListEditor
                    label="Finding"
                    items={row.segments}
                    marker={(s) => (
                      <Correct
                        multi
                        on={item.answers.includes(keyOf(r, s))}
                        label={`Finding ${s + 1} is correct`}
                        onClick={() => set({ answers: item.answers.includes(keyOf(r, s)) ? item.answers.filter((x) => x !== keyOf(r, s)) : [...item.answers, keyOf(r, s)] } as Partial<Item>)}
                      />
                    )}
                    onChange={(segments, map) =>
                      set({
                        rows: item.rows.map((x, k) => (k === r ? { ...x, segments } : x)),
                        answers: item.answers.flatMap((a) => {
                          const [rr, ss] = a.split("-").map(Number);
                          if (rr !== r) return [a];
                          const n = map(ss);
                          return n >= 0 ? [keyOf(rr, n)] : [];
                        }),
                      } as Partial<Item>)
                    }
                  />
                </div>
              ))}
              <Btn variant="ghost" onClick={() => set({ rows: [...item.rows, { label: "", segments: [""] }] } as Partial<Item>)}>
                <Plus className="size-3.5" />
                Add row
              </Btn>
            </div>
          </Field>
        </div>
      );
    }
    case "highlightText":
      return (
        <div className="space-y-3">
          <Field label="Passage HTML" hint={'Wrap each highlightable phrase in <span class="hl" data-h="key">…</span>.'}>
            <TextArea value={item.html} onChange={(e) => set({ html: e.target.value } as Partial<Item>)} rows={6} className="font-mono text-xs" />
          </Field>
          <Field label="Correct keys" hint="The data-h values that should be highlighted, separated by commas.">
            <Input value={item.answers.join(", ")} onChange={(e) => set({ answers: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } as Partial<Item>)} />
          </Field>
        </div>
      );
    case "bowtie": {
      const col = (key: "conditions" | "actions" | "parameters", label: string, pick: number) => {
        const list = item[key];
        const correct = (i: number) => (key === "conditions" ? item.answer.condition === i : (item.answer[key] as number[]).includes(i));
        const toggle = (i: number) => {
          if (key === "conditions") return set({ answer: { ...item.answer, condition: i } } as Partial<Item>);
          const cur = item.answer[key] as [number, number];
          const next = (cur.includes(i) ? cur : [cur[1], i]) as [number, number];
          set({ answer: { ...item.answer, [key]: next } } as Partial<Item>);
        };
        return (
          <Field label={`${label} (pick ${pick})`}>
            <ListEditor
              label={label.replace(/s$/, "")}
              min={pick + 1}
              items={list}
              marker={(i) => <Correct multi={pick > 1} on={correct(i)} onClick={() => toggle(i)} label={`${label} ${i + 1} is correct`} />}
              onChange={(next) => set({ [key]: next } as Partial<Item>)}
            />
          </Field>
        );
      };
      return (
        <div className="space-y-3">
          {col("conditions", "Conditions", 1)}
          {col("actions", "Actions", 2)}
          {col("parameters", "Parameters", 2)}
        </div>
      );
    }
    case "fitb":
      return (
        <Field label="Correct answer" hint="Exact value students must type (numbers are compared as written).">
          <Input value={item.answer} onChange={(e) => set({ answer: e.target.value } as Partial<Item>)} className="max-w-xs" />
        </Field>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Live preview                                                        */
/* ------------------------------------------------------------------ */

export function ItemPreview({ item }: { item: Item }) {
  const [answer, setAnswer] = useState<Answer>(() => emptyAnswer(item));
  const [mode, setMode] = useState<"answer" | "reveal">("answer");
  const reveal = mode === "reveal";
  // Reset the student's answer when the item's shape changes.
  const shape = JSON.stringify([item.type, "options" in item ? item.options.length : 0, "rows" in item ? item.rows.length : 0]);
  const [lastShape, setLastShape] = useState(shape);
  if (shape !== lastShape) {
    setLastShape(shape);
    setAnswer(emptyAnswer(item));
  }
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-primary px-3 py-2 text-sm text-white">
        <span className="font-semibold">Student preview</span>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "answer", label: "Answer it" },
            { value: "reveal", label: "Show answers" },
          ]}
        />
      </div>
      <div className="max-h-[75dvh] overflow-auto p-4 font-exam text-[16px] tracking-normal text-exam-ink">
        {item.lead && <p className="mb-4 leading-6">{item.lead}</p>}
        {item.stem ? <Html html={item.stem} className="block leading-6" /> : <p className="text-muted italic">The stem appears here.</p>}
        <div className="mt-4 pl-7">
          <ItemView item={item} answer={answer} onChange={setAnswer} locked={reveal} reveal={reveal} />
        </div>
        {reveal && <Feedback item={item} answer={answer} seconds={0} />}
      </div>
    </div>
  );
}
