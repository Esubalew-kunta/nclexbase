"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAll } from "@/lib/content";
import { StartCase } from "./StartCase";

/**
 * Every case study opens here: /nclex/next-gen-cases/qbanks/start?id=…
 *
 * Cases come from the API, so there is no fixed list to prebuild one page per case from.
 */
function Start() {
  const id = useSearchParams().get("id") ?? "";
  const row = useAll("cases").find((c) => c.id === id);
  if (!row) return null;
  return <StartCase caseId={row.id} subject={row.subject} title={row.title} />;
}

export default function CaseStartPage() {
  return (
    <Suspense>
      <Start />
    </Suspense>
  );
}
