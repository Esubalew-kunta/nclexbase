"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Copy, Plus, RefreshCw, Settings, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  addDays,
  daysBetween,
  displayMinutes,
  formatLong,
  formatMinutes,
  parseDate,
  resolveAssignments,
  speedFactor,
  toISODate,
  type Assignment,
  type Tone,
} from "@/lib/schedule";
import { Modal } from "@/components/ui/primitives";
import { CreateScheduleModal } from "@/components/home/CreateScheduleModal";
import { ScheduleSettingsModal } from "./ScheduleSettingsModal";

const TONES: Record<Tone, { bg: string; fg: string; border: string; swatch: string }> = {
  lav: { bg: "#eeecff", fg: "#4b3fd0", border: "#dcd8ff", swatch: "#e6e3ff" },
  green: { bg: "#e8f6ee", fg: "#1c7d4a", border: "#c9ebd7", swatch: "#d9f3e3" },
  red: { bg: "#fdecec", fg: "#c33c35", border: "#f8cfcf", swatch: "#fbdcdc" },
  gray: { bg: "#f1f1f4", fg: "#454653", border: "#e0e0e6", swatch: "#e9e9ee" },
  blue: { bg: "#e6f0fd", fg: "#1f5fbf", border: "#cbdffa", swatch: "#d5e6fb" },
  amber: { bg: "#fff3e0", fg: "#a9650b", border: "#fadfb6", swatch: "#fdebcd" },
  pink: { bg: "#fde8f3", fg: "#b3317a", border: "#f8cde4", swatch: "#fbd9ec" },
};
const SWATCHES: Tone[] = ["lav", "blue", "amber", "pink", "green", "red"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const monthYear = (d: Date) => d.toLocaleString("en-US", { month: "long", year: "numeric" });
const startOfWeek = (d: Date, weekStart: 0 | 1) => addDays(d, -((d.getDay() - weekStart + 7) % 7));

const id = () => `c-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * The study schedule calendar: Day / Week / Full Schedule views, check-off, custom assignments,
 * drag to another day, Rebalance and Settings. Used on Home (day view) and on the Study Schedule page.
 */
export function ScheduleCalendar({ home }: { home?: boolean }) {
  const schedule = useStore((s) => s.schedule)!;
  const edits = useStore((s) => s.scheduleEdits);
  const prefs = useStore((s) => s.schedulePrefs);
  const setPrefs = useStore((s) => s.setSchedulePrefs);
  const toggle = useStore((s) => s.toggleAssignment);
  const patch = useStore((s) => s.patchAssignment);
  const patchCustom = useStore((s) => s.patchCustomAssignment);
  const addCustom = useStore((s) => s.addCustomAssignment);
  const del = useStore((s) => s.deleteAssignment);
  const restore = useStore((s) => s.restoreAssignment);

  const [anchor, setAnchor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
  const [selected, setSelected] = useState<string | null>(null);
  const [viewMenu, setViewMenu] = useState(false);
  const [settings, setSettings] = useState(false);
  const [rebalance, setRebalance] = useState(false);
  const [toast, setToast] = useState<{ text: string; undo: () => void } | null>(null);
  const fullRef = useRef<HTMLDivElement>(null);

  const today = toISODate(new Date());
  const all = useMemo(() => resolveAssignments(schedule, edits), [schedule, edits]);
  const visible = prefs.hideCompleted ? all.filter((a) => !edits.done[a.id]) : all;
  const byDate = useMemo(() => {
    const m = new Map<string, Assignment[]>();
    for (const a of visible) (m.get(a.date) ?? m.set(a.date, []).get(a.date)!).push(a);
    return m;
  }, [visible]);

  const doneCount = all.filter((a) => edits.done[a.id]).length;
  const examDate = schedule.exam ? parseDate(schedule.exam) : null;
  const daysToExam = examDate ? Math.max(0, daysBetween(new Date(new Date().toDateString()), examDate)) : null;
  const minutesOf = (a: Assignment) => displayMinutes(a, schedule);
  const dayTotal = (iso: string) => (byDate.get(iso) ?? []).reduce((t, a) => t + minutesOf(a), 0);

  const planStart = parseDate(schedule.start);
  const planEnd = examDate ?? addDays(planStart, 56);
  const firstWeek = startOfWeek(planStart, prefs.weekStart);
  const totalWeeks = Math.max(1, Math.ceil((daysBetween(firstWeek, planEnd) + 1) / 7));
  const weekNumber = (d: Date) => Math.floor(daysBetween(firstWeek, startOfWeek(d, prefs.weekStart)) / 7) + 1;

  const step = (dir: 1 | -1) => {
    if (prefs.view === "day") setAnchor(addDays(anchor, dir));
    else if (prefs.view === "week") setAnchor(addDays(anchor, 7 * dir));
    else fullRef.current?.scrollBy({ top: 340 * dir, behavior: "smooth" });
  };
  const goToday = () => {
    setAnchor(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
    if (prefs.view === "full") fullRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);
  const showToast = (text: string, undo: () => void) => setToast({ text, undo });

  const addTo = (iso: string) => {
    const a = { id: id(), title: "New assignment", minutes: 15, tone: "gray" as Tone, date: iso };
    addCustom(a);
    setSelected(a.id);
  };
  const remove = (a: Assignment) => {
    del(a.id);
    setSelected(null);
    showToast(`to recover “${a.title}”`, () => {
      restore(a.id);
      setToast(null);
    });
  };
  const duplicate = (a: Assignment) => {
    const copy = { id: id(), title: a.title, minutes: minutesOf(a), tone: a.tone, date: a.date };
    addCustom(copy);
    setSelected(copy.id);
  };
  const move = (assignmentId: string, iso: string) => {
    const a = all.find((x) => x.id === assignmentId);
    if (!a || a.date === iso) return;
    if (a.custom) patchCustom(a.id, { date: iso });
    else patch(a.id, { date: iso });
  };

  const save = (a: Assignment, v: { title?: string; tone: Tone; minutes: number; date: string }) => {
    if (a.custom) patchCustom(a.id, v);
    else {
      // The panel shows speed-adjusted minutes; store the default-speed value.
      const changed = v.minutes !== minutesOf(a);
      patch(a.id, { tone: v.tone, date: v.date, ...(changed ? { minutes: Math.max(1, Math.round(v.minutes / speedFactor(schedule.speed))) } : {}) });
    }
    setSelected(null);
  };

  const selectedAssignment = all.find((a) => a.id === selected) ?? null;

  /* ---------------- assignment chip ---------------- */
  const chip = (a: Assignment, variant: "row" | "cell") => {
    const t = TONES[a.tone];
    const done = Boolean(edits.done[a.id]);
    const compactCell = variant === "cell";
    return (
      <div
        key={a.id}
        draggable
        onDragStart={(e) => e.dataTransfer.setData("text/plain", a.id)}
        onClick={() => setSelected(a.id)}
        title={a.title}
        className={clsx(
          "flex cursor-pointer items-center gap-2 rounded-md border transition-shadow hover:shadow-sm",
          compactCell ? "px-1.5 py-1 text-xs" : "px-3 text-base",
          !compactCell && (prefs.compact ? "h-[42px]" : "min-h-[56px] py-2"),
          selected === a.id && "ring-2 ring-[#2d3a46]",
          done && "opacity-60",
        )}
        style={{ background: t.bg, color: t.fg, borderColor: t.border }}
      >
        <input
          type="checkbox"
          checked={done}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggle(a.id)}
          aria-label={`Mark “${a.title}” complete`}
          className={clsx("shrink-0 cursor-pointer accent-brand", compactCell ? "size-3" : "size-4")}
        />
        <span className={clsx("min-w-0 flex-1", compactCell || prefs.compact ? "truncate" : "leading-5", done && "line-through")}>{a.title}</span>
        {!compactCell && <span className="shrink-0 text-sm opacity-80">{formatMinutes(minutesOf(a))}</span>}
      </div>
    );
  };

  const dropProps = (iso: string) => ({
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      move(e.dataTransfer.getData("text/plain"), iso);
    },
  });

  /* ---------------- views ---------------- */
  const dayView = () => {
    const iso = toISODate(anchor);
    const list = byDate.get(iso) ?? [];
    const isToday = iso === today;
    return (
      <div className={clsx("flex min-h-[260px]", selectedAssignment && "flex-col sm:flex-row")}>
        <div className="min-w-0 flex-1 px-4 pb-6" {...dropProps(iso)}>
          <div className="flex items-center py-4">
            <h3 className={clsx("text-xl leading-6 font-semibold", isToday ? "text-[#f43f5e]" : "text-ink-strong")}>
              {isToday ? "Today" : anchor.toLocaleDateString("en-US", { weekday: "long" })}
            </h3>
            <span
              className={clsx("ml-2 flex size-6 items-center justify-center rounded-full text-sm font-semibold", isToday ? "bg-[#f43f5e] text-white" : "bg-[#ededf0] text-muted")}
            >
              {anchor.getDate()}
            </span>
            <span className="ml-auto text-base text-faint">{dayTotal(iso) ? formatMinutes(dayTotal(iso)) : ""}</span>
          </div>
          <div className="flex flex-col gap-2">
            {list.map((a) => chip(a, "row"))}
            <button onClick={() => addTo(iso)} aria-label="Add assignment" className="flex h-7 cursor-pointer items-center justify-center rounded-md border border-[#ededf0] bg-[#fafafa] text-muted hover:bg-[#f1f1f4]">
              <Plus className="size-4" />
            </button>
          </div>
          {!list.length && <p className="mt-4 text-center text-base text-muted">Nothing scheduled. Enjoy the day off!</p>}
        </div>
        {selectedAssignment && (
          <AssignmentPanel
            key={selectedAssignment.id}
            a={selectedAssignment}
            minutes={minutesOf(selectedAssignment)}
            done={Boolean(edits.done[selectedAssignment.id])}
            onToggle={() => toggle(selectedAssignment.id)}
            onSave={(v) => save(selectedAssignment, v)}
            onDuplicate={() => duplicate(selectedAssignment)}
            onDelete={() => remove(selectedAssignment)}
            onClose={() => setSelected(null)}
            inline
          />
        )}
      </div>
    );
  };

  const dayCell = (d: Date, opts: { showMonth?: boolean }) => {
    const iso = toISODate(d);
    const list = byDate.get(iso) ?? [];
    const isToday = iso === today;
    const outside = d < planStart || d >= planEnd;
    const total = dayTotal(iso);
    return (
      <div key={iso} className={clsx("group min-h-[110px] min-w-0 border-r border-b border-[#ededf0] p-1", outside && "bg-[#fafafa]")} {...dropProps(iso)}>
        <div className="mb-1 flex items-center justify-between px-1 text-sm">
          <span className={clsx("flex h-6 min-w-6 items-center justify-center rounded-full px-1 font-medium", isToday ? "bg-[#f43f5e] text-white" : outside ? "text-faint" : "text-ink-strong")}>
            {opts.showMonth && d.getDate() === 1 ? `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}` : d.getDate()}
          </span>
          <span className="text-xs text-faint">{total ? formatMinutes(total) : ""}</span>
        </div>
        <div className="flex flex-col gap-1">
          {list.map((a) => chip(a, "cell"))}
          {!outside && (
            <button onClick={() => addTo(iso)} aria-label="Add assignment" className="hidden h-5 cursor-pointer items-center justify-center rounded bg-[#f6f6f8] text-muted group-hover:flex hover:bg-[#ededf0]">
              <Plus className="size-3" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const weekRow = (weekStart: Date, showMonth: boolean) => (
    <div key={toISODate(weekStart)} className="grid grid-cols-[28px_repeat(7,minmax(0,1fr))]">
      <div className="flex items-center justify-center border-r border-b border-[#ededf0]">
        <span className="-rotate-90 text-xs whitespace-nowrap text-faint">
          Week {Math.min(totalWeeks, Math.max(1, weekNumber(weekStart)))} of {totalWeeks}
        </span>
      </div>
      {Array.from({ length: 7 }, (_, i) => dayCell(addDays(weekStart, i), { showMonth }))}
    </div>
  );

  const dowHeader = (
    <div className="sticky top-0 z-10 grid grid-cols-[28px_repeat(7,minmax(0,1fr))] border-y border-[#ededf0] bg-white text-base text-ink">
      <div />
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="py-2 text-center">
          {DOW[(prefs.weekStart + i) % 7]}
        </div>
      ))}
    </div>
  );

  const weekView = () => (
    <div>
      {dowHeader}
      {weekRow(startOfWeek(anchor, prefs.weekStart), false)}
    </div>
  );

  const fullView = () => (
    <div ref={fullRef} className="max-h-[640px] overflow-auto">
      {dowHeader}
      {Array.from({ length: totalWeeks }, (_, w) => weekRow(addDays(firstWeek, w * 7), true))}
    </div>
  );

  const title = prefs.view === "week" ? monthYear(startOfWeek(anchor, prefs.weekStart)) : monthYear(anchor);
  const viewLabel = prefs.view === "full" ? "Full Schedule" : prefs.view === "week" ? "Week" : "Day";
  const vertical = prefs.view === "full";

  return (
    <div className="relative rounded-xl bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-2 px-4 pt-4">
        <h3 className="mr-auto text-xl leading-6 font-semibold text-ink-strong">{title}</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => step(-1)} aria-label="Previous" className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#ededf0] text-ink hover:bg-[#f6f6f6]">
            {vertical ? <ChevronUp className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
          <button onClick={goToday} className="h-8 cursor-pointer rounded-full border border-[#ededf0] px-4 text-sm text-ink hover:bg-[#f6f6f6]">
            Today
          </button>
          <button onClick={() => step(1)} aria-label="Next" className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#ededf0] text-ink hover:bg-[#f6f6f6]">
            {vertical ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
          <div className="relative">
            <button
              onClick={() => setViewMenu((v) => !v)}
              className={clsx("flex h-8 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm text-ink hover:bg-[#f6f6f6]", viewMenu ? "border-ink-strong" : "border-[#ededf0]")}
            >
              {viewLabel}
              <ChevronDown className="size-3.5" />
            </button>
            {viewMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setViewMenu(false)} />
                <ul className="absolute top-10 right-0 z-30 w-[148px] rounded-lg bg-white p-1 text-sm shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                  {(
                    [
                      ["full", "Full Schedule"],
                      ["week", "Week"],
                      ["day", "Day"],
                    ] as const
                  ).map(([key, label]) => (
                    <li
                      key={key}
                      onClick={() => {
                        setPrefs({ view: key });
                        setViewMenu(false);
                        setSelected(null);
                      }}
                      className={clsx("flex h-10 cursor-pointer items-center gap-2 rounded-md px-3 hover:bg-[#f6f6f6]", prefs.view === key && "bg-[#f1f1f4]")}
                    >
                      <span className="flex size-4 items-center">{prefs.view === key && <Check className="size-3.5" />}</span>
                      {label}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <button onClick={() => setRebalance(true)} className="flex h-8 cursor-pointer items-center gap-2 rounded-full border border-[#ededf0] px-4 text-sm text-ink hover:bg-[#f6f6f6]">
            <RefreshCw className="size-3.5" />
            Rebalance
          </button>
          <button onClick={() => setSettings(true)} aria-label="Settings" className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#ededf0] text-ink hover:bg-[#f6f6f6]">
            <Settings className="size-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-3 pb-3">
        <div className="h-2 overflow-hidden rounded-full bg-[#ededf0]">
          <div className="h-full rounded-full bg-good transition-[width] duration-300" style={{ width: `${all.length ? (doneCount / all.length) * 100 : 0}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-x-4 text-sm text-ink">
          <span>
            {doneCount} of {all.length} assignments completed
          </span>
          {daysToExam !== null && (
            <span className="text-muted">
              {daysToExam} days until exam &bull; {formatLong(examDate!)}
            </span>
          )}
        </div>
      </div>

      {prefs.view === "day" ? dayView() : prefs.view === "week" ? weekView() : fullView()}

      {prefs.view !== "day" && selectedAssignment && (
        <Modal open onClose={() => setSelected(null)} title="Assignment" width={420}>
          <AssignmentPanel
            key={selectedAssignment.id}
            a={selectedAssignment}
            minutes={minutesOf(selectedAssignment)}
            done={Boolean(edits.done[selectedAssignment.id])}
            onToggle={() => toggle(selectedAssignment.id)}
            onSave={(v) => save(selectedAssignment, v)}
            onDuplicate={() => duplicate(selectedAssignment)}
            onDelete={() => remove(selectedAssignment)}
            onClose={() => setSelected(null)}
          />
        </Modal>
      )}

      {home && (
        <Link href="/nclex/study-schedule" className="flex items-center justify-between border-t border-[#ededf0] px-4 py-4 text-base font-semibold text-ink-strong hover:bg-[#fafafa]">
          View full schedule
          <ChevronRight className="size-4 text-faint" />
        </Link>
      )}

      {toast && (
        <div className="animate-fade-in fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-brand px-4 py-3 text-white shadow-lg">
          <button onClick={toast.undo} aria-label="Undo" className="cursor-pointer text-white/80">
            <RefreshCw className="size-4" />
          </button>
          <div className="text-sm leading-5">
            <p className="font-semibold">Assignment deleted</p>
            <p>
              <button onClick={toast.undo} className="cursor-pointer underline">
                Undo
              </button>{" "}
              {toast.text}
            </p>
          </div>
          <button onClick={() => setToast(null)} aria-label="Dismiss" className="ml-2 flex size-7 cursor-pointer items-center justify-center rounded-full bg-white/20">
            &times;
          </button>
        </div>
      )}

      <ScheduleSettingsModal open={settings} onClose={() => setSettings(false)} />
      <CreateScheduleModal open={rebalance} onClose={() => setRebalance(false)} mode="rebalance" />
    </div>
  );
}

