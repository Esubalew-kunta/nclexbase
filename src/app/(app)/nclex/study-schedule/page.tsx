"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { BookOpen, CirclePlay, ClipboardList, Pencil, Target, Trash2 } from "lucide-react";
import { SCHEDULE_FAQS } from "@/data/catalog";
import { useStore } from "@/lib/store";
import { buildPlan, formatLong, toISODate } from "@/lib/schedule";
import { Button, Card, FaqList, PageHeader } from "@/components/ui/primitives";
import { StudyScheduleCard } from "@/components/home/StudyScheduleCard";
import { CreateScheduleModal } from "@/components/home/CreateScheduleModal";

const TASK_ICON = { video: CirclePlay, questions: ClipboardList, readiness: Target, review: BookOpen };

export default function StudySchedulePage() {
  const schedule = useStore((s) => s.schedule);
  const setSchedule = useStore((s) => s.setSchedule);
  const [editing, setEditing] = useState(false);

  const plan = schedule ? buildPlan(schedule) : [];
  const weeks: (typeof plan)[] = [];
  plan.forEach((d, i) => {
    const w = Math.floor(i / 7);
    (weeks[w] ??= []).push(d);
  });
  const todayIso = toISODate(new Date());

  return (
    <>
      <PageHeader trail={[{ label: "Study Schedule" }]} title="Your Study Schedule" />
      {!schedule ? (
        <StudyScheduleCard />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button variant="white" onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Edit Schedule
            </Button>
            <Button variant="glass" onClick={() => confirm("Delete your study schedule?") && setSchedule(null)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </div>
          <div className="space-y-6">
            {weeks.map((week, w) => (
              <section key={w}>
                <h2 className="mb-2 text-lg font-semibold text-white">
                  Week {w + 1} <span className="font-normal text-white/60">· {formatLong(week[0].date)}</span>
                </h2>
                <Card className="divide-y divide-line">
                  {week.map((d) => {
                    const iso = toISODate(d.date);
                    return (
                      <div key={iso} className={clsx("flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start", iso === todayIso && "bg-brand-tint")}>
                        <div className="w-44 shrink-0">
                          <div className="font-semibold text-ink-strong">{d.date.toLocaleDateString("en-US", { weekday: "long" })}</div>
                          <div className="text-sm text-muted">{formatLong(d.date)}</div>
                          {iso === todayIso && <span className="mt-1 inline-block rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">Today</span>}
                        </div>
                        {d.off ? (
                          <p className="text-muted">Day off</p>
                        ) : (
                          <ul className="flex-1 space-y-1.5">
                            {d.tasks.map((t) => {
                              const Icon = TASK_ICON[t.kind];
                              return (
                                <li key={t.label}>
                                  <Link href={t.href} className="flex items-center gap-2 text-ink hover:text-brand">
                                    <Icon className="size-4 text-brand" />
                                    {t.label}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </Card>
              </section>
            ))}
          </div>
          <CreateScheduleModal open={editing} onClose={() => setEditing(false)} />
        </>
      )}
      <FaqList items={SCHEDULE_FAQS} />
    </>
  );
}
