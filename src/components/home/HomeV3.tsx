"use client";

import Link from "next/link";
import { Bowtie, ItemGlyph } from "@/components/home/graphics";

/*
 * Homepage option 3 — "Eight ways of asking."
 *
 * The argument: the Next Gen item types are a visual language only this exam has, and nobody
 * in the category has used them as imagery. Bootcamp draws cartoon characters; UWorld shows
 * screenshots. A bowtie drawn correctly, at display scale, is simultaneously original artwork
 * we own outright, weightless SVG, and a credential — only someone who knows this exam draws
 * one.
 *
 * It also makes a claim that is specific, countable and verifiable without being a content
 * count: the exam has eight ways of asking, and you will have seen all eight. True at a
 * hundred items and true at three thousand.
 *
 * This replaces the first version's typography-only hero. Editorial restraint reads as
 * authority when the reader already trusts the publisher; for an unknown product with no
 * proof, white space reads as "there is nothing here yet". The restraint is kept — it is still
 * the quietest of the three — but it now has a subject.
 *
 * What it risks: abstraction. It proves we understand the exam's structure without proving the
 * content is any good, and a visitor who does not yet know what a bowtie is sees a diagram she
 * cannot read.
 */

const GLYPHS = [
  { kind: "matrix" as const, name: "Matrix", body: "One choice across each row of findings." },
  { kind: "cloze" as const, name: "Drag-and-drop cloze", body: "Words dropped into a sentence that has to end up true." },
  { kind: "highlight" as const, name: "Highlight", body: "The finding that matters, picked out of a passage." },
  { kind: "selectN" as const, name: "Select N", body: "Exactly how many apply — never all of them." },
];

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
    body: "Adaptive, timed and scored like the real test, so your first full-length exam is not the one that counts.",
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
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-14 sm:px-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-16 lg:pt-24 lg:pb-20">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-gold uppercase">NCLEX-RN® preparation</p>
            <h1 className="mt-6 font-display text-[2.5rem] leading-[1.06] font-medium tracking-tight text-ink sm:text-[3.25rem]">
              The exam has eight ways of asking.
            </h1>
            <div className="mt-7 h-px w-20 bg-gold" />
            <p className="mt-7 max-w-lg text-xl leading-8 text-muted">
              You will have seen all eight before you sit it — including the bowtie, which most people meet for the first time on the day.
            </p>
            <Link
              href="/auth/join"
              className="mt-9 inline-flex h-14 items-center rounded-lg bg-primary px-8 text-lg font-semibold text-white shadow-press transition-[background,transform] duration-[50ms] hover:bg-primary-hover active:translate-y-[2px] active:shadow-none"
            >
              Start free
            </Link>
            <p className="mt-4 text-sm text-faint">No card needed. Free questions in every subject.</p>
          </div>

          {/* The subject, at display scale. Labelled, because a diagram nobody can read is
              decoration — and the label is itself the thing being claimed. */}
          <figure className="lg:pl-4">
            <Bowtie className="h-auto w-full text-primary" strokeWidth={1.1} />
            <figcaption className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-line pt-4 text-sm text-muted">
              <span className="font-bold text-ink">Bowtie</span>
              <span>One condition. Two actions to take, two parameters to monitor.</span>
            </figcaption>
          </figure>
        </div>

        {/* The other four, as the same vocabulary at small scale. */}
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <ul className="grid gap-x-8 gap-y-7 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {GLYPHS.map((glyph) => (
              <li key={glyph.kind}>
                <ItemGlyph kind={glyph.kind} className="h-10 w-auto text-primary" />
                <h2 className="mt-3 text-sm font-bold text-ink">{glyph.name}</h2>
                <p className="mt-1 text-sm leading-6 text-muted">{glyph.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What it is ------------------------------------------------------- */}
      <section>
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="text-xs font-bold tracking-[0.18em] text-muted uppercase">What is in it</h2>
          <dl className="mt-8">
            {PARTS.map((part) => (
              <div key={part.title} className="border-b border-line py-7 first:border-t">
                <dt className="font-display text-2xl font-medium tracking-tight text-ink">{part.title}</dt>
                <dd className="mt-2 text-[17px] leading-7 text-muted">{part.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* The honest line -------------------------------------------------- */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <p className="font-display text-2xl leading-9 font-medium text-ink sm:text-[1.75rem]">
            NCLEXBase will not promise you a pass. Nobody can. What it can do is make sure the exam is not the first time you have seen a
            question written like that — which, for most people who fail, is the actual problem.
          </p>
        </div>
      </section>

      {/* Close ------------------------------------------------------------ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-medium tracking-tight text-ink">Start with one question.</h2>
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
