"use client";

import { HOME_FAQS, SUBJECTS, TOTALS } from "@/data/catalog";
import { greeting, useProgress } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { ExpertRow, FaqList, SectionTitle } from "@/components/ui/primitives";
import { HomeRow, LessonsBlock, SubjectIcon, TypeIcon, UsageBlock } from "@/components/ui/visuals";
import { QuickActions } from "@/components/home/QuickActions";
import { StudyScheduleCard } from "@/components/home/StudyScheduleCard";
import { UserAvatar } from "@/components/shell/TopBar";

export default function HomePage() {
  const progress = useProgress();
  const hydrated = useStore((s) => s.hydrated);

  return (
    <div className="flex flex-col items-start">
      <h1 className="mb-4 flex items-center text-[28px] leading-[45px] font-bold text-white sm:text-4xl">
        <span className="mr-2 hidden sm:block">
          <UserAvatar size={48} />
        </span>
        <span suppressHydrationWarning>{hydrated ? greeting() : "Welcome back"}!</span>
      </h1>

      <QuickActions />

      <section className="mb-8 w-full">
        <SectionTitle>Study Schedule</SectionTitle>
        <StudyScheduleCard />
      </section>

      <section className="mb-8 w-full">
        <SectionTitle>Study by Subject</SectionTitle>
        {SUBJECTS.map((s) => {
          const c = progress.subjectCounts(s.id);
          return (
            <HomeRow
              key={s.id}
              href={`/nclex/${s.id}`}
              icon={<SubjectIcon id={s.id} />}
              title={s.name}
              trailing={
                <div className="hidden border-l border-[#ededf0] pl-4 xl:block">
                  <ExpertRow ids={s.experts} dark className="w-[258px]" />
                </div>
              }
            >
              <div className="flex flex-col gap-2 xl:flex-row xl:gap-4">
                <UsageBlock className="flex-1" usage={{ total: s.questionCount, ...c }} />
                <LessonsBlock className="flex-1" done={0} total={s.lessonCount} />
              </div>
            </HomeRow>
          );
        })}
      </section>

      <section className="mb-8 w-full">
        <SectionTitle>Study by Question Type</SectionTitle>
        <HomeRow href="/nclex/next-gen-cases" icon={<TypeIcon kind="cases" />} title="Case Studies">
          <UsageBlock usage={{ total: TOTALS.cases, ...progress.casesTotal }} />
        </HomeRow>
        <HomeRow href="/nclex/next-gen-standalone" icon={<TypeIcon kind="standalone" />} title="Standalone Questions">
          <UsageBlock usage={{ total: TOTALS.standalone, ...progress.standaloneTotal }} />
        </HomeRow>
        <HomeRow href="/nclex/next-gen-readiness-exams" icon={<TypeIcon kind="readiness" />} title="CAT Readiness Exams">
          <UsageBlock usage={{ total: TOTALS.readiness, used: 0 }} />
        </HomeRow>
      </section>

      <section className="mb-8 w-full">
        <SectionTitle>Resources</SectionTitle>
        <HomeRow href="/nclex/crash-courses" icon={<TypeIcon kind="videos" />} title="Crash Course Videos">
          <LessonsBlock done={0} total={TOTALS.lessons} />
        </HomeRow>
        <HomeRow href="/nclex/cheat-sheets" icon={<TypeIcon kind="sheets" />} title="Cheat Sheets" subtitle="High-yield Cheat Sheets for the NCLEX®" />
        <HomeRow
          href="/nclex/next-gen-strategy-course/videos"
          icon={<TypeIcon kind="course" />}
          title="Next Gen Strategy Course"
          subtitle="Learn everything you need to know about the Next Gen NCLEX®"
        />
      </section>

      <div className="-mt-8 w-full">
        <FaqList items={HOME_FAQS} />
      </div>
    </div>
  );
}
