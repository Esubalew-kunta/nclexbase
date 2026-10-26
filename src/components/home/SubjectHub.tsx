"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAll, useCopy, useLessons, useSubjectRec } from "@/lib/content";
import { courseHref, subjectHref } from "@/lib/routes";
import { useProgress } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { useStats } from "@/lib/stats";
import type { SubjectId } from "@/lib/types";
import { TAB_LABELS, tabsFor, type SubjectTab } from "@/lib/subjectTabs";
import { Banner, Button, PageHeader, UnderlineTabs, UpgradeButton } from "@/components/ui/primitives";
import { NumberedRow, SubjectIcon, UsageBlock } from "@/components/ui/visuals";
import { CaseList } from "./CaseList";
import { CourseList } from "./CourseList";
import { CheatSheetBrowser } from "./CheatSheets";
import { MemoryTricksBrowser } from "./MemoryTricks";
import { SubjectPerformance } from "@/components/performance/SubjectPerformance";

/** /nclex/:subject → the subject's first visible tab (Admin > Subjects & Systems sets the order). */
export function SubjectRedirect({ id }: { id: SubjectId }) {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const rec = useSubjectRec(id);
  const first = rec?.tabs[0] ?? tabsFor(id)[0];
  useEffect(() => {
    if (hydrated && first) router.replace(subjectHref(id, first));
  }, [hydrated, router, id, first]);
  return null;
}

export function SubjectHub({ id, tab }: { id: SubjectId; tab: SubjectTab }) {
  const router = useRouter();
  const copy = useCopy();
  const rec = useSubjectRec(id);
  const lessons = useLessons(id);
  const course = useAll("courses").find((c) => c.id === id);
  const plan = useStore((s) => s.user.plan);
  const hydrated = useStore((s) => s.hydrated);
  const setUi = useStore((s) => s.setUi);
  const progress = useProgress();
  const stats = useStats();
  const name = rec?.name ?? id;
  const tabs = rec?.tabs ?? tabsFor(id);
  const systems = (rec?.systems ?? []).filter((s) => s.visible);

  const action = (system?: string) => (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (plan === "free") router.push("/nclex/upgrade");
    else setUi({ createTestOpen: true, createTestPreset: { subject: id, system } });
  };
  const actionButton = (system?: string) =>
    plan === "free" ? <UpgradeButton onClick={(e) => e.stopPropagation()} /> : <Button onClick={action(system)}>Create Test</Button>;

  // A tab the admin turned off (or a subject they hid) still has a static page; explain instead of rendering it.
  if (hydrated && (!rec || !tabs.includes(tab) || rec.visible === false))
    return (
      <>
        <PageHeader trail={[{ label: name }]} title={name} />
        <div className="rounded-lg border border-dashed border-line bg-white px-6 py-12 text-center">
          <p className="text-lg font-semibold text-ink">This section isn&apos;t available right now.</p>
          {rec?.visible !== false && tabs[0] && (
            <Link href={subjectHref(id, tabs[0])} className="mt-3 inline-block font-semibold text-primary underline hover:text-primary-hover">
              Go to {TAB_LABELS[tabs[0]]}
            </Link>
          )}
        </div>
      </>
    );

  return (
    <>
      <PageHeader trail={[{ label: name }]} title={name} />
      <UnderlineTabs tabs={tabs.map((t) => ({ label: TAB_LABELS[t], href: subjectHref(id, t) }))} active={subjectHref(id, tab)} />

      {tab === "case-studies" && (
        <>
          <Banner>{copy("subject.casesBanner")}</Banner>
          <CaseList subject={id} />
        </>
      )}

      {tab === "standalone" && (
        <>
          <Banner>{copy("subject.standaloneBanner")}</Banner>
          <h2 className="py-4 text-2xl leading-[30px] font-bold text-ink">By Subject</h2>
          <NumberedRow leading={<SubjectIcon id={id} size={24} />} title={name} onClick={() => action()()} action={actionButton()}>
            <UsageBlock className="lg:max-w-[630px]" usage={{ total: stats.subject(id).standalone, ...progress.standaloneFor(id) }} />
          </NumberedRow>
          <h2 className="py-4 text-2xl leading-[30px] font-bold text-ink">By System</h2>
          {systems.map((sys, i) => (
            <NumberedRow key={sys.key} number={i + 1} title={sys.label} onClick={() => action(sys.key)()} action={actionButton(sys.key)}>
              <UsageBlock
                className="lg:max-w-[630px]"
                usage={{ total: stats.system(id, sys.key).standalone, used: progress.bySystem.get(`${id}::${sys.key}`)?.used ?? 0 }}
              />
            </NumberedRow>
          ))}
        </>
      )}

      {tab === "videos" && (
        <CourseList
          defaultOpen
          courses={[
            {
              id,
              title: course?.title ?? name,
              runtime: course?.runtime ?? "",
              count: lessons.length,
              lessons: lessons.map((l) => ({ type: l.type, title: l.title, duration: l.duration, count: l.count, locked: l.access === "premium" })),
              href: courseHref(id),
            },
          ]}
        />
      )}

      {tab === "cheat-sheets" && <CheatSheetBrowser subject={id} />}

      {tab === "memory-tricks" && <MemoryTricksBrowser subject={id} />}

      {tab === "performance" && <SubjectPerformance subjects={[id]} />}
    </>
  );
}
