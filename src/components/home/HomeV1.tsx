"use client";

import Link from "next/link";
import { useState } from "react";
import { Bowtie, ChartSliver } from "@/components/home/graphics";

/*
 * Homepage option 1 — "Answer one."
 *
 * The argument, and the one I would ship: **item fidelity, demonstrated above the fold.**
 *
 * Trust online comes from social proof, institutional authority, demonstrated competence,
 * restraint or craft. We have no proof and no authority, so competence is what is left — and
 * it happens to be the strongest of the five, because this visitor is an expert evaluator of
 * exactly one thing. A nursing student three weeks out has worked hundreds of practice
 * questions. She knows the register of a real stem, the bolded keyword, four plausible
 * distractors. Put a correct NGN item in front of her and she *knows*, in about four seconds.
 * That is not a claim about proof; it is proof, and unlike "99% pass" it audits itself on
 * sight.
 *
 * So the question here is **live**, not a still. The first version of this hero was a
 * presentational card with the answer already revealed, and a dead picture of an interactive
 * thing reads as a mockup — the precise opposite of the impression needed. Giving away an
 * ungated question before asking for anything is itself the credibility signal: only someone
 * confident in the content does that.
 *
 * The imagery is the field and the planes, not a photograph. See graphics.tsx for why there is
 * no photography anywhere on this site.
 */

const OPTIONS = ["Apical pulse of 54/min", "Serum potassium of 4.2 mEq/L", "Blood pressure of 132/80 mm Hg", "Digoxin level of 1.0 ng/mL"];
const ANSWER = 0;

const RATIONALE: Record<number, string> = {
  0: "Correct. Digoxin is withheld for an apical pulse under 60/min — bradycardia is the earliest sign of toxicity, and giving the dose would slow conduction further.",
  1: "4.2 mEq/L is a normal potassium. It is worth watching, because hypokalaemia potentiates digoxin toxicity, but this value is no reason to hold the dose.",
  2: "132/80 mm Hg is an acceptable pressure. Digoxin is held for rate, not for blood pressure.",
  3: "1.0 ng/mL sits inside the therapeutic range of 0.5–2.0 ng/mL. A level above 2.0 would be the concern.",
};

const INCLUDED = [
  { title: "Every wrong answer explained", body: "Not just the right one. Each distractor gets the reasoning for why it is wrong, every time." },
  { title: "Eight Next Gen item types", body: "Matrix, bowtie, cloze, drop-down, highlight, select-N, SATA and multiple choice." },
  { title: "Cases with the real chart", body: "Six items around one patient, read through the tabbed chart the exam gives you." },
  { title: "Adaptive readiness exams", body: "Timed and scored the way the computer-adaptive test scores." },
];

