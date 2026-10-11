"use client";

import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { CoachPhoto } from "@/components/ui/CoachPhoto";
import { useConfig, useCopy, useReadinessExams, useSubjects } from "@/lib/content";
import { BRAND } from "@/lib/brand";
import { useProgress } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { scoreSession } from "@/lib/scoring";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/primitives";
import { Gauge, TargetPill } from "@/components/ui/visuals";
import {
  ExpandAllToggle,
  SectionHeading,
  TimeManagementTable,
  WarningInline,
  useSubjectPerformanceTable,
} from "@/components/performance/SubjectPerformance";
import { PlacedFaqs } from "@/components/ui/PlacedFaqs";


/** Readiness score band. Thresholds: Admin > Targets & Scoring. */
export function readinessStatus(percent: number, bands: { high: number; borderline: number }) {
  if (percent >= bands.high) return { label: "High", cls: "bg-success/10 text-success" };
  if (percent >= bands.borderline) return { label: "Borderline", cls: "bg-warning/15 text-ink" };
  return { label: "Low", cls: "bg-error/10 text-error" };
}

export default function PerformancePage() {
  const { targets: TARGETS, readinessBands, totals } = useConfig();
  const copy = useCopy();
  const exams = useReadinessExams();
  const subjectIds = useSubjects().map((s) => s.id);
  const progress = useProgress();
  const sessions = useStore((s) => s.sessions);
  const totalQuestions = totals.performanceQuestions;
  const usedCount = progress.used.size;
  const scorePct = progress.max ? Math.round((progress.earned / progress.max) * 100) : 0;
  const usagePct = Math.round((usedCount / totalQuestions) * 100);

  const readiness = exams.map((e) => {
    const attempt = sessions.filter((s) => s.kind === "readiness" && s.sourceId === e.id).at(-1);
    return { ...e, attempt, score: attempt ? scoreSession(attempt) : null };
  });
  const rEarned = readiness.reduce((a, r) => a + (r.score?.earned ?? 0), 0);
  const rMax = readiness.reduce((a, r) => a + (r.score?.max ?? 0), 0);
  const rUsed = readiness.reduce((a, r) => a + (r.attempt ? Object.keys(r.attempt.submitted).length : 0), 0);

  const scoreMet = progress.max > 0 && scorePct >= TARGETS.score;
  const usageMet = usagePct >= TARGETS.usage;
  const readinessMet = readiness.every((r) => r.attempt);
  const met = [scoreMet, usageMet, readinessMet].filter(Boolean).length;

  const { table, toggleAll, allOpen } = useSubjectPerformanceTable({ subjects: subjectIds });

  return (
    <>
      <PageHeader
        trail={[{ label: "Performance" }]}
        title={copy("performance.title")}
        description={copy("performance.description")}
      />

      <section className="mb-8">
        <h2 className="text-2xl leading-[30px] font-bold text-ink">Pass Targets</h2>
        <div className="relative mt-4 mb-4 pl-8">
          <CoachPhoto className="absolute top-1/2 left-0 size-[42px] -translate-y-1/2 rounded-full border-2 border-white object-cover shadow-[0_0_0_1px_var(--color-line)]" />
          <p className="rounded-lg border border-line bg-primary-light py-3 pr-6 pl-6 text-base leading-6 text-ink sm:pl-6">
            <span className="block pl-4 sm:pl-2">
              {copy("performance.banner")} <strong className="font-bold">You&apos;ve met {met} of 3 targets.</strong>{" "}
              {met === 3 ? "You're ready to pass!" : met ? "Keep going!" : "Just getting started!"}
            </span>
          </p>
        </div>

        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          <TargetCard
            title="Your Score"
            gauge={<Gauge value={scorePct} target={TARGETS.score} label="Correct" color={BRAND.primary} met={scoreMet} />}
            bar={{ value: scorePct, target: TARGETS.score, color: BRAND.primary }}
            pill={<TargetPill color={BRAND.primary} met={scoreMet}>Target: {TARGETS.score}%</TargetPill>}
            rows={[["Correct / Total Pts", `${round1(progress.earned)} / ${progress.max}`, false]]}
          />
          <TargetCard
            title="Question Usage"
            gauge={<Gauge value={usagePct} target={TARGETS.usage} label="Used" color={BRAND.info} met={usageMet} height={184} />}
            bar={{ value: usagePct, target: TARGETS.usage, color: BRAND.info }}
            pill={<TargetPill color={BRAND.info} met={usageMet}>Target: {TARGETS.usage}%</TargetPill>}
            rows={[
              ["Used Questions", usedCount, true],
              ["Unused Questions", totalQuestions - usedCount, true],
              ["Total Questions", totalQuestions, true],
            ]}
          />
          <TargetCard
            title="Readiness Exam Usage"
            gauge={
              <div className="flex w-full flex-col">
                {readiness.map((r) => {
                  const st = r.attempt && r.score ? readinessStatus(r.score.percent, readinessBands) : null;
                  return (
                    <div key={r.id} className="flex h-[42px] items-center justify-between">
                      <p className="text-base leading-4 text-ink">Exam {r.number}</p>
                      <p className={clsx("rounded-full px-2 py-1 text-base leading-4", st ? st.cls : "bg-background text-muted")}>{st ? st.label : "Not Attempted"}</p>
                    </div>
                  );
                })}
              </div>
            }
            pill={<TargetPill color={BRAND.gold} met={readinessMet}>Target: Attempt All {readiness.length}</TargetPill>}
            rows={[
              ["Used Exam Questions", rUsed, false],
              ["Unused Exam Questions", totals.readiness - rUsed, false],
              ["Correct / Total Pts", `${rEarned} / ${rMax}`, false],
            ]}
          />
        </div>
      </section>

      <SectionHeading
        title="Subject Performance"
        description={
          <>
            Increase your score in each subject by focusing on systems marked with a red
            <WarningInline />- that&apos;s where you can improve the most!
          </>
        }
        action={<ExpandAllToggle allOpen={allOpen} onClick={toggleAll} />}
      />
      <div className="mb-8">{table}</div>

      <SectionHeading title="Time Management" description="Green means you're faster than average! Red shows where you can improve your pace." />
      <div className="mb-8">
        <TimeManagementTable subjects={subjectIds} />
      </div>

      <PlacedFaqs placement="performance" />
    </>
  );
}

