"use client";

import type { ReactNode } from "react";
import type { HomeSection } from "@/lib/admin/config";
import { useConfig, useCopy, useFaqs, usePublished, useSubjects } from "@/lib/content";
import { subjectHref } from "@/lib/routes";
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
  const copy = useCopy();
  // Admin > Home & Navigation sets which sections show and in what order; totals come from Admin > Subjects & Systems.
  const { homeLayout, totals } = useConfig();
  const lessonCount = (course: string) => lessons.filter((l) => l.course === course).length;

  const render: Record<HomeSection, () => ReactNode> = {
    schedule: () => (
      <section key="schedule" className="mb-8 w-full">
        <SectionTitle>{copy("home.schedule.title")}</SectionTitle>
        <StudyScheduleCard />
      </section>
    ),
    subjects: () => (
      <section key="subjects" className="mb-8 w-full">
        <SectionTitle>{copy("home.subjects.title")}</SectionTitle>
        {subjects.map((s) => (
          <HomeRow key={s.id} href={subjectHref(s.id)} icon={<SubjectIcon id={s.id} />} title={s.name}>
            <div className="flex flex-col gap-2 xl:flex-row xl:gap-4">
              <UsageBlock className="flex-1" usage={{ total: s.stats.questionCount, ...progress.subjectCounts(s.id) }} />
              <LessonsBlock className="flex-1" done={0} total={lessonCount(s.id)} />
            </div>
          </HomeRow>
        ))}
      </section>
    ),
    questionTypes: () => (
      <section key="questionTypes" className="mb-8 w-full">
        <SectionTitle>{copy("home.questionTypes.title")}</SectionTitle>
        <HomeRow href="/nclex/next-gen-cases" icon={<TypeIcon kind="cases" />} title={copy("cases.title")}>
          <UsageBlock usage={{ total: totals.cases, ...progress.casesTotal }} />
        </HomeRow>
        <HomeRow href="/nclex/next-gen-standalone" icon={<TypeIcon kind="standalone" />} title={copy("standalone.title")}>
          <UsageBlock usage={{ total: totals.standalone, ...progress.standaloneTotal }} />
        </HomeRow>
        <HomeRow href="/nclex/next-gen-readiness-exams" icon={<TypeIcon kind="readiness" />} title={copy("readiness.title")}>
          <UsageBlock usage={{ total: totals.readiness, used: 0 }} />
        </HomeRow>
      </section>
    ),
    resources: () => (
      <section key="resources" className="mb-8 w-full">
        <SectionTitle>{copy("home.resources.title")}</SectionTitle>
        <HomeRow href="/nclex/crash-courses" icon={<TypeIcon kind="videos" />} title={copy("crash.title")}>
          <LessonsBlock done={0} total={subjects.reduce((a, s) => a + lessonCount(s.id), 0)} />
        </HomeRow>
        <HomeRow href="/nclex/cheat-sheets" icon={<TypeIcon kind="sheets" />} title="Cheat Sheets" subtitle="High-yield Cheat Sheets for the NCLEX®" />
        <HomeRow href="/nclex/next-gen-strategy-course/videos" icon={<TypeIcon kind="course" />} title={copy("ngn.title")} subtitle="Learn everything you need to know about the Next Gen NCLEX®" />
      </section>
    ),
    faqs: () =>
      faqs.length > 0 && (
        <div key="faqs" className="-mt-8 w-full">
          <FaqList items={faqs} title={copy("home.faqs.title")} />
        </div>
      ),
  };

  return (
    <div className="flex flex-col items-start">
      <h1 className="mb-4 flex items-center text-[28px] leading-[45px] font-bold text-ink sm:text-4xl">
        <span className="mr-2 hidden sm:block">
          <UserAvatar size={48} />
        </span>
        <span suppressHydrationWarning>{hydrated ? greeting() : "Welcome back"}!</span>
      </h1>

      <QuickActions />

      {homeLayout.sections.filter((x) => x.visible && render[x.key]).map((x) => render[x.key]())}
    </div>
  );
}
