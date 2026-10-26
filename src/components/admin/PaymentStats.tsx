"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import type { PaymentRec } from "@/lib/admin/types";
import { useAll, useConfig } from "@/lib/content";
import { addDays, todayISO } from "@/lib/daily";
import { formatPrice } from "@/lib/payments";
import { Segmented } from "./ui";

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

/** First day counted by each range ("all" has no start). */
function rangeStart(range: Range): string {
  const today = todayISO();
  if (range === "month") return `${today.slice(0, 7)}-01`;
  if (range === "30d") return addDays(today, -29);
  if (range === "year") return `${today.slice(0, 4)}-01-01`;
  return "";
}

export function PaymentStats() {
  const payments = useAll("payments");
  const currency = useConfig().payments.currency;
  const [range, setRange] = useState<Range>("month");

  const s = useMemo(() => {
    const inCur = payments.filter((p) => p.currency === currency);
    const approved = inCur.filter((p) => p.status === "approved");
    const start = rangeStart(range);
    const inRange = approved.filter((p) => dayOf(p) >= start);
    const sum = (l: PaymentRec[]) => l.reduce((n, p) => n + p.amount, 0);
    const pending = inCur.filter((p) => p.status === "pending");
    const earned = sum(inRange);
    return {
      earned,
      count: inRange.length,
      average: inRange.length ? earned / inRange.length : 0,
      discounts: inRange.reduce((n, p) => n + Math.max(0, (p.listPrice ?? p.amount) - p.amount), 0),
      pending: { amount: sum(pending), count: pending.length },
      allTime: sum(approved),
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