/** Editor for one assignment (inline beside the day list, or inside a modal in the other views). */
function AssignmentPanel({
  a,
  minutes,
  done,
  onToggle,
  onSave,
  onDuplicate,
  onDelete,
  onClose,
  inline,
}: {
  a: Assignment;
  minutes: number;
  done: boolean;
  onToggle: () => void;
  onSave: (v: { title?: string; tone: Tone; minutes: number; date: string }) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
  inline?: boolean;
}) {
  const [title, setTitle] = useState(a.title);
  const [tone, setTone] = useState<Tone>(a.tone);
  const [mins, setMins] = useState(minutes);
  const [date, setDate] = useState(a.date);

  return (
    <aside className={clsx("flex flex-col gap-3 p-4", inline ? "w-full shrink-0 border-t border-[#ededf0] sm:w-[285px] sm:border-t-0 sm:border-l" : "")}>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={done} onChange={onToggle} aria-label="Completed" className="size-5 cursor-pointer accent-brand" />
        <span className="ml-auto flex items-center gap-1.5 text-xs">
          {a.custom && <span className="rounded-md border border-[#ededf0] bg-[#f6f6f8] px-2 py-0.5 text-ink">Custom</span>}
          <span className="rounded-md border border-[#ededf0] bg-[#f6f6f8] px-2 py-0.5 text-muted">{formatMinutes(minutes)}</span>
        </span>
        {inline && (
          <button onClick={onClose} aria-label="Close" className="cursor-pointer text-faint hover:text-ink">
            &times;
          </button>
        )}
      </div>

      {a.custom ? (
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="border-b border-[#ededf0] pb-3 text-xl font-semibold text-ink-strong outline-none focus:border-brand" aria-label="Title" />
      ) : (
        <h4 className="border-b border-[#ededf0] pb-3 text-xl leading-6 font-semibold text-ink-strong">{a.title}</h4>
      )}

      <div className="flex items-center gap-2 border-b border-[#ededf0] pb-3">
        <button onClick={() => setTone("gray")} aria-label="Default color" className={clsx("flex size-6 cursor-pointer items-center justify-center rounded-md border border-[#ededf0] bg-[#f6f6f8]", tone === "gray" && "ring-2 ring-[#2d3a46]")}>
          {tone === "gray" && <Check className="size-3.5" />}
        </button>
        {SWATCHES.map((t) => (
          <button key={t} onClick={() => setTone(t)} aria-label={`Color ${t}`} className={clsx("size-6 cursor-pointer rounded-md", tone === t && "ring-2 ring-[#2d3a46]")} style={{ background: TONES[t].swatch }} />
        ))}
      </div>

      <label className="flex items-center gap-2 border-b border-[#ededf0] pb-3 text-base text-ink">
        <span className="text-muted">&#9719;</span>
        <input type="number" min={1} max={600} value={mins} onChange={(e) => setMins(Math.max(1, Number(e.target.value) || 1))} className="w-16 bg-transparent outline-none" />
        <span className="ml-auto text-sm text-muted">minutes</span>
      </label>

      <label className="flex items-center gap-2 border-b border-[#ededf0] pb-3 text-base text-ink">
        <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="w-full bg-transparent outline-none" aria-label="Date" />
      </label>

      <button
        onClick={() => onSave({ title: a.custom ? title.trim() || "New assignment" : undefined, tone, date, minutes: mins })}
        className="h-12 cursor-pointer rounded-full bg-brand text-base font-semibold text-white shadow-[0_2px_0_0_#4a3ac8] transition-[background,transform] duration-[50ms] hover:bg-[#6765ef] active:translate-y-[2px] active:shadow-none"
      >
        Save
      </button>
      {a.href && (
        <Link href={a.href} className="text-center text-sm font-semibold text-brand hover:underline">
          Open assignment
        </Link>
      )}
      <div className="flex gap-2">
        <button onClick={onDuplicate} className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[#ededf0] px-4 text-sm text-ink hover:bg-[#f6f6f6]">
          <Copy className="size-3.5" />
          Duplicate
        </button>
        <button onClick={onDelete} className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[#ededf0] px-4 text-sm text-[#c33c35] hover:bg-[#fdf3f3]">
          <Trash2 className="size-3.5" />
          Delete
        </button>
      </div>
    </aside>
  );
}
