export type SubjectId =
  | "adult-health"
  | "child-health"
  | "fundamentals"
  | "maternal-and-newborn-health"
  | "mental-health"
  | "pharmacology"
  | "management-of-care";

export interface Expert {
  id: string;
  name: string;
  short: string;
  credentials: string;
  initials: string;
  /** Avatar background, since the real photos are not part of the clone. */
  color: string;
}

export interface Subject {
  id: SubjectId;
  name: string;
  experts: string[];
  /** Catalog numbers mirrored from the live site. */
  questionCount: number;
  lessonCount: number;
  standaloneCount: number;
  caseCount: number;
  videoRuntime: string;
  avgScore: number;
  avgTimeSec: number;
  systems: { name: string; count: number }[];
}

/* ------------------------------------------------------------------ */
/* Question items (Next Gen NCLEX item types)                          */
/* ------------------------------------------------------------------ */

export type ScoringRule = "0/1" | "+/-" | "rationale";

export interface Rationale {
  /** Explanation is the complete live write-up (incorrect options and takeaways included). */
  raw?: boolean;
  /** HTML (trusted local mock data). */
  explanation: string;
  incorrect?: { label: string; text: string }[];
  takeaway: string[];
}

interface ItemBase {
  id: string;
  /** Context line above the stem, e.g. "The nurse reviews the client's Laboratory Results from 1200." */
  lead?: string;
  /** Case studies reveal tabs progressively: how many scenario tabs this item shows. */
  tabs?: number;
  subject: SubjectId;
  system: string;
  topic: string;
  /** HTML stem shown next to the blue arrow. */
  stem: string;
  rationale: Rationale;
  /** Average percent correct across all users (mock). */
  avgPercent: number;
  linkedVideo?: string;
  linkedSheet?: string;
}

export interface McqItem extends ItemBase {
  type: "mcq";
  options: string[];
  answer: number;
}

export interface SataItem extends ItemBase {
  type: "sata";
  options: string[];
  answers: number[];
}

export interface SelectNItem extends ItemBase {
  type: "selectN";
  n: number;
  options: string[];
  answers: number[];
}

export interface MatrixItem extends ItemBase {
  type: "matrix";
  rowHeader: string;
  columns: string[];
  rows: string[];
  /** Column index per row. */
  answers: number[];
}

export interface DragClozeItem extends ItemBase {
  type: "dragCloze";
  /** Sentence with `{0}`, `{1}` placeholders. */
  template: string;
  choices: string[];
  /** Choice index per blank. */
  answers: number[];
}

export interface DropdownClozeItem extends ItemBase {
  type: "dropdown";
  template: string;
  blanks: { options: string[]; answer: number }[];
}

export interface HighlightItem extends ItemBase {
  type: "highlight";
  headers: [string, string];
  rows: { label: string; segments: string[] }[];
  /** Keys `row-segment`. */
  answers: string[];
}

export interface BowtieItem extends ItemBase {
  type: "bowtie";
  conditions: string[];
  actions: string[];
  parameters: string[];
  answer: { condition: number; actions: [number, number]; parameters: [number, number] };
}

/** "Drag the top N findings ... to the box on the right." */
export interface DragTopNItem extends ItemBase {
  type: "dragTopN";
  n: number;
  sourceLabel: string;
  targetLabel: string;
  options: string[];
  answers: number[];
}

/** Matrix multiple response: checkboxes, several per row allowed. */
export interface MatrixMultiItem extends ItemBase {
  type: "matrixMulti";
  rowHeader: string;
  columns: string[];
  rows: string[];
  /** Correct column indexes for each row. */
  answers: number[][];
}

/** Fill in the blank: a single numeric answer (dosage calculations). */
export interface FitbItem extends ItemBase {
  type: "fitb";
  /** Correct answer, compared as a number. */
  answer: string;
}

/** Click-to-highlight inside a passage (HTML with `<span class="hl" data-h="n">` segments). */
export interface HighlightTextItem extends ItemBase {
  type: "highlightText";
  /** Passage HTML (including the instruction line). */
  html: string;
  /** Keys (data-h values) of the segments that should be highlighted. */
  answers: string[];
}

export type Item =
  | FitbItem
  | HighlightTextItem
  | McqItem
  | DragTopNItem
  | MatrixMultiItem
  | SataItem
  | SelectNItem
  | MatrixItem
  | DragClozeItem
  | DropdownClozeItem
  | HighlightItem
  | BowtieItem;

export type ItemType = Item["type"];

/* Answers are stored per item in a shape matching the item type. */
export type Answer =
  | { type: "mcq"; choice: number | null }
  | { type: "sata" | "selectN"; choices: number[] }
  | { type: "matrix"; cells: (number | null)[] }
  | { type: "matrixMulti"; cells: number[][] }
  | { type: "dragTopN"; chosen: number[] }
  | { type: "dragCloze" | "dropdown"; blanks: (number | null)[] }
  | { type: "highlight" | "highlightText"; keys: string[] }
  | { type: "fitb"; value: string }
  | { type: "bowtie"; condition: number | null; actions: number[]; parameters: number[] };

/* ------------------------------------------------------------------ */
/* Case studies                                                        */
/* ------------------------------------------------------------------ */

export type TabContent =
  | { kind: "text"; html: string }
  | { kind: "notes"; heading?: string; entries: { time: string; html: string }[] }
  | { kind: "table"; headers?: string[]; rows: string[][] };

export interface CaseTab {
  label: string;
  content: TabContent;
}

export interface CaseStudy {
  id: string;
  title: string;
  subject: SubjectId;
  intro: string;
  /** A single question with an exhibit tab (no "Item x of y" header). */
  exhibit?: boolean;
  tabs: CaseTab[];
  items: Item[];
}

/* ------------------------------------------------------------------ */
/* Test sessions                                                       */
/* ------------------------------------------------------------------ */

export type Pool = "unused" | "learning" | "reviewing" | "mastered" | "bookmarked";
export type MasteryTag = "learning" | "reviewing" | "mastered";

export interface SessionEntry {
  itemId: string;
  caseId?: string;
}

export interface TestSession {
  id: string;
  number: number;
  kind: "custom" | "case" | "readiness";
  title: string;
  createdAt: string;
  tutor: boolean;
  timed: boolean;
  pool: Pool;
  entries: SessionEntry[];
  answers: Record<string, Answer>;
  submitted: Record<string, boolean>;
  marked: Record<string, boolean>;
  timeSpent: Record<string, number>;
  current: number;
  status: "active" | "ended";
  /** Seconds allowed when timed. */
  timeLimit?: number;
  /** Catalog row that launched this session (case study or readiness exam id). */
  sourceId?: string;
}

export interface Score {
  earned: number;
  max: number;
}
