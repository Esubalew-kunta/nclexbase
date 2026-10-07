"use client";

import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { useStore, type SchedulePrefs } from "@/lib/store";
import { formatLong, formatMinutes, parseDate, resolveAssignments, SPEEDS, type SpeedKey } from "@/lib/schedule";
import { Modal } from "@/components/ui/primitives";

export function ScheduleSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Mount only while open so the draft re-reads the saved settings each time.
  return open ? <SettingsForm onClose={onClose} /> : null;
}

function Seg({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "cursor-pointer rounded-lg border px-5 py-3 text-base text-ink transition-colors",
        on ? "border-brand font-semibold text-ink-strong shadow-[0_0_0_1px_var(--color-brand)]" : "border-[#ededf0] hover:bg-[#f6f6f6]",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Preview({ on, onClick, title, children }: { on: boolean; onClick: () => void; title: string; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx("flex-1 cursor-pointer rounded-lg border p-3 text-left transition-colors", on ? "border-brand shadow-[0_0_0_1px_var(--color-brand)]" : "border-[#ededf0] hover:bg-[#fafafa]")}
    >
      <p className={clsx("mb-3 text-center text-base text-ink", on && "font-bold text-ink-strong")}>{title}</p>
      {children}
    </button>
  );
}

function SettingsForm({ onClose }: { onClose: () => void }) {
  const schedule = useStore((s) => s.schedule);
  const edits = useStore((s) => s.scheduleEdits);
  const prefs = useStore((s) => s.schedulePrefs);
  const setPrefs = useStore((s) => s.setSchedulePrefs);
  const setSchedule = useStore((s) => s.setSchedule);

  const [weekStart, setWeekStart] = useState<SchedulePrefs["weekStart"]>(prefs.weekStart);
  const [compact, setCompact] = useState(prefs.compact);
  const [hideCompleted, setHideCompleted] = useState(prefs.hideCompleted);
  const [speed, setSpeed] = useState<SpeedKey>(schedule?.speed ?? "default");
  const blurb = SPEEDS.find((s) => s.key === speed)!.blurb;

  const save = () => {
    setPrefs({ weekStart, compact, hideCompleted });
    if (schedule && (schedule.speed ?? "default") !== speed) setSchedule({ ...schedule, speed });
    onClose();
  };

  /** Printable copy of the schedule (open it and use Print > Save as PDF). */
  const download = () => {
    if (!schedule) return;
    const byDate = new Map<string, string[]>();
    for (const a of resolveAssignments(schedule, edits)) (byDate.get(a.date) ?? byDate.set(a.date, []).get(a.date)!).push(`${a.title} (${formatMinutes(a.minutes)})`);
    const rows = [...byDate.entries()]
      .sort(([x], [y]) => (x < y ? -1 : 1))
      .map(([d, list]) => `<h3>${formatLong(parseDate(d))}</h3><ul>${list.map((t) => `<li>${t}</li>`).join("")}</ul>`)
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>NCLEX Study Schedule</title><style>body{font-family:Arial,sans-serif;max-width:720px;margin:32px auto;color:#1f2937}h1{color:#5f4de0}h3{margin:18px 0 4px;font-size:15px}li{margin:2px 0}</style></head><body><h1>NCLEX Study Schedule</h1>${rows}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "nclex-study-schedule.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    if (!confirm("Reset your schedule? This clears all completed assignments so you can create a new schedule.")) return;
    setSchedule(null);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Settings"
      width={500}
      bodyClassName="px-6 pb-4"
      footer={
        <div className="border-t border-[#ededf0] bg-white px-6 py-4">
          <button
            onClick={save}
            className="flex h-14 w-full cursor-pointer items-center justify-center rounded-[64px] bg-brand text-lg font-semibold text-white shadow-[0_2px_0_0_#4a3ac8] transition-[background,transform] duration-[50ms] hover:bg-[#6765ef] active:translate-y-[2px] active:shadow-none"
          >
            Save
          </button>
        </div>
      }
    >
      <section className="border-b border-[#ededf0] py-4">
        <h4 className="mb-3 text-lg font-semibold text-ink-strong">Start week on</h4>
        <div className="flex gap-2">
          <Seg on={weekStart === 0} onClick={() => setWeekStart(0)}>
            Sunday
          </Seg>
          <Seg on={weekStart === 1} onClick={() => setWeekStart(1)}>
            Monday
          </Seg>
        </div>
      </section>

      <section className="border-b border-[#ededf0] py-4">
        <h4 className="mb-3 text-lg font-semibold text-ink-strong">Assignment View</h4>
        <div className="flex gap-3">
          <Preview on={!compact} onClick={() => setCompact(false)} title="Standard">
            <div className="rounded-md border border-[#dcd8ff] bg-[#eeecff] p-2 text-sm text-[#4b3fd0]">
              <p className="leading-4">35 Adult Health Standalone Questions</p>
              <p className="mt-1 text-right text-xs">1h 15m</p>
            </div>
          </Preview>
          <Preview on={compact} onClick={() => setCompact(true)} title="Compact">
            <div className="truncate rounded-md border border-[#dcd8ff] bg-[#eeecff] p-2 text-sm text-[#4b3fd0]">35 Adult Health Standalo...</div>
          </Preview>
        </div>
      </section>

      <section className="border-b border-[#ededf0] py-4">
        <h4 className="mb-3 text-lg font-semibold text-ink-strong">Completed Assignments</h4>
        <div className="flex gap-3">
          <Preview on={!hideCompleted} onClick={() => setHideCompleted(false)} title="Show">
            <div className="rounded-md border border-[#ededf0] p-2 text-xs text-muted">
              <p className="mb-1 text-ink">1</p>
              <p className="line-through">35 Adult Health Standalone Questions</p>
            </div>
          </Preview>
          <Preview on={hideCompleted} onClick={() => setHideCompleted(true)} title="Hide">
            <div className="rounded-md border border-[#ededf0] p-2 text-xs text-muted">
              <p className="mb-5 text-ink">1</p>
              <p>Show 1 completed</p>
            </div>
          </Preview>
        </div>
      </section>

      <section className="border-b border-[#ededf0] py-4">
        <h4 className="mb-3 text-lg font-semibold text-ink-strong">Study Speed</h4>
        <div className="flex flex-wrap gap-2">
          {SPEEDS.map((s) => (
            <Seg key={s.key} on={speed === s.key} onClick={() => setSpeed(s.key)} className="px-4 py-2.5">
              {s.label}
            </Seg>
          ))}
        </div>
        <p className="mt-3 text-base text-muted">{blurb} Does not affect custom assignments.</p>
      </section>

      <section className="border-b border-[#ededf0] py-4">
        <h4 className="text-lg font-semibold text-ink-strong">PDF Study Schedules</h4>
        <p className="mt-1 mb-3 text-base text-muted">Looking for a PDF / printable alternative? Click the button below.</p>
        <button onClick={download} className="h-10 cursor-pointer rounded-full border border-[#ededf0] px-5 text-base text-ink hover:bg-[#f6f6f6]">
          Download Study Schedule (PDF)
        </button>
      </section>

      <section className="py-4">
        <h4 className="text-lg font-semibold text-ink-strong">Reset Schedule</h4>
        <p className="mt-1 mb-3 text-base text-muted">Reset your schedule to clear all completed assignments and create a new schedule.</p>
        <button onClick={reset} className="h-10 cursor-pointer rounded-full border border-[#f8cfcf] px-5 text-base text-[#c33c35] hover:bg-[#fdf3f3]">
          Reset Schedule
        </button>
      </section>
    </Modal>
  );
}
