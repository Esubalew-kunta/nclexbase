"use client";

import { PERFORMANCE_FAQS, READINESS_EXAMS, SUBJECTS, TOTALS } from "@/data/catalog";
import { useProgress } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { Avatar, Card, FaqList, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { Gauge, TargetPill } from "@/components/ui/visuals";
import { SubjectPerformanceTable, TimeTable, type SubjectStat } from "@/components/performance/Tables";

/** Questions per subject including readiness items, as listed on the live Performance page. */
const PERF_TOTALS: Record<string, number> = {
  "adult-health": 629,
  "child-health": 256,
  fundamentals: 220,
  "maternal-and-newborn-health": 266,
  "mental-health": 170,
  pharmacology: 225,
  "management-of-care": 188,
};

const TARGETS = { score: 62, usage: 85 };

export default function PerformancePage() {
  const progress = useProgress();
  const sessions = useStore((s) => s.sessions);
  const totalQuestions = TOTALS.cases + TOTALS.standalone;
  const usedCount = progress.used.size;
  const scorePct = progress.max ? Math.round((progress.earned / progress.max) * 100) : 0;
  const usagePct = Math.round((usedCount / totalQuestions) * 100);

  const readiness = READINESS_EXAMS.map((e) => {
    const attempts = sessions.filter((s) => s.kind === "readiness" && s.title === e.title);
    const done = attempts.some((a) => a.status === "ended");
    return { ...e, status: done ? "Completed" : attempts.length ? "In Progress" : "Not Attempted" };
  });
  const met = [scorePct >= TARGETS.score && progress.max > 0, usagePct >= TARGETS.usage, readiness.every((r) => r.status === "Completed")].filter(Boolean).length;

  const stats: SubjectStat[] = SUBJECTS.map((s) => {
    const row = progress.bySubject.get(s.id);
    return {
      id: s.id,
      earned: row?.earned ?? 0,
      max: row?.max ?? 0,
      used: row?.used ?? 0,
      total: PERF_TOTALS[s.id],
      avgScore: s.avgScore,
      time: row?.time ?? 0,
      answered: row?.answered ?? 0,
      systems: s.systems.map((sys) => {
        const v = progress.bySystem.get(`${s.id}::${sys.name}`);
        return { name: sys.name, earned: v?.earned ?? 0, max: v?.max ?? 0, avgScore: s.avgScore };
      }),
    };
  });

  return (
    <>
      <PageHeader
        trail={[{ label: "Performance" }]}
        title="Performance"
        description="Performance tracks every question attempt for case studies, standalone questions, and readiness exams."
      />

      <SectionTitle>Pass Targets</SectionTitle>
      <div className="mb-3 flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2">
        <Avatar initials="EW" color="#8b6f5c" size={34} />
        <p className="text-[15px] text-white">
          99% of NCLEX Bootcamp students who meet all targets pass the NCLEX.{" "}
          <b>You&apos;ve met {met} of 3 targets.</b> {met === 3 ? "You're ready!" : met ? "Keep going!" : "Just getting started!"}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <TargetCard title="Your Score" footer={[["Correct / Total Pts", `${round1(progress.earned)} / ${progress.max}`]]}>
          <Gauge value={scorePct} target={TARGETS.score} label="Correct" size={230} />
          <TargetPill>Target: {TARGETS.score}%</TargetPill>
        </TargetCard>
        <TargetCard
          title="Question Usage"
          footer={[
            ["Used Questions", usedCount],
            ["Unused Questions", totalQuestions - usedCount],
            ["Total Questions", totalQuestions],
          ]}
        >
          <Gauge value={usagePct} target={TARGETS.usage} label="Used" size={230} />
          <TargetPill>Target: {TARGETS.usage}%</TargetPill>
        </TargetCard>
        <TargetCard
          title="Readiness Exam Usage"
          footer={[
            ["Used Exam Questions", 0],
            ["Unused Exam Questions", TOTALS.readiness],
            ["Correct / Total Pts", "0 / 0"],
          ]}
        >
          <ul className="w-full space-y-4 py-2 text-base">
            {readiness.map((r) => (
              <li key={r.id} className="flex justify-between">
                <span className="text-ink">Exam {r.number}</span>
                <span className={r.status === "Completed" ? "text-good" : "text-muted"}>{r.status}</span>
              </li>
            ))}
          </ul>
          <TargetPill>Target: Attempt All 4</TargetPill>
        </TargetCard>
      </div>

      <SectionTitle>Subject Performance</SectionTitle>
      <p className="-mt-3 mb-2 text-white/70">Increase your score in each subject by focusing on systems marked with a red ⚠ - that&apos;s where you can improve the most!</p>
      <SubjectPerformanceTable stats={stats} />

      <SectionTitle>Time Management</SectionTitle>
      <p className="-mt-3 mb-4 text-white/70">Green means you&apos;re faster than average! Red shows where you can improve your pace.</p>
      <TimeTable stats={stats} />

      <FaqList items={PERFORMANCE_FAQS} />
    </>
  );
}

function TargetCard({ title, children, footer }: { title: string; children: React.ReactNode; footer: [string, string | number][] }) {
  return (
    <Card className="flex flex-col px-4 pt-4 pb-2">
      <h3 className="border-b border-line pb-3 text-lg font-semibold text-ink-strong">{title}</h3>
      <div className="flex min-h-[250px] flex-col items-center justify-center gap-2 border-b border-line py-4">{children}</div>
      <dl className="divide-y divide-line">
        {footer.map(([k, v]) => (
          <div key={k} className="flex justify-between py-2.5 text-base">
            <dt className="text-ink">{k}</dt>
            <dd className="text-muted">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

const round1 = (n: number) => Math.round(n * 10) / 10;
