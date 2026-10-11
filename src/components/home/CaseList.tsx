"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCaseRows } from "@/lib/content";
import { resolveCase, useStartCase } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { Button, Modal, UpgradeButton } from "@/components/ui/primitives";
import { NumberedRow, UsageBlock } from "@/components/ui/visuals";

/** Case study rows: Start → Reset + Resume once attempted; Upgrade when locked. */
export function CaseList({ subject }: { subject?: string }) {
  const router = useRouter();
  const plan = useStore((s) => s.user.plan);
  const sessions = useStore((s) => s.sessions);
  const deleteSession = useStore((s) => s.deleteSession);
  const start = useStartCase();
  const [confirm, setConfirm] = useState<{ id: string; title: string } | null>(null);
  const rows = useCaseRows(subject);

  return (
    <div className="mt-4 flex flex-col">
      {rows.map((row, i) => {
        const unlocked = plan === "premium" || row.access === "free";
        const session = sessions.find((s) => s.kind === "case" && s.sourceId === row.id);
        const authored = resolveCase(row.id, row.subject);
        const counts = session
          ? {
              used: Object.keys(session.submitted).length,
              ...Object.fromEntries(
                (["mastered", "reviewing", "learning"] as const).map((t) => [
                  t,
                  Object.keys(session.submitted).filter((id) => useStore.getState().tags[id] === t).length,
                ]),
              ),
            }
          : { used: 0 };
        const go = () => (unlocked ? start(row.id, { subject: row.subject, title: row.title }) : router.push("/nclex/upgrade"));
        return (
          <NumberedRow
            key={row.id}
            number={subject ? i + 1 : row.number}
            title={row.title}
            onClick={go}
            action={
              !unlocked ? (
                <UpgradeButton />
              ) : session ? (
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirm({ id: session.id, title: row.title });
                    }}
                    className="min-w-[73px]"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      go();
                    }}
                  >
                    Resume
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    go();
                  }}
                  className="min-w-[92px]"
                >
                  Start
                </Button>
              )
            }
          >
            <UsageBlock usage={{ total: authored.items.length, ...counts }} />
          </NumberedRow>
        );
      })}

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Reset Case Study"
        width={480}
        footer={
          <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirm) deleteSession(confirm.id);
                setConfirm(null);
              }}
            >
              Reset
            </Button>
          </div>
        }
      >
        <p className="px-6 py-5 text-base leading-6 text-ink">
          Resetting <b>{confirm?.title}</b> clears your answers so you can start it again. Your performance history is kept.
        </p>
      </Modal>
    </div>
  );
}
