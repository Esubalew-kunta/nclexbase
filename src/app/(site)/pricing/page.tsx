"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useConfig, usePlans } from "@/lib/content";
import { formatPrice } from "@/lib/payments";
import { PageHeader } from "@/components/site/Prose";

/*
 * Public pricing.
 *
 * The homepage shows no prices — a Pricing link in the header leads here, which is where
 * bootcamp.com puts theirs too. A visitor who has not yet worked out what the product is
 * should not be reading three price cards.
 *
 * Prices, plan lengths and blurbs come from the plans collection, so the admin owns every
 * figure here and `/nclex/upgrade` reads the same records — the public page and the checkout
 * cannot disagree about what a plan costs.
 *
 * What a plan contains is `config.upgrade.included`, the admin's own list, printed inside
 * every card: all three plans contain the same thing and differ only in length, and a card
 * with nothing in it but a price asks the reader to take the value on trust. The signed-in
 * upgrade screen reads the same record, so the two pages cannot drift apart.
 */

export default function PricingPage() {
  const plans = usePlans();
  const included = useConfig().upgrade.included;

  return (
    <main>
      <PageHeader
        eyebrow="Pricing"
        title="One membership, everything in it."
        intro="Every subject, every question type, every case study and every readiness exam. Choose how long you need it for."
      />

      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        {plans.length === 0 ? (
          // Plans are admin content, so an empty list is a real state and not an error.
          <p className="text-muted">Plans are being updated. Please check back shortly.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-card border bg-surface p-6 ${plan.featured ? "border-gold shadow-card" : "border-line"}`}
              >
                {plan.featured && (
                  <span className="absolute -top-2.5 left-6 rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-ink uppercase">
                    Most chosen
                  </span>
                )}

                <h2 className="font-bold text-ink">
                  {plan.months} {plan.months === 1 ? "month" : "months"}
                </h2>
                <p className="mt-1 min-h-10 text-sm leading-5 text-muted">{plan.blurb}</p>

                <div className="mt-5 flex items-end gap-2">
                  <span className="text-4xl font-bold text-ink">{formatPrice(plan.price)}</span>
                  {plan.was > plan.price && <span className="pb-1 text-lg text-faint line-through">{formatPrice(plan.was)}</span>}
                </div>

                {plan.was > plan.price && (
                  <p className="mt-1 text-sm font-semibold text-success">
                    Save {formatPrice(plan.was - plan.price)} · {Math.round((1 - plan.price / plan.was) * 100)}% off
                  </p>
                )}

                <Link
                  href="/auth/join"
                  className="mt-6 flex h-12 items-center justify-center rounded-full bg-primary px-4 font-semibold text-white shadow-press transition-[background,transform] duration-[50ms] hover:bg-primary-hover active:translate-y-[2px] active:shadow-none"
                >
                  Get started
                </Link>

                <ul className="mt-6 space-y-2.5 border-t border-line pt-5">
                  {included.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm leading-6 text-muted">
                      <Check size={16} strokeWidth={2.6} className="mt-1 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <section className="mt-16 rounded-card border border-line bg-surface p-6">
          <h2 className="font-bold text-ink">Before you pay</h2>
          <p className="mt-2 text-[15px] leading-7 text-muted">
            There are free questions in every subject and you do not need a card to reach them. Create an account, try the material, and
            upgrade only once you know it suits how you study.
          </p>
          <Link href="/auth/join" className="mt-4 inline-flex text-[15px] font-semibold text-primary hover:text-primary-hover">
            Start free →
          </Link>
        </section>

        <section className="mt-16">
          <h2 className="text-xl font-bold tracking-tight text-ink">How you pay</h2>
          <p className="mt-3 text-[15px] leading-7 text-muted">
            By bank transfer or mobile wallet, in birr. You upload the receipt and we confirm your access. The account details and the
            current review time are shown at checkout.
          </p>
        </section>
      </div>
    </main>
  );
}
