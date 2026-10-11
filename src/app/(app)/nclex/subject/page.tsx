"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSubjectRec } from "@/lib/content";
import type { SubjectTab } from "@/lib/subjectTabs";
import { SubjectHub, SubjectRedirect } from "@/components/home/SubjectHub";

/** Subjects created in the admin (no pre-built page in the static export): /nclex/subject?id=…&tab=… */
function Page() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const tab = params.get("tab") as SubjectTab | null;
  const rec = useSubjectRec(id);
  if (!tab) return <SubjectRedirect id={id} />;
  return <SubjectHub key={`${id}:${tab}:${rec?.updatedAt}`} id={id} tab={tab} />;
}

export default function AdminSubjectPage() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
