"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { ExamLoading, ExamNotFound, ExamScreen } from "@/components/exam/ExamScreen";

function CustomTest() {
  const params = useSearchParams();
  const id = params.get("id");
  const review = params.get("review") === "1";
  const hydrated = useStore((s) => s.hydrated);
  const session = useStore((s) => s.sessions.find((x) => x.id === id));
  if (!hydrated) return <ExamLoading />;
  if (!session) return <ExamNotFound />;
  return <ExamScreen session={session} review={review} />;
}

export default function CustomTestPage() {
  return (
    <Suspense fallback={<ExamLoading />}>
      <CustomTest />
    </Suspense>
  );
}
