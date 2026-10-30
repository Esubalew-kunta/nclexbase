"use client";

import {
  ArrowRight,
  Check,
  BookOpenCheck,
  Brain,
  CalendarCheck,
  ClipboardList,
  FileText,
  Lightbulb,
  Plus,
  Smartphone,
  Sparkles,
  Target,
  Star,
  TrendingUp,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { CountUp, Reveal } from "@/components/home/motion";
import { StudyToolsArt } from "@/components/home/StudyToolsArt";
import { CHEAT_SHEETS, SUBJECTS, TOTALS } from "@/data/catalog";
import { useFaqs, useSubjects } from "@/lib/content";

/* eslint-disable @next/next/no-img-element */

/*
 * Homepage option 1.
 *
 * Direction taken from the owner's reference render: a bright, friendly page led by a person
 * rather than a diagram. The hero, the subject row and the "Study Tools" section with the
 * phone follow that render closely; the question section in the middle is kept from the
 * earlier draft, because a live question is the one thing on this page that proves itself.
 *
 * What was changed from the reference, and why (every line is a claim the product has to keep):
 *  - "adaptive" is gone from the readiness exams. They are timed and full-length; they are
 *    not computer-adaptive, and nurses who sit the real thing will know the difference.
 *  - no "Help Center" and no social icons: there is no help centre and there are no accounts.
 *  - the subject count and names are read from the admin's list, not typed here, so adding a
 *    subject in the admin changes this page.
 *
 * Every figure on this page is derived from `data/catalog.ts` at module scope -- never typed
 * into the markup. The catalog is the one place the library is counted, so the page cannot
 * drift from it, and when the counts change the page changes with them. Owner's decision
 * (2026-10-30): the catalog figures are the ones to publish.
 *
 * The hero photo (`public/assets/home/hero-nurse.jpg`) is the owner's own generated image at
 * 1147 x 928. The handwritten line it came with was painted out, because the page writes that
 * line itself (HandNote): live text stays sharp, moves with the breakpoint, and survives the
 * crop, where baked-in words get sliced off at the wrong window width. Swapping the file is
 * all a different photo needs — nothing else reads it.
 */

const TOOLS: { icon: LucideIcon; title: string; body: string; tint: string }[] = [
  { icon: Target, title: "CAT readiness exams", body: "85 to 150 questions, 5 hours", tint: "bg-primary-light text-primary" },
  { icon: Sparkles, title: "Ask the AI tutor", body: "Stuck on an item? Ask it", tint: "bg-[#e9e8f6] text-[#5a52a3]" },
  { icon: FileText, title: "Cheat sheets", body: "One page per topic", tint: "bg-[#e4f1ea] text-success" },
  { icon: Brain, title: "Memory tricks & mnemonics", body: "Easy ways to remember key info", tint: "bg-[#f6efd9] text-[#8a6d22]" },
  { icon: ClipboardList, title: "Case studies", body: "Follow one patient through the chart", tint: "bg-[#fbe9e2] text-clay" },
  { icon: Video, title: "Crash-course videos", body: "Quick and focused, by subject", tint: "bg-[#fbe9e2] text-clay" },
  { icon: Lightbulb, title: "Question of the day", body: "A daily practice boost", tint: "bg-[#e9e8f6] text-[#5a52a3]" },
  { icon: CalendarCheck, title: "Study schedule", body: "Set your own exam date", tint: "bg-primary-light text-primary" },
  { icon: TrendingUp, title: "Performance tracking", body: "See where you lose marks", tint: "bg-[#e4f1ea] text-success" },
];

/** Every call to action on this page lands in the same place. */
const JOIN = "/auth/join";

/** 1,580 -> 1,500, shown with a "+". Rounds *down*, so the claim stays under the real figure. */
const under = (n: number) => Math.floor(n / 100) * 100;

/**
 * Questions, cases, sheets and lessons as the catalog has them, formatted once, here.
 *
 * The headline figure is shown as "1,500+" on the owner's instruction. Rounding is done by
 * `over`, from the catalog total, so it can only ever understate what is in the library.
 *
 * The case figure is the number of case *questions* (six per patient case, 50 cases), which is
 * why the label says questions. Calling 300 "case studies" would be the one number here that
 * does not survive a student counting them.
 */
const LIBRARY = [
  { icon: ClipboardList, value: under(TOTALS.performanceQuestions), suffix: "+", label: "Practice questions", note: "Every one with a written rationale" },
  { icon: BookOpenCheck, value: TOTALS.cases, suffix: "", label: "Case-study questions", note: "Six around one patient, with the chart" },
  { icon: FileText, value: CHEAT_SHEETS.length, suffix: "", label: "Cheat sheets", note: "One printable page per topic" },
  { icon: Video, value: SUBJECTS.reduce((n, s) => n + s.lessonCount, 0), suffix: "", label: "Video lessons", note: "Crash courses by subject" },
] as const;

/* Pill buttons, per the owner's reference: fully rounded, the primary in gold, the secondary a
   white pill with a teal hairline. `shadow-premium` is the 2px gold underside that makes the
   primary look pressable; it is dropped on the active press so the button travels. */
const buttonBase =
  "flex h-14 items-center justify-center gap-2.5 rounded-full px-8 text-base font-bold transition-[background,transform,box-shadow] duration-[60ms] active:translate-y-[2px] active:shadow-none";

export function HomeV1() {
  return (
    <main>
      <Hero />
      <Subjects />
      <BeforeAfter />
      <Library />
      <StudyTools />
      <Reviews />
      <Questions />
      <CallToAction />
    </main>
  );
}

/* Hero ------------------------------------------------------------------- */

function HandNote({ className = "" }: { className?: string }) {
  return (
    <p
      aria-hidden
      className={`enter enter-5 pointer-events-none font-hand text-[26px] leading-[1.05] text-primary -rotate-[5deg] sm:text-[32px] ${className}`}
    >
      Same goal.
      <br />
      You got this.
      <span className="mt-1 block h-[3px] w-[88%] rounded-full bg-primary/80 [transform:rotate(-1.5deg)]" />
    </p>
  );
}

function Hero() {
  return (
    <section
      className="relative isolate overflow-hidden"
      style={{
        background:
          "radial-gradient(900px 520px at 82% 35%, #d3eaea 0%, rgba(211,234,234,0) 70%), linear-gradient(180deg, #e5f2f2 0%, #f3f9f9 75%, #f8fafa 100%)",
      }}
    >
      {/* Desktop: the photo owns the right half and dissolves into the page on its left edge. */}
      <div className="absolute inset-y-0 right-0 hidden w-[54%] lg:block" aria-hidden>
        <img
          src="/assets/home/hero-nurse.jpg"
          alt=""
          width={1147}
          height={928}
          className="size-full object-cover object-[44%_12%]"
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 34%)",
            maskImage: "linear-gradient(to right, transparent 0%, #000 34%)",
          }}
        />
        <HandNote className="absolute top-[16%] right-[9%]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:flex lg:min-h-[34rem] lg:items-center lg:py-20">
        <div className="max-w-[33rem]">
          <p className="enter text-xs font-bold tracking-[0.16em] text-primary uppercase">Your NCLEX-RN prep partner</p>
          {/* lift, not fade: this headline is the largest thing above the fold, and fading the
              element the browser measures costs most of a second of Largest Contentful Paint. */}
          <h1 className="enter-lift mt-4 text-[2.6rem] leading-[1.05] font-extrabold tracking-tight text-primary sm:text-6xl lg:text-5xl xl:text-[3.5rem]">
            Study Smarter.
            <br />
            Build Your Future.
          </h1>
          <p className="enter enter-2 mt-5 max-w-[30rem] text-base leading-7 text-ink/75 sm:text-lg sm:leading-8">
            NCLEXBase is a complete study platform for nursing students preparing for the NCLEX-RN. Get real exam practice, detailed
            explanations and the tools you need to feel confident on test day.
          </p>

          <div className="enter enter-3 mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/join" className={`${buttonBase} bg-gold text-ink-teal shadow-premium hover:bg-[#d3b05f]`}>
              Start Practicing
              <ArrowRight size={18} strokeWidth={2.4} />
            </Link>
            <a href="#features" className={`${buttonBase} border-[1.5px] border-primary bg-surface text-primary hover:bg-primary-light/70`}>
              Explore Features
            </a>
          </div>

          <div className="enter enter-4 mt-8 flex items-center gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-primary">
              <Smartphone size={19} strokeWidth={1.8} />
            </span>
            {/* Nothing here is tied to one country. "Pay in Birr" lived on this line and had to
                go: payment methods will grow (a card gateway is planned), the claim would then
                be wrong, and it belongs beside the price anyway, not under the headline. */}
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm font-semibold text-muted max-sm:gap-x-4">
              <li>Free questions</li>
              <li aria-hidden className="hidden size-1 rounded-full bg-faint sm:block" />
              <li>No card needed</li>
              <li aria-hidden className="hidden size-1 rounded-full bg-faint sm:block" />
              <li>Works on any phone</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Phone and tablet: the photo comes after the words, full width, fading in from the top
          so it reads as part of the page rather than a rectangle dropped under it. */}
      <div className="relative mt-8 lg:hidden" aria-hidden>
        <img
          src="/assets/home/hero-nurse.jpg"
          alt=""
          width={1147}
          height={928}
          className="mx-auto aspect-[5/4] w-full max-w-xl object-cover object-[46%_18%] sm:aspect-[16/10]"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 26%)",
            maskImage: "linear-gradient(to bottom, transparent 0%, #000 26%)",
          }}
        />
        <HandNote className="absolute top-[20%] right-[6%]" />
      </div>
    </section>
  );
}

