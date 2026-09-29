"use client";

import clsx from "clsx";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, ChevronRight, Clock, ListChecks, Settings2 } from "lucide-react";
import { SUBJECTS, subjectById } from "@/data/catalog";
import { itemById } from "@/lib/bank";
import { avgPoints, formatDuration, scoreItem, scoreSession } from "@/lib/scoring";
import { useStore } from "@/lib/store";
import { formatLong } from "@/lib/schedule";
import type { TestSession } from "@/lib/types";
import { Avatar, ButtonLink, Card, FaqList, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { Gauge } from "@/components/ui/visuals";
import { SubjectPerformanceTable, TimeTable, type SubjectStat } from "@/components/performance/Tables";

const FAQS = [
  ["How can I improve my score?", "Review every explanation, including the ones you got right, then tag each question as Learning, Reviewing, or Mastered. Build your next tests from the Learning and Reviewing pools."],
  ["How are partial credit questions scored?", "Next Gen items use 0/1, +/-, or rationale scoring. You earn points for each correct part, and +/- items subtract points for incorrect selections."],
] as const;

function Report() {
  const id = useSearchParams().get("id");
  const hydrated = useStore((s) => s.hydrated);
  const session = useStore((s) => s.sessions.find((x) => x.id === id));
  if (!hydrated) return null;
  if (!session)
    return (
      <>
        <PageHeader trail={[{ label: "Previous Tests", href: "/nclex/previous-tests" }]} title="Test not found" />
        <p className="text-white/80">This test is not saved on this device.</p>
      </>
    );
  return <ScoreReport session={session} />;
}

function ScoreReport({ session }: { session: TestSession }) {
  const sc = scoreSession(session);
  const data = buildStats(session);
  const avgPct = sc.max ? Math.round((data.avgEarned / sc.max) * 100) : 0;
  const perQ = session.entries.length ? sc.time / session.entries.length : 0;
  const avgPerQ = data.avgTime / Math.max(1, session.entries.length);
  const message =
    sc.percent >= avgPct
      ? "Great work! You scored above the average. Keep reviewing the explanations to lock in these concepts."
      : "Keep your head up! Review these solutions carefully and learn from your mistakes. I'm confident you'll bring this score up with hard work and practice.";

  return (
    <>
      <PageHeader trail={[{ label: "Previous Tests", href: "/nclex/previous-tests" }, { label: session.title }]} title={session.title} />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-ink-strong">Score Report</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-ink">
              <Chip icon={CalendarDays}>{formatLong(new Date(session.createdAt))}</Chip>
              <Chip icon={Clock}>{session.timed ? "Timed" : "Untimed"}</Chip>
              <Chip icon={Settings2}>{session.tutor ? "Tutored" : "Untutored"}</Chip>
              <Chip icon={ListChecks}>{session.entries.length} Questions</Chip>
            </div>
          </div>
          <ButtonLink href={`/nclex/custom-test?id=${session.id}&review=1`}>
            Start Review <ChevronRight className="size-4" />
          </ButtonLink>
        </div>

        <div className="grid items-center gap-8 px-6 py-8 md:grid-cols-2">
          <Gauge value={sc.percent} label={`Average: ${avgPct}%`} caption="Your Score" size={250} />
          <div className="overflow-hidden rounded-lg border border-line">
            <table className="w-full text-left text-base">
              <thead>
                <tr className="border-b border-line bg-[#fafafb]">
                  <th className="px-5 py-3" />
                  <th className="py-3 font-semibold text-ink-strong">You</th>
                  <th className="py-3 font-semibold text-muted">Average</th>
                </tr>
              </thead>
              <tbody className="[&_td]:py-3.5 [&_tr]:border-b [&_tr]:border-line [&_tr:last-child]:border-0">
                <tr>
                  <td className="px-5">Score</td>
                  <td>{sc.percent}%</td>
                  <td className="text-muted">{avgPct}%</td>
                </tr>
                <tr>
                  <td className="px-5">Correct / Total Pts</td>
                  <td>
                    {sc.earned} / {sc.max}
                  </td>
                  <td className="text-muted">
                    {round1(data.avgEarned)} / {sc.max}
                  </td>
                </tr>
                <tr>
                  <td className="px-5">Time Per Question</td>
                  <td>{formatDuration(perQ)}</td>
                  <td className="text-muted">{formatDuration(avgPerQ)}</td>
                </tr>
                <tr>
                  <td className="px-5">Total Time</td>
                  <td>{formatDuration(sc.time)}</td>
                  <td className="text-muted">{formatDuration(data.avgTime)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-start gap-3 px-6 pb-6">
          <Avatar initials="EW" color="#8b6f5c" size={40} />
          <p className="flex-1 rounded-lg bg-brand-tint px-5 py-3.5 text-base leading-6 text-ink">{message}</p>
        </div>
      </Card>

      <SectionTitle>Subject Breakdown</SectionTitle>
      <p className="-mt-3 mb-4 text-white/70">Increase your score by focusing on subjects marked with a red ⚠ - that&apos;s where you can improve the most!</p>
      <SubjectPerformanceTable stats={data.subjects} showUsage={false} startTest={false} />

      <SectionTitle>Time Management</SectionTitle>
      <p className="-mt-3 mb-4 text-white/70">Green means you&apos;re faster than average! Red shows where you can improve your pace.</p>
      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <Card className="flex flex-col items-center justify-center px-6 py-8 text-center">
          <span className={clsx("h-5 w-10 rounded-sm", perQ <= avgPerQ ? "bg-grad-good" : "bg-grad-bad")} />
          <div className="mt-4 text-lg font-semibold text-brand">Your Time Per Question</div>
          <div className="text-5xl font-bold text-brand">{formatDuration(perQ)}</div>
          <div className="mt-1 text-base text-muted">Average: {formatDuration(avgPerQ)}</div>
        </Card>
        <TimeTable stats={data.subjects} />
      </div>

      <SectionTitle>Question Breakdown</SectionTitle>
      <p className="-mt-3 mb-4 text-white/70">Click any question to jump directly to it.</p>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-base">
          <thead>
            <tr className="border-b border-line font-semibold text-ink-strong">
              <th className="w-14" />
              <th className="py-4">Question</th>
              <th>Subject</th>
              <th>System</th>
              <th>Correct / Total Pts</th>
              <th>Time</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {session.entries.map((e, i) => {
              const item = itemById(e.itemId);
              const s = scoreItem(item, session.submitted[e.itemId] ? session.answers[e.itemId] : undefined);
              const state = s.earned === s.max ? "full" : s.earned > 0 ? "partial" : "none";
              return (
                <tr key={e.itemId} className="border-b border-line text-muted last:border-0 hover:bg-[#fafafb]">
                  <td className="pl-6">
                    <span
                      className={clsx(
                        "block size-4 rounded-full border-2",
                        state === "full" && "border-good bg-good-light",
                        state === "partial" && "border-warn bg-[linear-gradient(180deg,#f9d95b_50%,transparent_50%)]",
                        state === "none" && "border-bad-light",
                      )}
                    />
                  </td>
                  <td className="py-3 text-ink">
                    <Link href={`/nclex/custom-test?id=${session.id}&review=1`} onClick={() => useStore.getState().goTo(session.id, i)} className="hover:text-brand">
                      {i + 1}
                    </Link>
                  </td>
                  <td>{subjectById(item.subject).name}</td>
                  <td>{item.system}</td>
                  <td className="text-ink">
                    {s.earned} / {s.max}
                  </td>
                  <td className="text-ink">{formatDuration(session.timeSpent[e.itemId] ?? 0)}</td>
                  <td>
                    <ChevronRight className="size-4 text-faint" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <FaqList items={FAQS} />
    </>
  );
}

function buildStats(session: TestSession) {
  let avgEarned = 0;
  let avgTime = 0;
  const bySubject = new Map<string, SubjectStat>();
  for (const e of session.entries) {
    const item = itemById(e.itemId);
    const subject = subjectById(item.subject);
    const s = scoreItem(item, session.submitted[e.itemId] ? session.answers[e.itemId] : undefined);
    const avg = avgPoints(item);
    avgEarned += avg;
    avgTime += subject.avgTimeSec;
    const row =
      bySubject.get(item.subject) ??
      ({ id: item.subject, earned: 0, max: 0, used: 0, total: 0, avgScore: 0, time: 0, answered: 0, systems: [] } as SubjectStat & { avgEarned?: number });
    row.earned += s.earned;
    row.max += s.max;
    row.time += session.timeSpent[e.itemId] ?? 0;
    row.answered += 1;
    let sys = row.systems.find((x) => x.name === item.system);
    if (!sys) {
      sys = { name: item.system, earned: 0, max: 0, avgScore: 0 };
      row.systems.push(sys);
    }
    sys.earned += s.earned;
    sys.max += s.max;
    sys.avgScore = Math.round(((sys.avgScore / 100) * (sys.max - s.max) + avg) / sys.max * 100);
    row.avgScore = Math.round(((row.avgScore / 100) * (row.max - s.max) + avg) / row.max * 100);
    bySubject.set(item.subject, row);
  }
  const subjects = SUBJECTS.map((s) => bySubject.get(s.id)).filter(Boolean) as SubjectStat[];
  return { avgEarned, avgTime, subjects };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function Chip({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1">
      <Icon className="size-3.5" />
      {children}
    </span>
  );
}

export default function ReviewPage() {
  return (
    <Suspense>
      <Report />
    </Suspense>
  );
}

