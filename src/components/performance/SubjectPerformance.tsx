"use client";

import clsx from "clsx";
import { Fragment, useState, type ReactNode } from "react";
import type { SubjectRec } from "@/lib/admin/types";
import { subjectName, useSubjects } from "@/lib/content";
import { useProgress } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { formatDuration } from "@/lib/scoring";
import type { SubjectId } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { SubjectIcon } from "@/components/ui/visuals";
import { PlacedFaqs } from "@/components/ui/PlacedFaqs";

/* ------------------------------------------------------------------ */
/* Small table pieces                                                  */
/* ------------------------------------------------------------------ */

export function SortArrows() {
  return (
    <span className="ml-2 inline-flex flex-col align-middle">
      <span className="mb-0.5 block border-x-[5px] border-b-[5px] border-x-transparent border-b-muted opacity-30" />
      <span className="block border-x-[5px] border-t-[5px] border-x-transparent border-t-muted opacity-30" />
    </span>
  );
}

/** 100px bar with a gray tick marking the average/target. */
function MiniBar({ children, tick }: { children: ReactNode; tick: number }) {
  return (
    <div className="relative w-[100px]">
      <div className="flex h-[10px] overflow-hidden rounded-lg bg-primary-light shadow-[inset_0_1px_3px_0_rgba(14,90,92,0.1)]">
        {children}
      </div>
      <div className="absolute -top-px -bottom-px w-0.5 bg-gold" style={{ left: `${tick}%` }} />
    </div>
  );
}

export function ScoreCell({ pct, avg }: { pct: number; avg: number }) {
  return (
    <div className="flex items-center gap-2">
      <p className="min-w-[42px] text-base leading-4 whitespace-nowrap">{pct} %</p>
      <MiniBar tick={avg}>
        <span className="h-2 bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </MiniBar>
    </div>
  );
}

export function UsageCell({ used, total, mastered = 0, reviewing = 0, learning = 0 }: { used: number; total: number; mastered?: number; reviewing?: number; learning?: number }) {
  const w = (n: number) => `${total ? Math.min(100, (n / total) * 100) : 0}%`;
  return (
    <div className="flex items-center gap-2">
      <p className="w-[78px] text-base leading-4">
        {used} / {total}
      </p>
      <MiniBar tick={74}>
        <span className="bg-success h-2 transition-[width] duration-500" style={{ width: w(mastered) }} />
        <span className="bg-warning h-2 transition-[width] duration-500" style={{ width: w(reviewing) }} />
        <span className="bg-error h-2 transition-[width] duration-500" style={{ width: w(learning) }} />
      </MiniBar>
    </div>
  );
}

function Warning() {
  return (
    <span className="mx-1 inline-flex size-3 items-center justify-center">
      <Icon name="warning" size={16} />
    </span>
  );
}

function CreateButton({ subject, system }: { subject: SubjectId; system?: string }) {
  const setUi = useStore((s) => s.setUi);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setUi({ createTestOpen: true, createTestPreset: { subject, system } });
      }}
      aria-label="Create a test"
      className="ml-auto flex size-8 cursor-pointer items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover"
    >
      <Icon name="plusSquare" size={16} />
    </button>
  );
}

const th = "p-3 px-4 text-left text-base leading-4 font-semibold text-muted";

/* ------------------------------------------------------------------ */
/* Subject Performance (subjects expand into systems)                  */
/* ------------------------------------------------------------------ */

