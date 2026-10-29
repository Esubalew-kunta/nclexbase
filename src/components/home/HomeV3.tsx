"use client";

import Link from "next/link";

/*
 * Homepage option 3 — "The Editorial."
 *
 * The argument: say less. Type, a gold rule, white space, one action. No cards, no grid of
 * tiles, no screenshot — it reads like a well-set page rather than a product site, and it is
 * the furthest of the three from bootcamp.com, whose page is eleven sections of features and
 * testimonials.
 *
 * This is the most literal answer to "simplistic, clear and simple", and it is the riskiest:
 * a reviewer expecting a product page may read restraint as an unfinished draft. Worth putting
 * in front of them precisely because that reaction is the thing to find out.
 *
 * Four sections, and the shortest page of the three.
 */

const PARTS = [
  {
    title: "Questions",
    body: "Every Next Gen item type, written the way the exam writes them — and an explanation under each one covering the right answer and every wrong answer.",
  },
  {
    title: "Case studies",
    body: "Six items around one patient whose condition unfolds as you read, with the same tabbed chart the exam gives you.",
  },
  {
    title: "Readiness exams",
    body: "Adaptive, timed and scored like the real test, so your first full-length exam is not on the day it counts.",
  },
  {
    title: "Cheat sheets",
    body: "A page per must-know topic, for the stage where you stop learning material and start holding on to it.",
  },
];

export function HomeV3() {
  return (
    <main>
      {/* Hero ------------------------------------------------------------ */}
      <section className="bg-surface">
        <div className="mx-auto max-w-3xl px-4 pt-24 pb-20 sm:px-6 lg:pt-32 lg:pb-28">
          <p className="text-xs font-bold tracking-[0.18em] text-gold uppercase">NCLEX-RN® preparation</p>
          <h1 className="mt-6 text-[2.6rem] leading-[1.06] font-extrabold tracking-tight text-ink sm:text-[3.5rem]">
            Learn it from the
            <br />
            questions themselves.
          </h1>
          <div className="mt-8 h-px w-20 bg-gold" />
          <p className="mt-8 max-w-xl text-xl leading-8 text-muted">
            No lecture series to sit through first. You answer an exam-style question, you read why the answer is the answer, and you do it
            again. That is the whole method.
          </p>
          <Link
            href="/auth/join"
            className="mt-10 inline-flex h-14 items-center rounded-lg bg-primary px-8 text-lg font-semibold text-white shadow-press transition-[background,transform] duration-[50ms] hover:bg-primary-hover active:translate-y-[2px] active:shadow-none"
          >
            Start free
          </Link>
          <p className="mt-4 text-sm text-faint">No card needed. Free questions in every subject.</p>
        </div>
      </section>

      {/* What it is ------------------------------------------------------- */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="text-xs font-bold tracking-[0.18em] text-muted uppercase">What is in it</h2>
          <dl className="mt-8">
            {PARTS.map((part) => (
              <div key={part.title} className="border-b border-line py-7 first:border-t">
                <dt className="text-xl font-bold tracking-tight text-ink">{part.title}</dt>
                <dd className="mt-2 text-[17px] leading-7 text-muted">{part.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* What it is not --------------------------------------------------- */}
      <section className="bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="text-xs font-bold tracking-[0.18em] text-muted uppercase">Plainly</h2>
          <p className="mt-7 text-xl leading-8 text-ink">
            NCLEXBase will not promise you a pass. Nobody can. What it can do is make sure the exam is not the first time you have seen a
            question written like that — which, for most people who fail, is the actual problem.
          </p>
        </div>
      </section>

      {/* Close ------------------------------------------------------------ */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink">Start with one question.</h2>
          <Link
            href="/auth/join"
            className="mt-7 inline-flex h-14 items-center rounded-lg bg-primary px-8 text-lg font-semibold text-white shadow-press transition-[background,transform] duration-[50ms] hover:bg-primary-hover active:translate-y-[2px] active:shadow-none"
          >
            Start free
          </Link>
        </div>
      </section>
    </main>
  );
}
