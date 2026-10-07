"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useStore } from "@/lib/store";
import { ScheduleCalendar } from "@/components/schedule/ScheduleCalendar";
import { Button } from "@/components/ui/primitives";
import { CreateScheduleModal } from "./CreateScheduleModal";

const BENEFITS = [
  "Know exactly what to study every day",
  "Personalized to your exam date",
  "One click to get back on track",
  "Proven plan trusted by 200,000+ students",
];

export function ScheduleIllustration() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/assets/brand/schedule-placeholder.png" alt="" className="h-[76px] w-[179px]" />;
}

export function StudyScheduleCard() {
  const schedule = useStore((s) => s.schedule);
  const [open, setOpen] = useState(false);

  if (!schedule) {
    return (
      <div className="rounded-xl bg-white shadow-card">
        <div className="flex flex-col items-center gap-4 px-4 py-6 text-center">
          <ScheduleIllustration />
          <h4 className="text-lg leading-[22.5px] font-semibold text-ink">
            Create Your Personalized NCLEX<sup className="text-[10px]">®</sup> Study Schedule
          </h4>
          <div className="flex flex-col items-center gap-2">
            {[BENEFITS.slice(0, 2), BENEFITS.slice(2)].map((row, i) => (
              <div key={i} className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                {row.map((b) => (
                  <div key={b} className="flex items-center gap-2">
                    <Icon name="checkCircle" size={16} className="text-brand" />
                    <p className="text-base leading-5 text-muted">{b}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <Button onClick={() => setOpen(true)}>
            <Icon name="plusSquare" size={20} />
            <span className="ml-2">Create Study Schedule</span>
          </Button>
        </div>
        <CreateScheduleModal open={open} onClose={() => setOpen(false)} />
      </div>
    );
  }

  return <ScheduleCalendar home />;
}
