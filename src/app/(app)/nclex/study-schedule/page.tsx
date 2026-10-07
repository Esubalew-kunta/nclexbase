"use client";

import { SCHEDULE_FAQS } from "@/data/catalog";
import { useStore } from "@/lib/store";
import { FaqList, PageHeader } from "@/components/ui/primitives";
import { StudyScheduleCard } from "@/components/home/StudyScheduleCard";

export default function StudySchedulePage() {
  const hydrated = useStore((s) => s.hydrated);
  return (
    <>
      <PageHeader trail={[{ label: "Study Schedule" }]} title="Your Study Schedule" />
      {hydrated && <StudyScheduleCard />}
      <FaqList items={SCHEDULE_FAQS} />
    </>
  );
}
