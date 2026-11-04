"use client";

import clsx from "clsx";
import { useEffect, useState, type ReactNode } from "react";
import { emptyAnswer, formatClock, isAnswered } from "@/lib/scoring";
import type { ExamSettings } from "@/lib/store";
import type { Answer, CaseStudy, Item, MasteryTag, TestSession } from "@/lib/types";
import { Icon, type IconName } from "@/components/ui/Icon";
import { LogoMark } from "@/components/ui/Logo";
import { BRAND, SITE_NAME } from "@/lib/brand";
import { ItemView } from "./items/ItemView";
import { Html } from "./items/shared";
import { Feedback } from "./Feedback";
import { ScenarioPanel } from "./ScenarioPanel";
import { Calculator, CompleteDialog, EndDialog, EndReviewDialog, PauseDialog, SettingsDrawer, TagTip } from "./ExamTools";

type Overlay = "drawer" | "end" | "pause" | "complete" | null;

/**
 * Everything the exam screen needs, handed in. This component imports no store and no router:
 * the student exam (ExamScreen) feeds it from the store, and the admin preview feeds it from
 * local state. That is the whole reason the preview can be trusted to save nothing, and to
 * look exactly like the real thing: there is one screen, and only its source of state differs.
 */
export interface ExamViewProps {
  session: TestSession;
  review: boolean;
  getItem: (id: string) => Item;
  getCase: (itemId: string) => CaseStudy | undefined;
  tags: Record<string, MasteryTag | undefined>;
  bookmarks: Record<string, boolean | undefined>;
  settings: ExamSettings;
  tipDismissed: boolean;
  /** Which plan the explanation's linked cards are drawn for. Omitted = the signed-in student's own. */
  plan?: "free" | "premium";
  /** Replaces the default full-screen height, e.g. when the screen sits inside another frame. */
  className?: string;
  onAnswer: (itemId: string, answer: Answer) => void;
  onSubmit: (itemId: string) => void;
  onGoTo: (index: number) => void;
  onToggleMark: (itemId: string) => void;
  onTick: (itemId: string, seconds: number) => void;
  onTag: (itemId: string, tag: MasteryTag | null) => void;
  onDismissTip: () => void;
  onSettings: (patch: Partial<ExamSettings>) => void;
  /** End the run: the End button, a timed test running out, the exam's last question. */
  onFinish: () => void;
  /** Leave review mode. */
  onExitReview: () => void;
}

/**
 * Pearson-style exam screen. Modes:
 *  - custom test: "NCLEX-RN Test (Tutored, Untimed)", End + Pause, "End Test" dialog → score report
 *  - case study:  "NCLEX-RN Test", End only, "End your review?" dialog → back to Home
 *  - readiness:   "NCLEX-RN Test", timed, End + Pause
 */