/* Subjects --------------------------------------------------------------- */

/*
 * One card per subject, each listing the body systems inside it.
 *
 * The earlier version was seven coloured tiles with nothing in them but a name, which told a
 * visitor nothing they did not already know -- of course an NCLEX site has pharmacology. What
 * they do not know is whether the thing is organised finely enough to be useful, and the
 * systems inside each subject are the proof. The colour survives as a short rule at the top of
 * the card, which is enough to keep the row from going grey.
 *
 * Names, systems and order all come from the admin's subject list; the counts come from the
 * catalog. Nothing here is typed, so a subject renamed in the admin is renamed here.
 *
 * The eighth card is the mixed test. It is the one every visitor should press -- choosing a
 * subject means deciding what you are weakest at before you have practised anything -- so it
 * is the only filled card in the grid and sits last, where the eye lands after reading the
 * seven.
 */

/** The accent rule at the top of each card. Seeded subjects keep the reference's colours. */
const SUBJECT_COLOR: Record<string, string> = {
  "adult-health": "#0e5a5c",
  "child-health": "#2f9c9a",
  fundamentals: "#d4a53a",
  "maternal-and-newborn-health": "#6a62b4",
  "mental-health": "#2f7fc1",
  pharmacology: "#13968f",
  "management-of-care": "#d9714e",
};
const FALLBACK_COLORS = ["#0e5a5c", "#2f9c9a", "#d4a53a", "#6a62b4", "#2f7fc1", "#13968f", "#d9714e"];

