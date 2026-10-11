"use client";

import { useRouter } from "next/navigation";
import { useConfig, useSubjects } from "@/lib/content";
import { useProgress } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import type { SubjectId } from "@/lib/types";
import { Button, UpgradeButton } from "@/components/ui/primitives";
import { NumberedRow, UsageBlock } from "@/components/ui/visuals";
import { CopyHeader } from "@/components/ui/CopyHeader";

export default function StandalonePage() {
  const router = useRouter();
  const plan = useStore((s) => s.user.plan);
  const setUi = useStore((s) => s.setUi);
  const progress = useProgress();
  const subjects = useSubjects();
  const freeQuestions = useConfig().freeTier.freeQuestions;
  const create = (subject?: SubjectId) => setUi({ createTestOpen: true, createTestPreset: subject ? { subject } : null });

  return (
    <>
      <CopyHeader trail={[{ label: "Next Gen Standalone" }]} titleKey="standalone.title" descriptionKey="standalone.description" />
      <div className="mt-4">
        {plan === "free" && (
          <NumberedRow title="Free Questions" onClick={() => create()} action={<Button onClick={(e) => (e.stopPropagation(), create())}>Create Test</Button>}>
            <UsageBlock usage={{ total: freeQuestions, ...progress.standaloneTotal }} />
          </NumberedRow>
        )}
        {subjects.map((s) => (
          <NumberedRow
            key={s.id}
            title={s.name}
            onClick={() => (plan === "free" ? router.push("/nclex/upgrade") : create(s.id))}
            action={plan === "free" ? <UpgradeButton /> : <Button onClick={(e) => (e.stopPropagation(), create(s.id))}>Create Test</Button>}
          >
            <UsageBlock usage={{ total: s.stats.standaloneCount, ...progress.standaloneFor(s.id) }} />
          </NumberedRow>
        ))}
      </div>
    </>
  );
}
