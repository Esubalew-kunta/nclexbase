"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";
import { buildEntries } from "@/lib/bank";
import { useStore } from "@/lib/store";

const SECONDS_PER_QUESTION = 120; // 200 minutes / 100 questions, as on the real exam.

export function ReadinessIntro({ number, title, questions, minutes }: { number: number; title: string; questions: number; minutes: number }) {
  const router = useRouter();
  const createSession = useStore((s) => s.createSession);
  const [restrictions, setRestrictions] = useState(true);
  const [accommodation, setAccommodation] = useState<1 | 1.5 | 2>(1);

  const start = () => {
    const entries = buildEntries({ subjects: "all", exclude: new Set(), count: questions, seed: number });
    const id = createSession({
      kind: "readiness",
      title,
      entries,
      tutor: false,
      timed: true,
      pool: "unused",
      timeLimit: Math.round(entries.length * SECONDS_PER_QUESTION * accommodation),
    });
    useStore.getState().setExamSettings({ restrictions });
    router.replace(`/nclex/custom-test?id=${id}`);
  };

  const hours = Math.floor(minutes / 60);
  return (
    <div className="flex h-dvh flex-col bg-white font-exam text-[#222]">
      <header className="flex h-[42px] shrink-0 items-center bg-exam px-2">
        <button onClick={() => router.push("/nclex/next-gen-readiness-exams")} aria-label="Close" className="flex size-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
          <X className="size-4" />
        </button>
      </header>
      <main className="flex flex-1 items-center justify-center overflow-y-auto p-6">
        <div className="w-full max-w-[1100px]">
          <h1 className="text-center text-xl font-bold">Welcome to NCLEX Bootcamp {title}</h1>
          <p className="mt-6">Please read the following before starting:</p>
          <ol className="mt-1 list-decimal pl-6">
            <li>
              You will have {hours} hours {minutes % 60} minutes to answer {questions} questions, similar to the real NCLEX.
            </li>
            <li>Your score report will appear after finishing the exam.</li>
          </ol>
          <p className="mt-4">Good Luck!</p>

          <h2 className="mt-6 font-bold">Test Settings</h2>
          <div className="mt-3 space-y-2">
            <SettingRow on={restrictions} onToggle={() => setRestrictions(!restrictions)} label="NCLEX Restrictions:" text="Adds delay between questions; disables cross-out and highlight to simulate Pearson testing experience." />
            <SettingRow on={accommodation === 1.5} onToggle={() => setAccommodation(accommodation === 1.5 ? 1 : 1.5)} label="Time Accommodation 1.5x:" text="Get an additional 1.5x time for students who have approved accommodations." />
            <SettingRow on={accommodation === 2} onToggle={() => setAccommodation(accommodation === 2 ? 1 : 2)} label="Time Accommodation 2x:" text="Get an additional 2x time for students who have approved accommodations." />
          </div>

          <div className="mt-6 flex flex-col items-center gap-2">
            <button onClick={start} className="rounded-sm bg-exam px-5 py-1.5 text-white hover:bg-[#005a8e]">
              Start Readiness Exam
            </button>
            <button onClick={() => router.push("/nclex/next-gen-readiness-exams")} className="rounded-sm border border-[#ccc] bg-[#f4f4f4] px-4 py-1 hover:bg-[#eaeaea]">
              Cancel
            </button>
          </div>
          <p className="mt-6 text-center text-sm text-[#888]">Prototype note: the exam draws from the authored sample bank, with time scaled to 2 minutes per question.</p>
        </div>
      </main>
      <footer className="h-10 shrink-0 bg-exam" />
    </div>
  );
}

function SettingRow({ on, onToggle, label, text }: { on: boolean; onToggle: () => void; label: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded border border-[#eee] bg-[#fafafa] px-3 py-2.5">
      <button role="switch" aria-checked={on} onClick={onToggle} className={clsx("relative h-5 w-10 shrink-0 rounded-full transition-colors", on ? "bg-[#5fd068]" : "bg-[#ccc]")}>
        <span className={clsx("absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform", on && "translate-x-5")} />
      </button>
      <p className="text-sm">
        <b>{label}</b> {text}
      </p>
    </div>
  );
}
