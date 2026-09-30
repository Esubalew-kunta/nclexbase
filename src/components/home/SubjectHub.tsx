"use client";

import { useRouter } from "next/navigation";
import { LESSONS, subjectById } from "@/data/catalog";
import { useProgress } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import type { SubjectId } from "@/lib/types";
import { TAB_LABELS, tabsFor, type SubjectTab } from "@/lib/subjectTabs";
import { Banner, Button, PageHeader, UnderlineTabs, UpgradeButton } from "@/components/ui/primitives";
import { NumberedRow, SubjectIcon, UsageBlock } from "@/components/ui/visuals";
import { CaseList } from "./CaseList";
import { CourseList } from "./CourseList";
import { CheatSheetBrowser } from "./CheatSheets";
import { SubjectPerformance } from "@/components/performance/SubjectPerformance";

export function SubjectHub({ id, tab }: { id: SubjectId; tab: SubjectTab }) {
  const router = useRouter();
  const subject = subjectById(id);
  const plan = useStore((s) => s.user.plan);
  const setUi = useStore((s) => s.setUi);
  const progress = useProgress();
  const base = `/nclex/${id}`;

  const action = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (plan === "free") router.push("/nclex/upgrade");
    else setUi({ createTestOpen: true });
  };
  const actionButton = plan === "free" ? <UpgradeButton onClick={(e) => e.stopPropagation()} /> : <Button onClick={action}>Create Test</Button>;

  return (
    <>
      <PageHeader trail={[{ label: subject.name }]} title={subject.name} experts={subject.experts} shortNames />
      <UnderlineTabs tabs={tabsFor(id).map((t) => ({ label: TAB_LABELS[t], href: `${base}/${t}` }))} active={`${base}/${tab}`} />

      {tab === "case-studies" && (
        <>
          <Banner>The case studies below are based on the real Next Gen NCLEX. Practice with these so you&apos;re ready for the real exam.</Banner>
          <CaseList subject={id} />
        </>
      )}

      {tab === "standalone" && (
        <>
          <Banner>The standalone questions below are based on the real Next Gen NCLEX. Practice with these so you&apos;re ready for the real exam.</Banner>
          <h2 className="py-4 text-2xl leading-[30px] font-bold text-white">By Subject</h2>
          <NumberedRow leading={<SubjectIcon id={id} size={24} />} title={subject.name} onClick={() => action()} action={actionButton}>
            <UsageBlock className="lg:max-w-[630px]" usage={{ total: subject.standaloneCount, ...progress.standaloneFor(id) }} />
          </NumberedRow>
          <h2 className="py-4 text-2xl leading-[30px] font-bold text-white">By System</h2>
          {subject.systems.map((sys, i) => (
            <NumberedRow key={sys.name} number={i + 1} title={sys.name} onClick={() => action()} action={actionButton}>
              <UsageBlock className="lg:max-w-[630px]" usage={{ total: sys.count, used: progress.bySystem.get(`${id}::${sys.name}`)?.used ?? 0 }} />
            </NumberedRow>
          ))}
        </>
      )}

      {tab === "videos" && (
        <CourseList
          defaultOpen
          courses={[{ id, title: subject.name, runtime: subject.videoRuntime, count: subject.lessonCount, lessons: LESSONS[id], href: `/nclex/crash-courses/videos/${id}` }]}
        />
      )}

      {tab === "cheat-sheets" && <CheatSheetBrowser subject={id} />}

      {tab === "performance" && <SubjectPerformance subjects={[id]} />}
    </>
  );
}
