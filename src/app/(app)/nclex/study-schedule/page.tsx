"use client";

import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/ui/primitives";
import { StudyScheduleCard } from "@/components/home/StudyScheduleCard";
import { PlacedFaqs } from "@/components/ui/PlacedFaqs";

export default function StudySchedulePage() {
  const hydrated = useStore((s) => s.hydrated);
  return (
    <>
      <PageHeader trail={[{ label: "Study Schedule" }]} title="Your Study Schedule" />
      {hydrated && <StudyScheduleCard />}
      <PlacedFaqs placement="schedule" />
    </>
  );
}
