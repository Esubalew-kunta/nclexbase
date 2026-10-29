"use client";

import Link from "next/link";
import { VitalsFlowsheet } from "@/components/home/graphics";

/*
 * Homepage option 2 — "At 1400."
 *
 * The argument: a patient deteriorating in front of you is a story, and a story holds
 * attention that a feature list does not. The hero puts the reader in the chair instead of
 * describing what the product contains.
 *
 * The imagery is the chart itself — four readings of one patient's vital signs, walking the
 * wrong way. The numbers *are* the image: no sparkline, no chart furniture, tabular figures
 * and hairline rules, so it reads as a real flowsheet rather than a dashboard. Two values have
 * tipped out of range and they are the only warm colour on the whole page; that restraint is
 * what makes two clay numbers land.
 *
 * The previous version of this page opened with a flat, centred, full-bleed teal field — the
 * single most generic hero shape on the web — and showed nothing of the product above the
 * fold. The headline that version carried ("You have one exam to pass. Here is the route.") was
 * the best line of the three and is kept, further down, where the route is actually described.
 *
 * What it risks: the chart needs clinical literacy to decode in three seconds. This audience
 * has it; a reviewer who is not a nurse may not.
 */

const STEPS = [
  { n: "1", title: "Find out where you stand", body: "A short diagnostic across all seven subjects. No studying yet — just which systems are costing you marks." },
  { n: "2", title: "Practice the weak systems", body: "Build tests from the subjects you missed. Every question explains the right answer and each wrong one." },
  { n: "3", title: "Prove it on a readiness exam", body: "A full adaptive exam, timed and scored like the real one, so you walk in knowing what will happen." },
];

export function HomeV2() {
  return (
    <main>
      {/* Hero ------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-linear-160 from-ink-teal to-ink-teal-soft">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-12 lg:py-24">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-gold uppercase">Next Gen case studies</p>
            <h1 className="mt-5 font-display text-[2.4rem] leading-[1.08] font-medium tracking-tight text-white sm:text-[3rem]">
              At 1400 the pressure drops.
            </h1>
            <p className="mt-5 font-display text-2xl leading-8 font-medium text-gold">What do you do first?</p>
            <p className="mt-6 max-w-sm text-lg leading-7 text-white/72">
              This is how the exam asks now: one patient, a chart you have to read, and six decisions as their condition changes.
            </p>
            <Link
              href="/auth/join"
              className="mt-8 inline-flex h-14 items-center rounded-lg bg-white px-7 text-lg font-semibold text-primary transition-[background,transform] duration-[50ms] hover:bg-primary-light active:translate-y-[2px]"
            >
              Start free
            </Link>
            <p className="mt-5 text-sm text-white/50">No card needed.</p>
          </div>

          {/* Bleeds off the right edge, so the chart reads as a window into something larger
              rather than as a picture of a chart. */}
          <div className="lg:-mr-24 xl:-mr-32">
            <VitalsFlowsheet className="shadow-[0_2px_8px_0_rgba(0,0,0,0.18),0_18px_48px_-12px_rgba(0,0,0,0.45)]" />
          </div>
        </div>
      </section>

      {/* The route ------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-medium tracking-tight text-ink">You have one exam to pass. Here is the route.</h2>
        <ol className="mt-12 grid gap-8 lg:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n} className="border-t-2 border-primary-light pt-5">
              <span className="font-display text-3xl font-medium text-primary">{step.n}</span>
              <h3 className="mt-2 font-bold text-ink">{step.title}</h3>
              <p className="mt-1.5 text-[15px] leading-6 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* The explanation claim ------------------------------------------- */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-ink">Every question tells you why</h2>
            <p className="mt-4 text-lg leading-7 text-muted">
              The reasoning for the right answer, and for each wrong one. That is the difference between a practice question and a quiz: a
              missed item becomes the thing you learned that day.
            </p>
          </div>
          {/*
           * Deliberately NOT a blockquote. An earlier version set this in curly quotes under
           * the caption "An explanation, in full", which made two sentences of our own product
           * copy look like a student testimonial — the same claim we refused to fabricate in
           * words, made by typography instead. It is now labelled as what it is.
           */}
          <figure className="rounded-card border border-line bg-background">
            <figcaption className="border-b border-line px-5 py-2.5 text-xs font-bold tracking-wider text-muted uppercase">
              A rationale, as it appears in the app
            </figcaption>
            <p className="px-5 py-4 font-exam text-[15px] leading-7 text-exam-ink">
              Digoxin is withheld for an apical pulse under 60/min. A potassium of 4.2 mEq/L, a blood pressure of 132/80 mm Hg and a digoxin
              level of 1.0 ng/mL are all within range — none of them is a reason to hold the dose.
            </p>
          </figure>
        </div>
      </section>

      {/* Close ------------------------------------------------------------ */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-3xl font-medium tracking-tight text-ink">Step one takes ten minutes.</h2>
        <p className="mt-4 text-lg text-muted">Start with the free questions and see where you actually stand.</p>
        <Link
          href="/auth/join"
          className="mt-8 inline-flex h-14 items-center rounded-lg bg-primary px-8 text-lg font-semibold text-white shadow-press transition-[background,transform] duration-[50ms] hover:bg-primary-hover active:translate-y-[2px] active:shadow-none"
        >
          Start free
        </Link>
      </section>
    </main>
  );
}
