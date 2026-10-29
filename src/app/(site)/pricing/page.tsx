"use client";

import Link from "next/link";
import { usePlans } from "@/lib/content";
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
 * The headings and the "in every plan" list are **not** read from `config.upgrade`, unlike the
 * signed-in upgrade screen. Those defaults were copied from bootcamp.com during the clone and
 * still read "Pass the NCLEX®. Guaranteed.", "Trusted by 200,000+ students", "2,600+ NCLEX®
 * Questions" and "Mobile App Access" — a guarantee we cannot honour, a number that is not
 * ours, a count we do not have and an app that does not exist. None of that may go on a public
 * page. See PROGRESS.md: the config copy itself needs rewriting, which is a separate decision.
 */

/** What is actually in the product today. Every line is true. */
const INCLUDED = [
  "Exam-style questions in every subject, with every Next Gen item type",
  "An explanation under each one — the right answer and every wrong answer",
  "Next Gen case studies with the tabbed patient chart",
  "Adaptive, timed readiness exams scored like the real test",
  "Printable cheat sheets and memory tricks",
  "A study schedule you set to your own exam date",
];

export default function PricingPage() {
  const plans = usePlans();

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
                  className="mt-6 flex h-12 items-center justify-center rounded-lg bg-primary px-4 font-semibold text-white shadow-press transition-[background,transform] duration-[50ms] hover:bg-primary-hover active:translate-y-[2px] active:shadow-none"
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        )}

        <section className="mt-16">
          <h2 className="text-xl font-bold tracking-tight text-ink">In every plan</h2>
          <ul className="mt-5 grid gap-x-10 gap-y-3 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-2.5 text-[15px] leading-6 text-muted">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </section>

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
            By bank transfer or mobile wallet, in birr. You upload the receipt and we confirm your access — the account details and the
            current review time are shown at checkout.
          </p>
        </section>
      </div>
    </main>
  );
}
