import type { SubjectId } from "./types";

export type SubjectTab = "case-studies" | "standalone" | "videos" | "cheat-sheets" | "memory-tricks" | "performance";

export const TAB_LABELS: Record<SubjectTab, string> = {
  "case-studies": "Case Studies",
  standalone: "Standalone Questions",
  videos: "Crash Course Videos",
  "cheat-sheets": "Cheat Sheets",
  "memory-tricks": "Memory Tricks",
  performance: "Performance",
};

/** Tab order per subject, as on the live site (Pharmacology lists Cheat Sheets before Videos). Memory Tricks is NCLEXBase-only. */
const ORDER: Record<SubjectId, SubjectTab[]> = {
  "adult-health": ["case-studies", "standalone", "videos", "cheat-sheets", "memory-tricks", "performance"],
  "child-health": ["case-studies", "standalone", "videos", "cheat-sheets", "memory-tricks", "performance"],
  fundamentals: ["standalone", "videos", "cheat-sheets", "memory-tricks", "performance"],
  "maternal-and-newborn-health": ["case-studies", "standalone", "videos", "cheat-sheets", "memory-tricks", "performance"],
  "mental-health": ["case-studies", "standalone", "videos", "cheat-sheets", "memory-tricks", "performance"],
  pharmacology: ["standalone", "cheat-sheets", "videos", "memory-tricks", "performance"],
  "management-of-care": ["standalone", "videos", "cheat-sheets", "memory-tricks", "performance"],
};

export const ALL_TABS = Object.keys(TAB_LABELS) as SubjectTab[];

/** Seed tab order. At runtime use the subject's `tabs` from the content repository (admin-editable). */
export function tabsFor(id: SubjectId): SubjectTab[] {
  return ORDER[id];
}