export function ExamView({
  session,
  review,
  getItem,
  getCase,
  tags,
  bookmarks,
  settings,
  tipDismissed,
  plan,
  className,
  onAnswer,
  onSubmit,
  onGoTo,
  onToggleMark,
  onTick,
  onTag,
  onDismissTip,
  onSettings,
  onFinish,
  onExitReview,
}: ExamViewProps) {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const [tabs, setTabs] = useState<Record<string, number>>({});
  const [warnFor, setWarnFor] = useState<string | null>(null);

  const isCase = session.kind === "case";
  /** CAT readiness exam: answers lock in on Next, no going back, no End button. */
  const isCat = session.kind === "readiness" && !review;
  const total = session.entries.length;
  const index = Math.min(session.current, total - 1);
  const entry = session.entries[index];
  const item = getItem(entry.itemId);
  const caseStudy = getCase(item.id);
  const caseIndex = caseStudy ? caseStudy.items.findIndex((i) => i.id === item.id) : -1;
  const firstOfCase = Boolean(caseStudy) && caseIndex === 0;

  const ended = session.status === "ended";
  const submitted = Boolean(session.submitted[item.id]);
  const locked = review || ended || submitted;
  const reveal = review || ended || (session.tutor && submitted);
  const current = session.answers[item.id] ?? emptyAnswer(item);
  const paused = overlay === "pause";

  const elapsed = Object.values(session.timeSpent).reduce((a, b) => a + b, 0);
  const clock = session.timed && session.timeLimit ? Math.max(0, session.timeLimit - elapsed) : elapsed;

  // Per-question timer: runs while the question is open and unanswered.
  useEffect(() => {
    if (review || ended || paused || submitted) return;
    const t = setInterval(() => onTick(item.id, 1), 1000);
    return () => clearInterval(t);
  }, [review, ended, paused, item.id, submitted, onTick]);

  // Timed tests end automatically when time runs out.
  useEffect(() => {
    if (session.timed && session.timeLimit && !review && !ended && clock <= 0) onFinish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock]);

  const go = (i: number) => {
    if (i < 0) return;
    if (i >= total) return review ? undefined : setOverlay("end");
    onGoTo(i);
    setOverlay(null);
  };

  const submit = () => {
    if (!isAnswered(item, current)) return setWarnFor(item.id);
    onSubmit(item.id);
    if (isCat) {
      if (index + 1 >= total) setOverlay("complete");
      else go(index + 1);
      return;
    }
    if (!session.tutor) go(index + 1);
  };

  // Keyboard shortcuts (Alt+letter, like the underlined access keys).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "n") {
        if (isCat) submit();
        else go(index + 1);
      } else if (k === "p") {
        if (!isCat) go(index - 1);
      }
      else if (k === "o") setCalcOpen((o) => !o);
      else if (k === "k") onToggleMark(item.id);
      else if (k === "g") setOverlay("drawer");
      else if (k === "s" && !locked) submit();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const title = session.kind === "custom" ? `NCLEX-RN Test (${session.tutor ? "Tutored" : "Untutored"}, ${session.timed ? "Timed" : "Untimed"})` : "NCLEX-RN Test";
  const showTimer = !isCase || settings.timer;
  const showTags = reveal && submitted;

  const itemBlock = (
    <div style={{ fontSize: settings.textSize }}>
      {item.lead && (
        <div className="mb-4">
          <p className="leading-6">{item.lead}</p>
        </div>
      )}
      <div className="flex">
        <svg viewBox="0 0 14 24" className="mr-3 h-6 w-3.5 shrink-0" aria-hidden>
          <path d="M1 5 13 12 1 19 4.5 12Z" fill={BRAND.primary} />
        </svg>
        <div className="min-w-0 flex-1">
          <Html html={item.stem} className="block leading-6" />
          <div className="mt-4">
            <ItemView item={item} answer={current} locked={locked} reveal={reveal} onChange={(a) => onAnswer(item.id, a)} />
          </div>
        </div>
      </div>
      {!locked && !isCat && (
        <div className="my-4 ml-[26px]">
          <button
            onClick={submit}
            data-testid="exam-submit"
            className="flex h-[35px] w-[100px] cursor-pointer items-center justify-center rounded-sm bg-primary text-base text-white hover:bg-primary-hover"
          >
            <u>S</u>ubmit
          </button>
          {warnFor === item.id && (
            <p className="mt-2 text-sm text-error" role="alert">
              Please complete your response before submitting.
            </p>
          )}
        </div>
      )}
      {reveal && <Feedback item={item} answer={submitted ? current : undefined} seconds={session.timeSpent[item.id] ?? 0} plan={plan} />}
      <div className="h-[72px]" />
    </div>
  );

  return (
    <div className={clsx("flex flex-col bg-white font-exam tracking-normal text-exam-ink", className ?? "h-dvh")}>
      {/* Header */}
      <header className="flex h-[42px] shrink-0 items-center justify-between bg-primary p-3 text-base text-white">
        <div className="flex min-w-0 flex-1 items-center truncate">{title}</div>
        <div className="hidden flex-1 items-center justify-center gap-2 text-center sm:flex">
          <LogoMark size={22} />
          <span>{SITE_NAME}</span>
        </div>
        <div className="flex flex-1 items-center justify-end gap-4">
          {!review && showTimer && (
            <div className="flex items-center gap-1.5" aria-label={session.timed ? "Time remaining" : "Time elapsed"}>
              <Icon name="examClock" size={20} />
              <span className="tabular-nums">{formatClock(clock)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Icon name="examQuestion" size={20} />
            <span>Question</span> {index + 1}{!isCat && ` of ${total}`}
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex h-[29px] shrink-0 items-center justify-between border-b-2 border-gold bg-info px-3 py-1 text-base text-white">
        <ToolbarButton icon="examCalc" iconSize={15} onClick={() => setCalcOpen((o) => !o)}>
          Calculat<u>o</u>r
        </ToolbarButton>
        <div className="flex items-center">
          <ToolbarButton icon="examSettings" onClick={() => setOverlay("drawer")} className="mr-2">
            Settings
          </ToolbarButton>
          {!review && (
            <ToolbarButton icon="examBookmark" onClick={() => onToggleMark(item.id)} active={session.marked[item.id]}>
              Mar<u>k</u> for Review
            </ToolbarButton>
          )}
        </div>
      </div>

      {/* Body */}
      <main className="min-h-0 flex-1 overflow-hidden">
        {caseStudy ? (
          <div className="flex h-full flex-col overflow-y-auto md:flex-row md:overflow-hidden md:pl-6">
            <div className="shrink-0 px-4 md:w-[48.5%] md:overflow-y-auto md:px-0 md:pr-6" style={{ fontSize: settings.textSize }}>
              <ScenarioPanel
                caseStudy={caseStudy}
                index={caseIndex}
                showBanner={firstOfCase}
                visibleTabs={item.tabs ?? caseStudy.tabs.length}
                itemTabs={item.caseTabs}
                tab={tabs[caseStudy.id] ?? 0}
                onTab={(t) => setTabs((s) => ({ ...s, [caseStudy.id]: t }))}
              />
              <div className="h-[72px]" />
            </div>
            <div className="hidden w-px shrink-0 bg-line md:block" />
            <div className="min-w-0 flex-1 px-4 pt-6 md:overflow-y-auto md:px-6">{itemBlock}</div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto px-4 pt-6 md:px-6">
            <div className="mx-auto max-w-[900px]">{itemBlock}</div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative flex h-10 shrink-0 items-stretch justify-between bg-primary text-white">
        <div className="flex items-stretch">
          {review ? (
            <FooterButton icon="examEnd" onClick={onExitReview} right testId="exam-review">
              Exit Review
            </FooterButton>
          ) : (
            <>
              {!isCat && (
                <FooterButton icon="examEnd" onClick={() => setOverlay("end")} right testId="exam-end">
                  End
                </FooterButton>
              )}
              {!isCase && (
                <FooterButton pause onClick={() => setOverlay("pause")} right>
                  Pause
                </FooterButton>
              )}
            </>
          )}
        </div>
        <div className="flex items-stretch">
          {showTags && <TagButtons value={tags[item.id]} onChange={(t) => onTag(item.id, tags[item.id] === t ? null : t)} />}
          {!isCat && (
            <>
              <FooterButton icon="examPrev" onClick={() => go(index - 1)} disabled={index === 0} testId="exam-prev">
                <u>P</u>revious
              </FooterButton>
              <FooterButton icon="examNavigate" onClick={() => setOverlay("drawer")}>
                Navi<u>g</u>ate
              </FooterButton>
            </>
          )}
          <FooterButton next onClick={() => (isCat ? submit() : go(index + 1))} disabled={(review && index === total - 1) || (isCat && !isAnswered(item, current))} testId="exam-next">
            <u>N</u>ext
          </FooterButton>
        </div>
        {showTags && !tipDismissed && <TagTip onClose={onDismissTip} />}
      </footer>

      {calcOpen && <Calculator onClose={() => setCalcOpen(false)} />}
      {overlay === "drawer" && (
        <SettingsDrawer session={session} settings={settings} onSettings={onSettings} tags={tags} bookmarks={bookmarks} getItem={getItem} onClose={() => setOverlay(null)} onJump={go} />
      )}
      {overlay === "end" &&
        (isCase ? (
          <EndReviewDialog session={session} tags={tags} onCancel={() => setOverlay(null)} onEnd={onFinish} />
        ) : (
          <EndDialog onCancel={() => setOverlay(null)} onEnd={onFinish} />
        ))}
      {overlay === "pause" && <PauseDialog onResume={() => setOverlay(null)} />}
      {overlay === "complete" && <CompleteDialog onView={onFinish} />}
    </div>
  );
}

function ToolbarButton({
  icon,
  iconSize = 20,
  children,
  onClick,
  active,
  className,
}: {
  icon: IconName;
  iconSize?: number;
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button onClick={onClick} className={clsx("group flex cursor-pointer items-center gap-1.5 hover:text-gold", active && "text-gold", className)}>
      <Icon name={icon} size={iconSize} className="[&_path]:transition-colors group-hover:[&_path]:stroke-gold" />
      <span>{children}</span>
    </button>
  );
}

function FooterButton({
  icon,
  children,
  onClick,
  disabled,
  right,
  next,
  pause,
  testId,
}: {
  icon?: IconName;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  right?: boolean;
  next?: boolean;
  pause?: boolean;
  /** Stable handle for end-to-end tests; these buttons are icon-led and hard to name. */
  testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={clsx(
        "flex cursor-pointer items-center gap-1 px-2 py-2.5 text-xl hover:text-gold disabled:cursor-default disabled:opacity-50 disabled:hover:text-white",
        right ? "border-r border-white" : "border-l border-white",
      )}
    >
      {icon && <Icon name={icon} size={20} />}
      {pause && (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="12" cy="12" r="9.5" />
          <path d="M10 8.5v7M14 8.5v7" strokeLinecap="round" />
        </svg>
      )}
      <span className={clsx((icon || pause) && "hidden sm:inline")}>{children}</span>
      {next && <Icon name="examPrev" size={20} className="rotate-180" />}
    </button>
  );
}

const TAGS: { id: MasteryTag; label: string; cls: string }[] = [
  { id: "learning", label: "Learning", cls: "bg-error text-white hover:bg-error" },
  { id: "reviewing", label: "Reviewing", cls: "bg-warning text-ink hover:bg-warning" },
  { id: "mastered", label: "Mastered", cls: "bg-success text-white hover:bg-success" },
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
            "flex cursor-pointer items-center gap-1.5 border-l border-white px-3 text-xl transition-colors",
            t.cls,
            value === t.id && "shadow-[inset_0_0_0_2px_#fff]",
          )}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
            <path d="M3 12.6V4a1 1 0 0 1 1-1h8.6l8.7 8.7a1 1 0 0 1 0 1.4l-7.6 7.6a1 1 0 0 1-1.4 0L3 12.6ZM8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
          </svg>
          <span>
            <u>{t.label[0]}</u>
            {t.label.slice(1)}
          </span>
        </button>
      ))}
    </div>
  );
}
