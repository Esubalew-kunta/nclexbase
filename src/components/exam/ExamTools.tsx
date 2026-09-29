"use client";

import clsx from "clsx";
import { useRef, useState, type ReactNode } from "react";
import { Bookmark, Calculator as CalcIcon, ChevronsRight, CirclePause, Search, Settings, SquareX } from "lucide-react";
import { useStore, type ExamSettings } from "@/lib/store";
import { itemById } from "@/lib/bank";
import { isAnswered } from "@/lib/scoring";
import type { TestSession } from "@/lib/types";

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
      className="fixed z-50 w-[266px] rounded-lg bg-[#1a74b8] p-1.5 font-exam shadow-2xl"
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
      <div className="bg-[#0a14e0] px-4 pt-6 pb-3">
        <div className="rounded-sm border-2 border-[#9a9a9a] bg-[#c9cfc4] px-2 py-1 text-right font-mono text-2xl tracking-widest text-[#222]">{display}</div>
        <div className="mt-3 flex items-center justify-between font-serif text-[11px] text-white">
          <span>TEXAS INSTRUMENTS</span>
          <b className="text-base">TI-108SC</b>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 bg-[#0a14e0] px-4 pt-2 pb-4">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className={clsx(
              "h-9 rounded-sm border-2 font-serif text-sm font-semibold active:translate-y-px",
              red(k) ? "border-[#f5a3a3] bg-[#e04b4b] text-white" : "border-[#c7d3ff] bg-white text-[#0a14e0]",
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
/* Settings drawer (right side)                                         */
/* ------------------------------------------------------------------ */

const SETTING_ROWS: { key: keyof ExamSettings; label: string }[] = [
  { key: "answerStats", label: "Answer Stats" },
  { key: "shortcuts", label: "Show Keyboard Shortcuts" },
  { key: "restrictions", label: "NCLEX Restrictions" },
  { key: "gridView", label: "Grid View" },
  { key: "hoverPreview", label: "Hover Preview" },
];

export function SettingsDrawer({ session, onClose, onJump }: { session: TestSession; onClose: () => void; onJump: (i: number) => void }) {
  const settings = useStore((s) => s.examSettings);
  const setSettings = useStore((s) => s.setExamSettings);
  const [tab, setTab] = useState<"All" | "Status" | "Topics">("All");
  const [q, setQ] = useState("");
  const answered = session.entries.filter((e) => session.submitted[e.itemId]).length;

  const rows = session.entries
    .map((e, i) => ({ i, item: itemById(e.itemId), e }))
    .filter(({ item, i }) => !q || `question ${i + 1} ${item.topic}`.toLowerCase().includes(q.toLowerCase()));

  const grouped: [string, typeof rows][] =
    tab === "All"
      ? [["", rows]]
      : tab === "Status"
        ? [
            ["Unanswered", rows.filter((r) => !session.submitted[r.e.itemId])],
            ["Answered", rows.filter((r) => session.submitted[r.e.itemId])],
            ["Marked", rows.filter((r) => session.marked[r.e.itemId])],
          ]
        : [...new Set(rows.map((r) => r.item.topic))].map((t) => [t, rows.filter((r) => r.item.topic === t)]);

  return (
    <div className="fixed inset-0 z-40 font-exam" role="dialog" aria-label="Test settings">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <aside className="animate-slide-in-right absolute inset-y-0 right-0 flex w-[256px] flex-col bg-[#0f6cb0] text-white">
        <div className="px-4 pt-4">
          <button onClick={onClose} aria-label="Close settings" className="flex size-14 items-center justify-center rounded-full bg-white/20 hover:bg-white/30">
            <ChevronsRight className="size-6" />
          </button>
          <div className="mt-6 text-[15px]">Bootcamp.com</div>
          <div className="text-[17px] font-bold">
            {session.tutor ? "Tutored" : "Untutored"}, {session.timed ? "Timed" : "Untimed"}
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full bg-white" style={{ width: `${(answered / session.entries.length) * 100}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[15px]">
              {answered}/{session.entries.length}
            </span>
            <span className="flex size-8 items-center justify-center rounded bg-white text-[#0f6cb0]">
              <Settings className="size-4" />
            </span>
          </div>
        </div>

        <div className="mt-3 divide-y divide-white/15 border-y border-white/15 px-4 text-[14px]">
          <div className="flex items-center justify-between py-2.5">
            <span>Text Size</span>
            <span className="flex items-center gap-2">
              <button aria-label="Smaller text" onClick={() => setSettings({ textSize: Math.max(14, settings.textSize - 1) })} className="px-1">
                −
              </button>
              <span className="text-xs">aA</span>
              <button aria-label="Larger text" onClick={() => setSettings({ textSize: Math.min(22, settings.textSize + 1) })} className="px-1">
                +
              </button>
            </span>
          </div>
          {SETTING_ROWS.map((r) => (
            <div key={r.key} className="flex items-center justify-between py-2.5">
              <span>{r.label}</span>
              <button
                role="switch"
                aria-checked={Boolean(settings[r.key])}
                onClick={() => setSettings({ [r.key]: !settings[r.key] })}
                className={clsx("relative h-5 w-10 rounded-full transition-colors", settings[r.key] ? "bg-[#5fd068]" : "bg-white/35")}
              >
                <span className={clsx("absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform", settings[r.key] && "translate-x-5")} />
              </button>
            </div>
          ))}
        </div>

        <div className="px-4 pt-3">
          <div className="grid grid-cols-3 rounded-md bg-white/15 p-1 text-sm">
            {(["All", "Status", "Topics"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={clsx("rounded py-1", tab === t && "bg-[#2b86d0]")}>
                {t}
              </button>
            ))}
          </div>
          <label className="mt-2 flex items-center gap-2 rounded-md bg-white/15 px-3 py-1.5">
            <Search className="size-4 opacity-70" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="w-full bg-transparent text-sm outline-none placeholder:text-white/70" />
          </label>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto bg-white/5 px-4 py-3">
          {grouped.map(([label, list]) => (
            <div key={label} className="mb-2">
              {label && <div className="mb-1 text-xs font-semibold tracking-wide text-white/70 uppercase">{label}</div>}
              {list.map(({ i, e }) => (
                <button
                  key={e.itemId + label}
                  onClick={() => onJump(i)}
                  className={clsx(
                    "mb-1.5 flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm font-semibold",
                    session.current === i ? "border-white bg-white text-[#0f3b66]" : "border-white/20 bg-white/10 hover:bg-white/15",
                  )}
                >
                  <span className={clsx("size-3 rounded-full border-2", session.submitted[e.itemId] ? "border-current bg-current" : "border-current")} />
                  <span className="flex-1">Question {i + 1}</span>
                  {session.marked[e.itemId] && <Bookmark className="size-3.5 fill-current" />}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Navigator + dialogs (Pearson look)                                  */
/* ------------------------------------------------------------------ */

function ExamDialog({ title, children, actions }: { title: string; children: ReactNode; actions: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 font-exam" role="dialog" aria-label={title}>
      <div className="w-full max-w-[520px] overflow-hidden bg-white shadow-2xl animate-pop-in">
        <div className="bg-exam px-4 py-2 text-white">{title}</div>
        <div className="px-5 py-5">{children}</div>
        <div className="flex justify-end gap-2 border-t border-[#ddd] px-5 py-3">{actions}</div>
      </div>
    </div>
  );
}

export function ExamButton({ children, onClick, primary }: { children: ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick} className={clsx("min-w-[110px] px-4 py-2", primary ? "bg-exam text-white hover:bg-[#005a8e]" : "border border-exam text-exam hover:bg-[#eef6fc]")}>
      {children}
    </button>
  );
}

export function EndDialog({ onCancel, onEnd, unanswered }: { onCancel: () => void; onEnd: () => void; unanswered: number }) {
  return (
    <ExamDialog
      title="End Test"
      actions={
        <>
          <ExamButton onClick={onCancel}>Return to Test</ExamButton>
          <ExamButton primary onClick={onEnd}>
            End Test
          </ExamButton>
        </>
      }
    >
      <p>Do you want to end this test? Once ended you can review your test results from the previous tests page.</p>
      {unanswered > 0 && <p className="mt-3 text-[#b3261e]">You have {unanswered} unanswered question{unanswered > 1 ? "s" : ""}.</p>}
    </ExamDialog>
  );
}

export function PauseDialog({ onResume }: { onResume: () => void }) {
  return (
    <ExamDialog title="Test Paused" actions={<ExamButton primary onClick={onResume}>Resume Test</ExamButton>}>
      <p className="flex items-center gap-2">
        <CirclePause className="size-5 text-exam" />
        Your test is paused and the timer has stopped.
      </p>
    </ExamDialog>
  );
}

export function NavigateDialog({ session, onJump, onClose }: { session: TestSession; onJump: (i: number) => void; onClose: () => void }) {
  return (
    <ExamDialog title="Navigation" actions={<ExamButton onClick={onClose}>Close</ExamButton>}>
      <div className="max-h-[50vh] overflow-y-auto">
        <table className="w-full border-collapse text-left text-[15px]">
          <thead>
            <tr className="bg-[#e8f1fb]">
              <th className="border border-[#d0d0d0] px-2 py-1">Question</th>
              <th className="border border-[#d0d0d0] px-2 py-1">Status</th>
              <th className="border border-[#d0d0d0] px-2 py-1">Marked</th>
            </tr>
          </thead>
          <tbody>
            {session.entries.map((e, i) => {
              const item = itemById(e.itemId);
              const status = session.submitted[e.itemId] ? "Answered" : isAnswered(item, session.answers[e.itemId]) ? "Incomplete" : "Unanswered";
              return (
                <tr key={e.itemId} className={clsx(i === session.current && "bg-[#fff8d6]")}>
                  <td className="border border-[#d0d0d0] px-2 py-1">
                    <button onClick={() => onJump(i)} className="text-exam underline">
                      Question {i + 1}
                    </button>
                  </td>
                  <td className={clsx("border border-[#d0d0d0] px-2 py-1", status === "Unanswered" && "text-[#b3261e]")}>{status}</td>
                  <td className="border border-[#d0d0d0] px-2 py-1">{session.marked[e.itemId] ? <Bookmark className="size-4 fill-exam text-exam" /> : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ExamDialog>
  );
}
