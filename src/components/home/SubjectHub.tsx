"use client";

import { SquarePlus } from "lucide-react";
import { CHEAT_SHEETS, LESSON_TITLES, subjectById } from "@/data/catalog";
import { STANDALONE } from "@/data/standalone";
import { useProgress } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import type { SubjectId } from "@/lib/types";
import { Button, PageHeader, UnderlineTabs, UpgradeButton } from "@/components/ui/primitives";
import { ProgressRow } from "@/components/ui/visuals";
import { SubjectPerformanceTable, TimeTable } from "@/components/performance/Tables";
import { CaseList } from "./CaseList";
import { CourseList } from "./CourseList";
import { padLessons } from "@/lib/lessons";
import { CheatSheetGrid } from "./CheatSheets";
import { SUBJECT_TABS, tabsFor, type SubjectTab } from "@/lib/subjectTabs";

export function SubjectHub({ id, tab }: { id: SubjectId; tab: SubjectTab }) {
  const subject = subjectById(id);
  const plan = useStore((s) => s.user.plan);
  const setUi = useStore((s) => s.setUi);
  const progress = useProgress();
  const available = tabsFor(id);
  const base = `/nclex/${id}`;
  const tabHref = (t: SubjectTab) => (t === available[0] ? base : `${base}/${t}`);

  const action =
    plan === "free" ? (
      <UpgradeButton />
    ) : (
      <Button onClick={() => setUi({ createTestOpen: true })}>
        <SquarePlus className="size-5" /> Create Test
      </Button>
    );
  const row = progress.bySubject.get(id);

  return (
    <>
      <PageHeader trail={[{ label: subject.name }]} title={subject.name} experts={subject.experts} />
      <UnderlineTabs tabs={SUBJECT_TABS.filter((t) => available.includes(t.id)).map((t) => ({ label: t.label, href: tabHref(t.id) }))} active={tabHref(tab)} />

      {tab === "cases" && (
        <>
          <Banner>The case studies below are based on the real Next Gen NCLEX. Practice with these so you&apos;re ready for the real exam.</Banner>
          <CaseList subject={id} />
        </>
      )}

      {tab === "standalone" && (
        <>
          <Banner>The standalone questions below are based on the real Next Gen NCLEX. Practice with these so you&apos;re ready for the real exam.</Banner>
          <h2 className="mb-3 text-lg font-semibold text-white">By Subject</h2>
          <ProgressRow
            title={subject.name}
            used={STANDALONE.filter((i) => i.subject === id && progress.used.has(i.id)).length}
            total={subject.standaloneCount}
            action={action}
          />
          <h2 className="mt-8 mb-3 text-lg font-semibold text-white">By System</h2>
          <div className="space-y-2">
            {subject.systems.map((sys, i) => (
              <ProgressRow key={sys.name} number={i + 1} title={sys.name} used={0} total={sys.count} action={action} />
            ))}
          </div>
        </>
      )}

      {tab === "crash-courses" && (
        <CourseList courses={[{ id, title: subject.name, runtime: subject.videoRuntime, lessons: padLessons(LESSON_TITLES[id], subject.lessonCount, subject.name) }]} />
      )}

      {tab === "cheat-sheets" && <CheatSheetGrid sheets={CHEAT_SHEETS.filter((c) => c.subject === id)} />}

      {tab === "performance" && (
        <>
          {(() => {
            const stat = {
              id,
              earned: row?.earned ?? 0,
              max: row?.max ?? 0,
              used: row?.used ?? 0,
              total: subject.questionCount,
              avgScore: subject.avgScore,
              time: row?.time ?? 0,
              answered: row?.answered ?? 0,
              systems: subject.systems.map((sys) => {
                const v = progress.bySystem.get(`${id}::${sys.name}`);
                return { name: sys.name, earned: v?.earned ?? 0, max: v?.max ?? 0, avgScore: subject.avgScore };
              }),
            };
            return (
              <>
                <SubjectPerformanceTable stats={[stat]} />
                <h2 className="mt-8 mb-3 text-2xl font-bold text-white">Time Management</h2>
                <TimeTable stats={[stat]} />
              </>
            );
          })()}
        </>
      )}
    </>
  );
}

function Banner({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 rounded-lg bg-white/10 px-4 py-3 text-[15px] text-white">{children}</div>;
}
