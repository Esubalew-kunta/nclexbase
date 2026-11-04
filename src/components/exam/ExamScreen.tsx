"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { caseForItem, itemById } from "@/lib/bank";
import { useStore } from "@/lib/store";
import type { TestSession } from "@/lib/types";
import { LogoStacked } from "@/components/ui/Logo";
import { ExamView } from "./ExamView";

/**
 * The student's exam: the one ExamView, fed from the store. Every write the exam makes (answers,
 * submits, tags, marks, the clock, settings) happens here and nowhere inside ExamView, which is
 * what lets the admin preview reuse that screen without being able to save anything.
 */
export function ExamScreen({ session, review }: { session: TestSession; review: boolean }) {
  const router = useRouter();
  const { answer, submit, goTo, toggleMark, endSession, setTag, dismissTip, setExamSettings } = useStore.getState();
  const tags = useStore((s) => s.tags);
  const bookmarks = useStore((s) => s.bookmarks);
  const settings = useStore((s) => s.examSettings);
  const tipDismissed = useStore((s) => Boolean(s.dismissedTips["tag-questions"]));
  const sessionId = session.id;

  const reviewPage = `/nclex/previous-tests/review?id=${sessionId}`;
  const onFinish = () => {
    endSession(sessionId);
    if (session.kind === "case") router.replace("/nclex");
    else router.replace(reviewPage);
  };
  // Stable, so the per-question clock inside ExamView is not restarted by every render.
  const onTick = useCallback((itemId: string, seconds: number) => useStore.getState().tick(sessionId, itemId, seconds), [sessionId]);

  return (
    <ExamView
      session={session}
      review={review}
      getItem={itemById}
      getCase={caseForItem}
      tags={tags}
      bookmarks={bookmarks}
      settings={settings}
      tipDismissed={tipDismissed}
      onAnswer={(itemId, a) => answer(sessionId, itemId, a)}
      onSubmit={(itemId) => submit(sessionId, itemId)}
      onGoTo={(i) => goTo(sessionId, i)}
      onToggleMark={(itemId) => toggleMark(sessionId, itemId)}
      onTick={onTick}
      onTag={(itemId, t) => setTag(itemId, t)}
      onDismissTip={() => dismissTip("tag-questions")}
      onSettings={setExamSettings}
      onFinish={onFinish}
      onExitReview={() => router.push(reviewPage)}
    />
  );
}

export function ExamLoading() {
  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <span className="size-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary" aria-label="Loading" />
    </div>
  );
}

export function ExamNotFound() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-background px-4 text-ink">
      <LogoStacked width={180} />
      <p className="text-lg text-muted">This test could not be found in this browser.</p>
      <Link href="/nclex" className="rounded-full bg-primary px-5 py-2 font-semibold text-white hover:bg-primary-hover">
        Back to Home
      </Link>
    </div>
  );
}
