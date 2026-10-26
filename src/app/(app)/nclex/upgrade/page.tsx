"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { useConfig, usePlans } from "@/lib/content";
import { fmtDay, formatPrice, useMyPayments } from "@/lib/payments";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/ui/primitives";

export default function UpgradePage() {
  const router = useRouter();
  const userPlan = useStore((s) => s.user.plan);
  // Plans, prices and the feature list: Admin > Plans & Access.
  const plans = usePlans();
  const { headline, subhead, included } = useConfig().upgrade;
  const latest = useMyPayments()[0];
  const pending = latest?.status === "pending";
  const buy = (planId: string) => router.push(`/nclex/checkout?plan=${encodeURIComponent(planId)}`);

  return (
    <>
      <PageHeader trail={[{ label: "Upgrade" }]} title={headline} description={subhead} />
      {pending && (
        <Link href="/nclex/checkout" className="mb-5 flex items-center gap-3 rounded-lg border border-gold/60 bg-gold/10 px-4 py-3 text-ink hover:border-gold">
          <Clock className="size-5 shrink-0 text-gold" />
          <span className="flex-1">
            Your payment <b className="font-mono">{latest.reference}</b> for {latest.planLabel} is being verified. We&apos;ll email you as soon as your Pro access is active.
          </span>
          <span className="text-sm font-semibold text-primary">View status</span>
        </Link>
      )}
      {!pending && userPlan === "premium" && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-ink">
          <CheckCircle2 className="size-5 shrink-0 text-success" />
          <span>You have NCLEXBase Pro{latest?.status === "approved" && latest.accessUntil ? ` until ${fmtDay(latest.accessUntil)}` : ""}.</span>
        </div>
      )}
      <div className={clsx("grid gap-4", plans.length >= 3 ? "lg:grid-cols-3" : plans.length === 2 ? "lg:grid-cols-2" : "max-w-md")}>
        {plans.map((p) => (
          <div key={p.id} className={clsx("relative flex flex-col rounded-2xl border bg-white p-6 shadow-card", p.featured ? "border-gold ring-2 ring-gold" : "border-line")}>
            {p.featured && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-xs font-bold text-ink">Most Recommended</span>
            )}
            <h2 className="text-xl font-bold text-ink">
              {p.months} Month{p.months > 1 ? "s" : ""} of Access
            </h2>
            <div className="mt-3 flex items-end gap-2">
              {p.was > p.price && <span className="text-lg text-muted line-through">{formatPrice(p.was)}</span>}
              <span className="text-4xl font-bold text-ink">{formatPrice(p.price)}</span>
            </div>
            {p.was > p.price && (
              <span className="mt-2 w-fit rounded-full bg-success/10 px-2.5 py-0.5 text-sm font-semibold text-success">
                Save {formatPrice(p.was - p.price)} · {Math.round((1 - p.price / p.was) * 100)}% OFF
              </span>
            )}
            <p className="mt-3 text-muted">{p.blurb}</p>
            <button
              onClick={() => buy(p.id)}
              disabled={pending || userPlan === "premium"}
              className={clsx(
                "mt-5 h-12 cursor-pointer rounded-full disabled:cursor-not-allowed disabled:opacity-50 font-semibold transition-[background,filter,transform] duration-[50ms] active:translate-y-[2px] active:shadow-none",
                p.featured ? "bg-gold text-ink shadow-premium hover:brightness-95" : "bg-primary text-white shadow-press hover:bg-primary-hover",
              )}
            >
              Get {p.months} Month{p.months > 1 ? "s" : ""} of Access
            </button>
            <p className="mt-2 text-center text-sm text-muted">Pay by bank or mobile wallet transfer</p>
            <div className="mt-5 border-t border-line pt-4">
              <div className="mb-2 font-semibold text-ink">What&apos;s included:</div>
              {p.guarantee && (
                <div className="mb-2 flex items-start gap-2 rounded-lg bg-primary-light p-2.5 text-sm">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold" />
                  <span>
                    <b>NCLEX® Pass Guarantee</b>
                    <br />
                    Get a full refund if you don&apos;t pass.
                  </span>
                </div>
              )}
              <ul className="space-y-1.5">
                {included.map((x) => (
                  <li key={x} className="flex items-center gap-2 text-[15px] text-ink">
                    <Check className="size-4 text-success" strokeWidth={3} />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
