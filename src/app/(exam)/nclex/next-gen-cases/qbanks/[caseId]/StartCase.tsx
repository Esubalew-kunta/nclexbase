"use client";

import { useEffect, useRef } from "react";
import { useAll } from "@/lib/content";
import { useStartCase } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { ExamLoading } from "@/components/exam/ExamScreen";

/** Deep link: /nclex/next-gen-cases/qbanks/:id starts the case and opens the exam. */
export function StartCase({ caseId, subject, title }: { caseId: string; subject: string; title: string }) {
  const hydrated = useStore((s) => s.hydrated);
  const start = useStartCase();
  const started = useRef(false);
  // The admin may have renamed the case since this page was generated.
  const rowTitle = useAll("cases").find((r) => r.id === caseId)?.title ?? title;
  useEffect(() => {
    if (!hydrated || started.current) return;
    started.current = true;
    start(caseId, { subject, title: rowTitle, replace: true });
  }, [hydrated, caseId, subject, rowTitle, start]);
  return <ExamLoading />;
}
