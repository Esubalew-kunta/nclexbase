"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/ui/primitives";

const PLANS = [
  { months: 1, price: 59, was: 79, off: 25, blurb: "The right choice for students taking the NCLEX® in under a month.", guarantee: false },
  { months: 2, price: 99, was: 159, off: 37, blurb: "The ideal timeline for most students preparing for the NCLEX®.", guarantee: true, featured: true },
  { months: 3, price: 129, was: 239, off: 46, blurb: "The best option for students who want more time and flexibility.", guarantee: true },
];

const INCLUDED = [
  "2,600+ NCLEX® Questions",
  "50 NCLEX® Cases",
  "Crash Course Videos",
  "4 Readiness Exams",
  "140+ Printable Cheat Sheets",
  "Study Schedule Creator",
  "Ask Bootcamp AI™",
  "Pass Targets Tracker",
  "Mobile App Access",
];

export default function UpgradePage() {
  const router = useRouter();
  const setPlan = useStore((s) => s.setPlan);
  const buy = () => {
    setPlan("premium");
    router.push("/nclex");
  };

  return (
    <>
      <PageHeader trail={[{ label: "Upgrade" }]} title="Pass the NCLEX®. Guaranteed." description="Trusted by 200,000+ students preparing for the NCLEX®." />
      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.months} className={clsx("bg-card relative flex flex-col rounded-2xl p-6 shadow-card", p.featured && "ring-4 ring-[#ffd24a]")}>
            {p.featured && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#ffd24a] px-3 py-1 text-xs font-bold text-ink">Most Recommended</span>
            )}
            <h2 className="text-xl font-bold text-ink-strong">
              {p.months} Month{p.months > 1 ? "s" : ""} of Access
            </h2>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-lg text-muted line-through">${p.was}</span>
              <span className="text-4xl font-bold text-ink-strong">${p.price}</span>
              <span className="pb-1 text-muted">USD</span>
            </div>
            <span className="mt-2 w-fit rounded-full bg-[#e7f7ef] px-2.5 py-0.5 text-sm font-semibold text-good">
              Save ${p.was - p.price} · {p.off}% OFF
            </span>
            <p className="mt-3 text-muted">{p.blurb}</p>
            <button onClick={buy} className="mt-5 h-12 rounded-full bg-brand font-semibold text-white shadow-press hover:bg-[#6a5eef]">
              Get {p.months} Month{p.months > 1 ? "s" : ""} of Access
            </button>
            <p className="mt-2 text-center text-sm text-muted">or 4 payments of ${(p.price / 4).toFixed(2)}</p>
            <div className="mt-5 border-t border-line pt-4">
              <div className="mb-2 font-semibold text-ink">What&apos;s included:</div>
              {p.guarantee && (
                <div className="mb-2 flex items-start gap-2 rounded-lg bg-brand-tint p-2.5 text-sm">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span>
                    <b>NCLEX® Pass Guarantee</b>
                    <br />
                    Get a full refund if you don&apos;t pass.
                  </span>
                </div>
              )}
              <ul className="space-y-1.5">
                {INCLUDED.map((x) => (
                  <li key={x} className="flex items-center gap-2 text-[15px] text-ink">
                    <Check className="size-4 text-good" strokeWidth={3} />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-white/70">Prototype: choosing a plan switches this device to Premium. No payment is taken.</p>
    </>
  );
}
