"use client";

import clsx from "clsx";
import { useStore } from "@/lib/store";
import { EXPERIMENTS } from "@/lib/features";
import { Button, PageHeader, Toggle } from "@/components/ui/primitives";

/**
 * Not part of the live product. Reach it at /nclex/prototype or with Ctrl+Shift+P.
 * Lets you switch plans, reset data, and toggle proposed features for demos.
 */
export default function PrototypeControls() {
  const plan = useStore((s) => s.user.plan);
  const setPlan = useStore((s) => s.setPlan);
  const flags = useStore((s) => s.flags);
  const setFlag = useStore((s) => s.setFlag);
  const resetProgress = useStore((s) => s.resetProgress);

  return (
    <>
      <PageHeader trail={[{ label: "Prototype Controls" }]} title="Prototype Controls" description="Only in this clone. Use these to demo different states. Shortcut: Ctrl+Shift+P." />
      <div className="max-w-3xl rounded-lg bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-ink">Membership</span>
          {(["free", "premium"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className={clsx("h-9 cursor-pointer rounded-full px-4 text-sm font-semibold capitalize", plan === p ? "bg-brand text-white" : "bg-[#f1f1f3] text-ink")}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <div className="font-semibold text-ink">Experiments (proposed features)</div>
          <div className="mt-3 space-y-3">
            {EXPERIMENTS.map((x) => (
              <div key={x.key} className="flex items-start justify-between gap-4 rounded-lg border border-[#ededf0] p-3">
                <div>
                  <div className="font-semibold text-ink-strong">{x.name}</div>
                  <div className="text-sm text-muted">{x.description}</div>
                </div>
                <Toggle checked={Boolean(flags[x.key])} onChange={(v) => setFlag(x.key, v)} />
              </div>
            ))}
            {!EXPERIMENTS.length && <p className="text-sm text-muted">No experiments registered yet. Add them in src/lib/features.ts.</p>}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => confirm("Reset all tests, tags, and bookmarks in this browser?") && resetProgress()}>
            Reset all progress
          </Button>
          <Button variant="outline" onClick={() => confirm("Clear everything (including the study schedule and settings)?") && (localStorage.clear(), location.reload())}>
            Clear all data
          </Button>
        </div>
      </div>
    </>
  );
}
