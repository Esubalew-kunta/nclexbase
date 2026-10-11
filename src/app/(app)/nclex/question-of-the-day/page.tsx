"use client";

import clsx from "clsx";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LETTERS, questionForDate, todayISO } from "@/lib/daily";
import { useConfig, useCopy } from "@/lib/content";
import { useStore } from "@/lib/store";
import { Button, Card, PageHeader } from "@/components/ui/primitives";

function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function QotdBody() {
  const params = useSearchParams();
  const requested = params.get("d");
  const plan = useStore((s) => s.user.plan);
  // The question depends on today's date and Admin > Question of the Day, so it is picked
  // only after hydration (the static HTML can't know either).
  const hydrated = useStore((s) => s.hydrated);
  useConfig();
  const copy = useCopy();
  const [choice, setChoice] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  if (!hydrated) return <PageHeader trail={[{ label: "Question of the Day" }]} title={copy("qotd.title")} />;
  const { date, item } = questionForDate(requested);
  const isToday = date === todayISO();

  return (
    <>
      <PageHeader
        trail={[{ label: "Question of the Day" }]}
        title={copy("qotd.title")}
        description={`${isToday ? "Today's question" : "Question for"} · ${formatDay(date)}. Answer it, then read the rationale.`}
      />
      <Card className="p-6">
        {item.lead && <p className="mb-3 text-lg leading-[27px] text-exam-ink">{item.lead}</p>}
        <div className="text-lg leading-[27px] text-exam-ink [&_b]:font-bold" dangerouslySetInnerHTML={{ __html: item.stem }} />
        <ul className="mt-4 flex flex-col gap-2">
          {item.options.map((o, i) => {
            const correct = i === item.answer;
            const picked = choice === i;
            return (
              <li key={i}>
                <label
                  className={clsx(
                    "flex cursor-pointer items-start gap-3 rounded-lg border bg-white px-4 py-3 text-base text-exam-ink transition-colors",
                    revealed && correct && "border-2 border-success bg-success/10",
                    revealed && picked && !correct && "border-2 border-error bg-error/10",
                    !revealed && (picked ? "border-2 border-primary bg-primary-light" : "border-line hover:bg-primary-light"),
                    revealed && !correct && !picked && "border-line",
                  )}
                >
                  <input type="radio" name="qotd" disabled={revealed} checked={picked} onChange={() => setChoice(i)} className="mt-1 size-4 accent-primary" />
                  <span className="font-semibold">{LETTERS[i]}.</span>
                  <span className="flex-1">{o}</span>
                  {revealed && correct && <span className="text-sm font-semibold text-success">✓ Correct answer</span>}
                  {revealed && picked && !correct && <span className="text-sm font-semibold text-error">✕ Your answer</span>}
                </label>
              </li>
            );
          })}
        </ul>
        {!revealed ? (
          <div className="mt-5">
            <Button onClick={() => setRevealed(true)} disabled={choice === null}>
              Submit Answer
            </Button>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-line bg-primary-light p-5 text-exam-ink">
            <h4 className={clsx("mb-2 text-xl font-bold", choice === item.answer ? "text-success" : "text-error")}>{choice === item.answer ? "Correct!" : "Not quite"}</h4>
            <p className="mb-1 text-sm text-muted">{item.avgPercent}% of students answered this correctly.</p>
            <div className="text-base leading-6 text-exam-ink [&_p]:mb-3" dangerouslySetInnerHTML={{ __html: item.rationale.explanation }} />
            {item.rationale.takeaway.length > 0 && (
              <>
                <h5 className="mt-2 mb-1 font-bold text-exam-ink">Key Takeaway</h5>
                <ul className="list-disc pl-6 text-base text-exam-ink">
                  {item.rationale.takeaway.map((t, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: t }} />
                  ))}
                </ul>
              </>
            )}
            <p className="mt-5 text-base text-muted">Come back tomorrow for a new question.</p>
          </div>
        )}
      </Card>

      <Card className="mt-4 flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h4 className="text-lg leading-[22.5px] font-semibold text-ink">Want this in your inbox every day?</h4>
          <p className="text-base leading-6 text-muted">Daily Warmup emails you one question every morning with a link to answer it here.</p>
        </div>
        <Link href={plan === "free" ? "/nclex/upgrade" : "/nclex/daily-warmup"}>
          <Button variant={plan === "free" ? "premium" : "primary"}>{plan === "free" ? "Upgrade to unlock" : "Set up Daily Warmup"}</Button>
        </Link>
      </Card>
    </>
  );
}

export default function QuestionOfTheDayPage() {
  return (
    <Suspense>
      <QotdBody />
    </Suspense>
  );
}
