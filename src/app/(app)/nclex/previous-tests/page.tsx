"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { itemById } from "@/lib/bank";
import { avgPoints, scoreSession } from "@/lib/scoring";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/ui/Icon";
import { CopyHeader } from "@/components/ui/CopyHeader";

const PAGE_SIZES = [10, 20, 30, 40, 50];

/** Score cell: "19 %" + 70px blue bar with an average tick. */
function ScoreBar({ pct, avg }: { pct: number; avg: number }) {
  return (
    <div className="flex items-center gap-2">
      <p className="w-[42px] text-base leading-4 text-ink">{pct} %</p>
      <div className="relative w-[70px]">
        <div className="flex h-[10px] overflow-hidden rounded-lg bg-primary-light shadow-[inset_0_1px_3px_0_rgba(14,90,92,0.1)]">
          <span className="h-2.5 bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <div className="absolute -top-px -bottom-px w-0.5 bg-gold" style={{ left: `${avg}%` }} />
      </div>
    </div>
  );
}

export default function PreviousTestsPage() {
  const router = useRouter();
  const sessions = useStore((s) => s.sessions);
  const [size, setSize] = useState(10);
  const [page, setPage] = useState(0);
  const list = sessions.filter((s) => s.kind === "custom").slice().reverse();
  const pages = Math.max(1, Math.ceil(list.length / size));
  const rows = list.slice(page * size, page * size + size);
  const th = "h-12 border-b border-line bg-background px-4 text-left text-base font-semibold";

  return (
    <>
      <CopyHeader trail={[{ label: "Previous Tests" }]} titleKey="previous.title" />
      <p className="mb-4 rounded-lg border border-l-4 border-line border-l-primary bg-primary-light px-6 py-[18px] text-base leading-6 text-ink">
        Your Readiness Exam attempts can be reviewed on the{" "}
        <Link href="/nclex/next-gen-readiness-exams" className="font-semibold text-primary underline hover:text-primary-hover">
          Readiness Exams page.
        </Link>
      </p>

      <div className="overflow-auto pb-4">
        <table className="w-full min-w-[860px] overflow-hidden rounded-lg border border-line bg-white text-ink shadow-card">
          <thead>
            <tr>
              <th className={`${th} pl-6 font-bold text-muted`}>#</th>
              <th className={th}>Test Name</th>
              <th className={th}>Question Pool</th>
              <th className={th}>Date Taken</th>
              <th className={th}>Score</th>
              <th className={`${th} text-muted`}>Avg. Score</th>
              <th className={th}>Questions</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => {
              const sc = scoreSession(s);
              const avgMax = s.entries.reduce((a, e) => a + avgPoints(itemById(e.itemId)), 0);
              const avg = sc.max ? Math.round((avgMax / sc.max) * 100) : 0;
              const href = s.status === "ended" ? `/nclex/previous-tests/review?id=${s.id}` : `/nclex/custom-test?id=${s.id}`;
              return (
                <tr key={s.id} onClick={() => router.push(href)} className="h-12 cursor-pointer hover:bg-primary-light">
                  <td className="pr-4 pl-6 text-muted">{list.length - (page * size + i)}</td>
                  <td className="px-4">{s.title}</td>
                  <td className="px-4">
                    <div className="flex items-center gap-2">
                      <p className="flex items-center gap-1 rounded-lg bg-primary-light px-2 py-1 text-sm leading-[14px] font-semibold text-primary capitalize">{s.pool}</p>
                    </div>
                  </td>
                  <td className="px-4">{new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td className="px-4">{s.status === "ended" ? <ScoreBar pct={sc.percent} avg={avg} /> : <span className="text-muted">In progress</span>}</td>
                  <td className="px-4 text-muted">{avg}%</td>
                  <td className="px-4">{s.entries.length}</td>
                  <td className="pr-6 pl-4 text-right">
                    <Icon name="chevronRight" size={16} className="ml-auto text-primary" />
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-muted">
                  You haven&apos;t taken any tests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end text-ink">
        <span className="flex items-center justify-center p-4">
          Page {page + 1} of {pages}
        </span>
        {[
          { icon: "arrowLeft" as const, disabled: page === 0, go: () => setPage(page - 1), label: "Previous page" },
          { icon: "arrowRight" as const, disabled: page >= pages - 1, go: () => setPage(page + 1), label: "Next page" },
        ].map((b) => (
          <button
            key={b.icon}
            aria-label={b.label}
            disabled={b.disabled}
            onClick={b.go}
            className="mr-2 flex size-[42px] cursor-pointer items-center justify-center rounded-full border border-line bg-white text-primary hover:bg-primary-light disabled:cursor-not-allowed disabled:text-faint disabled:hover:bg-white"
          >
            <Icon name={b.icon} size={20} />
          </button>
        ))}
        <div className="relative ml-2 flex rounded-lg border border-line bg-white">
          <select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}
            aria-label="Rows per page"
            className="mr-7 cursor-pointer appearance-none bg-transparent p-3 text-sm leading-4 font-bold text-ink outline-none"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n} className="text-ink">
                Show {n}
              </option>
            ))}
          </select>
          <Icon name="chevronDownBold" size={20} className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-primary" />
        </div>
      </div>
    </>
  );
}