export function HomeV1() {
  return (
    <main>
      {/* Hero ------------------------------------------------------------ */}
      <section className="relative isolate overflow-hidden bg-linear-160 from-ink-teal to-ink-teal-soft">
        {/*
         * The environment: the bowtie at roughly four times the card's height, anchored so its
         * centre sits off the right edge and the right-hand column is cropped away by the
         * viewport. Cropped, not contained.
         */}
        <Bowtie
          className="pointer-events-none absolute -top-16 -right-[22rem] hidden h-[42rem] w-auto text-white/7 lg:block"
          strokeWidth={0.6}
        />
        {/* Phone: a corner crop of the same shape rather than a shrunken copy of it. */}
        <Bowtie className="pointer-events-none absolute -top-10 -right-40 h-64 w-auto text-white/5 lg:hidden" strokeWidth={1} />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:py-24">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-gold uppercase">NCLEX-RN® preparation</p>
            <h1 className="mt-5 font-display text-[2.7rem] leading-[1.04] font-medium tracking-tight text-white sm:text-[3.4rem]">
              Try one.
              <br />
              Then decide.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-7 text-white/72">
              Every question is written the way the NCLEX writes them, and explained the way a good instructor would — the right answer, and
              every wrong one.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/auth/join"
                className="flex h-14 items-center rounded-lg bg-white px-7 text-lg font-semibold text-primary transition-[background,transform] duration-[50ms] hover:bg-primary-light active:translate-y-[2px]"
              >
                Start free
              </Link>
              <Link href="/about" className="flex h-14 items-center px-4 text-base font-semibold text-white/80 hover:text-white">
                How it works
              </Link>
            </div>
            <p className="mt-5 text-sm text-white/50">No card needed. Free questions in every subject.</p>
          </div>

          {/* The planes. Orthogonal offsets, no rotation, no blur, no glow — rotation reads as
              decoration, a hard 24/48px offset reads as considered. */}
          <div className="relative">
            <div className="pointer-events-none absolute top-6 -right-2 hidden w-[88%] lg:block" aria-hidden>
              <ChartSliver />
            </div>
            <div className="relative lg:mt-14 lg:mr-12">
              <LiveQuestion />
            </div>
          </div>
        </div>
      </section>

      {/* What is included ------------------------------------------------ */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-medium tracking-tight text-ink">Depth, not a bigger pile</h2>
        <p className="mt-3 max-w-xl text-lg leading-7 text-muted">
          Nobody writes two thousand questions and hand-writes a rationale for every wrong answer in all of them. We do it for every
          question we publish.
        </p>
        <div className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2">
          {INCLUDED.map((item) => (
            <div key={item.title} className="border-t-2 border-primary-light pt-5">
              <h3 className="font-bold text-ink">{item.title}</h3>
              <p className="mt-1.5 text-[15px] leading-6 text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The honest line. Mid-page, where it reads as integrity rather than as a disclaimer. */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <p className="font-display text-2xl leading-9 font-medium text-ink sm:text-[1.75rem]">
            NCLEXBase will not promise you a pass. Nobody can. What it can do is make sure the exam is not the first time you have seen a
            question written like that — which, for most people who fail, is the actual problem.
          </p>
        </div>
      </section>

      {/* Close ------------------------------------------------------------ */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-3xl font-medium tracking-tight text-ink">There are more where that came from.</h2>
        <Link
          href="/auth/join"
          className="mt-7 inline-flex h-14 items-center rounded-lg bg-primary px-8 text-lg font-semibold text-white shadow-press transition-[background,transform] duration-[50ms] hover:bg-primary-hover active:translate-y-[2px] active:shadow-none"
        >
          Start free
        </Link>
      </section>
    </main>
  );
}

/**
 * A real question, answerable before signing up.
 *
 * The item is written in rather than read from the bank: the bank sits behind `auth:sanctum`
 * because it is the paid product, so a public page cannot fetch one. This is a real seeded
 * item (`s-pharm-1`), chosen because digoxin and an apical pulse under 60 is the most
 * recognisable pharmacology fact on the exam — a student who knows it feels competent by
 * second three, one who does not learns something real by second eight, and both convert.
 */
function LiveQuestion() {
  const [picked, setPicked] = useState<number>();
  const answered = picked !== undefined;

  return (
    <div className="rounded-card bg-surface shadow-[0_2px_8px_0_rgba(0,0,0,0.18),0_18px_48px_-12px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3 text-xs font-semibold">
        <span className="rounded bg-primary-light px-2 py-0.5 text-primary">Pharmacology</span>
        <span className="text-faint">Cardiovascular</span>
        <span className="ml-auto text-faint">Try it</span>
      </div>

      <div className="px-5 py-5">
        <p className="font-exam text-[15px] leading-6 text-exam-ink">
          The nurse is preparing to administer digoxin 0.125 mg PO to a client with heart failure. Which finding requires the nurse to{" "}
          <b>withhold</b> the medication?
        </p>

        <ul className="mt-4 space-y-2">
          {OPTIONS.map((option, index) => {
            const isPicked = picked === index;
            const isAnswer = index === ANSWER;
            // Before an answer: plain. After: the correct one is always marked, and a wrong
            // pick is marked too, so the person sees both what they chose and what was right.
            const tone = !answered
              ? "border-line hover:border-primary hover:bg-primary-light/40"
              : isAnswer
                ? "border-success bg-success/10"
                : isPicked
                  ? "border-clay bg-clay/8"
                  : "border-line opacity-60";

            return (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => setPicked(index)}
                  aria-pressed={isPicked}
                  className={`flex min-h-11 w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left font-exam text-[15px] leading-6 text-exam-ink transition-colors ${tone}`}
                >
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                      answered && isAnswer
                        ? "border-success bg-success text-white"
                        : answered && isPicked
                          ? "border-clay bg-clay text-white"
                          : "border-line text-faint"
                    }`}
                  >
                    {answered && isAnswer ? "✓" : answered && isPicked ? "✕" : String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </button>
              </li>
            );
          })}
        </ul>

        {answered ? (
          // Opens inline and pushes the page. Never a modal: a modal would make the
          // explanation feel like an interruption instead of the point.
          <div className="mt-4 rounded-md border-l-2 border-gold bg-background px-4 py-3">
            <p className="mb-1 text-xs font-bold tracking-wider text-gold uppercase">
              {picked === ANSWER ? "Correct" : "Not this one"}
            </p>
            <p className="font-exam text-sm leading-6 text-exam-ink">{RATIONALE[picked]}</p>
            {picked !== ANSWER && <p className="mt-2 font-exam text-sm leading-6 text-exam-ink">{RATIONALE[ANSWER]}</p>}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Pick an answer to see the reasoning.</p>
        )}
      </div>
    </div>
  );
}
