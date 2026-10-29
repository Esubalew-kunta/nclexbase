"use client";

import clsx from "clsx";
import { useRef, useState, type ReactNode } from "react";
import { Calculator as CalcIcon, SquareX } from "lucide-react";
import { useStore, type ExamSettings } from "@/lib/store";
import { itemById } from "@/lib/bank";
import { formatDuration, scoreItem } from "@/lib/scoring";
import type { MasteryTag, TestSession } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { BRAND, SITE_NAME } from "@/lib/brand";

/* ------------------------------------------------------------------ */
/* Calculator (TI-108 look-alike, draggable)                            */
/* ------------------------------------------------------------------ */

export function Calculator({ onClose }: { onClose: () => void }) {
  const [pos, setPos] = useState(() => ({ x: Math.max(8, Math.min(587, window.innerWidth - 282)), y: 120 }));
  const [display, setDisplay] = useState("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);
  const [mem, setMem] = useState(0);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const value = () => parseFloat(display);
  const show = (n: number) => setDisplay(Number.isFinite(n) ? String(parseFloat(n.toPrecision(10))) : "Error");
  const apply = (a: number, b: number, o: string) => (o === "+" ? a + b : o === "-" ? a - b : o === "×" ? a * b : b === 0 ? NaN : a / b);

  const press = (k: string) => {
    if (/^[0-9]$/.test(k)) {
      setDisplay(fresh || display === "0" ? k : display.length < 10 ? display + k : display);
      setFresh(false);
    } else if (k === ".") {
      if (fresh) setDisplay("0.");
      else if (!display.includes(".")) setDisplay(display + ".");
      setFresh(false);
    } else if (["+", "-", "×", "÷"].includes(k)) {
      if (acc !== null && op && !fresh) {
        const r = apply(acc, value(), op);
        setAcc(r);
        show(r);
      } else setAcc(value());
      setOp(k);
      setFresh(true);
    } else if (k === "=") {
      if (acc !== null && op) {
        show(apply(acc, value(), op));
        setAcc(null);
        setOp(null);
        setFresh(true);
      }
    } else if (k === "√") {
      show(Math.sqrt(value()));
      setFresh(true);
    } else if (k === "%") {
      show(acc !== null ? (acc * value()) / 100 : value() / 100);
      setFresh(true);
    } else if (k === "+/-") show(-value());
    else if (k === "ON/C") {
      setDisplay("0");
      setAcc(null);
      setOp(null);
      setFresh(true);
    } else if (k === "M+") setMem(mem + value());
    else if (k === "M-") setMem(mem - value());
    else if (k === "MRC") show(mem);
  };

  const keys = ["+/-", "√", "%", "÷", "MRC", "M-", "M+", "×", "7", "8", "9", "-", "4", "5", "6", "+", "1", "2", "3", "=", "ON/C", "0", "."];
  const red = (k: string) => !/^[0-9.]$/.test(k);

  return (
    <div
      className="fixed z-50 w-[266px] rounded-lg bg-primary p-1.5 font-exam shadow-2xl"
      style={{ left: pos.x, top: pos.y }}
      role="dialog"
      aria-label="Calculator"
    >
      <div
        className="flex cursor-move items-center gap-2 px-1.5 pb-1.5 text-white select-none"
        onPointerDown={(e) => {
          drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => drag.current && setPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy })}
        onPointerUp={() => (drag.current = null)}
      >
        <CalcIcon className="size-4" />
        <span className="flex-1">Calculator</span>
        <button onClick={onClose} aria-label="Close calculator">
          <SquareX className="size-4" />
        </button>
      </div>
      <div className="bg-primary-hover px-4 pt-6 pb-3">
        <div className="rounded-sm border-2 border-faint bg-primary-light px-2 py-1 text-right font-mono text-2xl tracking-widest text-exam-ink">{display}</div>
        <div className="mt-3 flex items-center justify-between font-serif text-[11px] text-white">
          <span>TEXAS INSTRUMENTS</span>
          <b className="text-base">TI-108SC</b>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 bg-primary-hover px-4 pt-2 pb-4">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className={clsx(
              "h-9 rounded-sm border-2 font-serif text-sm font-semibold active:translate-y-px",
              red(k) ? "border-white/30 bg-info text-white" : "border-line bg-white text-primary-hover",
              k === "=" && "row-span-2 h-auto",
            )}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="flex justify-end px-1.5 pt-1.5 text-sm text-white">
        <button onClick={onClose} className="flex items-center gap-1">
          <SquareX className="size-4" />
          Close
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Settings / Navigate drawer (right side, deep teal)                   */
/* ------------------------------------------------------------------ */

