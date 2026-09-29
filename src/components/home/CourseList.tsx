"use client";

import clsx from "clsx";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, CirclePlay, Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Modal, ProgressBar } from "@/components/ui/primitives";

export interface Course {
  id: string;
  title: string;
  lessons: string[];
  runtime: string;
  /** Lessons free users can watch. */
  freeLessons?: number;
}

export function CourseList({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const plan = useStore((s) => s.user.plan);
  const [open, setOpen] = useState<string | null>(null);
  const [playing, setPlaying] = useState<{ course: Course; index: number } | null>(null);

  const play = (course: Course, index: number) => {
    const free = plan === "premium" || index < (course.freeLessons ?? 1);
    if (!free) return router.push("/nclex/upgrade");
    setPlaying({ course, index });
  };

  return (
    <div className="space-y-2">
      {courses.map((c, n) => (
        <div key={c.id} className="bg-card overflow-hidden rounded-lg shadow-card">
          <div className="flex items-center gap-4 px-6 py-5">
            <span className="w-6 shrink-0 text-center text-faint">{n + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold text-ink-strong">{c.title}</div>
              <ProgressBar value={0} className="mt-2.5" />
              <div className="mt-2 text-base text-muted">
                <b className="font-semibold text-ink">0</b> of {c.lessons.length} lessons completed <span className="mx-1">•</span> {c.runtime} runtime
              </div>
            </div>
            <Button className="min-w-[92px]" onClick={() => play(c, 0)}>
              Start
            </Button>
          </div>
          <button
            onClick={() => setOpen(open === c.id ? null : c.id)}
            aria-expanded={open === c.id}
            className="flex w-full items-center justify-center gap-1.5 border-t border-line py-2.5 text-[15px] font-semibold text-brand hover:bg-[#fafafb]"
          >
            {open === c.id ? "Hide lessons" : `Show all ${c.lessons.length} lessons`}
            {open === c.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {open === c.id && (
            <ol className="divide-y divide-line border-t border-line">
              {c.lessons.map((l, i) => {
                const locked = plan === "free" && i >= (c.freeLessons ?? 1);
                return (
                  <li key={i}>
                    <button onClick={() => play(c, i)} className="flex w-full items-center gap-4 px-6 py-3 text-left hover:bg-[#fafafb]">
                      <span className="w-10 text-sm text-muted">
                        {n + 1}.{i + 1}
                      </span>
                      <span className={clsx("flex-1 text-base", locked ? "text-muted" : "text-ink")}>{l}</span>
                      {locked ? <Lock className="size-4 text-faint" /> : <CirclePlay className="size-5 text-brand" />}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      ))}

      <Modal open={Boolean(playing)} onClose={() => setPlaying(null)} title={playing ? `${playing.course.title} · ${playing.course.lessons[playing.index]}` : ""} width={900}>
        <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-[#1b1f3b] to-[#4a3ac8] text-white">
          <div className="text-center">
            <CirclePlay className="mx-auto size-16 opacity-90" />
            <p className="mt-3 text-white/80">Video player placeholder. Lesson videos are not included in the static prototype.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
