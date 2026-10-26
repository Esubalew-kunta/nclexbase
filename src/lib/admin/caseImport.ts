import type { CaseTab, TabContent } from "@/lib/types";
import { normalizeRow, questionToJson, type ImportContext, type RowResult } from "./questionImport";
import type { Access, CaseRec, QuestionRec, Status } from "./types";

/*
 * Case study JSON: one object = details + scenario tabs + its questions (same question
 * format as the question import). Used by the bulk case import and the case editor's JSON view.
 * A case id that already exists updates that case; its questions are updated, added, or
 * archived when they are left out.
 */

export interface CaseImportRow {
  raw: unknown;
  rec: CaseRec | null;
  /** The case's questions, checked one by one. */
  questions: RowResult[];
  errors: string[];
  warnings: string[];
  mode: "create" | "update";
  previous?: CaseRec;
  /** Questions of an updated case that the JSON no longer lists (archived on save). */
  dropped: QuestionRec[];
  include: boolean;
}

export interface CaseContext extends ImportContext {
  existingCases: Map<string, CaseRec>;
  newCaseId: () => string;
  /** Next free case number (call once per new case). */
  nextNumber: () => number;
}

const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const strList = (v: unknown) => Array.isArray(v) && v.every(isStr);

/** JSON tab → stored tab. Returns an error message when the shape is wrong. */
function toTab(t: unknown, n: number): CaseTab | string {
  if (!isObj(t)) return `Tab ${n}: must be an object.`;
  if (!isStr(t.label) || !t.label.trim()) return `Tab ${n}: "label" is required.`;
  const kind = t.kind ?? "text";
  let content: TabContent;
  if (kind === "text") {
    if (!isStr(t.html)) return `Tab ${n}: a "text" tab needs "html".`;
    content = { kind, html: t.html };
  } else if (kind === "notes") {
    if (!Array.isArray(t.entries) || !t.entries.every((e) => isObj(e) && isStr(e.html) && (e.time === undefined || isStr(e.time)))) return `Tab ${n}: "entries" must be a list of { "time": "0800", "html": "…" }.`;
    if (t.heading !== undefined && !isStr(t.heading)) return `Tab ${n}: "heading" must be text.`;
    content = { kind, heading: (t.heading as string | undefined) ?? "", entries: (t.entries as { time?: string; html: string }[]).map((e) => ({ time: e.time ?? "", html: e.html })) };
  } else if (kind === "table") {
    if (!Array.isArray(t.rows) || !t.rows.every(strList)) return `Tab ${n}: "rows" must be a list of rows, each a list of texts.`;
    if (t.headers !== undefined && !strList(t.headers)) return `Tab ${n}: "headers" must be a list of texts.`;
    content = { kind, headers: t.headers as string[] | undefined, rows: t.rows as string[][] };
  } else return `Tab ${n}: "kind" must be "notes", "text" or "table".`;
  return { label: t.label, content };
}

function tabToJson(t: CaseTab): Record<string, unknown> {
  const c = t.content;
  if (c.kind === "notes") return { label: t.label, kind: c.kind, heading: c.heading ?? "", entries: c.entries };
  if (c.kind === "table") return { label: t.label, kind: c.kind, ...(c.headers ? { headers: c.headers } : {}), rows: c.rows };
  return { label: t.label, kind: c.kind, html: c.html };
}

