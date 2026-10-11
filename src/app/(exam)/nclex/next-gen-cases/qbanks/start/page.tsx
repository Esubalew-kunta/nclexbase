"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAll } from "@/lib/content";
import { StartCase } from "../[caseId]/StartCase";

/** Case studies created in the admin: /nclex/next-gen-cases/qbanks/start?id=… */
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