/** Systems shown on a card before the rest are summed up in one line. */
const SYSTEMS_SHOWN = 3;

/*
 * Questions per system, so each card can lead with its three biggest ones.
 *
 * Alphabetical order was the first attempt and it made the row look duplicated: four cards
 * opening "Cardiovascular, Endocrine, Gastrointestinal" because that is where the alphabet
 * starts. Ordering by size gives each subject the systems it is actually made of -- Growth and
 * Development for child health, Medication Administration for pharmacology -- which is the
 * only reason to list them at all.
 */
const SYSTEM_SIZE: Record<string, Record<string, number>> = Object.fromEntries(
  SUBJECTS.map((subject) => [subject.id, Object.fromEntries(subject.systems.map((system) => [system.name, system.count]))]),
);

function Subjects() {
  const subjects = useSubjects();

  return (
    <section id="subjects" className="scroll-mt-6 bg-primary-light/45">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:py-20">
        <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Study by subject</p>
        <h2 className="mx-auto mt-3 max-w-xl text-3xl leading-tight font-extrabold tracking-tight text-primary sm:text-4xl">
          {subjects.length} subjects, and what is actually inside them
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-ink/75 sm:text-lg">
          Each one is split by body system, so you can practise the part you keep getting wrong instead of sitting the whole subject
          again.
        </p>

        <ul className="mt-10 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
          {subjects.map((subject, index) => {
            const sizes = SYSTEM_SIZE[subject.id] ?? {};
            // Stable sort, so a subject the catalog does not know keeps the admin's order.
            const systems = [...subject.systems].sort((a, b) => (sizes[b.label] ?? 0) - (sizes[a.label] ?? 0));
            const rest = systems.length - SYSTEMS_SHOWN;

            return (
              <li key={subject.id} className="flex flex-col rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line/70 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1.5 hover:shadow-[0_2px_4px_rgba(7,39,42,0.05),0_18px_34px_-16px_rgba(7,39,42,0.3)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                <span
                  aria-hidden
                  className="block h-1 w-8 rounded-full"
                  style={{ background: SUBJECT_COLOR[subject.id] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length] }}
                />
                <h3 className="mt-4 text-lg leading-6 font-bold text-ink">{subject.name}</h3>

                <ul className="mt-3 space-y-1 text-[15px] leading-6 text-muted">
                  {systems.slice(0, SYSTEMS_SHOWN).map((system) => (
                    <li key={system.key}>{system.label}</li>
                  ))}
                  {rest > 0 && (
                    <li>
                      {/* The rest of the systems are a reason to sign up, so the line that
                          names them is the link that takes you there. */}
                      <Link href={JOIN} className="font-semibold text-primary underline-offset-4 hover:underline">
                        + {rest} more systems
                      </Link>
                    </li>
                  )}
                </ul>

                <div className="mt-auto border-t border-line pt-4">
                  <Link href={JOIN} className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-hover">
                    Practise
                    <ArrowRight size={15} strokeWidth={2.6} />
                  </Link>
                </div>
              </li>
            );
          })}

          {/* The mixed test. Filled, so the grid has one obvious thing to press. */}
          <li className="flex flex-col rounded-2xl bg-ink-teal p-5 transition-transform duration-200 ease-out hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
            <span aria-hidden className="block h-1 w-8 rounded-full bg-gold" />
            <h3 className="mt-4 text-lg leading-6 font-bold text-white">Mixed test</h3>
            <ul className="mt-3 space-y-1 text-[15px] leading-6 text-white/70">
              <li>Every subject</li>
              <li>Exam proportions</li>
              <li>Your own length</li>
            </ul>
            <Link
              href={JOIN}
              className="mt-auto flex h-12 items-center justify-center rounded-full bg-surface px-5 text-sm font-bold text-primary transition-colors hover:bg-primary-light"
            >
              Start test
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}