/** White target card. On phones it collapses to a header row with a linear bar, like the live app. */
function TargetCard({
  title,
  gauge,
  bar,
  pill,
  rows,
}: {
  title: string;
  gauge: ReactNode;
  bar?: { value: number; target: number; color: string };
  pill: ReactNode;
  rows: [string, string | number, boolean][];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col rounded-lg bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <p
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center justify-between border-b border-line pb-4 text-lg leading-[18px] font-semibold text-ink lg:cursor-default"
      >
        {title}
        <span className="lg:hidden">
          {open ? (
            <svg viewBox="0 0 48 48" className="size-5 text-muted" fill="currentColor">
              <path d="M6 23.5c0-.83.67-1.5 1.5-1.5h33a1.5 1.5 0 0 1 0 3h-33A1.5 1.5 0 0 1 6 23.5Z" />
            </svg>
          ) : (
            <Icon name="plus" size={20} className="text-muted" />
          )}
        </span>
      </p>

      {/* Phone: linear bar summary */}
      {bar && (
        <div className="pt-4 lg:hidden">
          <p className="text-2xl leading-8 font-bold" style={{ color: bar.color }}>
            {bar.value}%
          </p>
          <div className="relative mt-2 h-2.5 rounded-full bg-primary-light">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, bar.value)}%`, background: bar.color }} />
            <div className="absolute -top-1.5 h-[22px] w-px bg-faint" style={{ left: `${bar.target}%` }} />
          </div>
        </div>
      )}

      <div className={clsx("flex-col pt-4 lg:flex", bar ? "hidden" : "flex")}>
        <div className="flex min-h-[194px] items-center justify-center">{gauge}</div>
      </div>
      <div className={clsx("flex-col lg:flex", open || !bar ? "flex" : "hidden lg:flex")}>
        <div className="my-4 flex justify-center">{pill}</div>
        {rows.map(([k, v, pillValue]) => (
          <div key={k}>
            <div className="h-px bg-line" />
            <div className="flex h-[42px] items-center justify-between">
              <p className="text-base leading-4 text-ink">{k}</p>
              <p className={clsx("text-base leading-4", pillValue ? "rounded-full bg-background p-1 text-muted" : "text-ink")}>{v}</p>
            </div>
          </div>
        ))}
      </div>
      {bar && !open && <div className="mt-4 flex justify-center lg:hidden">{pill}</div>}
    </div>
  );
}

const round1 = (n: number) => Math.round(n * 10) / 10;
