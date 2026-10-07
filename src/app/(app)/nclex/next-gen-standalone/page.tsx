"use client";

import { useRouter } from "next/navigation";
import { SUBJECTS, TOTALS } from "@/data/catalog";
import { useProgress } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import type { SubjectId } from "@/lib/types";
import { Button, PageHeader, UpgradeButton } from "@/components/ui/primitives";
import { NumberedRow, UsageBlock } from "@/components/ui/visuals";

export default function StandalonePage() {
  const router = useRouter();
  const plan = useStore((s) => s.user.plan);
  const setUi = useStore((s) => s.setUi);
  const progress = useProgress();
  const create = (subject?: SubjectId) => setUi({ createTestOpen: true, createTestPreset: subject ? { subject } : null });

  return (
    <>
      <PageHeader
        trail={[{ label: "Next Gen Standalone" }]}
        title="Standalone Questions"
        description="The standalone questions below are based on the real Next Gen NCLEX. Practice with these so you're ready for the real exam."
        experts={["emily"]}
      />
      <div className="mt-4">
        {plan === "free" && (
          <NumberedRow title="Free Questions" onClick={() => create()} action={<Button onClick={(e) => (e.stopPropagation(), create())}>Create Test</Button>}>
            <UsageBlock usage={{ total: TOTALS.freeQuestions, ...progress.standaloneTotal }} />
          </NumberedRow>
        )}
        {SUBJECTS.map((s) => (
          <NumberedRow
            key={s.id}
            title={s.name}
            onClick={() => (plan === "free" ? router.push("/nclex/upgrade") : create(s.id))}
            action={plan === "free" ? <UpgradeButton /> : <Button onClick={(e) => (e.stopPropagation(), create(s.id))}>Create Test</Button>}
          >
            <UsageBlock usage={{ total: s.standaloneCount, ...progress.standaloneFor(s.id) }} />
          </NumberedRow>
        ))}
      </div>
    </>
  );
}
