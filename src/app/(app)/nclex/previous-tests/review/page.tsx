"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useState } from "react";
import { getAll, subjectName, useCopy } from "@/lib/content";
import { getStats } from "@/lib/stats";
import { CoachPhoto } from "@/components/ui/CoachPhoto";
import { subjectHref } from "@/lib/routes";
import { caseForItem, itemById } from "@/lib/bank";
import { avgPoints, chanceOfPassing, formatDuration, scoreItem, scoreSession } from "@/lib/scoring";
import { useStore } from "@/lib/store";
import { formatFull } from "@/lib/schedule";
import { BRAND } from "@/lib/brand";
import type { SubjectId, TestSession } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Button, PageHeader } from "@/components/ui/primitives";
import { SubjectIcon } from "@/components/ui/visuals";
import { ExpandAllToggle, ScoreCell, SectionHeading, SortArrows, TimeManagementTable, WarningInline } from "@/components/performance/SubjectPerformance";
import { PlacedFaqs } from "@/components/ui/PlacedFaqs";


function Report() {
  const id = useSearchParams().get("id");
  const hydrated = useStore((s) => s.hydrated);
  const session = useStore((s) => s.sessions.find((x) => x.id === id));
  if (!hydrated) return null;
  if (!session)
    return (
      <>
        <PageHeader trail={[{ label: "Previous Tests", href: "/nclex/previous-tests" }, { label: "Not found" }]} title="Test not found" />
        <p className="text-muted">This test is not saved in this browser.</p>
      </>
    );
  return <ScoreReport session={session} />;
}

/** 270° ring like the live canvas gauge: pale track, teal value arc, average tick. */
function RingGauge({ value, avg }: { value: number; avg: number }) {
  const r = 112;
  const cx = 133;
  const cy = 128;
  const start = 135;
  const sweep = 270;
  const polar = (deg: number, rad = r) => [cx + rad * Math.cos((deg * Math.PI) / 180), cy + rad * Math.sin((deg * Math.PI) / 180)];
  const arc = (from: number, to: number) => {
    const [x1, y1] = polar(from);
    const [x2, y2] = polar(to);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };
  const v = Math.max(0, Math.min(100, value));
  const t = start + (sweep * avg) / 100;
  const [a1, b1] = polar(t, r - 14);
  const [a2, b2] = polar(t, r + 14);
  return (
    <svg width="266" height="242" viewBox="0 0 266 242" aria-hidden>
      <defs>
        <linearGradient id="ring" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={BRAND.info} />
          <stop offset="1" stopColor={BRAND.primary} />
        </linearGradient>
      </defs>
      <path d={arc(start, start + sweep)} stroke={BRAND.primaryLight} strokeWidth="22" fill="none" strokeLinecap="round" />
      {v > 0 && <path d={arc(start, start + (sweep * v) / 100)} stroke="url(#ring)" strokeWidth="22" fill="none" strokeLinecap="round" />}
      <line x1={a1} y1={b1} x2={a2} y2={b2} stroke={BRAND.gold} strokeWidth="3" />
    </svg>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-center justify-center gap-1 rounded-lg border border-line px-2 py-1 text-sm leading-[14px] text-ink">
      {icon}
      {children}
    </p>
  );
}

const chipIcon = {
  date: <svg viewBox="0 0 48 48" className="size-3.5" fill="currentColor"><path d="M6 12.25C6 8.8 8.8 6 12.25 6h23.5C39.2 6 42 8.8 42 12.25v23.5C42 39.2 39.2 42 35.75 42h-23.5A6.25 6.25 0 0 1 6 35.75v-23.5ZM9 17v18.75C9 37.55 10.46 39 12.25 39h23.5c1.8 0 3.25-1.46 3.25-3.25V17H9Zm7 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm8 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm8 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" /></svg>,
  clock: <svg viewBox="0 0 48 48" className="size-3.5" fill="currentColor"><path d="M24 5a19 19 0 1 1 0 38 19 19 0 0 1 0-38Zm-1.25 7c-.83 0-1.5.67-1.5 1.5V26c0 .83.67 1.5 1.5 1.5h8.5a1.5 1.5 0 0 0 0-3h-7v-11c0-.83-.67-1.5-1.5-1.5Z" /></svg>,
  tutor: <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor"><path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3Zm-6.82 9.72v4L12 20.5l6.82-3.78v-4L12 16.5l-6.82-3.78Z" /></svg>,
  list: <Icon name="bites" size={14} />,
};

