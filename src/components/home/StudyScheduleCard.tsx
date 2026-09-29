"use client";

import Link from "next/link";
import { useState } from "react";
import { CircleCheck, CirclePlay, ClipboardList, SquarePlus, Target, BookOpen, ChevronRight } from "lucide-react";
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
  return (
    <svg viewBox="0 0 180 90" className="h-[90px] w-[180px]" aria-hidden>
      <rect x="4" y="38" width="36" height="10" rx="3" fill="#eeecfd" />
      <rect x="8" y="41" width="5" height="4" rx="1" fill="#6255e5" />
      <rect x="44" y="12" width="84" height="74" rx="8" fill="#eeecfd" />
      <rect x="44" y="12" width="84" height="16" rx="8" fill="#6255e5" />
      <rect x="62" y="4" width="4" height="14" rx="2" fill="#6255e5" />
      <rect x="104" y="4" width="4" height="14" rx="2" fill="#6255e5" />
      {[36, 52, 68].map((y) => (
        <g key={y}>
          <rect x="54" y={y} width="62" height="11" rx="3" fill="#fff" />
          <rect x="57" y={y + 3} width="5" height="5" rx="1" fill="#6255e5" />
          <rect x="66" y={y + 4} width="40" height="3" rx="1.5" fill="#c8c3f7" />
        </g>
      ))}
      <rect x="118" y="20" width="58" height="12" rx="3" fill="#fff" stroke="#e1defb" />
      <rect x="121" y="23" width="6" height="6" rx="1.5" fill="#6255e5" />
      <rect x="131" y="25" width="38" height="3" rx="1.5" fill="#c8c3f7" />
    </svg>
  );
}

const TASK_ICON = { video: CirclePlay, questions: ClipboardList, readiness: Target, review: BookOpen };

export function StudyScheduleCard() {
  const schedule = useStore((s) => s.schedule);
  const [open, setOpen] = useState(false);

  if (!schedule) {
    return (
      <Card className="flex flex-col items-center px-6 py-7 text-center">
        <ScheduleIllustration />
        <h3 className="mt-4 text-lg font-semibold text-ink-strong">Create Your Personalized NCLEX® Study Schedule</h3>
        <ul className="mt-4 grid max-w-2xl gap-x-6 gap-y-2 text-left sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-base text-muted">
              <CircleCheck className="mt-0.5 size-[18px] shrink-0 fill-brand text-white" />
              {b}
            </li>
          ))}
        </ul>
        <Button className="mt-6" onClick={() => setOpen(true)}>
          <SquarePlus className="size-5" />
          Create Study Schedule
        </Button>
        <CreateScheduleModal open={open} onClose={() => setOpen(false)} />
      </Card>
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
