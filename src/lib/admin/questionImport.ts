import type { Item, ItemType } from "@/lib/types";
import type { Access, QuestionRec, Status, SubjectRec } from "./types";

/*
 * Bulk question import: turns admin-written JSON into question records.
 * Every row is checked here (shape, taxonomy, answer indexes) so the import screen
 * can show problems per row before anything is saved. A row whose id is already in the
 * bank updates that question; rows without an id create standalone questions.
 */

export interface ImportRow {
  /** The object as the admin wrote it (edited in the review dialog). */
  raw: unknown;
  /** Normalised record, when the row's shape is usable. */
  rec: QuestionRec | null;
  /** Problems that block importing this row. */
  errors: string[];
  /** Problems that only block publishing; the row is imported as a draft. */
  warnings: string[];
  /** "update" when the id matches a question already in the bank. */
  mode: "create" | "update";
  /** The current version of an updated question (kept in its History). */
  previous?: QuestionRec;
  include: boolean;
}

type Kind = "string" | "number" | "string[]" | "number[]" | "number[][]" | "blanks" | "hlrows" | "bowtieAnswer";

/** Type-specific fields. Fields marked optional fall back to the editor's defaults. */
export const SHAPES: Record<ItemType, Record<string, { kind: Kind; optional?: boolean }>> = {
  mcq: { options: { kind: "string[]" }, answer: { kind: "number" } },
  sata: { options: { kind: "string[]" }, answers: { kind: "number[]" } },
  selectN: { n: { kind: "number" }, options: { kind: "string[]" }, answers: { kind: "number[]" } },
  matrix: { rowHeader: { kind: "string", optional: true }, columns: { kind: "string[]" }, rows: { kind: "string[]" }, answers: { kind: "number[]" } },
  matrixMulti: { rowHeader: { kind: "string", optional: true }, columns: { kind: "string[]" }, rows: { kind: "string[]" }, answers: { kind: "number[][]" } },
  dragCloze: { template: { kind: "string" }, choices: { kind: "string[]" }, answers: { kind: "number[]" } },
  dropdown: { template: { kind: "string" }, blanks: { kind: "blanks" } },
  highlight: { headers: { kind: "string[]", optional: true }, rows: { kind: "hlrows" }, answers: { kind: "string[]" } },
  highlightText: { html: { kind: "string" }, answers: { kind: "string[]" } },
  bowtie: { conditions: { kind: "string[]" }, actions: { kind: "string[]" }, parameters: { kind: "string[]" }, answer: { kind: "bowtieAnswer" } },
  dragTopN: { n: { kind: "number" }, sourceLabel: { kind: "string", optional: true }, targetLabel: { kind: "string", optional: true }, options: { kind: "string[]" }, answers: { kind: "number[]" } },
  fitb: { answer: { kind: "string" } },
};

export const IMPORT_TYPES = Object.keys(SHAPES) as ItemType[];

const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isArr = (v: unknown, each: (x: unknown) => boolean) => Array.isArray(v) && v.every(each);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function checkKind(kind: Kind, v: unknown): boolean {
  switch (kind) {
    case "string":
      return isStr(v);
    case "number":
      return isNum(v);
    case "string[]":
      return isArr(v, isStr);
    case "number[]":
      return isArr(v, isNum);
    case "number[][]":
      return isArr(v, (x) => isArr(x, isNum));
    case "blanks":
      return isArr(v, (b) => isObj(b) && isArr(b.options, isStr) && isNum(b.answer));
    case "hlrows":
      return isArr(v, (r) => isObj(r) && isStr(r.label) && isArr(r.segments, isStr));
    case "bowtieAnswer":
      return isObj(v) && isNum(v.condition) && isArr(v.actions, isNum) && (v.actions as number[]).length === 2 && isArr(v.parameters, isNum) && (v.parameters as number[]).length === 2;
  }
}

const KIND_HINT: Record<Kind, string> = {
  string: "text",
  number: "a number",
  "string[]": "a list of texts",
  "number[]": "a list of numbers",
  "number[][]": "a list of number lists (one per row)",
  blanks: 'a list of { "options": [...], "answer": n }',
  hlrows: 'a list of { "label": "...", "segments": [...] }',
  bowtieAnswer: '{ "condition": n, "actions": [n, n], "parameters": [n, n] }',
};

