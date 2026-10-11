"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUp, CircleAlert, CircleCheck, CirclePlay, CircleX, Clock, FileText, MessageSquare, Scale, ShieldCheck, Sparkles, SquarePen, Timer } from "lucide-react";
import { subjectName, systemLabel, useConfig } from "@/lib/content";
import { useStore } from "@/lib/store";
import { avgPoints, formatClock, scoreItem, scoringRule } from "@/lib/scoring";
import type { Answer, Item } from "@/lib/types";
import { Html } from "./items/shared";

export function Feedback({ item, answer, seconds }: { item: Item; answer: Answer | undefined; seconds: number }) {
  const plan = useStore((s) => s.user.plan);
  const askAi = useConfig().exam.askAi;
  const { earned, max } = scoreItem(item, answer);
  const status = earned === max ? "Correct" : earned === 0 ? "Incorrect" : "Partial Credit";

  return (
    <div className="mt-8 max-w-[760px] space-y-8">
      <section>
        <h3
          className={clsx(
            "mb-2 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-semibold",
            status === "Correct" ? "border-success/30 bg-success/10 text-success" : status === "Incorrect" ? "border-error/30 bg-error/10 text-error" : "border-warning/50 bg-warning/15 text-exam-ink",
          )}
        >
          {status === "Correct" ? <CircleCheck className="size-4" /> : status === "Incorrect" ? <CircleX className="size-4" /> : <CircleAlert className="size-4 text-warning" />}
          {status}
        </h3>
        <div className="divide-y divide-line rounded-lg border border-line text-[15px]">
          <StatRow icon={CircleCheck} label="Credit" value={`${earned} / ${max}`} />
          <StatRow icon={Scale} label="Avg Points Scored" value={`${avgPoints(item)} / ${max}`} />
          <StatRow icon={SquarePen} label="Scoring Rule" value={`${scoringRule(item)} Scoring`} />
          <StatRow icon={Timer} label="Time Spent" value={formatClock(seconds).replace(/^00:/, "")} />
        </div>
      </section>

      <section>
        <SectionHead icon={FileText}>Explanation</SectionHead>
        {!item.rationale.raw && (
        <div className="relative mb-6 flex aspect-video items-center justify-center overflow-hidden rounded border-b-4 border-gold bg-gradient-to-br from-primary-hover to-primary text-white">
          <div className="text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <CirclePlay className="size-9" />
            </span>
            <p className="mt-3 text-sm text-white/80">Video explanation · {item.topic}</p>
          </div>
          <span className="absolute bottom-2 left-3 text-xs text-white/60">Video explanations are placeholders in this prototype.</span>
        </div>
        )}
        <div className="prose-exam rounded-lg border border-line bg-primary-light px-5 pt-5 pb-1 leading-7">
          <Html html={item.rationale.explanation} />
          {item.rationale.incorrect && (
            <>
              <h4>Incorrect:</h4>
              {item.rationale.incorrect.map((x) => (
                <p key={x.label}>
                  <b>{x.label}</b>
                  <br />
                  {x.text}
                </p>
              ))}
            </>
          )}
          {!item.rationale.raw && (
            <>
              <h4>Key Takeaway:</h4>
              <ul>
                {item.rationale.takeaway.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p>
                <b>Version</b> 2026
              </p>
            </>
          )}
        </div>
        <button className="text-[15px] text-primary underline hover:text-primary-hover">View Sources</button>
        <dl className="mt-5 grid grid-cols-3 gap-4 text-[15px]">
          {[
            [subjectName(item.subject), "Subject"],
            [systemLabel(item.subject, item.system), "System"],
            [item.topic, "Topic"],
          ].map(([v, k]) => (
            <div key={k}>
              <dd className="text-exam-ink">{v}</dd>
              <dt className="text-xs text-muted">{k}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Admin > Settings > Exam can switch the AI assistant off. */}
      {askAi && <AskAi item={item} />}

      {item.linkedVideo && (
        <section>
          <SectionHead icon={CirclePlay}>Linked Crash Course Video</SectionHead>
          <LinkedCard kind="video" title={item.linkedVideo} subtitle={subjectName(item.subject)} locked={plan === "free"} href={`/nclex/${item.subject}/crash-courses`} />
        </section>
      )}
      {item.linkedSheet && (
        <section>
          <SectionHead icon={FileText}>Linked Cheat Sheet</SectionHead>
          <LinkedCard kind="sheet" title={item.linkedSheet} subtitle={subjectName(item.subject)} locked={plan === "free"} href="/nclex/cheat-sheets" />
        </section>
      )}

      <a href="mailto:support@example.com" className="flex h-11 items-center justify-center gap-2 rounded-full border border-line text-sm text-muted hover:bg-primary-light hover:text-primary">
        Still have a question? Contact our team <ArrowRight className="size-4" />
      </a>
    </div>
  );
}

function StatRow({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <Icon className="size-4 text-primary" />
      <span className="flex-1">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function SectionHead({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-[17px] font-semibold text-exam-ink">
      <Icon className="size-[18px]" />
      {children}
    </h3>
  );
}

function LinkedCard({ kind, title, subtitle, locked, href }: { kind: "video" | "sheet"; title: string; subtitle: string; locked: boolean; href: string }) {
  return (
    <Link href={locked ? "/nclex/upgrade" : href} target="_blank" className="flex items-center gap-4 rounded-lg border border-line p-3 shadow-sm hover:bg-primary-light">
      <span
        className={clsx(
          "flex h-[62px] w-[110px] shrink-0 items-center justify-center rounded text-xs font-semibold text-white",
          kind === "video" ? "bg-gradient-to-br from-primary to-primary-hover" : "bg-primary-light text-primary",
        )}
      >
        {kind === "video" ? <CirclePlay className="size-7" /> : <FileText className="size-7" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-exam-ink">{title}</span>
        <span className="block text-sm text-muted">{subtitle}</span>
      </span>
      {locked && <ShieldCheck className="size-5 fill-gold text-white" />}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Ask NCLEXBase AI (simulated: answers from the item's own rationale)  */
/* ------------------------------------------------------------------ */

function AskAi({ item }: { item: Item }) {
  const [q, setQ] = useState("");
  const [thread, setThread] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const ask = () => {
    const question = q.trim();
    if (!question || busy) return;
    setThread((t) => [...t, { role: "user", text: question }]);
    setQ("");
    setBusy(true);
    setTimeout(() => {
      const plain = item.rationale.explanation.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, "'").replace(/\s+/g, " ").trim();
      const firstSentences = plain.split(/(?<=\.)\s/).slice(0, 2).join(" ");
      setThread((t) => [
        ...t,
        {
          role: "ai",
          text: `Good question. ${firstSentences} The key idea to remember: ${item.rationale.takeaway[0]}`,
        },
      ]);
      setBusy(false);
    }, 700);
  };

  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-[17px] font-semibold text-exam-ink">
        <MessageSquare className="size-[18px]" />
        Ask NCLEXBase AI
      </h3>
      {thread.length > 0 && (
        <div className="mb-3 space-y-3">
          {thread.map((m, i) => (
            <div key={i} className={clsx("flex", m.role === "user" && "justify-end")}>
              <div className={clsx("max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-6", m.role === "user" ? "bg-primary text-white" : "bg-primary-light text-exam-ink")}>
                {m.role === "ai" && <Sparkles className="mr-1.5 inline size-4 text-primary" />}
                {m.text}
              </div>
            </div>
          ))}
          {busy && <div className="text-sm text-muted">NCLEXBase AI is thinking…</div>}
        </div>
      )}
      <div className="relative rounded-lg border border-line shadow-sm">
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask();
            }
          }}
          placeholder="Ask NCLEXBase AI a question..."
          rows={3}
          className="w-full resize-none rounded-lg px-4 py-3 text-[15px] text-exam-ink outline-none placeholder:text-muted"
        />
        <button
          onClick={ask}
          disabled={!q.trim() || busy}
          aria-label="Send question"
          className="absolute right-3 bottom-3 flex size-7 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover disabled:bg-faint"
        >
          <ArrowUp className="size-4" />
        </button>
      </div>
      <p className="mt-1.5 text-xs text-muted">AI answers are simulated from the explanation in this prototype.</p>
    </section>
  );
}
