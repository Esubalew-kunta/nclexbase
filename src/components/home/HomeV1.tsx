"use client";

import Link from "next/link";

/*
 * Homepage option 1 — "The Question."
 *
 * The argument: show the thing. The hero puts a real NCLEX item on screen next to six words,
 * because what a person buys here is the questions, and a screenshot of the questions is a
 * stronger claim than any sentence about them.
 *
 * It is also the only honest way to lead right now. bootcamp.com opens with 200,000 students,
 * a 99% pass rate and a wall of testimonials; we have none of that and will not borrow it. A
 * real question owes nobody a number.
 *
 * Four sections. bootcamp.com's page has eleven.
 *
 * The item below is written in rather than read from the bank: the bank sits behind
 * `auth:sanctum` (it is the paid product), so a public page cannot fetch one. It is a real
 * seeded question, kept short on purpose — a visitor should be able to answer it.
 */

const SAMPLE = {
  subject: "Pharmacology",
  system: "Cardiovascular",
  // The stem is written out in the markup rather than held here, because the exam bolds the
  // keyword and a marketing page should not be interpolating HTML to do it.
  options: ["Apical pulse of 54/min", "Serum potassium of 4.2 mEq/L", "Blood pressure of 132/80 mm Hg", "Digoxin level of 1.0 ng/mL"],
  answer: 0,
  why: "Digoxin is withheld for an apical pulse under 60/min. The other three findings are all within range.",
};

const INCLUDED = [
  { title: "Standalone questions", body: "Every NGN item type, written the way the exam writes them." },
  { title: "Next Gen case studies", body: "Six-item unfolding cases with the tabbed chart the exam uses." },
  { title: "CAT readiness exams", body: "Adaptive, timed, and scored the way the real thing scores." },
  { title: "Cheat sheets", body: "One page per must-know topic, for the day before." },
];

export function HomeV1() {
  return (
    <main>
      {/* Hero ------------------------------------------------------------ */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:py-24">
          <div>
            <h1 className="text-4xl leading-[1.08] font-extrabold tracking-tight text-ink sm:text-5xl">
              Practice on questions
              <br />
              that read like the exam.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-7 text-muted">
              Not summaries of the NCLEX. The questions themselves — with the reasoning written out underneath every one.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/auth/join"
                className="flex h-14 items-center rounded-lg bg-primary px-7 text-lg font-semibold text-white shadow-press transition-[background,transform] duration-[50ms] hover:bg-primary-hover active:translate-y-[2px] active:shadow-none"
              >
                Start free
              </Link>
              <Link href="/about" className="flex h-14 items-center px-4 text-base font-semibold text-primary hover:text-primary-hover">
                How it works
              </Link>
            </div>
            <p className="mt-5 text-sm text-faint">No card needed. Free questions in every subject.</p>
          </div>

          <QuestionCard />
        </div>
      </section>

      {/* What is included ------------------------------------------------ */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Four things, done properly</h2>
        <div className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2">
          {INCLUDED.map((item) => (
            <div key={item.title} className="border-t-2 border-primary-light pt-5">
              <h3 className="font-bold text-ink">{item.title}</h3>
              <p className="mt-1.5 text-[15px] leading-6 text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The explanation claim ------------------------------------------- */}
      <section className="border-y border-line bg-primary-light/60">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">The explanation is the product</h2>
          <p className="mt-4 text-lg leading-7 text-muted">
            A question you got wrong teaches you nothing until someone tells you why. Every item here has the reasoning for the right answer
            <em> and</em> for each wrong one, so a missed question is a lesson instead of a score.
          </p>
        </div>
      </section>

      {/* Close ------------------------------------------------------------ */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-ink">Answer one and see.</h2>
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
 * A still of the exam interface. Presentational only — no state, nothing selectable — so it
 * cannot drift into being a second, half-working copy of the real question renderer.
 */
function QuestionCard() {
  return (
    <div className="rounded-card border border-line bg-surface shadow-card">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3 text-xs font-semibold text-muted">
        <span className="rounded bg-primary-light px-2 py-0.5 text-primary">{SAMPLE.subject}</span>
        <span className="text-faint">{SAMPLE.system}</span>
        <span className="ml-auto text-faint">Sample item</span>
      </div>

      <div className="px-5 py-5">
        <p className="font-exam text-[15px] leading-6 text-exam-ink">
          The nurse is preparing to administer digoxin 0.125 mg PO to a client with heart failure. Which finding requires the nurse to{" "}
          <b>withhold</b> the medication?
        </p>

        <ul className="mt-4 space-y-2">
          {SAMPLE.options.map((option, index) => {
            const correct = index === SAMPLE.answer;
            return (
              <li
                key={option}
                className={`flex items-start gap-3 rounded-md border px-3 py-2.5 font-exam text-[15px] leading-6 ${
                  correct ? "border-success bg-success/10 text-exam-ink" : "border-line text-exam-ink"
                }`}
              >
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                    correct ? "border-success bg-success text-white" : "border-line text-faint"
                  }`}
                >
                  {correct ? "✓" : String.fromCharCode(65 + index)}
                </span>
                {option}
              </li>
            );
          })}
        </ul>

        <div className="mt-4 rounded-md border-l-2 border-gold bg-background px-4 py-3">
          <p className="mb-1 text-xs font-bold tracking-wider text-gold uppercase">Why</p>
          <p className="font-exam text-sm leading-6 text-exam-ink">{SAMPLE.why}</p>
        </div>
      </div>
    </div>
  );
}