/** Answer indexes must point at something that exists (0-based). */
function rangeErrors(it: Item): string[] {
  const e: string[] = [];
  const within = (idx: number[], len: number, what: string) => idx.some((i) => !Number.isInteger(i) || i < 0 || i >= len) && e.push(`Answer numbers must match the ${what}s listed (the first ${what} is 0).`);
  switch (it.type) {
    case "mcq":
      within([it.answer], it.options.length, "option");
      break;
    case "sata":
    case "selectN":
    case "dragTopN":
      within(it.answers, it.options.length, "option");
      break;
    case "matrix":
      if (it.answers.length !== it.rows.length) e.push(`"answers" needs one column number per row (${it.rows.length}).`);
      within(it.answers, it.columns.length, "column");
      break;
    case "matrixMulti":
      if (it.answers.length !== it.rows.length) e.push(`"answers" needs one list of columns per row (${it.rows.length}).`);
      within(it.answers.flat(), it.columns.length, "column");
      break;
    case "dragCloze":
      within(it.answers, it.choices.length, "word choice");
      break;
    case "dropdown":
      it.blanks.forEach((b, i) => b.answer >= 0 && b.answer < b.options.length ? null : e.push(`Drop-down ${i} has an answer outside its options.`));
      break;
    case "highlight": {
      const keys = new Set(it.rows.flatMap((r, ri) => r.segments.map((_, si) => `${ri}-${si}`)));
      if (it.answers.some((k) => !keys.has(k))) e.push('Highlight answers use "row-segment" keys like "0-1" (numbers start at 0).');
      if (it.headers.length !== 2) e.push('"headers" needs exactly 2 column titles.');
      break;
    }
    case "highlightText": {
      const keys = new Set([...it.html.matchAll(/data-h="([^"]+)"/g)].map((m) => m[1]));
      if (it.answers.some((k) => !keys.has(k))) e.push('Every answer key must match a data-h="…" segment in "html".');
      break;
    }
    case "bowtie":
      within([it.answer.condition], it.conditions.length, "condition");
      within(it.answer.actions, it.actions.length, "action");
      within(it.answer.parameters, it.parameters.length, "parameter");
      break;
    default:
      break;
  }
  return e;
}

export interface ImportContext {
  subjects: SubjectRec[];
  /** Questions already in the bank, by id. A row with one of these ids updates that question. */
  existing: Map<string, QuestionRec>;
  newId: () => string;
  blank: (type: ItemType, base: { id: string; subject: Item["subject"]; system: string }) => Item;
  validate: (it: Item) => string[];
  today: string;
}

export interface RowOptions {
  /** Questions inside a case: subject/system fall back to the case's, and access/status follow the case. */
  inCase?: { caseId: string; subject: string; system?: string; access: Access; status: Status };
  /** Editing one known question: the id must stay this one. */
  lockId?: string;
}

export type RowResult = Omit<ImportRow, "include">;

/** Check and normalise one JSON object. `seenIds` catches duplicates inside the same file. */
export function normalizeRow(raw: unknown, ctx: ImportContext, seenIds: Set<string>, opts: RowOptions = {}): RowResult {
  const fail = (errors: string[]): RowResult => ({ raw, rec: null, errors, warnings: [], mode: "create" });
  if (!isObj(raw)) return fail(["Each question must be a JSON object { … }."]);
  const type = raw.type as ItemType;
  if (!SHAPES[type]) return fail([`"type" must be one of: ${IMPORT_TYPES.join(", ")}.`]);
  const errors: string[] = [];

  // An id that is already in the bank means "update that question".
  let id = ctx.newId();
  let previous: QuestionRec | undefined;
  if (raw.id !== undefined) {
    if (!isStr(raw.id) || !raw.id.trim()) errors.push('"id" must be text, or leave it out to create a new question.');
    else if (opts.lockId && raw.id !== opts.lockId) errors.push(`"id" can't be changed here (it is “${opts.lockId}”).`);
    else if (seenIds.has(raw.id)) errors.push(`Id “${raw.id}” appears twice.`);
    else {
      id = raw.id;
      previous = ctx.existing.get(raw.id);
      if (previous && previous.type !== type) errors.push(`“${raw.id}” is a ${previous.type} question; its type can't change to ${type}.`);
      if (previous && opts.inCase && !(previous.source.kind === "case" && previous.source.caseId === opts.inCase.caseId))
        errors.push(`Id “${raw.id}” belongs to another question outside this case. Leave "id" out to create a new one.`);
    }
    if (isStr(raw.id)) seenIds.add(raw.id);
  }

  // Subject and system: id/key or display name, any case. A question being updated may keep its current ones.
  const sv = isStr(raw.subject) ? raw.subject.trim().toLowerCase() : (opts.inCase?.subject.toLowerCase() ?? "");
  const subject = ctx.subjects.find((s) => s.id.toLowerCase() === sv || s.name.toLowerCase() === sv);
  const yRaw = isStr(raw.system) ? raw.system : opts.inCase?.system;
  const yv = (yRaw ?? "").trim().toLowerCase();
  const system = subject?.systems.find((x) => x.key.toLowerCase() === yv || x.label.toLowerCase() === yv)?.key ?? (previous && subject?.id === previous.subject && yRaw === previous.system ? previous.system : undefined);
  if (!subject) errors.push(isStr(raw.subject) ? `Unknown subject “${raw.subject}”. Use a subject id from the Subjects & systems list.` : '"subject" is required.');
  else if (!system) errors.push(yRaw ? `“${yRaw}” is not a system of ${subject.name}.` : '"system" is required.');

  const shape = SHAPES[type];
  for (const [key, { kind, optional }] of Object.entries(shape)) {
    const v = type === "fitb" && key === "answer" && isNum(raw.answer) ? String(raw.answer) : raw[key];
    if (v === undefined && optional) continue;
    if (v === undefined) errors.push(`"${key}" is required for ${type} (${KIND_HINT[kind]}).`);
    else if (!checkKind(kind, v)) errors.push(`"${key}" must be ${KIND_HINT[kind]}.`);
  }

  const optStr = (k: string) => raw[k] !== undefined && !isStr(raw[k]) && errors.push(`"${k}" must be text.`);
  ["stem", "lead", "topic", "linkedVideo", "linkedSheet"].forEach(optStr);
  if (type !== "highlightText" && raw.stem === undefined) errors.push('"stem" is required.');
  if (raw.avgPercent !== undefined && (!isNum(raw.avgPercent) || raw.avgPercent < 0 || raw.avgPercent > 100)) errors.push('"avgPercent" must be a number from 0 to 100.');
  if (raw.tabs !== undefined && (!isNum(raw.tabs) || raw.tabs < 1)) errors.push('"tabs" must be the number of scenario tabs shown (1 or more).');
  if (!opts.inCase) {
    if (raw.access !== undefined && raw.access !== "free" && raw.access !== "premium") errors.push('"access" must be "free" or "premium".');
    if (raw.status !== undefined && raw.status !== "draft" && raw.status !== "published" && raw.status !== "archived") errors.push('"status" must be "draft", "published" or "archived".');
  }

  const r = raw.rationale;
  const rationale = isStr(r) ? { explanation: r } : isObj(r) ? r : null;
  if (!rationale) errors.push('"rationale" is required: { "explanation": "…" } (or just the explanation text).');
  else {
    if (!isStr(rationale.explanation)) errors.push('"rationale.explanation" must be text.');
    if (rationale.takeaway !== undefined && !isArr(rationale.takeaway, isStr)) errors.push('"rationale.takeaway" must be a list of texts.');
    if (rationale.incorrect !== undefined && !isArr(rationale.incorrect, (x) => isObj(x) && isStr(x.label) && isStr(x.text))) errors.push('"rationale.incorrect" must be a list of { "label": "…", "text": "…" }.');
  }

  if (errors.length || !subject || !system || !rationale) return fail(errors);

  const base = previous ?? ctx.blank(type, { id, subject: subject.id, system });
  const fields = Object.fromEntries(Object.keys(shape).filter((k) => raw[k] !== undefined).map((k) => [k, type === "fitb" && k === "answer" ? String(raw[k]) : raw[k]]));
  const item = {
    ...ctx.blank(type, { id, subject: subject.id, system }),
    ...fields,
    id,
    subject: subject.id,
    system,
    stem: isStr(raw.stem) ? raw.stem : "",
    lead: isStr(raw.lead) && raw.lead ? raw.lead : undefined,
    topic: isStr(raw.topic) ? raw.topic : "",
    avgPercent: isNum(raw.avgPercent) ? raw.avgPercent : base.avgPercent,
    tabs: isNum(raw.tabs) ? raw.tabs : undefined,
    linkedVideo: isStr(raw.linkedVideo) && raw.linkedVideo ? raw.linkedVideo : undefined,
    linkedSheet: isStr(raw.linkedSheet) && raw.linkedSheet ? raw.linkedSheet : undefined,
    // Uploaded videos aren't part of the JSON; an update keeps the current one.
    video: previous?.video,
    rationale: {
      explanation: rationale.explanation as string,
      takeaway: (rationale.takeaway as string[] | undefined) ?? [],
      ...(rationale.incorrect ? { incorrect: rationale.incorrect as { label: string; text: string }[] } : {}),
      ...(rationale.raw === true ? { raw: true } : {}),
    },
  } as Item;

  const range = rangeErrors(item);
  if (range.length) return fail(range);

  const warnings = ctx.validate(item);
  let status: Status;
  let access: Access;
  if (opts.inCase) {
    status = opts.inCase.status;
    access = opts.inCase.access;
  } else {
    const wanted = (raw.status as Status | undefined) ?? previous?.status ?? "draft";
    status = wanted === "published" && warnings.length ? "draft" : wanted;
    if (wanted === "published" && warnings.length) warnings.push("Asked for “published”, so it is saved as a draft until these are fixed.");
    access = (raw.access as Access | undefined) ?? previous?.access ?? "free";
  }
  const rec = {
    ...item,
    source: opts.inCase ? { kind: "case", caseId: opts.inCase.caseId } : (previous?.source ?? { kind: "standalone" }),
    access,
    status,
    order: previous?.order ?? 0,
    updatedAt: ctx.today,
  } as QuestionRec;
  return { raw, rec, errors: [], warnings, mode: previous ? "update" : "create", previous };
}

/** A question as editable JSON: the same format the import accepts, so it can be copied, changed and pasted back. */
export function questionToJson(q: QuestionRec, opts: { inCase?: boolean } = {}): Record<string, unknown> {
  const it = q as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = { id: q.id, type: q.type, subject: q.subject, system: q.system, topic: q.topic };
  if (!opts.inCase) Object.assign(out, { access: q.access, status: q.status });
  out.avgPercent = q.avgPercent;
  if (q.tabs !== undefined) out.tabs = q.tabs;
  if (q.lead) out.lead = q.lead;
  if (q.type !== "highlightText" || q.stem) out.stem = q.stem;
  for (const k of Object.keys(SHAPES[q.type])) if (it[k] !== undefined) out[k] = it[k];
  out.rationale = q.rationale;
  if (q.linkedVideo) out.linkedVideo = q.linkedVideo;
  if (q.linkedSheet) out.linkedSheet = q.linkedSheet;
  return out;
}

/** Parse pasted text into question objects: an array, `{ "questions": [...] }`, or a single object. */
export function parseImport(text: string): { items: unknown[] } | { error: string } {
  if (!text.trim()) return { error: "Paste JSON or upload a .json file first." };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { error: `This isn't valid JSON: ${e instanceof Error ? e.message : "parse error"}. Check for missing commas, quotes or brackets.` };
  }
  if (Array.isArray(data)) return { items: data };
  if (isObj(data) && Array.isArray(data.questions)) return { items: data.questions };
  if (isObj(data) && data.type) return { items: [data] };
  return { error: 'Expected a list of questions: [ { … }, { … } ] or { "questions": [ … ] }.' };
}

