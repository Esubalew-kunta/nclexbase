import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Prose, Section } from "@/components/site/Prose";

export const metadata: Metadata = {
  title: "About us",
  description: "Why NCLEXBase exists, how it is built, and what it does not claim.",
};

/*
 * About us.
 *
 * Written to be read by a nursing student deciding whether to trust this, which means it says
 * what the thing is and what it will not promise. bootcamp.com's equivalent is a founder
 * story; this is the same idea without the pass guarantee, because we cannot stand behind one.
 *
 * It states no student numbers, pass rates or testimonials. We have none yet, and a claim
 * invented for a homepage is the one thing that cannot be walked back.
 */
export default function AboutPage() {
  return (
    <main>
      <PageHeader
        eyebrow="About us"
        title="Built around the questions."
        intro="NCLEXBase is an NCLEX-RN® preparation site for nurses and nursing students: exam-style questions, Next Gen case studies, adaptive readiness exams and cheat sheets, with the reasoning written out under every answer."
      />

      <Prose>
        <Section title="Why it exists">
          <p>
            Most people who fail the NCLEX do not fail because they never learned the material. They fail because the exam asks about it in
            a way they have not seen before — a matrix grid, a bowtie, six items about one patient whose condition changes as you read.
            Knowing that potassium matters is not the same as spotting, under time pressure, that it is the reason to hold a dose.
          </p>
          <p>
            So NCLEXBase is not a lecture series with a question bank attached. It is a question bank, with the teaching inside the
            explanations. You answer something written the way the exam writes it, you read why that answer is right and why the other three
            are wrong, and you do it again.
          </p>
        </Section>

        <Section title="How it is put together">
          <p>
            Every item is tagged to a subject and a system, so a test can be built from exactly the material you are weak at rather than
            from whatever comes next in a syllabus. Case studies use the same tabbed chart the real exam gives you — nurses&apos; notes,
            vital signs, laboratory results — because reading a chart under pressure is itself a skill being tested.
          </p>
          <p>
            Readiness exams are adaptive and timed, and scored the way the NCLEX scores. The point is not the number at the end. It is that
            your first full-length exam should not be the one that counts.
          </p>
        </Section>

        <Section title="What we do not claim">
          <p>
            We will not promise you a pass, and we would be careful with anyone who does. No prep site sits in the room with you, and no
            amount of practice makes a result certain.
          </p>
          <p>
            We also will not show you a pass rate or a student count we cannot stand behind. When there are real numbers to report, they
            will be real numbers, and they will be here.
          </p>
        </Section>

        <Section title="Where it is made">
          <p>
            NCLEXBase is built in Ethiopia, priced in birr, and takes payment by bank transfer and mobile wallet — because a prep site that
            only accepts a foreign credit card is no use to most of the nurses it is meant for.
          </p>
        </Section>

        <Section title="Questions, corrections, complaints">
          <p>
            If an explanation is wrong, tell us — we would rather fix it than defend it. The{" "}
            <Link href="/contact" className="font-semibold text-primary hover:text-primary-hover">
              contact page
            </Link>{" "}
            has the address, and a message about a specific question gets to whoever wrote it.
          </p>
        </Section>
      </Prose>
    </main>
  );
}