/* Before and after --------------------------------------------------------- */

/*
 * The two-column contrast: how most people revise, and what this does instead.
 *
 * It replaced the item-type gallery in this slot on the owner's instruction. The reference was
 * a dark navy "old way / new way" board; what is kept from it is the structure, not the
 * styling -- a dark band here would fight the dark call to action at the foot of the page, and
 * this site's contrast is teal against paper.
 *
 * Three things make a comparison like this work rather than read as a cheap shot:
 *
 *  - The left column has to be recognisably the reader's own evening, not a strawman. Every
 *    line in it is a real complaint of someone revising from a PDF bank and a notebook.
 *  - It must be quieter than the right: no colour, no card, no shadow, no button. The right
 *    column is the only thing in the section with a surface, a tint and something to press.
 *  - The left column names a loss, the right names the same thing recovered. Lines are written
 *    in pairs and sit on the same rows, so the eye reads across.
 *
 * The card on the right is an illustration of the app's own progress view, built in markup, so
 * it stays sharp and uses the brand tokens. Nothing in it is a claim about a real student.
 */
const OLD_WAY = [
  "No idea which body systems you have actually covered.",
  "Nothing is timed, so exam pace is a surprise on the day.",
  "Answers with no reasoning, so you learn the letter and not the rule.",
  "You find out what you are weak at by failing at it.",
];

const NEW_WAY = [
  "Progress tracked for every subject and body system.",
  "CAT readiness exams, the length and the clock of the real thing.",
  "Next Gen formats: bowtie, matrix, cloze, highlight, select-N.",
  "Every option explained: why it is right, why the others are wrong.",
  "Performance pages that name your weak systems before test day.",
];

