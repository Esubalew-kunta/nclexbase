"use client";

import { SquarePlus } from "lucide-react";
import { SUBJECTS } from "@/data/catalog";
import { STANDALONE } from "@/data/standalone";
import { useProgress } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { Button, PageHeader, UpgradeButton } from "@/components/ui/primitives";
import { ProgressRow, SubjectIcon } from "@/components/ui/visuals";

export default function StandalonePage() {
  const plan = useStore((s) => s.user.plan);
  const setUi = useStore((s) => s.setUi);
  const progress = useProgress();
  const freeUsed = STANDALONE.filter((i) => progress.used.has(i.id)).length;
  const create = (
    <Button onClick={() => setUi({ createTestOpen: true })}>
      <SquarePlus className="size-5" />
      Create Test
    </Button>
  );

  return (
    <>
      <PageHeader
        trail={[{ label: "Next Gen Standalone" }]}
        title="Standalone Questions"
        description="The standalone questions below are based on the real Next Gen NCLEX. Practice with these so you're ready for the real exam."
        experts={["emily"]}
      />
      <div className="space-y-2">
        {plan === "free" && <ProgressRow title="Free Questions" used={freeUsed} total={36} action={create} />}
        {SUBJECTS.map((s) => (
          <ProgressRow
            key={s.id}
            leading={<SubjectIcon id={s.id} />}
            title={s.name}
            used={STANDALONE.filter((i) => i.subject === s.id && progress.used.has(i.id)).length}
            total={s.standaloneCount}
            action={plan === "free" ? <UpgradeButton /> : create}
          />
        ))}
      </div>
    </>
  );
}
