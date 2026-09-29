"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { HOME_FAQS, SUBJECTS, TOTALS } from "@/data/catalog";
import { greeting, useProgress } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { Avatar, ExpertRow, FaqList, ProgressBar, SectionTitle } from "@/components/ui/primitives";
import { ProgressRow, SubjectIcon, TypeIcon } from "@/components/ui/visuals";
import { QuickActions } from "@/components/home/QuickActions";
import { StudyScheduleCard } from "@/components/home/StudyScheduleCard";

export default function HomePage() {
  const progress = useProgress();
  const hydrated = useStore((s) => s.hydrated);
  const initial = useStore((s) => (s.user.name || s.user.email).charAt(0).toLowerCase());
  const usedTotal = progress.used.size;

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <Avatar initials={initial} color="#e8e8f0" size={42} light />
        <h1 className="text-[28px] font-bold text-white sm:text-4xl" suppressHydrationWarning>
          {hydrated ? greeting() : "Welcome back!"}
        </h1>
      </div>

      <QuickActions />

      <SectionTitle>Study Schedule</SectionTitle>
      <StudyScheduleCard />

      <SectionTitle>Study by Subject</SectionTitle>
      <div className="space-y-2">
        {SUBJECTS.map((s) => {
          const used = progress.bySubject.get(s.id)?.used ?? 0;
          return (
            <Link
              key={s.id}
              href={`/nclex/${s.id}`}
              className="bg-card flex items-center gap-4 rounded-lg px-4 py-4 shadow-card transition-transform hover:-translate-y-0.5 sm:px-6"
            >
              <SubjectIcon id={s.id} size={32} />
              <div className="min-w-0 flex-1">
                <div className="text-lg font-semibold text-ink-strong">{s.name}</div>
                <div className="mt-2 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div>
                    <ProgressBar value={(used / s.questionCount) * 100} />
                    <div className="mt-2 text-base text-muted">
                      <b className="font-semibold text-ink">{used}</b> of {s.questionCount} questions used
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <ProgressBar value={0} />
                    <div className="mt-2 text-base text-muted">
                      <b className="font-semibold text-ink">0</b> of {s.lessonCount} lessons completed
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden w-[260px] shrink-0 border-l border-line pl-5 md:block">
                <ExpertRow ids={s.experts} dark />
              </div>
              <ChevronRight className="size-5 shrink-0 text-faint" />
            </Link>
          );
        })}
      </div>

      <SectionTitle>Study by Question Type</SectionTitle>
      <div className="space-y-2">
        <ProgressRow href="/nclex/next-gen-cases" leading={<TypeIcon kind="cases" />} title="Case Studies" used={countCaseItems(progress.used)} total={TOTALS.cases} />
        <ProgressRow
          href="/nclex/next-gen-standalone"
          leading={<TypeIcon kind="standalone" />}
          title="Standalone Questions"
          used={usedTotal - countCaseItems(progress.used)}
          total={TOTALS.standalone}
        />
        <ProgressRow href="/nclex/next-gen-readiness-exams" leading={<TypeIcon kind="readiness" />} title="Readiness Exams" used={0} total={TOTALS.readiness} />
      </div>

      <SectionTitle>Resources</SectionTitle>
      <div className="space-y-2">
        <ProgressRow href="/nclex/crash-courses" leading={<TypeIcon kind="videos" />} title="Crash Course Videos" used={0} total={TOTALS.lessons} unit="lessons completed" />
        <ProgressRow href="/nclex/cheat-sheets" leading={<TypeIcon kind="sheets" />} title="Cheat Sheets" subtitle="High-yield Cheat Sheets for the NCLEX®" />
        <ProgressRow
          href="/nclex/next-gen-strategy-course"
          leading={<TypeIcon kind="course" />}
          title="Next Gen Strategy Course"
          subtitle="Learn everything you need to know about the Next Gen NCLEX®"
        />
      </div>

      <FaqList items={HOME_FAQS} />
    </>
  );
}

function countCaseItems(used: Set<string>) {
  let n = 0;
  for (const id of used) if (id.startsWith("c")) n++;
  return n;
}
