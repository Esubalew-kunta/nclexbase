"use client";

import { READINESS_EXAMS } from "@/data/catalog";
import { useStore } from "@/lib/store";
import { scoreSession } from "@/lib/scoring";
import { ButtonLink, FaqList, PageHeader, UpgradeButton } from "@/components/ui/primitives";
import { ProgressRow } from "@/components/ui/visuals";

const FAQS = [
  ["How are the readiness exams different from regular tests?", "Readiness exams are timed, 100-question exams that mirror the length and pacing of the real NCLEX®. Explanations appear only after you finish."],
  ["When should I take the readiness exams?", "Take them spaced out over your final weeks of study. The study schedule places them for you."],
  ["Do readiness exams count toward my Pass Targets?", "Yes. Attempting all 4 readiness exams is one of your three Pass Targets."],
] as const;

export default function ReadinessPage() {
  const plan = useStore((s) => s.user.plan);
  const sessions = useStore((s) => s.sessions);

  return (
    <>
      <PageHeader
        trail={[{ label: "Next Gen Readiness Exams" }]}
        title="Readiness Exams"
        description="Our readiness exams are designed to simulate the real Next Gen NCLEX. Take them to gauge your readiness before test day."
        experts={["emily", "cortney"]}
      />
      <div className="space-y-2">
        {READINESS_EXAMS.map((e) => {
          const attempt = sessions.filter((s) => s.kind === "readiness" && s.title === e.title).at(-1);
          const score = attempt ? scoreSession(attempt) : null;
          const answered = attempt ? Object.keys(attempt.submitted).length : 0;
          const unlocked = plan === "premium" || e.free;
          return (
            <ProgressRow
              key={e.id}
              number={e.number}
              title={e.title}
              used={answered}
              total={e.questions}
              action={
                !unlocked ? (
                  <UpgradeButton />
                ) : attempt?.status === "ended" ? (
                  <ButtonLink href={`/nclex/previous-tests/review?id=${attempt.id}`} variant="white" className="min-w-[92px]">
                    {score?.percent}% · Review
                  </ButtonLink>
                ) : (
                  <ButtonLink
                    href={attempt ? `/nclex/custom-test?id=${attempt.id}` : `/nclex/next-gen-readiness-exams/qbanks/${e.id}`}
                    className="min-w-[92px]"
                  >
                    {attempt ? "Resume" : "Start"}
                  </ButtonLink>
                )
              }
            />
          );
        })}
      </div>
      <FaqList items={FAQS} />
    </>
  );
}
