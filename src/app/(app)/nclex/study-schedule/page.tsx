"use client";

import { useStore } from "@/lib/store";
import { StudyScheduleCard } from "@/components/home/StudyScheduleCard";
import { PlacedFaqs } from "@/components/ui/PlacedFaqs";
import { CopyHeader } from "@/components/ui/CopyHeader";

export default function StudySchedulePage() {
  const hydrated = useStore((s) => s.hydrated);
  return (
    <>
      <CopyHeader trail={[{ label: "Study Schedule" }]} titleKey="schedule.title" />
      {hydrated && <StudyScheduleCard />}
      <PlacedFaqs placement="schedule" />
    </>
  );
}
