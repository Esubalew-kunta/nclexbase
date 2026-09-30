import type { SubjectId } from "./types";

export type SubjectTab = "case-studies" | "standalone" | "videos" | "cheat-sheets" | "performance";

export const TAB_LABELS: Record<SubjectTab, string> = {
  "case-studies": "Case Studies",
  standalone: "Standalone Questions",
  videos: "Crash Course Videos",
  "cheat-sheets": "Cheat Sheets",
  performance: "Performance",
};

/** Tab order per subject, as on the live site (Pharmacology lists Cheat Sheets before Videos). */
const ORDER: Record<SubjectId, SubjectTab[]> = {
  "adult-health": ["case-studies", "standalone", "videos", "cheat-sheets", "performance"],
  "child-health": ["case-studies", "standalone", "videos", "cheat-sheets", "performance"],
  fundamentals: ["standalone", "videos", "cheat-sheets", "performance"],
  "maternal-and-newborn-health": ["case-studies", "standalone", "videos", "cheat-sheets", "performance"],
  "mental-health": ["case-studies", "standalone", "videos", "cheat-sheets", "performance"],
  pharmacology: ["standalone", "cheat-sheets", "videos", "performance"],
  "management-of-care": ["standalone", "videos", "cheat-sheets", "performance"],
};

export function tabsFor(id: SubjectId): SubjectTab[] {
  return ORDER[id];
}