const SETTING_ROWS: { key: keyof ExamSettings; label: string; caseOnly?: boolean }[] = [
  { key: "answerStats", label: "Answer Stats" },
  { key: "timer", label: "Timer", caseOnly: true },
  { key: "shortcuts", label: "Show Keyboard Shortcuts" },
  { key: "restrictions", label: "NCLEX Restrictions" },
  { key: "gridView", label: "Grid View" },
  { key: "hoverPreview", label: "Hover Preview" },
];

export const TAG_STYLE: Record<MasteryTag | "unused" | "bookmarked", string> = {
  unused: BRAND.faint,
  learning: BRAND.error,
  reviewing: BRAND.warning,
  mastered: BRAND.success,
  bookmarked: BRAND.gold,
};

export function TagIcon({ tag, size = 16 }: { tag: keyof typeof TAG_STYLE; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded" style={{ width: size, height: size, background: TAG_STYLE[tag] }}>
      <svg viewBox="0 0 24 24" style={{ width: size * 0.62, height: size * 0.62 }} fill="white">
        {tag === "bookmarked" ? <path d="M6 3h12v18l-6-4-6 4z" /> : <path d="M3 12.6V4a1 1 0 0 1 1-1h8.6l8.7 8.7a1 1 0 0 1 0 1.4l-7.6 7.6a1 1 0 0 1-1.4 0L3 12.6ZM8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />}
      </svg>
    </span>
  );
}

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={clsx("relative ml-auto h-5 w-10 shrink-0 cursor-pointer rounded-[20px] border transition-colors duration-300", on ? "border-success bg-success" : "border-white/30 bg-white/30")}
    >
      <span className={clsx("absolute top-px left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-300", on && "translate-x-[18px]")} />
    </button>
  );
}

const CHECK = "M40.32 12.7a1.5 1.5 0 0 1-.02 2.12l-22.25 22a1.5 1.5 0 0 1-2.11 0L7.68 28.5a1.5 1.5 0 1 1 2.1-2.12l7.2 7.13 21.2-20.83a1.5 1.5 0 0 1 2.14.02Z";
const HALF = "M2.03 11.25a10 10 0 0 1 19.94 0H22V12a10 10 0 0 1-20 0v-.75h.03ZM12 20.5a8.5 8.5 0 0 0 8.47-7.75H3.53A8.5 8.5 0 0 0 12 20.5Z";
const CROSS = "M8.56 6.44a1.5 1.5 0 1 0-2.12 2.12L21.88 24 6.44 39.44a1.5 1.5 0 1 0 2.12 2.12L24 26.12l15.44 15.44a1.5 1.5 0 0 0 2.12-2.12L26.12 24 41.56 8.56a1.5 1.5 0 0 0-2.12-2.12L24 21.88 8.56 6.44Z";

