"use client";

import Link from "next/link";

/*
 * Homepage option 2 — "The Plan."
 *
 * The argument: the exam is not hard to understand, it is hard to face. So the hero sells a
 * route rather than a feature set — three steps from today to pass day, on a calm teal canvas
 * with one action and nothing else competing for the eye.
 *
 * This is the direction the landing-page research points at: an outcome-first headline that
 * names the result and the person, not the product category. It is also the only one of the
 * three that answers "where do I even start", which is the question a nursing student
 * actually arrives with.
 *
 * Five sections. The trade-off against option 1 is deliberate: nothing of the product is
 * visible above the fold.
 */

const STEPS = [
  {
    n: "1",
    title: "Find out where you stand",
    body: "A short diagnostic across all seven subjects. No studying yet — just an honest picture of which systems are costing you marks.",
  },
  {
    n: "2",
    title: "Practice the weak systems",
    body: "Build tests from the subjects and systems you missed. Every question explains the right answer and why each wrong one is wrong.",
  },
  {
    n: "3",
    title: "Prove it on a readiness exam",
    body: "A full adaptive exam, timed and scored like the real one, so you walk in knowing roughly what will happen.",
  },
];

const PARTS = [
  { title: "Standalone questions", body: "Every Next Gen item type — matrix, bowtie, drag-and-drop, highlight, drop-down." },
  { title: "Case studies", body: "Six items around one unfolding patient, with the tabbed chart the exam gives you." },
  { title: "Readiness exams", body: "Adaptive and timed, scored the way the NCLEX scores." },
  { title: "Cheat sheets and memory tricks", body: "One page per topic, for the week you stop learning and start revising." },
];

export function HomeV2() {
  return (
    <main>
      {/* Hero ------------------------------------------------------------ */}
      <section className="bg-primary">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:py-28">
          <h1 className="mx-auto max-w-3xl text-4xl leading-[1.1] font-extrabold tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
            You have one exam to pass. Here is the route.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-7 text-white/80">
            NCLEXBase takes you from a cold start to a scored readiness exam, in three steps, without guessing what to study next.
          </p>
          <Link
            href="/auth/join"
            className="mt-9 inline-flex h-14 items-center rounded-lg bg-white px-8 text-lg font-semibold text-primary shadow-premium transition-transform duration-[50ms] hover:bg-primary-light active:translate-y-[2px] active:shadow-none"
          >
            Start free
          </Link>
          <p className="mt-5 text-sm text-white/60">No card needed.</p>
        </div>

        {/* The one visual: the route itself, as a path rather than a list. */}
        <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <ol className="grid gap-5 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.n} className="relative rounded-card bg-surface p-6 shadow-card">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary text-base font-bold text-gold">{step.n}</span>
                <h2 className="mt-4 font-bold text-ink">{step.title}</h2>
                <p className="mt-1.5 text-[15px] leading-6 text-muted">{step.body}</p>
                {/* The connector is decoration between the cards, so it is hidden from
                    assistive tech and only drawn where the cards sit side by side. */}
                {index < STEPS.length - 1 && (
                  <span aria-hidden className="absolute top-1/2 -right-5 hidden w-5 border-t-2 border-dashed border-white/40 lg:block" />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What is in it --------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">What you study with</h2>
        <div className="mt-10 grid gap-x-12 gap-y-9 sm:grid-cols-2">
          {PARTS.map((part) => (
            <div key={part.title}>
              <h3 className="font-bold text-ink">{part.title}</h3>
              <p className="mt-1.5 text-[15px] leading-6 text-muted">{part.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The explanation claim ------------------------------------------- */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Every question tells you why</h2>
            <p className="mt-4 text-lg leading-7 text-muted">
              The reasoning for the right answer, and for each wrong one. That is the difference between a practice question and a quiz: a
              missed item becomes the thing you learned that day.
            </p>
          </div>
          <blockquote className="rounded-card border-l-2 border-gold bg-background px-6 py-5">
            <p className="font-exam text-[15px] leading-7 text-exam-ink">
              “Digoxin is withheld for an apical pulse under 60/min. A potassium of 4.2 mEq/L, a blood pressure of 132/80 mm Hg and a digoxin
              level of 1.0 ng/mL are all within range — none of them is a reason to hold the dose.”
            </p>
            <footer className="mt-3 text-xs font-semibold tracking-wider text-faint uppercase">An explanation, in full</footer>
          </blockquote>
        </div>
      </section>

      {/* Close ------------------------------------------------------------ */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-ink">Step one takes ten minutes.</h2>
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
