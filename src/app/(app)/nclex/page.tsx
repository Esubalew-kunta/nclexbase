"use client";

import { subjectById, TOTALS } from "@/data/catalog";
import { useConfig, useFaqs, usePublished, useSubjects } from "@/lib/content";
import { greeting, useProgress } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { FaqList, SectionTitle } from "@/components/ui/primitives";
import { HomeRow, LessonsBlock, SubjectIcon, TypeIcon, UsageBlock } from "@/components/ui/visuals";
import { QuickActions } from "@/components/home/QuickActions";
import { StudyScheduleCard } from "@/components/home/StudyScheduleCard";
import { UserAvatar } from "@/components/shell/TopBar";

export default function HomePage() {
  const progress = useProgress();
  const hydrated = useStore((s) => s.hydrated);
  const subjects = useSubjects();
  const lessons = usePublished("lessons");
  const faqs = useFaqs("home");
  // Admin > Home & Navigation turns whole sections on or off.
  const { sections } = useConfig().home;
  const lessonCount = (course: string) => lessons.filter((l) => l.course === course).length;

  return (
    <div className="flex flex-col items-start">
      <h1 className="mb-4 flex items-center text-[28px] leading-[45px] font-bold text-ink sm:text-4xl">
        <span className="mr-2 hidden sm:block">
          <UserAvatar size={48} />
        </span>
        <span suppressHydrationWarning>{hydrated ? greeting() : "Welcome back"}!</span>
      </h1>

      <QuickActions />

      {sections.schedule && (
        <section className="mb-8 w-full">
          <SectionTitle>Study Schedule</SectionTitle>
          <StudyScheduleCard />
        </section>
      )}

      {sections.subjects && (
        <section className="mb-8 w-full">
          <SectionTitle>Study by Subject</SectionTitle>
          {subjects.map((s) => {
            const c = progress.subjectCounts(s.id);
            return (
              <HomeRow
                key={s.id}
                href={`/nclex/${s.id}`}
                icon={<SubjectIcon id={s.id} />}
                title={s.name}
              >
                <div className="flex flex-col gap-2 xl:flex-row xl:gap-4">
                  <UsageBlock className="flex-1" usage={{ total: subjectById(s.id).questionCount, ...c }} />
                  <LessonsBlock className="flex-1" done={0} total={lessonCount(s.id)} />
                </div>
              </HomeRow>
            );
          })}
        </section>
      )}

      {sections.questionTypes && (
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
      )}

      {sections.resources && (
        <section className="mb-8 w-full">
          <SectionTitle>Resources</SectionTitle>
          <HomeRow href="/nclex/crash-courses" icon={<TypeIcon kind="videos" />} title="Crash Course Videos">
            <LessonsBlock done={0} total={subjects.reduce((a, s) => a + lessonCount(s.id), 0)} />
          </HomeRow>
          <HomeRow href="/nclex/cheat-sheets" icon={<TypeIcon kind="sheets" />} title="Cheat Sheets" subtitle="High-yield Cheat Sheets for the NCLEX®" />
          <HomeRow
            href="/nclex/next-gen-strategy-course/videos"
            icon={<TypeIcon kind="course" />}
            title="Next Gen Strategy Course"
            subtitle="Learn everything you need to know about the Next Gen NCLEX®"
          />
        </section>
      )}

      {sections.faqs && faqs.length > 0 && (
        <div className="-mt-8 w-full">
          <FaqList items={faqs} />
        </div>
      )}
    </div>
  );
}