export function normalizeCase(raw: unknown, ctx: CaseContext, seen: { cases: Set<string>; questions: Set<string> }, opts: { lockId?: string } = {}): Omit<CaseImportRow, "include"> {
  const fail = (errors: string[], questions: RowResult[] = []) => ({ raw, rec: null, questions, errors, warnings: [], mode: "create" as const, dropped: [] });
  if (!isObj(raw)) return fail(["Each case study must be a JSON object { … }."]);
  const errors: string[] = [];

  let id = "";
  let previous: CaseRec | undefined;
  if (raw.id !== undefined) {
    if (!isStr(raw.id) || !raw.id.trim()) errors.push('"id" must be text, or leave it out to create a new case.');
    else if (opts.lockId && raw.id !== opts.lockId) errors.push(`"id" can't be changed here (it is “${opts.lockId}”).`);
    else if (seen.cases.has(raw.id)) errors.push(`Case id “${raw.id}” appears twice.`);
    else {
      id = raw.id;
      previous = ctx.existingCases.get(raw.id);
      seen.cases.add(raw.id);
    }
  }

  if (!isStr(raw.title) || !raw.title.trim()) errors.push('"title" is required.');
  const sv = isStr(raw.subject) ? raw.subject.trim().toLowerCase() : "";
  const subject = ctx.subjects.find((s) => s.id.toLowerCase() === sv || s.name.toLowerCase() === sv);
  if (!subject) errors.push(isStr(raw.subject) ? `Unknown subject “${raw.subject}”.` : '"subject" is required.');
  if (raw.system !== undefined && (!isStr(raw.system) || (subject && !subject.systems.some((x) => x.key.toLowerCase() === (raw.system as string).toLowerCase() || x.label.toLowerCase() === (raw.system as string).toLowerCase()))))
    errors.push(`"system" must be a system of ${subject?.name ?? "the subject"} (used for questions that don't name one).`);
  if (raw.number !== undefined && (!isNum(raw.number) || !Number.isInteger(raw.number) || raw.number < 1)) errors.push('"number" must be a whole number (1 or more).');
  if (raw.access !== undefined && raw.access !== "free" && raw.access !== "premium") errors.push('"access" must be "free" or "premium".');
  if (raw.status !== undefined && raw.status !== "draft" && raw.status !== "published" && raw.status !== "archived") errors.push('"status" must be "draft", "published" or "archived".');
  if (raw.intro !== undefined && !isStr(raw.intro)) errors.push('"intro" must be text.');

  const tabs: CaseTab[] = [];
  if (!Array.isArray(raw.tabs) || !raw.tabs.length) errors.push('"tabs" is required: a list of scenario tabs (at least one).');
  else
    raw.tabs.forEach((t, i) => {
      const r = toTab(t, i + 1);
      if (typeof r === "string") errors.push(r);
      else tabs.push(r);
    });
  if (!Array.isArray(raw.questions)) errors.push('"questions" is required: a list of questions (same format as the question import).');
  if (errors.length || !subject) return fail(errors);

  id ||= ctx.newCaseId();
  const access = (raw.access as Access | undefined) ?? previous?.access ?? "premium";
  const qList = raw.questions as unknown[];
  // Case questions are published with the case; students only reach them through it.
  const questions = qList.map((q) => normalizeRow(q, ctx, seen.questions, { inCase: { caseId: id, subject: subject.id, system: isStr(raw.system) ? raw.system : undefined, access, status: "published" } }));
  const qErrors = questions.flatMap((q, i) => q.errors.map((e) => `Question ${i + 1}: ${e}`));
  questions.forEach((q, i) => {
    const t = q.rec?.tabs;
    if (q.rec && t !== undefined && t > tabs.length) qErrors.push(`Question ${i + 1}: "tabs" is ${t} but the case has ${tabs.length} tab${tabs.length === 1 ? "" : "s"}.`);
  });
  if (qErrors.length) return fail(qErrors, questions);

  const recs = questions.map((q, i) => ({ ...q.rec!, tabs: q.rec!.tabs ?? tabs.length, order: i }) as QuestionRec);
  questions.forEach((q, i) => (q.rec = recs[i]));
  const warnings = questions.flatMap((q, i) => q.warnings.map((w) => `Question ${i + 1}: ${w}`));
  if (!recs.length) warnings.push("No questions yet, so the case can't be published.");

  const wanted = (raw.status as Status | undefined) ?? previous?.status ?? "draft";
  let status = wanted;
  if (wanted === "published" && warnings.length) {
    status = "draft";
    warnings.push("Asked for “published”, so it is saved as a draft until these are fixed.");
  }
  const number = isNum(raw.number) ? raw.number : (previous?.number ?? ctx.nextNumber());
  const rec: CaseRec = {
    id,
    number,
    title: (raw.title as string).trim(),
    subject: subject.id,
    access,
    status,
    order: previous?.order ?? number,
    content: { intro: (raw.intro as string | undefined) ?? "", tabs, itemIds: recs.map((q) => q.id), ...(previous?.content?.exhibit ? { exhibit: true } : {}) },
    updatedAt: ctx.today,
  };
  const keep = new Set(rec.content!.itemIds);
  const dropped = (previous?.content?.itemIds ?? []).filter((q) => !keep.has(q)).map((q) => ctx.existing.get(q)).filter((q): q is QuestionRec => Boolean(q) && q!.status !== "archived");
  return { raw, rec, questions, errors: [], warnings, mode: previous ? "update" : "create", previous, dropped };
}

/** A case study as editable JSON (the import format). */
export function caseToJson(c: CaseRec, questions: QuestionRec[]): Record<string, unknown> {
  return {
    id: c.id,
    title: c.title,
    subject: c.subject,
    number: c.number,
    access: c.access,
    status: c.status,
    intro: c.content?.intro ?? "",
    tabs: (c.content?.tabs ?? []).map(tabToJson),
    questions: questions.map((q) => questionToJson(q, { inCase: true })),
  };
}

