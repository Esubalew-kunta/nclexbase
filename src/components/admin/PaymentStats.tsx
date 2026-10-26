"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import type { PaymentRec } from "@/lib/admin/types";
import { useAll, useConfig } from "@/lib/content";
import { addDays, todayISO } from "@/lib/daily";
import { formatPrice } from "@/lib/payments";
import { Panel, Segmented } from "./ui";

/*
 * Money earned from approved payments. Earned = approved, dated by approval; waiting = pending.
 * Totals use the current currency (Payments › Settings); payments recorded in another
 * currency are counted separately so amounts are never mixed.
 */

type Range = "month" | "30d" | "year" | "all";
const RANGES: { value: Range; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "30d", label: "Last 30 days" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
];

/** Local calendar day of approval (falls back to submission). */
const dayOf = (p: PaymentRec) => {
  const d = new Date(p.reviewedAt ?? p.submittedAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const compact = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${+(n / 1e3).toFixed(1)}K` : n.toLocaleString("en-US", { maximumFractionDigits: 2 }));
const monthLabel = (ym: string) => new Date(`${ym}-01T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" });
const dayLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** The range's first day and its buckets (days for a month or 30 days, months otherwise). */
function buckets(range: Range, firstDay: string): { start: string; keys: string[]; label: (k: string) => string; keyOf: (iso: string) => string } {
  const today = todayISO();
  if (range === "month" || range === "30d") {
    const start = range === "month" ? `${today.slice(0, 7)}-01` : addDays(today, -29);
    const keys: string[] = [];
    for (let d = start; d <= today; d = addDays(d, 1)) keys.push(d);
    return { start, keys, label: dayLabel, keyOf: (iso) => iso };
  }
  const start = range === "year" ? `${today.slice(0, 4)}-01-01` : `${(firstDay < today ? firstDay : today).slice(0, 7)}-01`;
  const keys: string[] = [];
  const [y0, m0] = start.split("-").map(Number);
  for (let y = y0, m = m0; `${y}-${String(m).padStart(2, "0")}` <= today.slice(0, 7); m === 12 ? ((m = 1), y++) : m++) keys.push(`${y}-${String(m).padStart(2, "0")}`);
  return { start, keys, label: monthLabel, keyOf: (iso) => iso.slice(0, 7) };
}

export function PaymentStats() {
  const payments = useAll("payments");
  const currency = useConfig().payments.currency;
  const [range, setRange] = useState<Range>("month");
  const [asTable, setAsTable] = useState(false);

  const s = useMemo(() => {
    const inCur = payments.filter((p) => p.currency === currency);
    const approved = inCur.filter((p) => p.status === "approved");
    const first = approved.map(dayOf).sort()[0] ?? todayISO();
    const b = buckets(range, first);
    const inRange = approved.filter((p) => dayOf(p) >= b.start);
    const sum = (l: PaymentRec[]) => l.reduce((n, p) => n + p.amount, 0);
    const series = b.keys.map((k) => {
      const l = inRange.filter((p) => b.keyOf(dayOf(p)) === k);
      return { key: k, label: b.label(k), amount: sum(l), count: l.length };
    });
    const group = (by: (p: PaymentRec) => string) => {
      const m = new Map<string, { amount: number; count: number }>();
      for (const p of inRange) {
        const g = m.get(by(p)) ?? { amount: 0, count: 0 };
        g.amount += p.amount;
        g.count++;
        m.set(by(p), g);
      }
      return [...m.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.amount - a.amount);
    };
    const pending = inCur.filter((p) => p.status === "pending");
    const earned = sum(inRange);
    return {
      earned,
      count: inRange.length,
      average: inRange.length ? earned / inRange.length : 0,
      discounts: inRange.reduce((n, p) => n + Math.max(0, (p.listPrice ?? p.amount) - p.amount), 0),
      pending: { amount: sum(pending), count: pending.length },
      allTime: sum(approved),
      series,
      byMethod: group((p) => p.methodName),
      byPlan: group((p) => p.planLabel),
      otherCurrencies: [...new Set(payments.filter((p) => p.currency !== currency && p.status === "approved").map((p) => p.currency))],
    };
  }, [payments, currency, range]);

  const money = (n: number) => formatPrice(Math.round(n * 100) / 100, currency);
  const rangeLabel = RANGES.find((r) => r.value === range)!.label.toLowerCase();

  return (
    <div className="mb-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">Money earned</h2>
        <Segmented value={range} onChange={setRange} options={RANGES} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label={`Earned ${rangeLabel}`} value={money(s.earned)} sub={`${s.count} approved payment${s.count === 1 ? "" : "s"} · ${money(s.allTime)} all time`} hero />
        <Tile label="Waiting for review" value={money(s.pending.amount)} sub={`${s.pending.count} pending payment${s.pending.count === 1 ? "" : "s"}`} />
        <Tile label="Average payment" value={s.count ? money(s.average) : "—"} sub={`Approved ${rangeLabel}`} />
        <Tile label="Discounts given" value={money(s.discounts)} sub="Promo codes and referrals" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <Panel
          title={`Earned per ${range === "month" || range === "30d" ? "day" : "month"}`}
          description={`Approved payments in ${currency}, by approval date.`}
          actions={
            <button type="button" onClick={() => setAsTable(!asTable)} className="cursor-pointer text-sm font-semibold text-primary hover:underline">
              {asTable ? "Show chart" : "Show as table"}
            </button>
          }
        >
          {asTable ? <SeriesTable series={s.series} money={money} /> : <BarChart series={s.series} money={money} />}
        </Panel>
        <div className="space-y-4">
          <Breakdown title="By payment method" rows={s.byMethod} money={money} />
          <Breakdown title="By plan" rows={s.byPlan} money={money} />
        </div>
      </div>
      {s.otherCurrencies.length > 0 && <p className="text-xs text-muted">Payments approved in {s.otherCurrencies.join(", ")} (before the currency changed) aren&apos;t included in these totals.</p>}
    </div>
  );
}

function Tile({ label, value, sub, hero }: { label: string; value: string; sub: string; hero?: boolean }) {
  return (
    <div className={clsx("rounded-lg border bg-white p-4", hero ? "border-primary/30" : "border-line")}>
      <p className="text-sm text-muted">{label}</p>
      <p className={clsx("mt-1 font-semibold text-ink tabular-nums", hero ? "text-3xl" : "text-2xl")}>{value}</p>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
    </div>
  );
}

type Point = { key: string; label: string; amount: number; count: number };

/** Single-series column chart: brand teal, 4px rounded tops, hairline grid, hover tooltip. */
function BarChart({ series, money }: { series: Point[]; money: (n: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...series.map((p) => p.amount), 0);
  // Clean top tick: 1, 2 or 5 × a power of ten.
  const top = max
    ? (() => {
        const e = 10 ** Math.floor(Math.log10(max));
        return [1, 2, 5, 10].map((m) => m * e).find((v) => v >= max)!;
      })()
    : 1;
  const ticks = [top, top / 2, 0];
  const H = 200;
  const labelEvery = Math.max(1, Math.ceil(series.length / 8));
  if (!max) return <p className="py-12 text-center text-sm text-muted">No approved payments in this period yet.</p>;
  return (
    <div className="flex gap-2">
      <div className="relative w-10 shrink-0 text-right text-[11px] text-muted tabular-nums" style={{ height: H }}>
        {ticks.map((t) => (
          <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: H - (t / top) * H }}>
            {compact(t)}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative" style={{ height: H }} onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 h-px bg-line" style={{ top: H - (t / top) * H }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {series.map((p, i) => (
              <div
                key={p.key}
                className="relative flex h-full min-w-0 flex-1 cursor-default items-end justify-center"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                tabIndex={0}
                aria-label={`${p.label}: ${money(p.amount)}, ${p.count} payments`}
              >
                <div
                  className={clsx("w-full max-w-6 rounded-t-[4px] transition-colors", hover === i ? "bg-primary-hover" : "bg-primary")}
                  style={{ height: p.amount ? Math.max(2, (p.amount / top) * H) : 0 }}
                />
              </div>
            ))}
          </div>
          {hover !== null && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs whitespace-nowrap shadow-card"
              style={{ left: `${((hover + 0.5) / series.length) * 100}%`, bottom: Math.min(H - 8, (series[hover].amount / top) * H + 8) }}
            >
              <p className="font-semibold text-ink">{series[hover].label}</p>
              <p className="text-ink tabular-nums">{money(series[hover].amount)}</p>
              <p className="text-muted">
                {series[hover].count} payment{series[hover].count === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </div>
        <div className="mt-1 flex gap-[2px] text-[11px] text-muted">
          {series.map((p, i) => (
            <span key={p.key} className="min-w-0 flex-1 text-center whitespace-nowrap">
              {i % labelEvery === 0 ? p.label : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SeriesTable({ series, money }: { series: Point[]; money: (n: number) => string }) {
  const rows = series.filter((p) => p.count);
  if (!rows.length) return <p className="py-12 text-center text-sm text-muted">No approved payments in this period yet.</p>;
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs text-muted uppercase">
        <tr>
          <th className="py-1.5">Period</th>
          <th className="py-1.5 text-right">Payments</th>
          <th className="py-1.5 text-right">Earned</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.key} className="border-t border-line">
            <td className="py-1.5">{p.label}</td>
            <td className="py-1.5 text-right tabular-nums">{p.count}</td>
            <td className="py-1.5 text-right font-semibold tabular-nums">{money(p.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Ranked horizontal bars (one hue, length = amount) with the numbers beside them. */
function Breakdown({ title, rows, money }: { title: string; rows: { name: string; amount: number; count: number }[]; money: (n: number) => string }) {
  const max = Math.max(...rows.map((r) => r.amount), 0);
  return (
    <Panel title={title}>
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.name}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-ink">{r.name}</span>
                <span className="shrink-0 font-semibold text-ink tabular-nums">
                  {money(r.amount)} <span className="font-normal text-muted">· {r.count}</span>
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-primary-light">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${(r.amount / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Nothing approved in this period.</p>
      )}
    </Panel>
  );
}
