"use client";

import Link from "next/link";
import { useState } from "react";
import { CirclePlay, ClipboardList, Target, BookOpen, ChevronRight } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { useStore } from "@/lib/store";
import { buildPlan, formatLong, toISODate } from "@/lib/schedule";
import { Button, Card } from "@/components/ui/primitives";
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

const TASK_ICON = { video: CirclePlay, questions: ClipboardList, readiness: Target, review: BookOpen };

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

  const plan = buildPlan(schedule);
  const todayIso = toISODate(new Date());
  const today = plan.find((d) => toISODate(d.date) === todayIso) ?? plan.find((d) => d.date > new Date());
  const remaining = plan.filter((d) => d.date >= new Date(new Date().toDateString()) && !d.off).length;

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold tracking-wide text-muted uppercase">Today · {today ? formatLong(today.date) : "—"}</div>
          <h3 className="text-lg font-semibold text-ink-strong">
            {today?.off ? "Day off. Rest up!" : "Today's study plan"}
          </h3>
        </div>
        <div className="text-right text-sm text-muted">
          {schedule.exam ? (
            <>
              Exam on <b className="text-ink">{formatLong(new Date(schedule.exam + "T00:00"))}</b>
              <br />
              {remaining} study days left
            </>
          ) : (
            "No exam date set"
          )}
        </div>
      </div>
      {!today?.off && (
        <ul className="mt-4 space-y-2">
          {today?.tasks.map((t) => {
            const Icon = TASK_ICON[t.kind];
            return (
              <li key={t.label}>
                <Link href={t.href} className="flex items-center gap-3 rounded-lg border border-line px-4 py-3 hover:bg-[#fafafb]">
                  <Icon className="size-5 text-brand" />
                  <span className="flex-1 text-base text-ink">{t.label}</span>
                  <ChevronRight className="size-4 text-faint" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Link href="/nclex/study-schedule" className="mt-4 inline-block text-base font-semibold text-brand hover:underline">
        View full schedule
      </Link>
    </Card>
  );
}
