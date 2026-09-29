"use client";

import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { ChevronsUpDown, Minus, Plus, SquarePlus, TriangleAlert } from "lucide-react";
import { SUBJECTS } from "@/data/catalog";
import { useStore } from "@/lib/store";
import { formatDuration } from "@/lib/scoring";
import type { SubjectId } from "@/lib/types";
import { Card } from "@/components/ui/primitives";
import { SubjectIcon } from "@/components/ui/visuals";

export interface SubjectStat {
  id: SubjectId;
  earned: number;
  max: number;
  used: number;
  total: number;
  avgScore: number;
  time: number;
  answered: number;
  systems: { name: string; earned: number; max: number; avgScore: number }[];
}

/** Score bar with a tick for the average, as on the live site. */
export function ScoreBar({ value, avg }: { value: number; avg: number }) {
  return (
    <span className="relative inline-block h-2 w-[84px] rounded-full bg-track shadow-track align-middle">
      <span className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#2f6fe4] to-brand" style={{ width: `${value}%` }} />
      <span className="absolute -top-1 h-4 w-0.5 bg-[#9a9aa6]" style={{ left: `${avg}%` }} />
    </span>
  );
}

export function SubjectPerformanceTable({ stats, showUsage = true, startTest = true }: { stats: SubjectStat[]; showUsage?: boolean; startTest?: boolean }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<"name" | "score">("name");
  const setUi = useStore((s) => s.setUi);
  const rows = [...stats].sort((a, b) => (sort === "score" ? pct(a) - pct(b) : 0));
  const allOpen = open.size === stats.length;

  return (
    <>
      <div className="-mt-2 mb-4 flex justify-end">
        <button onClick={() => setOpen(allOpen ? new Set() : new Set(stats.map((s) => s.id)))} className="flex items-center gap-1.5 font-semibold text-white">
          {allOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
          {allOpen ? "Collapse All" : "Expand All"}
        </button>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-base">
          <thead>
            <tr className="border-b border-line font-semibold text-ink-strong">
              <th className="w-12" />
              <th className="py-4">
                <SortHead onClick={() => setSort("name")}>Subject</SortHead>
              </th>
              <th>
                <SortHead onClick={() => setSort("score")}>{showUsage ? "Score" : "Correct / Total Pts"}</SortHead>
              </th>
              {!showUsage && <th>Score</th>}
              <th className="text-muted">Avg. Score</th>
              {showUsage && <th>Questions Used</th>}
              {startTest && <th className="w-16" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const subject = SUBJECTS.find((x) => x.id === s.id)!;
              const p = pct(s);
              const weak = s.max > 0 && p < s.avgScore;
              const isOpen = open.has(s.id);
              return (
                <FragmentRows key={s.id}>
                  <tr className="border-b border-line">
                    <td className="pl-4">
                      <button
                        aria-label={isOpen ? "Collapse" : "Expand"}
                        onClick={() => setOpen((o) => toggle(o, s.id))}
                        className="text-faint hover:text-ink"
                      >
                        {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                      </button>
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-3">
                        <SubjectIcon id={s.id} size={22} />
                        {subject.name}
                        {weak && <TriangleAlert className="size-4 fill-bad-light text-white" />}
                      </span>
                    </td>
                    {showUsage ? (
                      <td>
                        <span className="inline-flex items-center gap-4">
                          <span className="w-10">{p}%</span>
                          <ScoreBar value={p} avg={s.avgScore} />
                        </span>
                      </td>
                    ) : (
                      <>
                        <td>
                          {fmt(s.earned)} / {fmt(s.max)}
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-4">
                            <span className="w-10">{p}%</span>
                            <ScoreBar value={p} avg={s.avgScore} />
                          </span>
                        </td>
                      </>
                    )}
                    <td className="text-muted">{s.avgScore}%</td>
                    {showUsage && (
                      <td>
                        <span className="inline-flex items-center gap-4">
                          <span className="w-16">
                            {s.used} / {s.total}
                          </span>
                          <ScoreBar value={(s.used / s.total) * 100} avg={85} />
                        </span>
                      </td>
                    )}
                    {startTest && (
                      <td className="pr-4 text-right">
                        <button
                          onClick={() => setUi({ createTestOpen: true })}
                          aria-label={`Create a ${subject.name} test`}
                          className="inline-flex size-8 items-center justify-center rounded-full bg-brand text-white shadow-press"
                        >
                          <SquarePlus className="size-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                  {isOpen &&
                    (s.systems.length ? s.systems : subject.systems.map((x) => ({ name: x.name, earned: 0, max: 0, avgScore: s.avgScore }))).map((sys) => {
                      const sp = sys.max ? Math.round((sys.earned / sys.max) * 100) : 0;
                      return (
                        <tr key={sys.name} className="border-b border-line bg-[#fafafb] text-[15px]">
                          <td />
                          <td className="py-2.5 pl-9 text-ink">{sys.name}</td>
                          {showUsage ? (
                            <td>
                              <span className="inline-flex items-center gap-4">
                                <span className="w-10">{sp}%</span>
                                <ScoreBar value={sp} avg={sys.avgScore} />
                              </span>
                            </td>
                          ) : (
                            <>
                              <td>
                                {fmt(sys.earned)} / {fmt(sys.max)}
                              </td>
                              <td>
                                <span className="inline-flex items-center gap-4">
                                  <span className="w-10">{sp}%</span>
                                  <ScoreBar value={sp} avg={sys.avgScore} />
                                </span>
                              </td>
                            </>
                          )}
                          <td className="text-muted">{sys.avgScore}%</td>
                          {showUsage && <td />}
                          {startTest && <td />}
                        </tr>
                      );
                    })}
                </FragmentRows>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}

export function TimeTable({ stats }: { stats: SubjectStat[] }) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-base">
        <thead>
          <tr className="border-b border-line font-semibold text-ink-strong">
            <th className="w-12" />
            <th className="py-4">Subject</th>
            <th>
              <SortHead>Time Per Question</SortHead>
            </th>
            <th className="text-muted">Avg. Time</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => {
            const subject = SUBJECTS.find((x) => x.id === s.id)!;
            const per = s.answered ? s.time / s.answered : null;
            return (
              <tr key={s.id} className="border-b border-line last:border-0">
                <td />
                <td className="py-3.5">
                  <span className="flex items-center gap-3">
                    <SubjectIcon id={s.id} size={22} />
                    {subject.name}
                  </span>
                </td>
                <td>
                  {per == null ? (
                    <span className="text-muted">--</span>
                  ) : (
                    <span className="inline-flex items-center gap-3">
                      {formatDuration(per)}
                      <span className={clsx("h-3 w-1.5 rounded-sm", per <= subject.avgTimeSec ? "bg-good-light" : "bg-bad-light")} />
                    </span>
                  )}
                </td>
                <td className="text-muted">{formatDuration(subject.avgTimeSec)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function SortHead({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 font-semibold">
      {children}
      <ChevronsUpDown className="size-3.5 text-faint" />
    </button>
  );
}

function FragmentRows({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

const pct = (s: { earned: number; max: number }) => (s.max ? Math.round((s.earned / s.max) * 100) : 0);
const fmt = (n: number) => (Number.isInteger(n) ? n : n.toFixed(1));
const toggle = (set: Set<string>, id: string) => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

