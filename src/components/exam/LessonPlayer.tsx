"use client";

import clsx from "clsx";
import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Lesson } from "@/data/catalog";
import { asLesson, useAll, useLessons } from "@/lib/content";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/ui/Icon";

/**
 * Full-screen lesson player (/nclex/crash-courses/videos/:subject?index=N).
 * The live free account only shows a loading spinner here, so this follows the
 * app's visual language: purple canvas, video area, and a lesson list.
 */
function Player({ title, lessons, base, back }: { title: string; lessons: Lesson[]; base: string; back: string }) {
  const router = useRouter();
  const plan = useStore((s) => s.user.plan);
  const params = useSearchParams();
  const index = Math.min(lessons.length, Math.max(1, Number(params.get("index")) || 1));
  const lesson = lessons[index - 1];
  const locked = plan === "free" && lesson?.locked;
  const go = (i: number) => i >= 1 && i <= lessons.length && router.replace(`${base}?index=${i}`);

  return (
    <div className="flex h-dvh flex-col bg-primary-hover text-white">
      <header className="flex h-[72px] shrink-0 items-center gap-3 px-6">
        <Link href={back} aria-label="Close" className="flex size-[42px] items-center justify-center rounded-full bg-white/10 hover:bg-white/30">
          <svg viewBox="0 0 48 48" className="size-4" fill="currentColor">
            <path d="M8.56 6.44a1.5 1.5 0 1 0-2.12 2.12L21.88 24 6.44 39.44a1.5 1.5 0 1 0 2.12 2.12L24 26.12l15.44 15.44a1.5 1.5 0 0 0 2.12-2.12L26.12 24 41.56 8.56a1.5 1.5 0 0 0-2.12-2.12L24 21.88 8.56 6.44Z" />
          </svg>
        </Link>
        <div className="min-w-0">
          <p className="text-sm text-white/70">{title}</p>
          <h1 className="truncate text-lg font-semibold">
            {index}. {lesson?.title}
          </h1>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border-b-4 border-gold bg-black/30">
            {locked ? (
              <div className="text-center">
                <Icon name="shield" size={40} className="mx-auto text-gold" />
                <p className="mt-3 text-lg font-semibold">Upgrade to unlock this lesson</p>
                <Link href="/nclex/upgrade" className="mt-4 inline-flex h-[42px] items-center rounded-[64px] bg-gold px-5 font-semibold text-ink shadow-premium hover:brightness-95">
                  Upgrade
                </Link>
              </div>
            ) : (
              <div className="text-center">
                <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/15">
                  <svg viewBox="0 0 24 24" className="ml-1 size-7" fill="white">
                    <path d="M7 5.5v13l11-6.5z" />
                  </svg>
                </span>
                <p className="mt-3 text-white/70">{lesson?.type === "bites" ? `Bites quiz · ${lesson.count} questions` : `Video · ${lesson?.duration}`}</p>
                <p className="mt-1 text-xs text-white/50">Lesson media isn&apos;t included in the static prototype.</p>
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => go(index - 1)} disabled={index === 1} className="flex h-[42px] cursor-pointer items-center gap-2 rounded-[64px] bg-white/10 px-4 font-semibold hover:bg-white/30 disabled:opacity-40">
              <Icon name="arrowLeft" size={16} /> Previous
            </button>
            <button onClick={() => go(index + 1)} disabled={index === lessons.length} className="ml-auto flex h-[42px] cursor-pointer items-center gap-2 rounded-[64px] bg-primary px-4 font-semibold shadow-press hover:bg-primary-hover disabled:opacity-40">
              Next <Icon name="arrowRight" size={16} />
            </button>
          </div>
        </div>
        <aside className="flex max-h-[45vh] w-full shrink-0 flex-col overflow-hidden rounded-xl bg-white text-ink lg:max-h-none lg:w-[380px]">
          <p className="border-b border-line px-4 py-3 font-semibold text-ink">{title}</p>
          <div className="overflow-y-auto">
            {lessons.map((l, i) => (
              <button
                key={i}
                onClick={() => go(i + 1)}
                className={clsx("flex w-full cursor-pointer items-center gap-3 border-b border-line px-4 py-3 text-left hover:bg-primary-light", i + 1 === index && "bg-primary-light")}
              >
                <span
                  className={clsx(
                    "w-[52px] shrink-0 rounded border px-2 py-1 text-center text-xs leading-3",
                    l.type === "video" ? "border-white/30 text-white" : "border-gold/60 text-gold",
                  )}
                >
                  {l.type === "video" ? "Video" : "Bites"}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{l.title}</span>
                {plan === "free" && l.locked ? <Icon name="shield" size={16} className="text-muted" /> : <span className="text-sm text-muted">{l.type === "video" ? l.duration : `${l.count} Qs`}</span>}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function LessonPlayer(props: { title: string; lessons: Lesson[]; base: string; back: string }) {
  return (
    <Suspense fallback={<div className="h-dvh bg-primary-hover" />}>
      <Player {...props} />
    </Suspense>
  );
}

/** Player for a course managed in Admin > Courses & Lessons (crash course subject or Next Gen module). */
export function CoursePlayer({ course, fallbackTitle, base, back }: { course: string; fallbackTitle: string; base: string; back: string }) {
  const lessons = useLessons(course);
  const title = useAll("courses").find((c) => c.id === course)?.title ?? fallbackTitle;
  return <LessonPlayer title={title} lessons={lessons.map(asLesson)} base={base} back={back} />;
}