/* ------------------------------------------------------------------ */
/* Sample JSON, one per item type (original content)                   */
/* ------------------------------------------------------------------ */

const common = (subject: string, system: string, topic: string) => ({ subject, system, topic, access: "free", status: "draft" });

export const SAMPLES: Record<ItemType, Record<string, unknown>> = {
  mcq: {
    type: "mcq",
    ...common("pharmacology", "Cardiovascular", "Digoxin toxicity"),
    lead: "A client taking digoxin 0.25 mg daily reports nausea and seeing yellow halos around lights.",
    stem: "Which action should the nurse take <b>first</b>?",
    options: ["Hold the next dose and check the apical pulse", "Give the dose with food", "Encourage potassium-rich foods", "Document the finding as an expected side effect"],
    answer: 0,
    rationale: {
      explanation: "<p>Visual changes and nausea are early signs of digoxin toxicity. Hold the drug and assess the apical pulse before anything else.</p>",
      incorrect: [{ label: "Give the dose with food", text: "Food does not treat toxicity; giving the dose makes it worse." }],
      takeaway: ["Yellow-green halos + GI upset on digoxin = suspect toxicity."],
    },
  },
  sata: {
    type: "sata",
    ...common("adult-health", "Respiratory", "COPD"),
    stem: "Which findings are expected in a client with chronic obstructive pulmonary disease? <b>Select all that apply.</b>",
    options: ["Barrel chest", "Pursed-lip breathing", "Bradypnea", "Use of accessory muscles", "Pink, frothy sputum"],
    answers: [0, 1, 3],
    rationale: { explanation: "<p>Air trapping causes a barrel chest; clients purse their lips and use accessory muscles to move air.</p>", takeaway: ["COPD: barrel chest, pursed lips, accessory muscles."] },
  },
  selectN: {
    type: "selectN",
    ...common("adult-health", "Cardiovascular", "Heart failure"),
    n: 3,
    stem: "Select the <b>3</b> findings most consistent with left-sided heart failure.",
    options: ["Crackles in the lung bases", "Orthopnea", "Pink, frothy sputum", "Jugular venous distention", "Dependent edema"],
    answers: [0, 1, 2],
    rationale: { explanation: "<p>Left-sided failure backs up into the lungs. Right-sided failure backs up into the body.</p>", takeaway: ["Left = lungs, Right = rest of the body."] },
  },
  matrix: {
    type: "matrix",
    ...common("fundamentals", "Safety and Infection Control", "Isolation precautions"),
    stem: "For each condition, select the type of precaution required.",
    rowHeader: "Condition",
    columns: ["Airborne", "Droplet", "Contact"],
    rows: ["Tuberculosis", "Influenza", "C. difficile"],
    answers: [0, 1, 2],
    rationale: { explanation: "<p>TB is airborne, influenza is droplet and C. difficile is contact.</p>" },
  },
  matrixMulti: {
    type: "matrixMulti",
    ...common("adult-health", "Endocrine", "Diabetes"),
    stem: "For each finding, select whether it indicates hypoglycemia, hyperglycemia, or both.",
    rowHeader: "Finding",
    columns: ["Hypoglycemia", "Hyperglycemia"],
    rows: ["Diaphoresis", "Polyuria", "Confusion"],
    answers: [[0], [1], [0, 1]],
    rationale: { explanation: "<p>Sweating points to low glucose, polyuria to high glucose, and confusion can occur with both.</p>" },
  },
  dragCloze: {
    type: "dragCloze",
    ...common("adult-health", "Neurologic", "Stroke"),
    stem: "Complete the sentence by dragging the words into the blanks.",
    template: "The client is most likely experiencing {0}, so the nurse should first {1}.",
    choices: ["an ischemic stroke", "a migraine", "check blood glucose", "give aspirin"],
    answers: [0, 2],
    rationale: { explanation: "<p>Hypoglycemia can mimic a stroke, so check glucose before any stroke treatment.</p>" },
  },
  dropdown: {
    type: "dropdown",
    ...common("maternal-and-newborn-health", "Antepartum", "Preeclampsia"),
    stem: "Complete the sentence by choosing from the lists of options.",
    template: "The client is at highest risk for {0} as evidenced by {1}.",
    blanks: [
      { options: ["seizures", "hemorrhage", "infection"], answer: 0 },
      { options: ["blood pressure 168/112", "temperature 37.2 °C", "heart rate 88"], answer: 0 },
    ],
    rationale: { explanation: "<p>Severe hypertension in preeclampsia raises the risk of eclamptic seizures.</p>" },
  },
  highlight: {
    type: "highlight",
    ...common("adult-health", "Gastrointestinal", "Appendicitis"),
    stem: "Click to highlight the findings that require <b>immediate</b> follow-up.",
    headers: ["Body System", "Findings"],
    rows: [
      { label: "Vital signs", segments: ["Temperature 38.9 °C", "Heart rate 118"] },
      { label: "Abdomen", segments: ["Rebound tenderness", "Active bowel sounds"] },
    ],
    answers: ["0-0", "0-1", "1-0"],
    rationale: { explanation: "<p>Fever, tachycardia and rebound tenderness suggest a ruptured appendix.</p>" },
  },
  highlightText: {
    type: "highlightText",
    ...common("mental-health", "Mood and Personality Disorders", "Suicide risk"),
    html: '<p>Click to highlight the statements that require follow-up.</p><p><span class="hl" data-h="a">I gave my guitar to my brother</span>. <span class="hl" data-h="b">I slept well last night</span>. <span class="hl" data-h="c">It won\'t matter soon</span>.</p>',
    answers: ["a", "c"],
    rationale: { explanation: "<p>Giving away possessions and hopeless statements are warning signs of suicide.</p>" },
  },
  bowtie: {
    type: "bowtie",
    ...common("adult-health", "Endocrine", "Diabetic ketoacidosis"),
    stem: "Complete the diagram: the condition the client is most likely experiencing, 2 actions to take, and 2 parameters to monitor.",
    conditions: ["Diabetic ketoacidosis", "Hypoglycemia", "Diabetes insipidus"],
    actions: ["Start IV regular insulin", "Give IV fluids", "Give oral glucose", "Restrict fluids"],
    parameters: ["Serum potassium", "Blood glucose", "Hemoglobin", "Platelets"],
    answer: { condition: 0, actions: [0, 1], parameters: [0, 1] },
    rationale: { explanation: "<p>DKA needs fluids and insulin; insulin moves potassium into cells, so monitor potassium and glucose.</p>" },
  },
  dragTopN: {
    type: "dragTopN",
    ...common("adult-health", "Respiratory", "Pneumonia"),
    n: 2,
    stem: "Drag the <b>2</b> findings that require immediate follow-up to the box on the right.",
    sourceLabel: "Findings",
    targetLabel: "Priority findings",
    options: ["SpO2 86% on room air", "Productive cough", "Respiratory rate 32", "Temperature 37.8 °C"],
    answers: [0, 2],
    rationale: { explanation: "<p>Low oxygen saturation and tachypnea show the client is not oxygenating well.</p>" },
  },
  fitb: {
    type: "fitb",
    ...common("pharmacology", "Medication Administration", "Weight-based dosing"),
    stem: "The provider prescribes 5 mg/kg of a medication for a client who weighs 60 kg. How many mg should the nurse give? Enter the number only.",
    answer: "300",
    rationale: { explanation: "<p>5 mg × 60 kg = 300 mg.</p>" },
  },
};

/** Field guide shown next to the samples. */
export const COMMON_FIELDS: [string, string][] = [
  ["type", "Required. One of the item types."],
  ["subject", "Required. Subject id (or its name), e.g. adult-health."],
  ["system", "Required. A system of that subject, e.g. Cardiovascular."],
  ["stem", "Required (except highlightText). HTML allowed: <b>, <i>, <br>."],
  ["rationale", 'Required. { "explanation": "…", "takeaway": [ … ], "incorrect": [ { "label", "text" } ] }'],
  ["topic, lead", "Optional text."],
  ["access", '"free" (default) or "premium".'],
  ["status", '"draft" (default) or "published". Questions with problems always come in as drafts.'],
  ["avgPercent", "Optional, 0 to 100 (default 60)."],
  ["id", "Optional. Leave it out to create a new question. An id that is already in the bank updates that question (copy it from the question's JSON view)."],
  ["tabs", "Case questions only: how many scenario tabs are visible for this question."],
  ["answers", "Positions start at 0: the first option is 0, the second is 1, and so on."],
];