/** Ability estimate over the exam: running score on a logit scale with a shrinking confidence band. */
function AbilityChart({ session }: { session: TestSession }) {
  const W = 1000;
  const H = 300;
  const L = 60;
  const B = 50;
  const maxQ = 150;
  const x = (q: number) => L + ((W - L - 20) * q) / maxQ;
  const y = (z: number) => 20 + ((H - 20 - B) * (3 - Math.max(-3, Math.min(3, z)))) / 6;
  let earned = 0;
  let max = 0;
  const pts: { q: number; z: number; ci: number }[] = [];
  session.entries.forEach((e, i) => {
    const sc = scoreItem(itemById(e.itemId), session.answers[e.itemId]);
    earned += sc.earned;
    max += sc.max;
    if (i + 1 >= 10) {
      const p = Math.min(0.95, Math.max(0.05, earned / Math.max(1, max)));
      pts.push({ q: i + 1, z: Math.log(p / (1 - p)), ci: 2.2 / Math.sqrt((i + 1) / 10) });
    }
  });
  const passZ = Math.log(0.6 / 0.4);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(p.q)} ${y(p.z)}`).join(" ");
  const band = [...pts.map((p) => `${x(p.q)} ${y(p.z + p.ci)}`), ...[...pts].reverse().map((p) => `${x(p.q)} ${y(p.z - p.ci)}`)].join(" L");
  const last = pts[pts.length - 1];
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Ability estimate by question number">
        <rect x={x(0)} y={20} width={x(10) - x(0)} height={H - 20 - B} fill={BRAND.primaryLight} />
        {pts.length > 0 && <path d={`M${band} Z`} fill={BRAND.primaryLight} />}
        <line x1={L} x2={W - 20} y1={y(passZ)} y2={y(passZ)} stroke={BRAND.success} strokeDasharray="5 4" strokeWidth={2} />
        {pts.length > 0 && <path d={line} fill="none" stroke={BRAND.primary} strokeWidth={2.5} />}
        {last && <circle cx={x(last.q)} cy={y(last.z)} r={6} fill={BRAND.primary} />}
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150].map((q) => (
          <text key={q} x={x(q)} y={H - B + 22} textAnchor="middle" fontSize={16} fill={BRAND.muted}>
            {q}
          </text>
        ))}
        <text x={W / 2} y={H - 8} textAnchor="middle" fontSize={17} fontWeight={700} fill={BRAND.muted}>
          Question #
        </text>
        <text transform={`translate(18 ${(H - B) / 2}) rotate(-90)`} textAnchor="middle" fontSize={17} fontWeight={700} fill={BRAND.muted}>
          Ability Estimate
        </text>
      </svg>
      <div className="flex flex-wrap justify-center gap-5 text-sm text-ink">
        <span className="flex items-center gap-1.5"><i className="size-3 rounded-sm bg-primary" />Ability Estimate</span>
        <span className="flex items-center gap-1.5"><i className="size-3 rounded-sm border border-line bg-primary-light" />95% Confidence Interval</span>
        <span className="flex items-center gap-1.5"><i className="size-3 rounded-sm bg-success" />Passing Standard</span>
      </div>
    </div>
  );
}

function CatSummary({ session, percent, weakest }: { session: TestSession; percent: number; weakest: string[] }) {
  const chance = chanceOfPassing(percent);
  const tone = chance === "Low" ? "text-error" : chance === "Borderline" ? "text-warning" : "text-success";
  const n = session.entries.length;
  const message =
    chance === "Low" || chance === "Borderline" ? (
      <>
        Your exam ended at <b>{n}</b> questions because you were <b>{percent < 50 ? "below" : "close to"} the passing standard</b>. You would have a <b>{chance}</b> chance of passing if you took the NCLEX today. Keep practicing!
        <br />
        <br />
        We recommend reviewing <b>Cheat Sheets</b>, <b>Crash Course videos</b>, and questions from the <b>{weakest.join(" & ")}</b> sections, then taking the next <b>CAT Readiness exam</b> in 1-2 weeks.
      </>
    ) : (
      <>
        Your exam ended at <b>{n}</b> questions because you were <b>above the passing standard</b>. You would have a <b>{chance}</b> chance of passing if you took the NCLEX today. Great work!
        <br />
        <br />
        Keep your momentum going: review the explanations for anything you missed, then take the next <b>CAT Readiness exam</b> to confirm the pattern.
      </>
    );
  return (
    <div className="flex flex-col px-6 pt-4 pb-6">
      <h3 className="mb-4 text-2xl leading-[30px] font-bold text-ink">
        Chance of Passing: <span className={tone}>{chance}</span>
      </h3>
      <div className="relative mb-6">
        <CoachPhoto className="absolute top-6 left-0 z-[1] size-12 rounded-full object-cover" />
        <p className="ml-9 rounded-lg bg-primary-light py-4 pr-6 pl-12 text-base leading-6 text-ink">{message}</p>
      </div>
      <AbilityChart session={session} />
    </div>
  );
}

function ScoreReport({ session }: { session: TestSession }) {
  const router = useRouter();
  const goTo = useStore((s) => s.goTo);
  const sc = scoreSession(session);
  const stats = buildStats(session);
  const avgPct = sc.max ? Math.round((stats.avgEarned / sc.max) * 100) : 0;
  const perQ = session.entries.length ? sc.time / session.entries.length : 0;
  const avgPerQ = stats.avgTime / Math.max(1, session.entries.length);
  const [open, setOpen] = useState<Set<string>>(() => new Set(stats.subjects.map((s) => s.id)));
  const [openCases, setOpenCases] = useState<Set<string>>(() => new Set(stats.caseIds));
  const good = sc.percent >= avgPct;
  const copy = useCopy();
  const message = good ? copy("review.coachGood") : copy("review.coachBad");
  const review = (index = 0) => {
    goTo(session.id, index);
    router.push(`/nclex/custom-test?id=${session.id}&review=1`);
  };
  const allOpen = open.size === stats.subjects.length;
  const isCat = session.kind === "readiness";
  const weakest = [...stats.subjects].sort((a, b) => a.earned / Math.max(1, a.max) - b.earned / Math.max(1, b.max)).slice(0, 2).map((x) => subjectName(x.id));
  const faster = perQ <= avgPerQ;
  const diff = Math.min(1, Math.abs(perQ - avgPerQ) / Math.max(1, avgPerQ));

  return (
    <>
      <PageHeader trail={[{ label: "Previous Tests", href: "/nclex/previous-tests" }, { label: session.title }]} title={session.title} />

      <div className="mb-8 rounded-lg bg-white shadow-card">
        <div className="sticky top-0 z-[5] flex flex-wrap gap-4 rounded-t-lg border-b border-line bg-white px-6 py-4">
          <div className="flex flex-col">
            <h4 className="mb-2 text-lg leading-[22.5px] font-semibold text-ink">Score Report</h4>
            <div className="flex flex-wrap gap-2">
              <Chip icon={chipIcon.date}>{formatFull(new Date(session.createdAt))}</Chip>
              {isCat ? (
                <Chip icon={chipIcon.clock}>{formatDuration(sc.time)} Total Time</Chip>
              ) : (
                <>
                  <Chip icon={chipIcon.clock}>{session.timed ? "Timed" : "Untimed"}</Chip>
                  <Chip icon={chipIcon.tutor}>{session.tutor ? "Tutored" : "Untutored"}</Chip>
                </>
              )}
              <Chip icon={chipIcon.list}>{session.entries.length} Questions</Chip>
            </div>
          </div>
          <div className="ml-auto flex items-center justify-end gap-4">
            <Button onClick={() => review(0)}>
              <span className="mr-2">Start Review</span>
              <Icon name="chevronRight" size={18} />
            </Button>
          </div>
        </div>

        {isCat && <CatSummary session={session} percent={sc.percent} weakest={weakest} />}
        <div className={clsx("flex-col px-6 pt-4 pb-6", isCat ? "hidden" : "flex")}>
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="flex flex-1 items-center justify-center py-6">
              <div className="relative">
                <RingGauge value={sc.percent} avg={avgPct} />
                <div className="absolute top-1/2 left-1/2 w-[140px] -translate-x-1/2 -translate-y-[42%] text-center">
                  <p className="text-lg leading-[18px] font-bold text-primary">Your Score</p>
                  <div className="my-2 text-[64px] leading-[64px] font-bold tracking-[-1px] text-primary">{sc.percent}%</div>
                  <p className="text-lg leading-[18px] text-muted">Average: {avgPct} %</p>
                </div>
              </div>
            </div>
            <div className="flex flex-1 items-center">
              <div className="w-full overflow-auto rounded-lg border border-line">
                <table className="w-full text-ink">
                  <tbody>
                    <tr className="border-b border-line bg-background text-base leading-4 font-semibold">
                      <td className="w-1/2 px-6" />
                      <td className="p-4">You</td>
                      <td className="p-4 text-muted">Average</td>
                    </tr>
                    {[
                      ["Score", `${sc.percent}%`, `${avgPct}%`],
                      ["Correct / Total Pts", `${sc.earned} / ${sc.max}`, `${round1(stats.avgEarned)} / ${sc.max}`],
                      ["Time Per Question", formatDuration(perQ), formatDuration(avgPerQ)],
                      ["Total Time", formatDuration(sc.time), formatDuration(stats.avgTime)],
                    ].map(([k, you, avg], i, a) => (
                      <tr key={k} className={clsx("bg-white text-base leading-4", i < a.length - 1 && "border-b border-line")}>
                        <td className="h-12 px-6">{k}</td>
                        <td className="p-4">{you}</td>
                        <td className="p-4 text-muted">{avg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="relative mt-6">
            <CoachPhoto className="absolute top-1/2 left-0 size-12 -translate-y-1/2 rounded-full object-cover" />
            <p className="ml-9 rounded-lg bg-primary-light py-3 pr-6 pl-8 text-base leading-6 text-ink">{message}</p>
          </div>
        </div>
      </div>

      <SectionHeading
        title="Subject Breakdown"
        description={
          <>
            Increase your score by focusing on subjects marked with a red
            <WarningInline />- that&apos;s where you can improve the most!
          </>
        }
        action={<ExpandAllToggle allOpen={allOpen} onClick={() => setOpen(allOpen ? new Set() : new Set(stats.subjects.map((s) => s.id)))} />}
      />
      <div className="mb-6 overflow-auto rounded-lg bg-white shadow-card">
        <table className="w-full min-w-[720px] text-ink">
          <tbody>
            <tr className="border-b border-line bg-background text-base leading-4 font-semibold text-muted">
              <td className="w-14 py-4 pr-4 pl-6" />
              <td className="p-4 text-ink">Subject</td>
              <td className="p-4">
                <span className="inline-flex items-center text-ink">
                  Correct / Total Pts
                  <SortArrows />
                </span>
              </td>
              <td className="p-4">
                <span className="inline-flex items-center text-ink">
                  Score
                  <SortArrows />
                </span>
              </td>
              <td className="p-4">Avg. Score</td>
              <td className="w-14 p-4" />
            </tr>
            {stats.subjects.map((s) => {
              const isOpen = open.has(s.id);
              const pct = s.max ? Math.round((s.earned / s.max) * 100) : 0;
              return (
                <Fragment key={s.id}>
                  <tr
                    className="group cursor-pointer border-b border-line bg-white shadow-[inset_3px_0_0_0_var(--color-line)] hover:bg-primary-light"
                    onClick={() =>
                      setOpen((o) => {
                        const n = new Set(o);
                        if (n.has(s.id)) n.delete(s.id);
                        else n.add(s.id);
                        return n;
                      })
                    }
                  >
                    <td className="py-4 pr-4 pl-6">
                      {isOpen ? (
                        <svg viewBox="0 0 48 48" className="size-4 text-primary" fill="currentColor">
                          <path d="M6 23.5c0-.83.67-1.5 1.5-1.5h33a1.5 1.5 0 0 1 0 3h-33A1.5 1.5 0 0 1 6 23.5Z" />
                        </svg>
                      ) : (
                        <Icon name="plus" size={16} className="text-primary" />
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <SubjectIcon id={s.id} size={20} />
                        <p className="text-base leading-4 group-hover:text-primary">{subjectName(s.id)}</p>
                        {pct < s.avg && <WarningInline />}
                      </div>
                    </td>
                    <td className="p-4 text-base leading-4">
                      {round1(s.earned)} / {s.max}
                    </td>
                    <td className="p-4">
                      <ScoreCell pct={pct} avg={s.avg} />
                    </td>
                    <td className="p-4 text-base leading-4 text-muted">{s.avg}%</td>
                    <td className="p-4 text-right">
                      <Link
                        href={subjectHref(s.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="ml-auto flex size-8 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover"
                      >
                        <Icon name="chevronRight" size={16} />
                      </Link>
                    </td>
                  </tr>
                  {isOpen &&
                    s.systems.map((sys) => {
                      const sp = sys.max ? Math.round((sys.earned / sys.max) * 100) : 0;
                      return (
                        <tr key={sys.name} className="border-b border-line bg-background shadow-[inset_3px_0_0_0_var(--color-line)]">
                          <td />
                          <td className="p-4">
                            <p className="ml-7 text-base leading-4">{sys.name}</p>
                          </td>
                          <td className="p-4 text-base leading-4">
                            {round1(sys.earned)} / {sys.max}
                          </td>
                          <td className="p-4">
                            <ScoreCell pct={sp} avg={sys.avg} />
                          </td>
                          <td className="p-4 text-base leading-4 text-muted">{sys.avg}%</td>
                          <td />
                        </tr>
                      );
                    })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <SectionHeading title="Time Management" description="Green means you're faster than average! Red shows where you can improve your pace." />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row">
        <div className="flex shrink-0 flex-col items-center justify-center rounded-lg bg-white px-6 py-8 text-center shadow-card lg:w-[346px]">
          <div className="mb-4 flex h-7 w-[216px] items-center justify-center overflow-hidden">
            <div className="flex h-7 w-[107px] justify-end py-1">{faster && <div className="bg-success h-5" style={{ width: Math.max(8, diff * 107) }} />}</div>
            <div className="h-7 w-[3px] bg-faint" />
            <div className="h-7 w-[107px] py-1">{!faster && <div className="bg-error h-5" style={{ width: Math.max(8, diff * 107) }} />}</div>
          </div>
          <p className="text-lg leading-[18px] font-bold text-primary">Your Time Per Question</p>
          <span className="text-[64px] leading-[80px] font-bold tracking-[-1px] text-primary">{formatDuration(perQ)}</span>
          <p className="text-lg leading-[18px] text-muted">Average: {formatDuration(avgPerQ)}</p>
        </div>
        <div className="min-w-0 flex-1 overflow-hidden rounded-lg shadow-card">
          <TimeManagementTable
            subjects={stats.subjects.map((s) => s.id)}
            perQuestion={Object.fromEntries(stats.subjects.map((s) => [s.id, s.time / Math.max(1, s.count)]))}
          />
        </div>
      </div>

      <h2 className="text-2xl leading-[30px] font-bold text-ink">Question Breakdown</h2>
      <p className="mt-1 mb-4 text-base leading-6 text-muted">Click any question to jump directly to it.</p>
      <div className="mb-6 overflow-auto rounded-lg bg-white shadow-card">
        <table className="w-full min-w-[760px] text-ink">
          <tbody>
            <tr className="border-b border-line bg-background text-base leading-4 font-semibold text-muted">
              <td className="w-[60px] py-4 pr-4 pl-6" />
              <td className="p-4 text-ink">Question</td>
              <td className="p-4 text-ink">Subject</td>
              <td className="p-4 text-ink">System</td>
              <td className="p-4">
                <span className="inline-flex items-center text-ink">
                  Correct / Total Pts
                  <SortArrows />
                </span>
              </td>
              <td className="p-4">
                <span className="inline-flex items-center text-ink">
                  Time
                  <SortArrows />
                </span>
              </td>
              <td className="w-[52px] p-4" />
            </tr>
            {stats.groups.map((g) => {
              const caseOpen = g.caseId ? openCases.has(g.caseId) : true;
              return (
                <Fragment key={g.caseId ?? g.rows[0].index}>
                  {g.caseId && (
                    <tr
                      className="cursor-pointer border-b border-line bg-white shadow-[inset_3px_0_0_0_var(--color-line)] hover:bg-primary-light"
                      onClick={() =>
                        setOpenCases((o) => {
                          const n = new Set(o);
                          if (n.has(g.caseId!)) n.delete(g.caseId!);
                          else n.add(g.caseId!);
                          return n;
                        })
                      }
                    >
                      <td className="py-4 pr-4 pl-6">
                        {caseOpen ? (
                          <svg viewBox="0 0 48 48" className="size-4 text-primary" fill="currentColor">
                            <path d="M6 23.5c0-.83.67-1.5 1.5-1.5h33a1.5 1.5 0 0 1 0 3h-33A1.5 1.5 0 0 1 6 23.5Z" />
                          </svg>
                        ) : (
                          <Icon name="plus" size={16} className="text-primary" />
                        )}
                      </td>
                      <td className="p-4 text-base leading-4">Case Study</td>
                      <td className="p-4 text-base leading-4">{subjectName(g.subject)}</td>
                      <td className="p-4 text-base leading-4">{g.system}</td>
                      <td className="p-4 text-base leading-4">
                        {g.earned} / {g.max}
                      </td>
                      <td className="p-4 text-base leading-4">{formatDuration(g.time)}</td>
                      <td />
                    </tr>
                  )}
                  {caseOpen &&
                    g.rows.map((r) => (
                      <tr
                        key={r.index}
                        onClick={() => review(r.index)}
                        className={clsx("cursor-pointer border-b border-line last:border-0 hover:bg-primary-light", g.caseId ? "bg-background shadow-[inset_3px_0_0_0_var(--color-line)]" : "bg-white")}
                      >
                        <td className="py-4 pr-4 pl-6">
                          <StatusIcon earned={r.earned} max={r.max} />
                        </td>
                        <td className="p-4 text-base leading-4">
                          <span className="mr-2">{r.index + 1}</span>
                        </td>
                        <td className="p-4 text-base leading-4 text-muted">{subjectName(r.subject)}</td>
                        <td className="p-4 text-base leading-4 text-muted">{r.system}</td>
                        <td className="p-4 text-base leading-4">
                          {r.earned} / {r.max}
                        </td>
                        <td className="p-4 text-base leading-4">{formatDuration(r.time)}</td>
                        <td className="p-4 text-right">
                          <Icon name="chevronRight" size={20} className="ml-auto text-primary" />
                        </td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <PlacedFaqs placement="review" />
    </>
  );
}

function StatusIcon({ earned, max }: { earned: number; max: number }) {
  if (earned >= max)
    return (
      <svg viewBox="0 0 24 24" className="size-5 text-success" fill="currentColor">
        <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm4.3 6.6-5.8 5.8-2.8-2.8a1 1 0 1 0-1.4 1.4l3.5 3.5a1 1 0 0 0 1.4 0l6.5-6.5a1 1 0 1 0-1.4-1.4Z" />
      </svg>
    );
  if (earned > 0)
    return (
      <svg viewBox="0 0 24 24" className="size-5 text-warning" fill="currentColor">
        <path d="M2.03 11.25a10 10 0 0 1 19.94 0H22V12a10 10 0 0 1-20 0v-.75h.03ZM12 20.5a8.5 8.5 0 0 0 8.47-7.75H3.53A8.5 8.5 0 0 0 12 20.5Z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 48 48" className="size-5 text-error" fill="currentColor">
      <path d="M24 6.5a17.5 17.5 0 1 0 0 35 17.5 17.5 0 0 0 0-35ZM4 24a20 20 0 1 1 40 0 20 20 0 0 1-40 0Z" />
    </svg>
  );
}

function buildStats(session: TestSession) {
  let avgEarned = 0;
  let avgTime = 0;
  const bySubject = new Map<SubjectId, { id: SubjectId; earned: number; max: number; avgEarned: number; time: number; count: number; avg: number; systems: Map<string, { name: string; earned: number; max: number; avgEarned: number }> }>();
  const groups: { caseId?: string; subject: SubjectId; system: string; earned: number; max: number; time: number; rows: { index: number; subject: SubjectId; system: string; earned: number; max: number; time: number }[] }[] = [];
  const caseIds: string[] = [];
  const recorded = getStats();

  session.entries.forEach((e, index) => {
    const item = itemById(e.itemId);
    const s = scoreItem(item, session.submitted[e.itemId] ? session.answers[e.itemId] : undefined);
    const avg = avgPoints(item);
    const time = session.timeSpent[e.itemId] ?? 0;
    const subjectAvgTime = recorded.subject(item.subject).avgTimeSec ?? time;
    avgEarned += avg;
    avgTime += subjectAvgTime;

    const row = bySubject.get(item.subject) ?? { id: item.subject, earned: 0, max: 0, avgEarned: 0, time: 0, count: 0, avg: 0, systems: new Map() };
    row.earned += s.earned;
    row.max += s.max;
    row.avgEarned += avg;
    row.time += time;
    row.count += 1;
    const sys = row.systems.get(item.system) ?? { name: item.system, earned: 0, max: 0, avgEarned: 0 };
    sys.earned += s.earned;
    sys.max += s.max;
    sys.avgEarned += avg;
    row.systems.set(item.system, sys);
    bySubject.set(item.subject, row);

    const cs = caseForItem(item.id);
    const caseId = cs && !cs.exhibit ? e.caseId : undefined;
    let g = groups.at(-1);
    if (!g || !caseId || g.caseId !== caseId) {
      g = { caseId, subject: item.subject, system: item.system, earned: 0, max: 0, time: 0, rows: [] };
      groups.push(g);
      if (caseId) caseIds.push(caseId);
    }
    g.earned += s.earned;
    g.max += s.max;
    g.time += time;
    g.rows.push({ index, subject: item.subject, system: item.system, earned: s.earned, max: s.max, time });
  });

  const subjects = [...getAll("subjects")]
    .sort((a, b) => a.order - b.order)
    .map((s) => bySubject.get(s.id))
    .filter(<T,>(x: T | undefined): x is T => Boolean(x))
    .map((r) => ({
      ...r,
      avg: r.max ? Math.round((r.avgEarned / r.max) * 100) : 0,
      systems: [...r.systems.values()].map((x) => ({ ...x, avg: x.max ? Math.round((x.avgEarned / x.max) * 100) : 0 })),
    }));
  return { avgEarned, avgTime, subjects, groups, caseIds };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export default function ReviewPage() {
  return (
    <Suspense>
      <Report />
    </Suspense>
  );
}
