"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";
import { readinessEntriesFor } from "@/lib/bank";
import { useAll } from "@/lib/content";
import { useStore } from "@/lib/store";

export function ReadinessIntro({ id: examId, number, title }: { id: string; number: number; title: string }) {
  const router = useRouter();
  const createSession = useStore((s) => s.createSession);
  const [restrictions, setRestrictions] = useState(true);
  const [accommodation, setAccommodation] = useState<1 | 1.5 | 2>(1);
  // Time limit, question range and title are set in Admin > Readiness Exams.
  const exam = useAll("readiness").find((e) => e.id === examId);
  const minutes = exam?.minutes ?? 300;
  const name = exam?.title ?? title;
  const hours = minutes % 60 ? `${Math.floor(minutes / 60)} hours ${minutes % 60} minutes` : `${minutes / 60} hours`;

  const start = () => {
    const entries = readinessEntriesFor({ shuffle: exam?.shuffle ?? number !== 1, number: exam?.number ?? number, questionIds: exam?.questionIds });
    const id = createSession({
      kind: "readiness",
      title: name,
      entries,
      tutor: false,
      timed: true,
      pool: "unused",
      timeLimit: Math.round(minutes * 60 * accommodation),
      sourceId: examId,
    });
    useStore.getState().setExamSettings({ restrictions });
    router.replace(`/nclex/custom-test?id=${id}`);
  };

  return (
    <div className="flex h-dvh flex-col bg-white font-exam text-exam-ink">
      <header className="flex h-[42px] shrink-0 items-center bg-primary px-2">
        <button onClick={() => router.push("/nclex/next-gen-readiness-exams")} aria-label="Close" className="flex size-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
          <X className="size-4" />
        </button>
      </header>
      <main className="flex flex-1 items-center justify-center overflow-y-auto p-6">
        <div className="w-full max-w-[1100px]">
          <h1 className="text-center text-xl font-bold">Welcome to the NCLEXBase CAT Exam</h1>
          <p className="mt-6">Please read the following before starting:</p>
          <ol className="mt-1 list-decimal pl-6">
            <li>You will have {hours} to complete the exam. You may pause and resume the exam as needed.</li>
            <li>
              The exam has a minimum of {exam?.minQuestions ?? 85} questions and a max of {exam?.maxQuestions ?? 150}.
            </li>
            <li>Once you submit an answer, you cannot go back or change your response.</li>
            <li>The exam will end once the simulator has determined your readiness level.</li>
          </ol>
          <p className="mt-4">Good Luck!</p>

          <h2 className="mt-6 font-bold">Test Settings</h2>
          <div className="mt-3 space-y-2">
            <SettingRow on={restrictions} onToggle={() => setRestrictions(!restrictions)} label="NCLEX Restrictions:" text="Adds delay between questions; disables cross-out and highlight to simulate Pearson testing experience." />
            <SettingRow on={accommodation === 1.5} onToggle={() => setAccommodation(accommodation === 1.5 ? 1 : 1.5)} label="Time Accommodation 1.5x:" text="Get an additional 1.5x time for students who have approved accommodations." />
            <SettingRow on={accommodation === 2} onToggle={() => setAccommodation(accommodation === 2 ? 1 : 2)} label="Time Accommodation 2x:" text="Get an additional 2x time for students who have approved accommodations." />
          </div>

          <div className="mt-6 flex flex-col items-center gap-2">
            <button onClick={start} className="rounded-sm bg-primary px-5 py-1.5 text-white hover:bg-primary-hover">
              Start CAT Exam
            </button>
            <button onClick={() => router.push("/nclex/next-gen-readiness-exams")} className="rounded-sm border border-primary bg-white px-4 py-1 text-primary hover:bg-primary-light">
              Cancel
            </button>
          </div>
        </div>
      </main>
      <footer className="h-10 shrink-0 bg-primary" />
    </div>
  );
}

function SettingRow({ on, onToggle, label, text }: { on: boolean; onToggle: () => void; label: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded border border-line bg-background px-3 py-2.5">
      <button role="switch" aria-checked={on} onClick={onToggle} className={clsx("relative h-5 w-10 shrink-0 rounded-full transition-colors", on ? "bg-primary" : "bg-line")}>
        <span className={clsx("absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform", on && "translate-x-5")} />
      </button>
      <p className="text-sm">
        <b>{label}</b> {text}
      </p>
    </div>
  );
}
