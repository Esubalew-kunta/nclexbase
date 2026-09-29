"use client";

import { useEffect, useRef } from "react";
import { useStartCase } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { ExamLoading } from "@/components/exam/ExamScreen";

/** Deep link: /nclex/next-gen-cases/qbanks/:id starts the case and opens the exam. */
export function StartCase({ caseId, subject, title }: { caseId: string; subject: string; title: string }) {
  const hydrated = useStore((s) => s.hydrated);
  const start = useStartCase();
  const started = useRef(false);
  useEffect(() => {
    if (!hydrated || started.current) return;
    started.current = true;
    start(caseId, { subject, title, replace: true });
  }, [hydrated, caseId, subject, title, start]);
  return <ExamLoading />;
}
