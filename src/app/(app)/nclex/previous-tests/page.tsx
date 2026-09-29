"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { avgPoints, scoreSession } from "@/lib/scoring";
import { itemById } from "@/lib/bank";
import { Card, PageHeader } from "@/components/ui/primitives";

const PAGE_SIZES = [10, 20, 30, 40, 50];

export default function PreviousTestsPage() {
  const sessions = useStore((s) => s.sessions);
  const [size, setSize] = useState(10);
  const [page, setPage] = useState(0);
  const list = sessions.filter((s) => s.kind !== "readiness").slice().reverse();
  const pages = Math.max(1, Math.ceil(list.length / size));
  const rows = list.slice(page * size, page * size + size);

  return (
    <>
      <PageHeader trail={[{ label: "Previous Tests" }]} title="Previous Tests" description="Your Readiness Exam attempts can be reviewed on the Readiness Exams page." />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-line text-base font-semibold text-ink-strong">
                <th className="py-4 pr-2 pl-6">#</th>
                <th className="px-2">Test Name</th>
                <th className="px-2">Question Pool</th>
                <th className="px-2">Date Taken</th>
                <th className="px-2">Score</th>
                <th className="px-2">Avg. Score</th>
                <th className="px-2">Questions</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => {
                const sc = scoreSession(s);
                const avgMax = s.entries.reduce((a, e) => a + avgPoints(itemById(e.itemId)), 0);
                const avg = sc.max ? Math.round((avgMax / sc.max) * 100) : 0;
                const href = s.status === "ended" ? `/nclex/previous-tests/review?id=${s.id}` : `/nclex/custom-test?id=${s.id}`;
                return (
                  <tr key={s.id} className="border-b border-line text-base text-ink last:border-0 hover:bg-[#fafafb]">
                    <td className="py-4 pr-2 pl-6 text-muted">{list.length - (page * size + i)}</td>
                    <td className="px-2 font-semibold">
                      <Link href={href} className="hover:text-brand">
                        {s.title}
                      </Link>
                      {s.status === "active" && <span className="ml-2 rounded-full bg-brand-tint px-2 py-0.5 text-xs font-semibold text-brand">In progress</span>}
                    </td>
                    <td className="px-2 capitalize">{s.pool}</td>
                    <td className="px-2">{new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="px-2 font-semibold">{s.status === "ended" ? `${sc.percent}%` : "—"}</td>
                    <td className="px-2 text-muted">{avg}%</td>
                    <td className="px-2">{s.entries.length}</td>
                    <td className="pr-4">
                      <Link href={href} aria-label={`Open ${s.title}`}>
                        <ChevronRight className="size-5 text-faint" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted">
                    No tests yet. Create a test to see it here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-3 text-sm text-muted">
          <span className="flex items-center gap-3">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="disabled:opacity-40">
              ‹
            </button>
            Page {page + 1} of {pages}
            <button disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className="disabled:opacity-40">
              ›
            </button>
          </span>
          <select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}
            aria-label="Rows per page"
            className="rounded-md border border-line px-2 py-1"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                Show {n}
              </option>
            ))}
          </select>
        </div>
      </Card>
    </>
  );
}
