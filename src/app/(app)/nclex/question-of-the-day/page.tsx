"use client";

import clsx from "clsx";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LETTERS, questionForDate, todayISO } from "@/lib/daily";
import { useStore } from "@/lib/store";
import { Button, Card, PageHeader } from "@/components/ui/primitives";

function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function QotdBody() {
  const params = useSearchParams();
  const requested = params.get("d");
  const { date, item } = questionForDate(requested);
  const plan = useStore((s) => s.user.plan);
  const [choice, setChoice] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const isToday = date === todayISO();

  return (
    <>
      <PageHeader
        trail={[{ label: "Question of the Day" }]}
        title="NCLEX® Question of the Day"
        description={`${isToday ? "Today's question" : "Question for"} · ${formatDay(date)}. Answer it, then read the rationale.`}
      />
      <Card className="p-6">
        {item.lead && <p className="mb-3 text-lg leading-[27px] text-ink">{item.lead}</p>}
        <div className="text-lg leading-[27px] text-ink [&_b]:font-bold" dangerouslySetInnerHTML={{ __html: item.stem }} />
        <ul className="mt-4 flex flex-col gap-2">
          {item.options.map((o, i) => {
            const correct = i === item.answer;
            const picked = choice === i;
            return (
              <li key={i}>
                <label
                  className={clsx(
                    "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-base text-ink transition-colors",
                    revealed && correct && "border-[#2e9d3a] bg-[#eaf7ec]",
                    revealed && picked && !correct && "border-[#e02424] bg-[#fdeeee]",
                    !revealed && (picked ? "border-brand bg-[#f4f2ff]" : "border-[#ededf0] hover:bg-[#fafafa]"),
                    revealed && !correct && !picked && "border-[#ededf0]",
                  )}
                >
                  <input type="radio" name="qotd" disabled={revealed} checked={picked} onChange={() => setChoice(i)} className="mt-1 size-4 accent-brand" />
                  <span className="font-semibold">{LETTERS[i]}.</span>
                  <span className="flex-1">{o}</span>
                  {revealed && correct && <span className="text-sm font-semibold text-[#2e9d3a]">Correct answer</span>}
                  {revealed && picked && !correct && <span className="text-sm font-semibold text-[#e02424]">Your answer</span>}
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
          <div className="mt-6 border-t border-[#ededf0] pt-5">
            <h4 className={clsx("mb-2 text-xl font-bold", choice === item.answer ? "text-[#2e9d3a]" : "text-[#e02424]")}>{choice === item.answer ? "Correct!" : "Not quite"}</h4>
            <p className="mb-1 text-sm text-muted">{item.avgPercent}% of students answered this correctly.</p>
            <div className="text-base leading-6 text-ink [&_p]:mb-3" dangerouslySetInnerHTML={{ __html: item.rationale.explanation }} />
            {item.rationale.takeaway.length > 0 && (
              <>
                <h5 className="mt-2 mb-1 font-bold text-ink-strong">Key Takeaway</h5>
                <ul className="list-disc pl-6 text-base text-ink">
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
          <Button>{plan === "free" ? "Upgrade to unlock" : "Set up Daily Warmup"}</Button>
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
