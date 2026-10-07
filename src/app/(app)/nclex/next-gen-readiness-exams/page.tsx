"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { READINESS_EXAMS, READINESS_FAQS } from "@/data/catalog";
import { useStore } from "@/lib/store";
import { chanceOfPassing, scoreSession } from "@/lib/scoring";
import { Button, FaqList, Modal, PageHeader, UpgradeButton } from "@/components/ui/primitives";
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
        title="CAT Readiness Exams"
        description="These readiness exams simulate the look, feel, and content of the real Next Gen NCLEX. Use them to gauge your readiness to pass the NCLEX!"
      />
      <div className="mt-4">
        {READINESS_EXAMS.map((e) => {
          const attempts = sessions.filter((s) => s.kind === "readiness" && s.sourceId === e.id);
          const attempt = attempts.at(-1);
          const unlocked = plan === "premium" || e.free;
          const intro = `/nclex/next-gen-readiness-exams/qbanks/${e.id}`;
          const done = attempt?.status === "ended";
          const open = () => {
            if (!unlocked) return router.push("/nclex/upgrade");
            if (done) return router.push(`/nclex/previous-tests/review?id=${attempt!.id}`);
            router.push(attempt ? `/nclex/custom-test?id=${attempt.id}` : intro);
          };
          const chance = done ? chanceOfPassing(scoreSession(attempt!).percent) : null;
          const stat = (label: string, value: string, tone?: string) => (
            <div className="flex flex-col items-center px-4 text-center">
              <span className="text-sm leading-[14px] text-muted">{label}</span>
              <span className={clsx("mt-1.5 text-base leading-4 font-semibold", tone ?? "text-ink-strong")}>{value}</span>
            </div>
          );
          return (
            <NumberedRow
              key={e.id}
              number={e.number}
              title={e.title}
              onClick={open}
              action={
                !unlocked ? (
                  <UpgradeButton />
                ) : done ? (
                  <div className="flex items-center gap-3">
                    <div className="hidden divide-x divide-[#ededf0] sm:flex">
                      {stat("Date", new Date(attempt!.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }))}
                      {stat("Chance", chance!, chance === "Low" ? "text-[#e05e57]" : chance === "Borderline" ? "text-[#d09528]" : "text-[#4c8b43]")}
                      {stat("Attempt", String(attempts.length))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setConfirm(attempt!.id);
                      }}
                    >
                      Reset
                    </Button>
                    <Button onClick={(ev) => (ev.stopPropagation(), open())}>Review</Button>
                  </div>
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
                    <Button onClick={(ev) => (ev.stopPropagation(), open())}>Resume</Button>
                  </div>
                ) : (
                  <Button onClick={(ev) => (ev.stopPropagation(), open())} className="min-w-[92px]">
                    Start Exam
                  </Button>
                )
              }
            />
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