/** Parse pasted text into case objects: an array, `{ "cases": [...] }`, or a single case. */
export function parseCases(text: string): { items: unknown[] } | { error: string } {
  if (!text.trim()) return { error: "Paste JSON or upload a .json file first." };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { error: `This isn't valid JSON: ${e instanceof Error ? e.message : "parse error"}. Check for missing commas, quotes or brackets.` };
  }
  if (Array.isArray(data)) return { items: data };
  if (isObj(data) && Array.isArray(data.cases)) return { items: data.cases };
  if (isObj(data) && data.tabs) return { items: [data] };
  return { error: 'Expected a list of case studies: [ { … }, { … } ] or { "cases": [ … ] }.' };
}

/* ------------------------------------------------------------------ */
/* Sample (original content)                                           */
/* ------------------------------------------------------------------ */

export const CASE_SAMPLE = {
  title: "Sepsis in the Emergency Department",
  subject: "adult-health",
  system: "Immune / Infectious Disease",
  access: "premium",
  status: "draft",
  intro: "The nurse is caring for a 72-year-old client brought to the emergency department by family for new confusion.",
  tabs: [
    {
      label: "Nurses' Notes",
      kind: "notes",
      heading: "Emergency Department",
      entries: [
        { time: "0900", html: "Family reports the client has been more confused since last night and has had burning on urination for 3 days. Client is oriented to person only." },
        { time: "0930", html: "Skin warm and flushed. Capillary refill 3 seconds. Client reports chills." },
      ],
    },
    {
      label: "Vital Signs",
      kind: "table",
      headers: ["Time", "T", "HR", "RR", "BP", "SpO2"],
      rows: [
        ["0900", "39.1 °C", "118", "24", "92/54", "94% RA"],
        ["1000", "39.3 °C", "124", "26", "84/48", "93% RA"],
      ],
    },
    { label: "Lab Results", kind: "text", html: "<p>WBC 18,400/mm³ (high). Lactate 4.2 mmol/L (high). Urinalysis: positive nitrites and leukocyte esterase.</p>" },
  ],
  questions: [
    {
      type: "highlight",
      tabs: 1,
      stem: "Click to highlight the findings that require <b>immediate</b> follow-up.",
      headers: ["Body System", "Findings"],
      rows: [
        { label: "Neurologic", segments: ["Oriented to person only"] },
        { label: "Skin", segments: ["Warm and flushed", "Capillary refill 3 seconds"] },
      ],
      answers: ["0-0", "1-1"],
      rationale: { explanation: "<p>New confusion and slow capillary refill point to poor perfusion.</p>" },
    },
    {
      type: "mcq",
      tabs: 3,
      system: "Immune / Infectious Disease",
      stem: "Which condition is the client most likely experiencing?",
      options: ["Sepsis from a urinary tract infection", "Stroke", "Hypoglycemia", "Dehydration only"],
      answer: 0,
      rationale: { explanation: "<p>Fever, tachycardia, hypotension, high lactate and a positive urinalysis indicate sepsis from a urinary source.</p>" },
    },
    {
      type: "sata",
      tabs: 3,
      stem: "Which actions should the nurse take? <b>Select all that apply.</b>",
      options: ["Obtain blood cultures before antibiotics", "Give a 30 mL/kg IV crystalloid bolus", "Restrict fluids", "Start broad-spectrum antibiotics as prescribed", "Place the client flat with legs elevated for 24 hours"],
      answers: [0, 1, 3],
      rationale: { explanation: "<p>The sepsis bundle: cultures first, then antibiotics and a fluid bolus for hypotension or lactate ≥ 4.</p>" },
    },
  ],
};

export const CASE_FIELDS: [string, string][] = [
  ["title", "Required."],
  ["subject", "Required. Subject id (or name), e.g. adult-health."],
  ["system", "Optional. Used for questions that don't name a system."],
  ["intro", "The sentence above the tabs."],
  ["tabs", 'Required. Each tab: "label" plus a "kind": notes (heading + entries of time/html), text (html) or table (headers + rows).'],
  ["questions", 'Required. Same format as the question import. Add "tabs": n to show only the first n tabs for that question.'],
  ["access", '"premium" (default) or "free".'],
  ["status", '"draft" (default) or "published". A case with question problems is saved as a draft.'],
  ["number", "Optional. Shown on the case list; the next free number is used when left out."],
  ["id", "Optional. Leave it out to create a new case. An existing case id updates that case (copy it from the case's JSON view)."],
];
