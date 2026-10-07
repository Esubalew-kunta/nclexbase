import type { Answer, Item, ScoringRule, Score, TestSession } from "./types";
import { itemById } from "./bank";

/**
 * Next Gen NCLEX scoring rules:
 *  - 0/1: one point per correct response (MCQ, matrix rows, cloze blanks, bowtie slots, select-N).
 *  - +/-: +1 for each correct selection, -1 for each incorrect selection, floor 0 (SATA, highlight).
 */
export function scoringRule(item: Item): ScoringRule {
  return item.type === "sata" || item.type === "highlight" || item.type === "highlightText" || item.type === "matrixMulti" ? "+/-" : "0/1";
}

export type Chance = "Low" | "Borderline" | "High" | "Very High";

/** CAT readiness result from the percent of points earned (practice estimate, not a guarantee). */
export function chanceOfPassing(percent: number): Chance {
  return percent < 50 ? "Low" : percent < 60 ? "Borderline" : percent < 70 ? "High" : "Very High";
}

export function maxPoints(item: Item): number {
  switch (item.type) {
    case "mcq":
      return 1;
    case "sata":
    case "selectN":
      return item.answers.length;
    case "matrix":
      return item.rows.length;
    case "dragCloze":
      return item.answers.length;
    case "dropdown":
      return item.blanks.length;
    case "highlight":
    case "highlightText":
      return item.answers.length;
    case "fitb":
      return 1;
    case "bowtie":
      return 5;
    case "dragTopN":
      return item.n;
    case "matrixMulti":
      return item.answers.reduce((a, r) => a + r.length, 0);
  }
}

export function emptyAnswer(item: Item): Answer {
  switch (item.type) {
    case "mcq":
      return { type: "mcq", choice: null };
    case "sata":
    case "selectN":
      return { type: item.type, choices: [] };
    case "matrix":
      return { type: "matrix", cells: item.rows.map(() => null) };
    case "dragCloze":
      return { type: "dragCloze", blanks: item.answers.map(() => null) };
    case "dropdown":
      return { type: "dropdown", blanks: item.blanks.map(() => null) };
    case "highlight":
    case "highlightText":
      return { type: item.type, keys: [] };
    case "fitb":
      return { type: "fitb", value: "" };
    case "bowtie":
      return { type: "bowtie", condition: null, actions: [], parameters: [] };
    case "dragTopN":
      return { type: "dragTopN", chosen: [] };
    case "matrixMulti":
      return { type: "matrixMulti", cells: item.rows.map(() => []) };
  }
}

export function isAnswered(item: Item, a: Answer | undefined): boolean {
  if (!a) return false;
  switch (a.type) {
    case "mcq":
      return a.choice !== null;
    case "sata":
    case "selectN":
      return a.choices.length > 0;
    case "matrix":
      return a.cells.every((c) => c !== null);
    case "dragCloze":
    case "dropdown":
      return a.blanks.every((b) => b !== null);
    case "highlight":
    case "highlightText":
      return a.keys.length > 0;
    case "fitb":
      return a.value.trim() !== "";
    case "bowtie":
      return a.condition !== null && a.actions.length === 2 && a.parameters.length === 2;
    case "dragTopN":
      return a.chosen.length > 0;
    case "matrixMulti":
      return a.cells.some((c) => c.length > 0);
  }
}

export function scoreItem(item: Item, a: Answer | undefined): Score {
  const max = maxPoints(item);
  if (!a) return { earned: 0, max };
  let earned = 0;
  switch (item.type) {
    case "mcq":
      earned = a.type === "mcq" && a.choice === item.answer ? 1 : 0;
      break;
    case "selectN":
      if (a.type === "selectN") earned = a.choices.filter((c) => item.answers.includes(c)).length;
      break;
    case "sata":
      if (a.type === "sata") earned = plusMinus(a.choices, item.answers);
      break;
    case "highlight":
      if (a.type === "highlight") earned = plusMinus(a.keys, item.answers);
      break;
    case "highlightText":
      if (a.type === "highlightText") earned = plusMinus(a.keys, item.answers);
      break;
    case "fitb":
      if (a.type === "fitb") earned = Number(a.value) === Number(item.answer) ? 1 : 0;
      break;
    case "matrix":
      if (a.type === "matrix") earned = a.cells.filter((c, i) => c === item.answers[i]).length;
      break;
    case "dragCloze":
      if (a.type === "dragCloze") earned = a.blanks.filter((b, i) => b === item.answers[i]).length;
      break;
    case "dropdown":
      if (a.type === "dropdown") earned = a.blanks.filter((b, i) => b === item.blanks[i].answer).length;
      break;
    case "dragTopN":
      if (a.type === "dragTopN") earned = a.chosen.filter((c) => item.answers.includes(c)).length;
      break;
    case "matrixMulti":
      if (a.type === "matrixMulti") earned = a.cells.reduce((sum, row, r) => sum + plusMinus(row, item.answers[r]), 0);
      break;
    case "bowtie":
      if (a.type === "bowtie") {
        earned += a.condition === item.answer.condition ? 1 : 0;
        earned += a.actions.filter((x) => item.answer.actions.includes(x)).length;
        earned += a.parameters.filter((x) => item.answer.parameters.includes(x)).length;
      }
      break;
  }
  return { earned: Math.min(earned, max), max };
}

function plusMinus<T>(chosen: T[], correct: T[]) {
  const score = chosen.reduce((s, c) => s + (correct.includes(c) ? 1 : -1), 0);
  return Math.max(0, score);
}

export function scoreSession(s: TestSession) {
  let earned = 0;
  let max = 0;
  let time = 0;
  for (const e of s.entries) {
    const item = itemById(e.itemId);
    const sc = scoreItem(item, s.submitted[e.itemId] ? s.answers[e.itemId] : undefined);
    earned += sc.earned;
    max += sc.max;
    time += s.timeSpent[e.itemId] ?? 0;
  }
  return { earned, max, percent: max ? Math.round((earned / max) * 100) : 0, time };
}

/** Mock "average user" points for an item, from its avgPercent. */
export function avgPoints(item: Item) {
  return Math.round(maxPoints(item) * item.avgPercent) / 100;
}

export function formatDuration(sec: number) {
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatClock(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
