"use client";

/* Case study JSON: import context, saving, and a student-style preview (scenario tabs + questions). */

import clsx from "clsx";
import { useState } from "react";
import { crud } from "@/lib/admin/crud";
import { newId, useAdminStore } from "@/lib/admin/store";
import type { CaseContext, CaseImportRow } from "@/lib/admin/caseImport";
import type { CaseRec, QuestionRec } from "@/lib/admin/types";
import type { CaseStudy } from "@/lib/types";
import { getAll } from "@/lib/content";
import { ScenarioPanel } from "@/components/exam/ScenarioPanel";
import { ItemPreview } from "./items";
import { useImportContext } from "./questionJson";

export function useCaseContext(): () => CaseContext {
  const base = useImportContext();
  return () => {
    const cases = getAll("cases");
    let next = Math.max(0, ...cases.map((c) => c.number));
    return { ...base(), existingCases: new Map(cases.map((c) => [c.id, c])), newCaseId: () => newId("case"), nextNumber: () => ++next };
  };
}

/** Save checked case rows: cases, their questions (new and updated), and archive questions an update left out. */
export function saveCaseRows(rows: CaseImportRow[], how: string) {
  const save = useAdminStore.getState().save;
  const ok = rows.filter((r) => r.rec);
  const qs = ok.flatMap((r) => r.questions);
  const newQs = qs.filter((q) => q.mode === "create").map((q) => q.rec!);
  const updQs = qs.filter((q) => q.mode === "update");
  if (newQs.length) save("questions", newQs, { action: "import", label: `Added ${newQs.length} case question${newQs.length === 1 ? "" : "s"} ${how}` });
  if (updQs.length) save("questions", updQs.map((q) => q.rec!), { action: "import", label: `Updated ${updQs.length} case question${updQs.length === 1 ? "" : "s"} ${how}`, previous: updQs.map((q) => q.previous) });
  const dropped = ok.flatMap((r) => r.dropped.map((q) => q.id));
  if (dropped.length) crud("questions").patchMany(dropped, { status: "archived" }, `Removed from their case ${how}`);
  const created = ok.filter((r) => r.mode === "create").map((r) => r.rec!);
  const updated = ok.filter((r) => r.mode === "update");
  if (created.length) save("cases", created, { action: "import", label: `Imported ${created.length} case stud${created.length === 1 ? "y" : "ies"} ${how}` });
  if (updated.length) save("cases", updated.map((r) => r.rec!), { action: "import", label: `Updated ${updated.length} case stud${updated.length === 1 ? "y" : "ies"} ${how}`, previous: updated.map((r) => r.previous) });
  return { created: created.length, updated: updated.length, questions: qs.length, dropped: dropped.length };
}

/** What students see: the scenario on the left (tabs unlock per question) and the selected question. */
export function CasePreview({ rec, questions }: { rec: CaseRec; questions: QuestionRec[] }) {
  const [index, setIndex] = useState(0);
  const [tab, setTab] = useState(0);
  const i = Math.min(index, Math.max(0, questions.length - 1));
  const q = questions[i];
  const study: CaseStudy = { id: rec.id, title: rec.title, subject: rec.subject, intro: rec.content?.intro ?? "", tabs: rec.content?.tabs ?? [], items: questions };
  if (!study.tabs.length) return <p className="text-sm text-muted">Add a tab to see the preview.</p>;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 text-xs text-muted">Question</span>
        {questions.map((x, k) => (
          <button
            key={x.id}
            type="button"
            onClick={() => (setIndex(k), setTab(0))}
            className={clsx("size-8 cursor-pointer rounded-md border text-sm font-semibold tabular-nums", k === i ? "border-primary bg-primary text-white" : "border-line text-ink hover:border-primary")}
          >
            {k + 1}
          </button>
        ))}
        {!questions.length && <span className="text-xs text-muted">No questions yet</span>}
      </div>
      <div className="rounded-lg border border-line bg-white px-4 pb-4 font-exam text-[15px] text-exam-ink">
        <ScenarioPanel caseStudy={study} index={i} showBanner={i === 0} visibleTabs={q?.tabs ?? study.tabs.length} tab={tab} onTab={setTab} />
      </div>
      {q && <ItemPreview key={`${q.id}-${i}`} item={q} />}
    </div>
  );
}
