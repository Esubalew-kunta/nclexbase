"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAll } from "@/lib/content";
import { ReadinessIntro } from "../[examId]/ReadinessIntro";

/** Readiness exams created in the admin: /nclex/next-gen-readiness-exams/qbanks/start?id=… */
function Start() {
  const id = useSearchParams().get("id") ?? "";
  const exam = useAll("readiness").find((e) => e.id === id);
  if (!exam) return null;
  return <ReadinessIntro id={exam.id} number={exam.number} title={exam.title} />;
}

export default function ReadinessStartPage() {
  return (
    <Suspense>
      <Start />
    </Suspense>
  );
}