/** Performance numbers for a subject from Admin > Subjects & Systems (averages are editable there). */
function subjectView(subjects: SubjectRec[], id: SubjectId) {
  const rec = subjects.find((s) => s.id === id);
  return {
    id,
    name: rec?.name ?? id,
    avgScore: rec?.stats.avgScore ?? 0,
    perfTotal: rec?.stats.perfTotal ?? 0,
    avgTimeSec: rec?.stats.avgTimeSec ?? 70,
    perfSystems: (rec?.systems ?? [])
      .filter((x) => x.visible)
      .map((x) => ({ key: x.key, name: x.label, avg: x.avg, total: x.perfTotal }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export function useSubjectPerformanceTable({ subjects, defaultExpanded }: { subjects: SubjectId[]; defaultExpanded?: boolean }) {
  const progress = useProgress();
  const all = useSubjects(true);
  const [open, setOpen] = useState<Set<SubjectId>>(() => new Set(defaultExpanded ? subjects : []));
  const [sort, setSort] = useState<{ key: "name" | "score"; dir: 1 | -1 } | null>(null);
  const allOpen = open.size === subjects.length;

  const rows = subjects.map((id) => {
    const s = subjectView(all, id);
    const stat = progress.bySubject.get(id);
    const counts = progress.subjectCounts(id);
    return { id, s, pct: stat?.max ? Math.round((stat.earned / stat.max) * 100) : 0, counts };
  });
  if (sort) rows.sort((a, b) => (sort.key === "name" ? a.s.name.localeCompare(b.s.name) : a.pct - b.pct) * sort.dir);

  const toggleSort = (key: "name" | "score") => setSort((cur) => (cur?.key === key ? { key, dir: (cur.dir * -1) as 1 | -1 } : { key, dir: 1 }));


  return {
    toggleAll: () => setOpen(allOpen ? new Set() : new Set(subjects)),
    allOpen,
    table: (
      <div className="overflow-auto">
        <table className="w-full min-w-[760px] overflow-hidden rounded-lg bg-white text-ink">
          <tbody>
            <tr className="border-b border-line bg-background">
              <td className={clsx(th, "w-12 rounded-tl-lg")} />
              <td className={clsx(th, "cursor-pointer")} onClick={() => toggleSort("name")}>
                <span className="inline-flex items-center text-ink">
                  Subject
                  <SortArrows />
                </span>
              </td>
              <td className={clsx(th, "cursor-pointer")} onClick={() => toggleSort("score")}>
                <span className="inline-flex items-center text-ink">
                  Score
                  <SortArrows />
                </span>
              </td>
              <td className={th}>Avg. Score</td>
              <td className={th}>
                <span className="text-ink">Questions Used</span>
              </td>
              <td className={clsx(th, "w-16 rounded-tr-lg text-right")} />
            </tr>
            {rows.map(({ id, s, pct, counts }) => {
              const isOpen = open.has(id);
              return (
                <Fragment key={id}>
                  <tr
                    onClick={() =>
                      setOpen((o) => {
                        const n = new Set(o);
                        if (n.has(id)) n.delete(id);
                        else n.add(id);
                        return n;
                      })
                    }
                    className="group cursor-pointer border-b border-line bg-white shadow-[inset_3px_0_0_0_var(--color-line)] transition-colors hover:bg-primary-light"
                  >
                    <td className="px-4 py-3">
                      {isOpen ? (
                        <svg viewBox="0 0 48 48" className="size-4 text-primary" fill="currentColor">
                          <path d="M6 23.5c0-.83.67-1.5 1.5-1.5h33a1.5 1.5 0 0 1 0 3h-33A1.5 1.5 0 0 1 6 23.5Z" />
                        </svg>
                      ) : (
                        <Icon name="plus" size={16} className="text-primary" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <SubjectIcon id={id} size={20} />
                        <p className="truncate text-base leading-4 transition-colors group-hover:text-primary">{subjectName(s.id)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreCell pct={pct} avg={s.avgScore} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-base leading-4 text-muted">{s.avgScore} %</p>
                    </td>
                    <td className="px-4 py-3">
                      <UsageCell total={s.perfTotal} {...counts} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <CreateButton subject={id} />
                    </td>
                  </tr>
                  {isOpen &&
                    s.perfSystems.map((sys) => {
                      const v = progress.bySystem.get(`${id}::${sys.key}`);
                      const sp = v?.max ? Math.round((v.earned / v.max) * 100) : 0;
                      return (
                        <tr key={sys.key} className="border-b border-line bg-background shadow-[inset_3px_0_0_0_var(--color-line)]">
                          <td className="px-4 py-3" />
                          <td className="px-4 py-3 text-muted">
                            <div className="ml-7 flex items-center gap-2 text-ink">
                              <p className="truncate text-base leading-4">{sys.name}</p>
                              {sp < sys.avg && <Warning />}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <ScoreCell pct={sp} avg={sys.avg} />
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-base leading-4 text-muted">{sys.avg} %</p>
                          </td>
                          <td className="px-4 py-3">
                            <UsageCell used={v?.used ?? 0} total={sys.total} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <CreateButton subject={id} system={sys.key} />
                          </td>
                        </tr>
                      );
                    })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    ),
  };
}

/* ------------------------------------------------------------------ */
/* Time Management                                                     */
/* ------------------------------------------------------------------ */

export function TimeManagementTable({ subjects, perQuestion }: { subjects: SubjectId[]; perQuestion?: Partial<Record<SubjectId, number>> }) {
  const progress = useProgress();
  const all = useSubjects(true);
  return (
    <div className="overflow-auto">
      <table className="w-full min-w-[640px] overflow-hidden rounded-lg bg-white text-ink">
        <tbody>
          <tr className="border-b border-line bg-background">
            <td className="w-12 rounded-tl-lg py-4 pr-4 pl-6" />
            <td className="p-4 text-base leading-4 font-semibold">Subject</td>
            <td className="p-4 text-base leading-4 font-semibold">
              <span className="inline-flex items-center">
                Time Per Question
                <SortArrows />
              </span>
            </td>
            <td className="p-4 text-base leading-4 font-semibold text-muted">Avg. Time</td>
            <td className="w-12 rounded-tr-lg p-4" />
          </tr>
          {subjects.map((id) => {
            const s = subjectView(all, id);
            const stat = progress.bySubject.get(id);
            const per = perQuestion ? perQuestion[id] : stat?.answered ? stat.time / stat.answered : undefined;
            const slow = per != null && per > s.avgTimeSec;
            return (
              <tr key={id} className="border-b border-line bg-white last:border-0">
                <td className="py-4 pr-4 pl-6" />
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <SubjectIcon id={id} size={20} />
                    <p className="truncate text-base leading-4">{subjectName(s.id)}</p>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex w-[200px] items-center">
                    <span className="w-[50px] text-base leading-4">{per == null ? "--" : formatDuration(per)}</span>
                    {per != null && (
                      <span
                        className={clsx("ml-2 h-2 rounded-sm", slow ? "bg-error" : "bg-success")}
                        style={{ width: Math.max(4, Math.min(100, (per / s.avgTimeSec) * 12)) }}
                      />
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-base leading-4 text-muted">{formatDuration(s.avgTimeSec)}</span>
                </td>
                <td className="p-4" />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section wrappers                                                    */
/* ------------------------------------------------------------------ */

export function SectionHeading({ title, description, action }: { title: string; description: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex justify-between gap-4">
      <div>
        <h2 className="text-2xl leading-[30px] font-bold text-ink">{title}</h2>
        <p className="mt-1 text-base leading-6 text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function ExpandAllToggle({ allOpen, onClick }: { allOpen: boolean; onClick: () => void }) {
  return (
    <p onClick={onClick} className="flex shrink-0 cursor-pointer items-center justify-center gap-1 text-base leading-6 font-semibold text-primary hover:text-primary-hover">
      {allOpen ? (
        <svg viewBox="0 0 48 48" className="size-4" fill="currentColor">
          <path d="M6 23.5c0-.83.67-1.5 1.5-1.5h33a1.5 1.5 0 0 1 0 3h-33A1.5 1.5 0 0 1 6 23.5Z" />
        </svg>
      ) : (
        <Icon name="plus" size={16} />
      )}
      {allOpen ? "Collapse All" : "Expand All"}
    </p>
  );
}

export const WarningInline = () => (
  <span className="mx-1 inline-flex size-3 items-center justify-center align-middle">
    <Icon name="warning" size={18} />
  </span>
);

/** Subject tab "Performance": description, systems table (expanded), time, FAQs. */
export function SubjectPerformance({ subjects }: { subjects: SubjectId[] }) {
  const { table, toggleAll, allOpen } = useSubjectPerformanceTable({ subjects, defaultExpanded: true });
  return (
    <>
      <p className="mb-6 text-lg leading-[27px] text-muted">Performance tracks every question attempt for case studies, standalone questions, and readiness exams.</p>
      <SectionHeading
        title="Subject Performance"
        description={
          <>
            Topics marked with a red
            <WarningInline />
            should receive additional attention.
          </>
        }
        action={<ExpandAllToggle allOpen={allOpen} onClick={toggleAll} />}
      />
      <div className="mb-8">{table}</div>
      <SectionHeading title="Time Management" description="Green means you're faster than average! Red shows where you can improve your pace." />
      <div className="mb-8">
        <TimeManagementTable subjects={subjects} />
      </div>
      <PlacedFaqs placement="performance" />
    </>
  );
}
