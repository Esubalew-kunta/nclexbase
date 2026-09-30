"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Lesson } from "@/data/catalog";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar, UsageBar } from "@/components/ui/primitives";

export interface Course {
  id: string;
  title: string;
  runtime: string;
  lessons: Lesson[];
  /** "N lessons" shown in the header (live counts videos and bites). */
  count: number;
  /** Base URL for lesson links; `?index=N` is appended (1-based). */
  href: string;
}

/** Filter input above the course list ("Start typing to filter the lessons"). */
export function LessonFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative mb-4 text-white">
      <Icon name="filter" size={24} className="absolute top-1/2 left-7 -translate-y-1/2 text-white/70" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing to filter the lessons"
        className="h-12 w-full rounded-full bg-white/10 py-4 pr-8 pl-16 text-lg leading-[27px] text-white transition-[box-shadow,background] duration-[400ms] outline-none placeholder:text-white/70 focus:bg-white/15"
      />
    </div>
  );
}

/** Crash course cards: header (index, title, lessons bar, Start) + expandable Video/Bites rows. */
export function CourseList({ courses, filter = "", defaultOpen = false }: { courses: Course[]; filter?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultOpen ? courses.map((c) => c.id) : []));
  const term = filter.trim().toLowerCase();
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="flex flex-col">
      {courses.map((c, n) => {
        const lessons = c.lessons.map((l, i) => ({ ...l, index: i + 1 })).filter((l) => !term || l.title.toLowerCase().includes(term));
        if (term && !lessons.length) return null;
        const expanded = Boolean(term) || open.has(c.id);
        const firstFree = c.lessons.findIndex((l) => !l.locked) + 1 || 1;
        return (
          <div key={c.id} className="mb-2 rounded-lg bg-white shadow-card transition-transform duration-200 hover:scale-[1.01]">
            <Link href={`${c.href}?index=${firstFree}`} className="flex items-center rounded-t-lg bg-white px-6 py-4">
              <div className="mr-4 flex min-w-0 flex-1 items-start">
                <h4 className="mr-4 text-lg leading-[22.5px] font-semibold text-faint">{n + 1}</h4>
                <div className="min-w-0 flex-1 lg:max-w-[630px]">
                  <h4 className="mr-4 text-lg leading-[22.5px] font-semibold text-ink-strong">{c.title}</h4>
                  <div className="mt-2">
                    <ProgressBar value={0} className="mb-2" />
                    <p className="text-base leading-4 text-muted">
                      <strong className="font-bold">0</strong> of {c.count} lessons completed
                      <span className="mx-1 text-faint">•</span>
                      {c.runtime} runtime
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end pr-2 pl-4">
                <span className="flex h-[42px] w-[98px] items-center justify-center rounded-[64px] bg-brand text-base leading-[18px] font-semibold text-white shadow-[0_2px_0_0_#4a3ac8] transition-[background,transform] duration-[50ms] hover:bg-[#6765ef] active:translate-y-[2px] active:shadow-none">
                  Start
                </span>
              </div>
            </Link>

            {expanded && (
              <div className="flex flex-col">
                {lessons.map((l) => (
                  <LessonRow key={l.index} lesson={l} href={`${c.href}?index=${l.index}`} />
                ))}
              </div>
            )}

            {!term && (
              <div
                onClick={() => toggle(c.id)}
                className="flex cursor-pointer items-center rounded-b-lg border-t border-[#ededf0] bg-[#fafafa] px-[18px] py-4 transition-colors duration-200 hover:bg-[#f6f6f6]"
              >
                <Icon name={expanded ? "chevronUpThin" : "chevronDownThin"} size={24} className="text-muted" />
                <p className="ml-4 text-base leading-4 font-medium text-muted">{expanded ? "Hide lessons" : `Show all ${c.count} lessons`}</p>
              </div>
            )}
          </div>
        );
      })}
      {term && courses.every((c) => !c.lessons.some((l) => l.title.toLowerCase().includes(term))) && (
        <p className="py-8 text-center text-lg text-white/70">No lessons match “{filter}”.</p>
      )}
    </div>
  );
}

function LessonRow({ lesson, href }: { lesson: Lesson & { index: number }; href: string }) {
  const router = useRouter();
  const plan = useStore((s) => s.user.plan);
  const locked = plan === "free" && lesson.locked;
  return (
    <Link
      href={locked ? "/nclex/upgrade" : href}
      onClick={(e) => {
        if (locked) {
          e.preventDefault();
          router.push("/nclex/upgrade");
        }
      }}
      className="group border-b border-[#ededf0] bg-white px-2 transition-colors duration-200 hover:rounded-lg hover:bg-[#f6f6f6]"
    >
      <div className="flex items-center">
        <div className="flex size-12 items-center justify-center p-3">
          <span className="rounded-full p-1 transition-colors duration-100 hover:bg-[#ededf0]">
            <span className="block size-4 rounded-full border border-black/30" />
          </span>
        </div>
        <div className="flex size-12 items-center justify-center rounded-lg p-4">
          {lesson.type === "bites" && <Icon name="bites" size={16} className="text-faint" />}
        </div>
        <div className="px-3.5 py-[11px]">
          <div
            className={clsx(
              "w-[52px] rounded border px-2 py-1 text-center",
              lesson.type === "video" ? "border-[rgba(20,184,166,0.25)] text-[#14b8a6]" : "border-[rgba(249,115,22,0.25)] text-[#f97316]",
            )}
          >
            <p className="text-xs leading-3">{lesson.type === "video" ? "Video" : "Bites"}</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-1 p-4">
          <p className="truncate text-base leading-4 text-ink-strong">{lesson.title}</p>
          {lesson.type === "video" ? (
            <p className="shrink-0 text-base leading-4 text-muted">{lesson.duration}</p>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <p className="text-base leading-4 text-muted">0 / {lesson.count}</p>
              <UsageBar total={lesson.count ?? 1} className="hidden w-[76px] sm:flex" />
            </div>
          )}
        </div>
        <div className="flex size-12 items-center justify-center p-4">
          {locked ? <Icon name="shield" size={20} className="text-[#85868e]" /> : <Icon name="chevronRight" size={16} className="text-faint" />}
        </div>
      </div>
    </Link>
  );
}