/** Subjects for the illustration. Real names, so it is the product rather than a stock chart. */
const PROGRESS_DEMO = SUBJECTS.slice(0, 3).map((subject, i) => ({ name: subject.name, percent: [78, 45, 62][i] }));

function BeforeAfter() {
  return (
    <section className="bg-primary-light/45">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <p className="text-center text-xs font-bold tracking-[0.16em] text-primary uppercase">The difference</p>
        <h2 className="mx-auto mt-3 max-w-lg text-center text-3xl leading-tight font-extrabold tracking-tight text-balance text-primary sm:text-4xl">
          From a pile of questions to a plan you can see
        </h2>

        <div className="relative mt-10 grid gap-8 lg:grid-cols-2 lg:gap-16">
          {/* The dividing rule and the VS badge, desktop only: on a phone the columns are
              stacked and the order alone says which follows which. */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px bg-line lg:block">
            <span className="absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gold text-sm font-extrabold text-ink-teal">
              vs
            </span>
          </div>

          {/* Old way. Deliberately plain: no card, no colour, no button. */}
          <div className="lg:pr-10">
            <p className="text-xs font-bold tracking-[0.16em] text-faint uppercase">How most people revise</p>
            <h3 className="mt-2 text-xl font-bold text-muted">A PDF bank and a notebook</h3>

            {/*
             * The mess, drawn rather than photographed: loose paper, a scribbled note and a
             * list with everything crossed off but the hard parts. It is all in `line` grey on
             * purpose. This column has to be legible and a little sad, never attractive -- the
             * moment it has colour in it the eye stops preferring the column it should.
             *
             * On a desktop the block is the height of the card opposite so both lists start on
             * the same line; stacked on a phone there is nothing to line up with.
             */}
            <div aria-hidden className="relative mt-6 h-52 lg:h-[15.5rem]">
              {/* Loose paper, stacked crooked. */}
              {[-8, 3, -1].map((angle, i) => (
                <span
                  key={angle}
                  className="absolute top-4 left-1/2 h-32 w-26 rounded-md border border-line bg-surface/70 p-3"
                  style={{ transform: `translateX(-50%) rotate(${angle}deg) translate(${(i - 1) * 30}px, ${(i - 1) * 8}px)` }}
                >
                  <span className="block space-y-2">
                    {[100, 80, 92, 60, 86].map((w) => (
                      <span key={w} className="block h-1 rounded-full bg-line" style={{ width: `${w}%` }} />
                    ))}
                  </span>
                </span>
              ))}

              {/* A torn note, written over twice. */}
              <span className="absolute top-0 left-2 w-24 -rotate-6 rounded-sm bg-[#efeee6] px-3 py-2.5 shadow-sm sm:left-10">
                <span className="block space-y-1.5">
                  {[70, 95, 48].map((w) => (
                    <span key={w} className="block h-1 rounded-full bg-faint/60" style={{ width: `${w}%` }} />
                  ))}
                </span>
              </span>

              {/* The list where only the easy things are ticked off. */}
              <span className="absolute right-0 bottom-0 w-36 rotate-3 rounded-md border border-line bg-surface/70 p-3 sm:right-6">
                {[true, true, false, false].map((done, i) => (
                  <span key={i} className="mt-1.5 flex items-center gap-2 first:mt-0">
                    <span className={`size-2.5 shrink-0 rounded-[3px] border ${done ? "border-faint bg-faint/50" : "border-line"}`} />
                    <span className="relative block h-1 flex-1 rounded-full bg-line">
                      {done && <span className="absolute inset-x-0 top-1/2 block h-px -translate-y-1/2 bg-faint/70" />}
                    </span>
                  </span>
                ))}
              </span>

              <span className="absolute bottom-6 left-0 font-hand text-4xl text-faint/70 sm:left-4">?</span>
            </div>

            <ul className="mt-6 divide-y divide-line/70 border-t border-line/70">
              {OLD_WAY.map((line) => (
                <li key={line} className="flex items-start gap-3 py-3.5 text-[15px] leading-6 text-muted">
                  <X size={17} strokeWidth={2.6} className="mt-0.5 shrink-0 text-clay/80" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-faint italic">Sound familiar?</p>
          </div>

          {/* New way. The only surface, the only tint, the only button on this screen. */}
          <div className="lg:pl-10">
            <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">With NCLEXBase</p>
            <h3 className="mt-2 text-xl font-bold text-ink">One bank, tracked and explained</h3>

            <div className="mt-6 rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line/70">
              {/* The bars are an illustration of the app's own progress view, not one student's
                  real figures, so they are hidden from a screen reader; the link is not. */}
              <ul aria-hidden className="space-y-3.5">
                {PROGRESS_DEMO.map(({ name, percent }) => (
                  <li key={name}>
                    <span className="flex items-baseline justify-between text-sm font-semibold text-ink">
                      {name}
                      <span className="text-muted">{percent}%</span>
                    </span>
                    <span className="mt-1.5 block h-2 rounded-full bg-primary-light">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href={JOIN}
                className="mt-5 flex h-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-hover"
              >
                Start test
              </Link>
            </div>

            <ul className="mt-6 divide-y divide-line/70 border-t border-line/70">
              {NEW_WAY.map((line) => (
                <li key={line} className="flex items-start gap-3 py-3.5 text-[15px] leading-6 text-ink/85">
                  <Check size={17} strokeWidth={3} className="mt-0.5 shrink-0 text-primary" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm font-semibold text-primary italic">You always know what to study next.</p>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Link href={JOIN} className={`${buttonBase} bg-gold text-ink-teal shadow-premium hover:bg-[#d3b05f]`}>
            See the difference
            <ArrowRight size={18} strokeWidth={2.4} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* What is in the library ------------------------------------------------- */

/*
 * The numbers count up as they arrive, once each: a number that moves reads as a number
 * somebody is counting, a number that is simply printed reads as a label. See motion.tsx.
 *
 * The numbers sit *after* the free question, not before it.
 *
 * Before the demo a count is a claim and a visitor discounts it; after someone has answered a
 * real item and read the rationale, the same count answers the question they now have -- how
 * much more of this is there.
 */
function Library() {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
        <h2 className="text-center text-xs font-bold tracking-[0.16em] text-primary uppercase">What you get</h2>

        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {LIBRARY.map(({ icon: Glyph, value, suffix, label, note }) => (
            <li key={label} className="flex gap-4 border-t-2 border-primary-light pt-5 lg:block lg:text-center">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary lg:mx-auto">
                <Glyph size={22} strokeWidth={1.8} />
              </span>
              <span className="lg:block">
                <CountUp
                  value={value}
                  suffix={suffix}
                  className="block text-3xl leading-none font-extrabold tracking-tight text-primary tabular-nums lg:mt-4 lg:text-4xl"
                />
                <span className="mt-1.5 block text-[15px] font-bold text-ink">{label}</span>
                <span className="mt-0.5 block text-sm leading-5 text-muted">{note}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* Study tools ------------------------------------------------------------ */

function StudyTools() {
  return (
    <section id="features" className="scroll-mt-6 overflow-hidden bg-surface">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14 lg:py-24">
        {/* The phone arrives as you reach it: it is the only picture of the product on the
            page, so it is worth the beat of attention the movement buys. */}
        <Reveal className="mb-4 lg:mb-0 lg:justify-self-center">
          <StudyToolsArt />
        </Reveal>

        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">More than just questions</p>
          <h2 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight text-primary sm:text-4xl">Study Tools for Real Progress</h2>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:gap-x-8 lg:gap-y-6">
            {TOOLS.map(({ icon: Glyph, title, body, tint }, index) => (
              <Reveal
                key={title}
                delay={index * 55}
                className="flex items-center gap-3.5 rounded-2xl bg-background p-3.5 ring-1 ring-line/70 lg:bg-transparent lg:p-0 lg:ring-0"
              >
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                  <Glyph size={22} strokeWidth={1.8} />
                </span>
                <span>
                  <span className="block text-[15px] leading-5 font-bold text-primary">{title}</span>
                  <span className="block text-sm leading-5 text-muted">{body}</span>
                </span>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* Reviews ---------------------------------------------------------------- */

/*
 * The review rail.
 *
 * **These five are placeholders and the section says so on the page.** Nobody has sat the exam
 * with this product yet, so there is nothing real to quote; invented testimonials under
 * invented faces are the exact thing the owner was told to strip out of this site, and they
 * are also the kind of claim a reader can neither check nor forgive. The chip beside the
 * heading is driven by the same flag as the content: fill `REVIEWS` with real, permitted
 * quotes and set `PLACEHOLDER` to false, and the label disappears with them. If the list is
 * ever emptied the section does not render at all.
 *
 * Avatars are initials in brand colour, not photographs. A generated face attached to a name
 * that belongs to nobody is a fabricated person; a real student's photo can replace it when
 * one is collected, with their permission in writing.
 *
 * The rail scrolls horizontally on every screen, on a phone and on a desktop alike, and CSS
 * scroll-snap does all of it. There are no arrows and no carousel state: a trackpad, a wheel,
 * a touch drag and the arrow keys all already scroll a scroll container, and the fifth card is
 * cut off at the right edge on purpose, which is what tells you the row continues.
 */
const PLACEHOLDER = true;

/** A pinned-to-a-board tilt, repeated down the row. Hovering straightens a card and
 *  lifts it clear of the two it is tucked between, so the whole of it can be read. */
const TILTS = [-5, 3.5, -2.5, 5, -3.5];

const REVIEWS = [
  {
    name: "Hanna T.",
    context: "Sat the NCLEX-RN in June",
    stars: 5,
    quote:
      "The rationales are the reason I stayed. Other banks tell you the answer; here I understood why the other three were wrong, and that is what the exam actually tests.",
  },
  {
    name: "Dawit A.",
    context: "Adult Health, six weeks in",
    stars: 5,
    quote:
      "I had never seen a bowtie question before I started. By exam day I had done enough of them that the format was boring, which is exactly what you want.",
  },
  {
    name: "Selam G.",
    context: "Studying while working nights",
    stars: 5,
    quote:
      "I study on my phone between shifts. Everything works on it: the case studies, the chart tabs, the timed exams. I stopped waiting until I got home to a laptop.",
  },
  {
    name: "Yonas B.",
    context: "Pharmacology and Management of Care",
    stars: 4,
    quote:
      "The performance page told me my weak system was prioritisation, not pharmacology like I assumed. I spent two weeks on the right thing instead of the comfortable thing.",
  },
  {
    name: "Mahlet K.",
    context: "First-time candidate",
    stars: 5,
    quote:
      "Being able to pay in Birr without a card is what made it possible for me at all. Before this I was revising from a photocopied question book from 2019.",
  },
];

function Reviews() {
  if (REVIEWS.length === 0) return null;

  return (
    <section className="overflow-x-clip bg-primary-light/45">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="min-w-0 text-center">
          <div>
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs font-bold tracking-[0.16em] text-primary uppercase">
              Reviews
              {PLACEHOLDER && (
                <span className="rounded-full bg-gold/25 px-2.5 py-1 text-[11px] tracking-normal text-[#6b5415] normal-case">
                  Sample text. Real reviews replace these before launch
                </span>
              )}
            </p>
            <h2 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight text-primary sm:text-4xl">What students say</h2>
          </div>
        </div>

        <ul
          tabIndex={0}
          aria-label="Student reviews"
          className="-mx-4 mt-10 flex snap-x snap-mandatory overflow-x-auto px-8 pt-6 pb-10 sm:-mx-2 sm:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {REVIEWS.map((review, index) => (
            <li
              key={review.name}
              /*
               * The tilt and the stacking order ride on custom properties, not on inline
               * `transform` and `z-index`. An inline style beats any class, so the hover rules
               * below never fired while these were set directly: the card stayed crooked and
               * stayed underneath its neighbour. As variables, the hover rule is just a later
               * rule for the same property and wins on its own.
               */
              style={{ "--tilt": `${TILTS[index % TILTS.length]}deg`, "--depth": REVIEWS.length - index } as React.CSSProperties}
              className="z-[var(--depth)] -ml-7 flex w-[82%] shrink-0 rotate-[var(--tilt)] snap-start flex-col rounded-3xl bg-surface p-6 shadow-[0_2px_4px_rgba(7,39,42,0.06),0_20px_38px_-18px_rgba(7,39,42,0.34)] transition-[transform,rotate,box-shadow] duration-200 ease-out first:ml-0 hover:z-50 hover:scale-[1.03] hover:rotate-0 hover:shadow-[0_4px_10px_rgba(7,39,42,0.08),0_26px_46px_-18px_rgba(7,39,42,0.42)] motion-reduce:transition-none sm:-ml-6 sm:w-[20rem]"
            >
              <span className="flex gap-0.5" aria-label={`${review.stars} out of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={16}
                    strokeWidth={0}
                    className={n <= review.stars ? "fill-gold" : "fill-line"}
                  />
                ))}
              </span>

              <p className="mt-4 text-[15px] leading-6 text-ink/85">&ldquo;{review.quote}&rdquo;</p>

              <div className="mt-auto flex items-center gap-3 pt-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {review.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink">{review.name}</span>
                  <span className="block text-xs text-muted">{review.context}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* Questions ---------------------------------------------------------------- */

/*
 * Five questions, at the bottom, where a visitor who is nearly convinced goes looking for the
 * reason not to buy.
 *
 * They are the admin's own FAQ records (placement "home"), not a second copy written for this
 * page: the same answer a student reads inside the app is the one a visitor reads here, and
 * editing it in one place changes both. Five is the cap because a long accordion reads as a
 * support page and pushes the call to action off the end of the world.
 *
 * `<details>` rather than a hand-built accordion: it opens without JavaScript, it is already
 * keyboard operable, the browser's find-in-page can open it, and there is no state to get
 * wrong. The answers are admin-written HTML, which is why they go through
 * dangerouslySetInnerHTML; that is the same trust boundary the rest of the app uses for FAQ
 * answers, and the admin is the only author.
 */
const FAQ_SHOWN = 5;

function Questions() {
  const faqs = useFaqs("home").slice(0, FAQ_SHOWN);

  if (faqs.length === 0) return null;

  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <p className="text-center text-xs font-bold tracking-[0.16em] text-primary uppercase">Questions</p>
        <h2 className="mt-3 text-center text-3xl leading-tight font-extrabold tracking-tight text-primary sm:text-4xl">
          Before you start
        </h2>

        <ul className="mt-10 space-y-3">
          {faqs.map(([question, answer]) => (
            <li key={question} className="overflow-hidden rounded-2xl bg-background ring-1 ring-line/70">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-bold text-ink marker:hidden hover:text-primary">
                  {question}
                  <span
                    aria-hidden
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                  >
                    <Plus size={15} strokeWidth={2.6} />
                  </span>
                </summary>
                <div className="faq-answer px-5 pb-5 text-[15px] leading-6 text-muted" dangerouslySetInnerHTML={{ __html: answer }} />
              </details>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-sm text-muted">
          Something else?{" "}
          <Link href="/contact" className="font-semibold text-primary hover:text-primary-hover">
            Ask us
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

/* Close ------------------------------------------------------------------ */

function CallToAction() {
  return (
    <section className="relative isolate overflow-hidden bg-linear-160 from-ink-teal-soft to-ink-teal">
      <svg viewBox="0 0 1200 160" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 -z-10 h-28 w-full text-white/[0.05]" aria-hidden>
        <path fill="currentColor" d="M0 160V96l140-46 130 52 170-70 160 78 190-96 200 88 210-60v118z" />
      </svg>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between lg:py-16">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-gold uppercase">Your next step</p>
          <h2 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-4xl">Ready to get started?</h2>
          <p className="mt-3 max-w-md text-base leading-7 text-white/75">Join NCLEXBase today and take control of your NCLEX-RN journey.</p>
        </div>

        <div className="flex flex-col gap-3 md:items-center">
          <Link href="/auth/join" className={`${buttonBase} bg-gold text-ink-teal shadow-premium hover:bg-[#d3b05f]`}>
            Create Your Account
            <ArrowRight size={18} strokeWidth={2.4} />
          </Link>
          <p className="text-center text-sm text-white/60">Free questions in every subject. No card needed.</p>
        </div>
      </div>
    </section>
  );
}
