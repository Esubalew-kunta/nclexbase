"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Bookmark, Calculator as CalcIcon, CirclePause, Clock, Compass, ListChecks, LogOut, Settings, Tag } from "lucide-react";
import { caseForItem, itemById } from "@/lib/bank";
import { emptyAnswer, formatClock, isAnswered } from "@/lib/scoring";
import { useStore } from "@/lib/store";
import type { MasteryTag, TestSession } from "@/lib/types";
import { ItemView } from "./items/ItemView";
import { Html } from "./items/shared";
import { Feedback } from "./Feedback";
import { ScenarioPanel } from "./ScenarioPanel";
import { Calculator, EndDialog, NavigateDialog, PauseDialog, SettingsDrawer } from "./ExamTools";

type Overlay = "calc" | "settings" | "navigate" | "end" | "pause" | null;

export function ExamScreen({ session, review }: { session: TestSession; review: boolean }) {
  const router = useRouter();
  const { answer, submit, goTo, toggleMark, tick, endSession, setTag } = useStore.getState();
  const tags = useStore((s) => s.tags);
  const settings = useStore((s) => s.examSettings);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const [tabs, setTabs] = useState<Record<string, number>>({});
  const [warnFor, setWarnFor] = useState<string | null>(null);

  const total = session.entries.length;
  const index = Math.min(session.current, total - 1);
  const entry = session.entries[index];
  const item = itemById(entry.itemId);
  const caseStudy = caseForItem(item.id);
  const caseIndex = caseStudy ? caseStudy.items.findIndex((i) => i.id === item.id) : -1;
  const prevEntry = session.entries[index - 1];
  const firstOfCase = Boolean(caseStudy) && prevEntry?.caseId !== entry.caseId;

  const ended = session.status === "ended";
  const locked = review || ended || Boolean(session.submitted[item.id]);
  const reveal = review || ended || (session.tutor && Boolean(session.submitted[item.id]));
  const current = session.answers[item.id] ?? emptyAnswer(item);
  const paused = overlay === "pause";

  const elapsed = Object.values(session.timeSpent).reduce((a, b) => a + b, 0);
  const clock = session.timed && session.timeLimit ? Math.max(0, session.timeLimit - elapsed) : elapsed;

  // Per-question timer: runs while the question is open and unanswered.
  useEffect(() => {
    if (review || ended || paused || session.submitted[item.id]) return;
    const t = setInterval(() => tick(session.id, item.id, 1), 1000);
    return () => clearInterval(t);
  }, [review, ended, paused, session.id, item.id, session.submitted, tick]);

  const finish = () => {
    endSession(session.id);
    router.replace(`/nclex/previous-tests/review?id=${session.id}`);
  };

  // Timed tests end automatically when time runs out.
  useEffect(() => {
    if (session.timed && session.timeLimit && !review && !ended && clock <= 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock]);

  const go = (i: number) => {
    if (i < 0) return;
    if (i >= total) return review || ended ? undefined : setOverlay("end");
    goTo(session.id, i);
    setOverlay(null);
  };

  const onSubmit = () => {
    if (!isAnswered(item, current)) return setWarnFor(item.id);
    submit(session.id, item.id);
    if (!session.tutor) go(index + 1);
  };

  const title = `NCLEX-RN ${session.kind === "readiness" ? session.title : "Test"}${session.kind === "custom" ? ` (${session.tutor ? "Tutored" : "Untutored"}, ${session.timed ? "Timed" : "Untimed"})` : ""}${review ? " · Review" : ""}`;
  const unanswered = session.entries.filter((e) => !session.submitted[e.itemId] && !isAnswered(itemById(e.itemId), session.answers[e.itemId])).length;

  const itemBlock = (
    <div>
      <div className="flex gap-3">
        <svg viewBox="0 0 16 16" className="mt-1 size-4 shrink-0" aria-hidden>
          <path d="M2 1 15 8 2 15 6 8Z" fill="#1076c2" />
        </svg>
        <Html html={item.stem} className="leading-6" />
      </div>
      <div className="mt-5 pl-8">
        <ItemView item={item} answer={current} locked={locked} reveal={reveal} onChange={(a) => answer(session.id, item.id, a)} />
        {!locked && (
          <div className="mt-6">
            <button accessKey="s" onClick={onSubmit} className="h-[35px] min-w-[100px] bg-exam px-6 text-white hover:bg-[#005a8e]">
              <u>S</u>ubmit
            </button>
            {warnFor === item.id && <p className="mt-2 text-sm text-[#b3261e]" role="alert">Please complete your response before submitting.</p>}
          </div>
        )}
        {reveal && <Feedback item={item} answer={session.submitted[item.id] ? current : undefined} seconds={session.timeSpent[item.id] ?? 0} />}
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh flex-col bg-white font-exam text-[#222]">
      {/* Header */}
      <header className="flex h-[42px] shrink-0 items-center gap-4 bg-exam px-3 text-[15px] text-white">
        <span className="min-w-0 flex-1 truncate">{title}</span>
        <span className="hidden flex-1 text-center sm:block">Bootcamp.com</span>
        <span className="flex flex-1 items-center justify-end gap-4">
          {!review && (
            <span className="flex items-center gap-1.5" aria-label={session.timed ? "Time remaining" : "Time elapsed"}>
              <Clock className="size-[18px]" />
              <span className="tabular-nums">{formatClock(clock)}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <ListChecks className="size-[18px]" />
            Question {index + 1} of {total}
          </span>
        </span>
      </header>

      {/* Toolbar */}
      <div className="flex h-[29px] shrink-0 items-center bg-exam-tool px-2 text-[15px] text-white">
        <ToolbarButton icon={CalcIcon} onClick={() => setCalcOpen((o) => !o)} accessKey="o">
          Calculat<u>o</u>r
        </ToolbarButton>
        <span className="flex-1" />
        <ToolbarButton icon={Settings} onClick={() => setOverlay("settings")} active={overlay === "settings"}>
          Settings
        </ToolbarButton>
        {!review && (
          <ToolbarButton icon={Bookmark} onClick={() => toggleMark(session.id, item.id)} accessKey="k" filled={session.marked[item.id]}>
            Mar<u>k</u> for Review
          </ToolbarButton>
        )}
      </div>

      {/* Body */}
      <main className="min-h-0 flex-1" style={{ fontSize: settings.textSize }}>
        {caseStudy ? (
          <div className="h-full overflow-y-auto md:grid md:grid-cols-2 md:overflow-hidden">
            <div className="border-b border-[#d6d6d6] p-4 sm:p-6 md:overflow-y-auto md:border-r md:border-b-0">
              <ScenarioPanel
                caseStudy={caseStudy}
                index={caseIndex}
                showBanner={firstOfCase}
                tab={tabs[caseStudy.id] ?? 0}
                onTab={(t) => setTabs((s) => ({ ...s, [caseStudy.id]: t }))}
              />
            </div>
            <div className="p-4 sm:p-6 md:overflow-y-auto">{itemBlock}</div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-6">
            <div className="mx-auto max-w-[900px]">{itemBlock}</div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="flex h-10 shrink-0 items-stretch bg-exam text-white">
        {review || ended ? (
          <FooterButton icon={LogOut} onClick={() => router.push(`/nclex/previous-tests/review?id=${session.id}`)}>
            Exit Review
          </FooterButton>
        ) : (
          <>
            <FooterButton icon={LogOut} onClick={() => setOverlay("end")}>
              End
            </FooterButton>
            <FooterButton icon={CirclePause} onClick={() => setOverlay("pause")}>
              Pause
            </FooterButton>
          </>
        )}
        <span className="flex-1" />
        {reveal && <TagButtons value={tags[item.id]} onChange={(t) => setTag(item.id, tags[item.id] === t ? null : t)} />}
        <FooterButton icon={ArrowLeft} onClick={() => go(index - 1)} accessKey="p" disabled={index === 0} bordered>
          <u>P</u>revious
        </FooterButton>
        <FooterButton icon={Compass} onClick={() => setOverlay("navigate")} accessKey="g" bordered>
          Navi<u>g</u>ate
        </FooterButton>
        <FooterButton iconRight={ArrowRight} onClick={() => go(index + 1)} accessKey="n" bordered disabled={(review || ended) && index === total - 1}>
          <u>N</u>ext
        </FooterButton>
      </footer>

      {calcOpen && <Calculator onClose={() => setCalcOpen(false)} />}
      {overlay === "settings" && <SettingsDrawer session={session} onClose={() => setOverlay(null)} onJump={go} />}
      {overlay === "navigate" && <NavigateDialog session={session} onJump={go} onClose={() => setOverlay(null)} />}
      {overlay === "end" && <EndDialog unanswered={unanswered} onCancel={() => setOverlay(null)} onEnd={finish} />}
      {overlay === "pause" && <PauseDialog onResume={() => setOverlay(null)} />}
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  children,
  onClick,
  accessKey,
  active,
  filled,
}: {
  icon: typeof Clock;
  children: ReactNode;
  onClick: () => void;
  accessKey?: string;
  active?: boolean;
  filled?: boolean;
}) {
  return (
    <button onClick={onClick} accessKey={accessKey} className={clsx("flex h-full items-center gap-1.5 px-2 hover:bg-white/10", active && "text-[#ffff66]")}>
      <Icon className={clsx("size-[18px]", filled && "fill-white")} />
      <span>{children}</span>
    </button>
  );
}

function FooterButton({
  icon: Icon,
  iconRight: IconRight,
  children,
  onClick,
  accessKey,
  disabled,
  bordered,
}: {
  icon?: typeof Clock;
  iconRight?: typeof Clock;
  children: ReactNode;
  onClick: () => void;
  accessKey?: string;
  disabled?: boolean;
  bordered?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      accessKey={accessKey}
      disabled={disabled}
      className={clsx(
        "flex items-center gap-1.5 px-2.5 text-[17px] hover:bg-white/10 disabled:opacity-50 sm:text-[19px]",
        bordered ? "border-l border-white/40" : "border-r border-white/40",
      )}
    >
      {Icon && <Icon className="size-5" />}
      <span className={clsx(Icon && "hidden sm:inline", IconRight && "hidden sm:inline")}>{children}</span>
      {IconRight && <IconRight className="size-5" />}
    </button>
  );
}

const TAGS: { id: MasteryTag; label: string; cls: string }[] = [
  { id: "learning", label: "Learning", cls: "bg-grad-bad" },
  { id: "reviewing", label: "Reviewing", cls: "bg-grad-warn" },
  { id: "mastered", label: "Mastered", cls: "bg-grad-good" },
];

function TagButtons({ value, onChange }: { value?: MasteryTag; onChange: (t: MasteryTag) => void }) {
  return (
    <div className="hidden items-stretch lg:flex">
      {TAGS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          aria-pressed={value === t.id}
          title={`Tag as ${t.label}`}
          className={clsx(
            "flex items-center gap-1.5 border-l border-white/40 px-3 text-[17px] text-white",
            t.cls,
            value && value !== t.id && "opacity-50",
            value === t.id && "ring-2 ring-white ring-inset",
          )}
        >
          <Tag className="size-4 fill-white/90" />
          <span>
            <u>{t.label[0]}</u>
            {t.label.slice(1)}
          </span>
        </button>
      ))}
    </div>
  );
}

export function ExamLoading() {
  return (
    <div className="bg-app-gradient flex h-dvh items-center justify-center">
      <span className="size-6 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-label="Loading" />
    </div>
  );
}

export function ExamNotFound() {
  return (
    <div className="bg-app-gradient flex h-dvh flex-col items-center justify-center gap-4 text-white">
      <p className="text-lg">This test could not be found on this device.</p>
      <Link href="/nclex" className="rounded-full bg-white px-5 py-2 font-semibold text-brand">
        Back to Home
      </Link>
    </div>
  );
}
