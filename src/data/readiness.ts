import type { BowtieItem, CaseStudy, Item, SessionEntry } from "@/lib/types";
import raw from "./live/readiness-exam1.json";

/*
 * CAT Readiness Exam 1, captured from the free exam on app.bootcamp.com (see scripts/build-readiness.py).
 * Items keep the live order: standalone questions with four six-item case studies and two exhibit questions.
 */

type Raw = {
  q: number;
  type: string;
  subject: string;
  system: string;
  avgPercent: number;
  explanation: string;
  case: string | null;
  lead?: string;
  stem?: string;
  [k: string]: unknown;
};

const R = raw as unknown as {
  cases: { key: string; intro: string; subject: string; tabs: { label: string; html: string }[] }[];
  items: Raw[];
};

export const readinessItemId = (q: number) => `r1-q${q}`;

function toItem(r: Raw): Item {
  const base = {
    id: readinessItemId(r.q),
    subject: r.subject as Item["subject"],
    system: r.system,
    topic: r.system,
    lead: r.lead || undefined,
    stem: r.stem ?? "",
    avgPercent: r.avgPercent,
    rationale: { explanation: r.explanation, takeaway: [], raw: true },
  };
  const f = r as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  switch (r.type) {
    case "mcq":
      return { ...base, type: "mcq", options: f.options, answer: f.answer };
    case "sata":
      return { ...base, type: "sata", options: f.options, answers: f.answers };
    case "selectN":
      return { ...base, type: "selectN", n: f.n, options: f.options, answers: f.answers };
    case "matrix":
      return { ...base, type: "matrix", rowHeader: f.rowHeader, columns: f.columns, rows: f.rows, answers: f.answers };
    case "matrixMulti":
      return { ...base, type: "matrixMulti", rowHeader: f.rowHeader, columns: f.columns, rows: f.rows, answers: f.answers };
    case "dragCloze":
      return { ...base, type: "dragCloze", template: f.template, choices: f.choices, answers: f.answers };
    case "dropdown":
      return { ...base, type: "dropdown", template: f.template, blanks: f.blanks };
    case "highlightText":
      return { ...base, type: "highlightText", html: f.html, answers: f.answers };
    case "fitb":
      return { ...base, type: "fitb", answer: String(f.answer) };
    case "bowtie":
      return {
        ...base,
        type: "bowtie",
        conditions: f.conditions,
        actions: f.actions,
        parameters: f.parameters,
        answer: f.answer as BowtieItem["answer"],
      };
    default:
      throw new Error(`Unknown readiness item type ${r.type}`);
  }
}

const itemsByQ = new Map<number, Item>(R.items.map((r) => [r.q, toItem(r)]));

export const READINESS_CASES: CaseStudy[] = R.cases.map((c) => {
  const items = R.items.filter((r) => r.case === c.key).map((r) => itemsByQ.get(r.q)!);
  return {
    id: `r1-${c.key}`,
    title: c.key.startsWith("exhibit") ? "" : "Case Study",
    subject: c.subject as CaseStudy["subject"],
    intro: c.intro,
    exhibit: c.key.startsWith("exhibit"),
    tabs: c.tabs.map((t) => ({ label: t.label, content: { kind: "text" as const, html: t.html } })),
    items,
  };
});

export const READINESS_ITEMS: Item[] = R.items.map((r) => itemsByQ.get(r.q)!);

/** Entries in exam order. Items that belong to a case carry its id. */
export function readinessEntries(): SessionEntry[] {
  return R.items.map((r) => ({ itemId: readinessItemId(r.q), caseId: r.case ? `r1-${r.case}` : undefined }));
}

/** Shuffle whole groups (a case stays together, in order) so exams 2-4 present the same bank differently. */
export function readinessEntriesShuffled(seed: number): SessionEntry[] {
  const groups: SessionEntry[][] = [];
  for (const e of readinessEntries()) {
    const last = groups[groups.length - 1];
    if (e.caseId && last && last[0].caseId === e.caseId) last.push(e);
    else groups.push([e]);
  }
  let a = seed;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = groups.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [groups[i], groups[j]] = [groups[j], groups[i]];
  }
  return groups.flat();
}
