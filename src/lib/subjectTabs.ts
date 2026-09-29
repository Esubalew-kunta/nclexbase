import { subjectById } from "@/data/catalog";
import type { SubjectId } from "./types";

export type SubjectTab = "cases" | "standalone" | "crash-courses" | "cheat-sheets" | "performance";

export const SUBJECT_TABS: { id: SubjectTab; label: string }[] = [
  { id: "cases", label: "Case Studies" },
  { id: "standalone", label: "Standalone Questions" },
  { id: "crash-courses", label: "Crash Course Videos" },
  { id: "cheat-sheets", label: "Cheat Sheets" },
  { id: "performance", label: "Performance" },
];

/** Subjects without case studies open on Standalone Questions, as on the live site. */
export function tabsFor(id: SubjectId): SubjectTab[] {
  const s = subjectById(id);
  return SUBJECT_TABS.map((t) => t.id).filter((t) => t !== "cases" || s.caseCount > 0);
}
