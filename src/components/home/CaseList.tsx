"use client";

import { CASE_ROWS } from "@/data/cases";
import { useProgress, useStartCase } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { Button, UpgradeButton } from "@/components/ui/primitives";
import { ProgressRow } from "@/components/ui/visuals";

export function CaseList({ subject }: { subject?: string }) {
  const plan = useStore((s) => s.user.plan);
  const progress = useProgress();
  const start = useStartCase();
  const rows = subject ? CASE_ROWS.filter((r) => r.subject === subject) : CASE_ROWS;

  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const unlocked = plan === "premium" || row.free;
        return (
          <ProgressRow
            key={row.id}
            number={subject ? i + 1 : row.number}
            title={row.title}
            used={row.playable ? progress.caseUsed(row.id) : 0}
            total={6}
            action={
              unlocked ? (
                <Button size="md" className="min-w-[92px]" onClick={() => start(row.id, { subject: row.subject, title: row.title })}>
                  Start
                </Button>
              ) : (
                <UpgradeButton />
              )
            }
          />
        );
      })}
    </div>
  );
}