export function SettingsDrawer({ session, onClose, onJump }: { session: TestSession; onClose: () => void; onJump: (i: number) => void }) {
  const settings = useStore((s) => s.examSettings);
  const setSettings = useStore((s) => s.setExamSettings);
  const tags = useStore((s) => s.tags);
  const bookmarks = useStore((s) => s.bookmarks);
  const isCase = session.kind === "case";
  const tabsList: string[] = isCase ? ["All", "Status"] : ["All", "Status", "Topics"];
  const [tab, setTab] = useState("All");
  const [showSettings, setShowSettings] = useState(true);
  const [q, setQ] = useState("");
  const total = session.entries.length;
  const answered = session.entries.filter((e) => session.submitted[e.itemId]).length;

  const credit = { full: 0, partial: 0, none: 0 };
  const pools = { unused: 0, learning: 0, reviewing: 0, mastered: 0, bookmarked: 0 };
  session.entries.forEach((e) => {
    if (session.submitted[e.itemId]) {
      const sc = scoreItem(itemById(e.itemId), session.answers[e.itemId]);
      if (sc.earned >= sc.max) credit.full++;
      else if (sc.earned > 0) credit.partial++;
      else credit.none++;
    } else pools.unused++;
    const t = tags[e.itemId];
    if (t) pools[t]++;
    if (bookmarks[e.itemId]) pools.bookmarked++;
  });

  const rows = session.entries
    .map((e, i) => ({ e, i, item: itemById(e.itemId) }))
    .filter(({ i, item }) => !q || `question ${i + 1} ${item.topic}`.toLowerCase().includes(q.toLowerCase()));
  const topics = [...new Set(rows.map((r) => r.item.topic))];
  const tabIndex = Math.max(0, tabsList.indexOf(tab));

  const creditRows: [string, number, string, string][] = [
    ["Full Credit", credit.full, CHECK, "0 0 48 48"],
    ["Partial Credit", credit.partial, HALF, "0 0 24 24"],
    ["No Credit", credit.none, CROSS, "0 0 48 48"],
  ];

  return (
    <div className="fixed inset-0 z-40 font-exam tracking-normal" role="dialog" aria-label="Test navigation">
      <div className="animate-fade-in absolute inset-0 bg-black/45" onClick={onClose} />
      <aside className="animate-slide-in-right absolute inset-y-0 right-0 flex w-[256px] flex-col overflow-y-auto bg-primary text-white">
        <div className="shrink-0">
          <div className="border-b border-black/10 px-4 pt-4 pb-3">
            <button onClick={onClose} aria-label="Close" className="flex size-14 cursor-pointer items-center justify-center rounded-full border border-white/5 bg-white/10 p-4 hover:bg-white/20">
              <svg viewBox="0 0 20 20" className="h-6 w-[22px] rotate-180" fill="white">
                <path d="M11.27 15.8a.75.75 0 0 1-1.06-.03l-5-5.25a.75.75 0 0 1 0-1.04l5-5.25a.75.75 0 1 1 1.08 1.04L6.8 10l4.5 4.73c.29.3.28.78-.02 1.06Zm4 0a.75.75 0 0 1-1.06-.03l-5-5.25a.75.75 0 0 1 0-1.04l5-5.25a.75.75 0 1 1 1.09 1.04L10.8 10l4.5 4.73c.29.3.28.78-.02 1.06Z" />
              </svg>
            </button>
            <div className="pt-4">
              <h4 className="mb-1 text-base leading-4 text-white/70">{isCase ? "Question Bank" : SITE_NAME}</h4>
              <h4 className="text-lg leading-[18px] font-bold">{isCase ? session.title : `${session.tutor ? "Tutored" : "Untutored"}, ${session.timed ? "Timed" : "Untimed"}`}</h4>
            </div>
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex h-[10px] overflow-hidden rounded-lg bg-white/15">
                <span className="bg-success h-2" style={{ width: `${(pools.mastered / total) * 100}%` }} />
                <span className="bg-warning h-2" style={{ width: `${(pools.reviewing / total) * 100}%` }} />
                <span className="bg-error h-2" style={{ width: `${(pools.learning / total) * 100}%` }} />
              </div>
              <div className="flex items-center gap-2">
                <h5 className="text-sm leading-[14px]">
                  {answered}/{total}
                </h5>
                <button
                  onClick={() => setShowSettings((v) => !v)}
                  aria-label="Toggle settings"
                  className="ml-auto flex size-8 cursor-pointer items-center justify-center rounded-lg border border-black/5 bg-white p-2 text-ink"
                >
                  <Icon name="examSettings" size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden transition-[max-height] duration-[400ms] ease-in-out" style={{ maxHeight: showSettings ? 400 : 0 }}>
            <div className="px-4 pt-2">
              <div className="flex items-center border-b border-black/10 pb-2 text-sm">
                <span>Text Size</span>
                <div className="ml-auto flex">
                  <button aria-label="Smaller text" onClick={() => setSettings({ textSize: Math.max(14, settings.textSize - 1) })} className="flex size-6 cursor-pointer items-center justify-center rounded-full hover:bg-white/10">
                    <svg viewBox="0 0 48 48" className="size-3.5" fill="white">
                      <path d="M6 23.5c0-.83.67-1.5 1.5-1.5h33a1.5 1.5 0 0 1 0 3h-33A1.5 1.5 0 0 1 6 23.5Z" />
                    </svg>
                  </button>
                  <button aria-label="Reset text size" onClick={() => setSettings({ textSize: 16 })} className="flex size-6 cursor-pointer items-center justify-center rounded-full text-xs hover:bg-white/10">
                    aA
                  </button>
                  <button aria-label="Larger text" onClick={() => setSettings({ textSize: Math.min(22, settings.textSize + 1) })} className="flex size-6 cursor-pointer items-center justify-center rounded-full hover:bg-white/10">
                    <svg viewBox="0 0 28 28" className="size-3.5" fill="white">
                      <path d="M24 13h-9V4a1 1 0 1 0-2 0v9H4a1 1 0 1 0 0 2h9v9a1 1 0 1 0 2 0v-9h9a1 1 0 1 0 0-2Z" />
                    </svg>
                  </button>
                </div>
              </div>
              {SETTING_ROWS.filter((r) => !r.caseOnly || isCase).map((r) => (
                <div key={r.key} className="flex items-center border-b border-black/10 py-2 text-sm leading-[19px]">
                  <span>{r.label}</span>
                  <Switch on={Boolean(settings[r.key])} onClick={() => setSettings({ [r.key]: !settings[r.key] })} />
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="relative flex rounded-lg bg-white/10 p-1">
              <span
                className="absolute inset-y-1 rounded-lg bg-white/10 shadow-[0_4px_8px_rgba(0,0,0,0.08)] transition-[left] duration-300"
                style={{ width: `calc((100% - 8px) / ${tabsList.length})`, left: `calc(4px + (100% - 8px) / ${tabsList.length} * ${tabIndex})` }}
              />
              {tabsList.map((t) => (
                <button key={t} onClick={() => setTab(t)} className="relative z-10 flex-1 cursor-pointer py-0.5 text-sm">
                  {t}
                </button>
              ))}
            </div>

            {tab === "Status" ? (
              <>
                <div className="mt-2 rounded-lg bg-white/10 px-3 text-sm leading-[14px]">
                  {creditRows.map(([label, n, d, vb], i) => (
                    <div key={label} className={clsx("flex items-center py-2", i === 0 && "pt-3", i === creditRows.length - 1 ? "pb-3" : "border-b border-black/10")}>
                      <svg viewBox={vb} className="size-3.5" fill="white">
                        <path d={d} />
                      </svg>
                      <span className="ml-2">{label}</span>
                      <span className="ml-auto">{n}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 rounded-lg bg-white/10 px-3 text-sm leading-[14px]">
                  {(["unused", "learning", "reviewing", "mastered", "bookmarked"] as const).map((k, i, a) => (
                    <div key={k} className={clsx("flex items-center py-2", i === 0 && "pt-3", i === a.length - 1 ? "pb-3" : "border-b border-black/10")}>
                      <TagIcon tag={k} />
                      <span className="ml-2 capitalize">{k}</span>
                      <span className="ml-auto">{pools[k]}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <label className="mt-2 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
                <svg viewBox="0 0 24 24" className="size-4 opacity-70" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
                </svg>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="w-full bg-transparent text-sm outline-none placeholder:text-white/70" />
              </label>
            )}
          </div>
        </div>

        <div className="flex-1 bg-black/10 pt-3 pb-6 shadow-[inset_-4px_4px_12px_rgba(0,0,0,0.15)]">
          {(tab === "Topics" ? topics : [""]).map((topic) => (
            <div key={topic || "all"}>
              {topic && <div className="px-4 pt-2 pb-1 text-xs font-semibold tracking-wide text-white/70 uppercase">{topic}</div>}
              {rows
                .filter((r) => !topic || r.item.topic === topic)
                .map(({ e, i }) => {
                  const current = session.current === i;
                  const t = tags[e.itemId];
                  return (
                    <div key={e.itemId} className="px-4 py-1">
                      <button
                        onClick={() => onJump(i)}
                        className={clsx(
                          "flex w-full cursor-pointer items-center rounded-lg border px-3 py-2 text-left text-sm font-semibold",
                          current ? "border-white bg-white text-primary" : "border-white/10 bg-white/10 text-white/70 hover:bg-white/15",
                        )}
                      >
                        <Icon name={current ? "qStatusCurrent" : "qStatusOther"} size={14} />
                        <span className="ml-2 flex-1">Question {i + 1}</span>
                        {session.marked[e.itemId] && <Icon name="examBookmark" size={14} />}
                        <span className="ml-1">
                          <TagIcon tag={t ?? "unused"} size={14} />
                        </span>
                      </button>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dialogs (Pearson look: dark teal panel, outlined buttons)            */
/* ------------------------------------------------------------------ */

function ExamDialog({ title, children, actions, onClose, width = 474 }: { title: string; children: ReactNode; actions: ReactNode; onClose?: () => void; width?: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 font-exam tracking-normal" role="dialog" aria-label={title}>
      <div className="animate-pop-in w-full border-t-4 border-gold bg-primary-hover text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)]" style={{ maxWidth: width }}>
        <div className="mx-4 flex items-center border-b border-white py-2.5">
          <span className="flex-1 text-base">{title}</span>
          {onClose && (
            <button onClick={onClose} aria-label="Close" className="cursor-pointer text-white/90 hover:text-white">
              <SquareX className="size-4" />
            </button>
          )}
        </div>
        {children}
        <div className="flex justify-center gap-4 px-5 pt-2 pb-5">{actions}</div>
      </div>
    </div>
  );
}

export function ExamButton({
  children,
  onClick,
  primary,
  testId,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  /** Stable handle for end-to-end tests. */
  testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={clsx(
        "min-w-[90px] cursor-pointer border px-3 py-1 text-base",
        primary ? "border-white font-semibold text-white hover:bg-white/10" : "border-white/40 text-white/60 hover:border-white/70 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
      <defs>
        <radialGradient id="exam-info" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={BRAND.info} />
          <stop offset="1" stopColor={BRAND.primary} />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="url(#exam-info)" stroke={BRAND.primaryLight} strokeWidth="1.5" />
      <rect x="14.2" y="13" width="3.6" height="11" rx="1" fill="white" />
      <circle cx="16" cy="9.2" r="2.1" fill="white" />
    </svg>
  );
}

/** Custom test / readiness exam: "End Test". */
export function EndDialog({ onCancel, onEnd }: { onCancel: () => void; onEnd: () => void }) {
  return (
    <ExamDialog
      title="End Test"
      onClose={onCancel}
      actions={
        <>
          <ExamButton onClick={onCancel}>Return to Test</ExamButton>
          <ExamButton primary onClick={onEnd} testId="exam-end-confirm">
            End Test
          </ExamButton>
        </>
      }
    >
      <div className="flex items-start gap-4 px-5 py-5">
        <InfoIcon />
        <p className="text-base leading-6">Do you want to end this test? Once ended you can review your test results from the previous tests page.</p>
      </div>
    </ExamDialog>
  );
}

/** Case study (tutored review): "Would you like to end your review?" with stats and tag counts. */
export function EndReviewDialog({ session, onCancel, onEnd }: { session: TestSession; onCancel: () => void; onEnd: () => void }) {
  const tags = useStore((s) => s.tags);
  const answered = session.entries.filter((e) => session.submitted[e.itemId]).length;
  const time = Object.values(session.timeSpent).reduce((a, b) => a + b, 0);
  const count = (t: MasteryTag) => session.entries.filter((e) => tags[e.itemId] === t).length;
  const tagBadge = (t: MasteryTag, bg: string, color: string) => (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-white px-2.5 py-0.5 text-base font-semibold" style={{ background: bg, color }}>
      <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
        <path d="M3 12.6V4a1 1 0 0 1 1-1h8.6l8.7 8.7a1 1 0 0 1 0 1.4l-7.6 7.6a1 1 0 0 1-1.4 0L3 12.6ZM8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      </svg>
      {count(t)}
    </span>
  );
  return (
    <ExamDialog
      title="Would you like to end your review?"
      onClose={onCancel}
      actions={
        <>
          <ExamButton onClick={onCancel}>Return to Review</ExamButton>
          <ExamButton primary onClick={onEnd} testId="exam-end-confirm">
            End Review
          </ExamButton>
        </>
      }
    >
      <div className="flex items-start gap-4 px-5 pt-5 pb-4">
        <InfoIcon />
        <p className="text-base leading-6">
          You can resume your review whenever you&apos;re ready.
          <br />
          Your tagged questions are saved.
        </p>
      </div>
      <div className="mx-2 grid grid-cols-3 gap-y-4 bg-white/10 px-2 py-5 text-center">
        {[
          ["Answered", `${answered} of ${session.entries.length}`],
          ["Time Taken", formatDuration(time)],
          ["Per Question", formatDuration(answered ? time / answered : 0)],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-base">{k}</p>
            <p className="text-xl font-semibold">{v}</p>
          </div>
        ))}
        <div>
          <p className="mb-1 text-base">Learning</p>
          {tagBadge("learning", BRAND.surface, BRAND.error)}
        </div>
        <div>
          <p className="mb-1 text-base">Reviewing</p>
          {tagBadge("reviewing", BRAND.warning, BRAND.ink)}
        </div>
        <div>
          <p className="mb-1 text-base">Mastered</p>
          {tagBadge("mastered", BRAND.surface, BRAND.success)}
        </div>
      </div>
    </ExamDialog>
  );
}

/** CAT readiness exam: shown after the last question. */
export function CompleteDialog({ onView }: { onView: () => void }) {
  return (
    <ExamDialog
      title="Exam Complete"
      actions={
        <ExamButton primary onClick={onView}>
          <b>View Results</b>
        </ExamButton>
      }
    >
      <div className="flex items-start gap-4 px-5 py-5">
        <InfoIcon />
        <p className="text-base leading-6">The simulator has determined your readiness level. Submit your exam to view your results.</p>
      </div>
    </ExamDialog>
  );
}

export function PauseDialog({ onResume }: { onResume: () => void }) {
  return (
    <ExamDialog
      title="Test Paused"
      actions={
        <ExamButton primary onClick={onResume}>
          Resume Test
        </ExamButton>
      }
    >
      <div className="flex items-start gap-4 px-5 py-5">
        <InfoIcon />
        <p className="text-base leading-6">Your test is paused and the timer has stopped. Click Resume Test when you&apos;re ready to continue.</p>
      </div>
    </ExamDialog>
  );
}

/** First-time tip above the tag buttons. */
export function TagTip({ onClose }: { onClose: () => void }) {
  return (
    <div className="animate-fade-in absolute right-[330px] bottom-12 z-30 w-[250px] rounded-lg bg-ink p-3 font-sans text-white shadow-xl">
      <div className="flex items-center border-b border-white/20 pb-2">
        <span className="flex-1 text-base font-bold">Tag Questions</span>
        <button onClick={onClose} aria-label="Dismiss" className="cursor-pointer text-white/80 hover:text-white">
          <SquareX className="size-4" />
        </button>
      </div>
      <p className="pt-2 text-[15px] leading-[21px]">Use mastery tags to rate your understanding of each question. You can sort and review tagged questions later.</p>
      <span className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-ink" />
    </div>
  );
}
