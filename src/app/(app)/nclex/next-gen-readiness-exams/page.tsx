"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { READINESS_EXAMS, READINESS_FAQS } from "@/data/catalog";
import { useStore } from "@/lib/store";
import { scoreSession } from "@/lib/scoring";
import { Button, FaqList, Modal, PageHeader, ProgressBar, UpgradeButton } from "@/components/ui/primitives";
import { NumberedRow } from "@/components/ui/visuals";

export default function ReadinessPage() {
  const router = useRouter();
  const plan = useStore((s) => s.user.plan);
  const sessions = useStore((s) => s.sessions);
  const deleteSession = useStore((s) => s.deleteSession);
  const [confirm, setConfirm] = useState<string | null>(null);

  return (
    <>
      <PageHeader
        trail={[{ label: "Next Gen Readiness Exams" }]}
        title="Readiness Exams"
        description="These readiness exams simulate the look, feel, and content of the real Next Gen NCLEX. Use them to gauge your readiness to pass the NCLEX!"
      />
      <div className="mt-4">
        {READINESS_EXAMS.map((e) => {
          const attempt = sessions.filter((s) => s.kind === "readiness" && s.sourceId === e.id).at(-1);
          const answered = attempt ? Object.keys(attempt.submitted).length : 0;
          const unlocked = plan === "premium" || e.free;
          const intro = `/nclex/next-gen-readiness-exams/qbanks/${e.id}`;
          const open = () => {
            if (!unlocked) return router.push("/nclex/upgrade");
            if (attempt?.status === "ended") return router.push(`/nclex/previous-tests/review?id=${attempt.id}`);
            router.push(attempt ? `/nclex/custom-test?id=${attempt.id}` : intro);
          };
          return (
            <NumberedRow
              key={e.id}
              number={e.number}
              title={e.title}
              onClick={open}
              action={
                !unlocked ? (
                  <UpgradeButton />
                ) : attempt ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setConfirm(attempt.id);
                      }}
                    >
                      Reset
                    </Button>
                    <Button onClick={(ev) => (ev.stopPropagation(), open())}>{attempt.status === "ended" ? "Review" : "Resume"}</Button>
                  </div>
                ) : (
                  <Button onClick={(ev) => (ev.stopPropagation(), open())} className="min-w-[92px]">
                    Start
                  </Button>
                )
              }
            >
              <ProgressBar value={(answered / e.questions) * 100} className="mb-2" />
              <p className="text-base leading-6 text-muted">
                {attempt?.status === "ended" ? (
                  <>
                    Completed · <strong className="font-bold">{scoreSession(attempt).percent}%</strong>
                  </>
                ) : attempt ? (
                  "Paused"
                ) : (
                  <>
                    <strong className="font-bold">0</strong> of {e.questions} questions used
                  </>
                )}
              </p>
            </NumberedRow>
          );
        })}
      </div>
      <FaqList items={READINESS_FAQS} />

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Reset Readiness Exam"
        width={480}
        footer={
          <div className="flex justify-end gap-2 border-t border-[#ededf0] px-6 py-4">
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button onClick={() => (confirm && deleteSession(confirm), setConfirm(null))}>Reset</Button>
          </div>
        }
      >
        <p className="px-6 py-5 text-base leading-6 text-ink">Resetting this exam deletes your progress so you can start it again from question 1.</p>
      </Modal>
    </>
  );
}
