"use client";

import clsx from "clsx";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { formatLong, parseDate, toISODate } from "@/lib/schedule";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/primitives";

/** Rough total content hours in the proven plan; hours/day = this / study days. */
const PLAN_HOURS = 110;

export function CreateScheduleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Mount the form only while open so it re-reads the saved schedule each time.
  return open ? <ScheduleForm onClose={onClose} /> : null;
}

const calIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
    <path d="M3.5 9h17M8 3v3M16 3v3" strokeLinecap="round" />
    <path d="M8 12.5h.01M12 12.5h.01M16 12.5h.01M8 16h.01M12 16h.01M16 16h.01" strokeWidth={2.2} strokeLinecap="round" />
  </svg>
);

const rocket = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 4.5c3-1.5 5.5-1 5.5-1s.5 2.5-1 5.5l-6 6-4.5-4.5 6-6ZM8 10.5l-3 .5-2 2 4.5 1M13.5 16l-.5 3-2 2-1-4.5M7 17l-2.5 2.5" />
    <circle cx="15.5" cy="8.5" r="1.3" />
  </svg>
);

const target = <Icon name="target" size={20} />;
const sun = (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <circle cx="12" cy="12" r="4" />
    {Array.from({ length: 8 }).map((_, i) => (
      <rect key={i} x="11.2" y="1.5" width="1.6" height="3.5" rx="0.8" transform={`rotate(${i * 45} 12 12)`} />
    ))}
  </svg>
);

function ScheduleForm({ onClose }: { onClose: () => void }) {
  const existing = useStore((s) => s.schedule);
  const setSchedule = useStore((s) => s.setSchedule);
  const today = toISODate(new Date());
  const [start, setStart] = useState(existing?.start ?? today);
  const [exam, setExam] = useState<string>(existing?.exam ?? "");
  const [noDate, setNoDate] = useState(existing ? existing.exam === null : false);
  const [offDates, setOffDates] = useState<string[]>(existing?.offDates ?? []);
  const [picker, setPicker] = useState<"start" | "exam" | "off" | null>(null);

  const hasExam = Boolean(exam) && !noDate;
  const ready = Boolean(start && (noDate || (exam && exam > start)));
  const studyDays = hasExam ? Math.max(1, Math.round((parseDate(exam).getTime() - parseDate(start).getTime()) / 864e5) - offDates.length) : 0;
  const hours = hasExam ? Math.max(1, Math.round(PLAN_HOURS / studyDays)) : 0;
  const tone = hours <= 6 ? "good" : hours <= 9 ? "warn" : "bad";
  const toneStyle = {
    good: { c: "#4c8b43", bg: "rgba(234,245,234,0.5)", chip: "#eaf5ea", b: "rgba(76,139,67,0.5)", msg: "That's a great start!" },
    warn: { c: "#b7791f", bg: "rgba(255,253,233,0.6)", chip: "#fffde9", b: "rgba(208,149,40,0.5)", msg: "That's a busy schedule. You've got this!" },
    bad: { c: "#c33c35", bg: "rgba(252,236,238,0.6)", chip: "#fcecee", b: "rgba(195,60,53,0.5)", msg: "Consider a later exam date to lighten your load." },
  }[tone];

  const create = () => {
    setSchedule({ start, exam: noDate ? null : exam, daysOff: [], offDates, createdAt: new Date().toISOString() });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={existing ? "Edit Study Schedule" : "Create Study Schedule"} width={858} allowOverflow>
      <div className="grid md:grid-cols-2">
        <div className="px-6 md:border-r md:border-[#ededf0]">
          <Field icon={rocket} title="Start Date" hint="Your study schedule will begin on this date.">
            <DateField value={start} placeholder="Select a date" open={picker === "start"} onOpen={() => setPicker("start")} onClose={() => setPicker(null)}>
              <Calendar
                mode="single"
                initial={start}
                min={today}
                onCancel={() => setPicker(null)}
                onConfirm={(v) => {
                  if (v[0]) setStart(v[0]);
                  setPicker(null);
                }}
              />
            </DateField>
          </Field>
          <Field icon={target} title="Exam Date" hint="Your exam date can be updated anytime.">
            <DateField value={noDate ? "" : exam} placeholder="Select a date" disabled={noDate} open={picker === "exam"} onOpen={() => setPicker("exam")} onClose={() => setPicker(null)}>
              <Calendar
                mode="single"
                initial={exam || start}
                min={toISODate(new Date(parseDate(start).getTime() + 864e5))}
                onCancel={() => setPicker(null)}
                onConfirm={(v) => {
                  if (v[0]) setExam(v[0]);
                  setPicker(null);
                }}
              />
            </DateField>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-base text-ink-strong">
              <input type="radio" checked={noDate} onChange={() => setNoDate(true)} onClick={() => noDate && setNoDate(false)} className="size-[18px] accent-brand" />
              I don&apos;t have an exam date yet.
            </label>
          </Field>
          <Field icon={sun} title="Days Off" hint="We recommend taking one day off per week." last>
            <DateField
              value={offDates.length ? `${offDates.length} day${offDates.length > 1 ? "s" : ""} off` : ""}
              raw
              placeholder="Select days off"
              disabled={!hasExam}
              open={picker === "off"}
              onOpen={() => setPicker("off")}
              onClose={() => setPicker(null)}
            >
              <Calendar
                mode="multi"
                initial={start}
                min={start}
                max={exam}
                selected={offDates}
                onCancel={() => setPicker(null)}
                onConfirm={(v) => {
                  setOffDates(v);
                  setPicker(null);
                }}
              />
            </DateField>
          </Field>
        </div>

        <div className="flex flex-col rounded-br-lg bg-[#fafafa] px-6 py-6">
          <h3 className="text-lg font-semibold text-ink-strong">Your Schedule</h3>
          <div className="mt-4 rounded-lg border border-[#ededf0] bg-white p-4">
            <TimelinePoint icon={rocket} title={formatLong(parseDate(start))} sub="Start Date" />
            <div className="ml-[19px] border-l-2 border-dotted border-brand/60 py-8 pl-7">
              {hasExam ? (
                <div className="flex items-start rounded-lg border p-3" style={{ background: toneStyle.bg, borderColor: toneStyle.b, color: toneStyle.c }}>
                  <div className="mr-3 flex size-10 shrink-0 items-center justify-center rounded-lg" style={{ background: toneStyle.chip }}>
                    <svg viewBox="0 0 48 48" className="size-5" fill="currentColor">
                      <path d="M24 5a19 19 0 1 1 0 38 19 19 0 0 1 0-38Zm-1.25 7c-.83 0-1.5.67-1.5 1.5V26c0 .83.67 1.5 1.5 1.5h8.5a1.5 1.5 0 0 0 0-3h-7v-11c0-.83-.67-1.5-1.5-1.5Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-base leading-6 font-bold">About {hours} hours daily</p>
                    <p className="text-base leading-[20.8px]">{toneStyle.msg}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-[#ededf0] px-3 py-2.5 text-base text-muted">
                  {noDate ? "We'll build an 8-week plan. Add your exam date anytime." : "Choose an exam date to see your Study Schedule timeline."}
                </div>
              )}
            </div>
            <TimelinePoint icon={target} title={noDate ? "No exam date yet" : exam ? formatLong(parseDate(exam)) : "Select a date"} sub="Exam Date" />
          </div>
          <div className="mt-auto pt-8">
            <button
              onClick={create}
              disabled={!ready}
              className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-[64px] bg-brand text-lg font-semibold text-white shadow-[0_2px_0_0_#4a3ac8] transition-[background,transform] duration-[50ms] hover:bg-[#6765ef] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:bg-[#ededf0] disabled:text-muted disabled:shadow-none"
            >
              {existing ? "Update Study Schedule" : "Create Study Schedule"}
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <p className="mt-3 text-center text-base text-muted">You can adjust your schedule anytime</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Field({ icon, title, hint, children, last }: { icon: ReactNode; title: string; hint: string; children: ReactNode; last?: boolean }) {
  return (
    <section className={clsx("py-6", !last && "border-b border-[#ededf0]")}>
      <h4 className="flex items-center gap-2 text-lg font-semibold text-ink-strong">
        <span className="text-brand">{icon}</span>
        {title}
      </h4>
      <p className="mt-1 mb-4 text-base text-muted">{hint}</p>
      {children}
    </section>
  );
}

/** Input-looking button that opens a calendar popover beneath it. */
function DateField({
  value,
  placeholder,
  disabled,
  open,
  onOpen,
  onClose,
  children,
  raw,
}: {
  value: string;
  placeholder: string;
  disabled?: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  children: ReactNode;
  raw?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onClose();
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [open, onClose]);
  const label = value ? (raw ? value : formatLong(parseDate(value))) : "";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => (open ? onClose() : onOpen())}
        className={clsx(
          "flex h-11 w-full cursor-pointer items-center justify-between rounded-lg border px-4 text-left text-base transition-colors",
          disabled ? "cursor-not-allowed border-[#ededf0] bg-[#f6f6f6] text-muted" : open ? "border-faint bg-white" : "border-[#ededf0] bg-white hover:border-faint",
          label ? "text-ink-strong" : "text-muted",
        )}
      >
        {label || placeholder}
        {!disabled && <span className="text-ink-strong">{calIcon}</span>}
      </button>
      {open && <div className="animate-fade-in absolute top-[calc(100%+4px)] left-0 z-20 w-[374px] max-w-[calc(100vw-48px)] rounded-xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.16)]">{children}</div>}
    </div>
  );
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Month calendar with Cancel/Confirm. `multi` = days-off picker (click a weekday header to toggle all). */
function Calendar({
  mode,
  initial,
  min,
  max,
  selected = [],
  onCancel,
  onConfirm,
}: {
  mode: "single" | "multi";
  initial: string;
  min?: string;
  max?: string;
  selected?: string[];
  onCancel: () => void;
  onConfirm: (v: string[]) => void;
}) {
  const init = parseDate(initial);
  const [month, setMonth] = useState(new Date(init.getFullYear(), init.getMonth(), 1));
  const [picked, setPicked] = useState<string[]>(mode === "single" ? [] : selected);

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const cells: Date[] = [];
  for (let i = -first.getDay(); cells.length < 42; i++) cells.push(new Date(month.getFullYear(), month.getMonth(), 1 + i));
  const rows = Array.from({ length: 6 }, (_, r) => cells.slice(r * 7, r * 7 + 7)).filter((row) => row.some((d) => d.getMonth() === month.getMonth()));
  const enabled = (d: Date) => {
    const iso = toISODate(d);
    return (!min || iso >= min) && (!max || iso < max);
  };
  const toggle = (iso: string) => setPicked((p) => (mode === "single" ? [iso] : p.includes(iso) ? p.filter((x) => x !== iso) : [...p, iso]));
  const toggleWeekday = (wd: number) => {
    if (mode !== "multi" || !max) return;
    const all: string[] = [];
    for (let d = parseDate(min ?? initial); toISODate(d) < max; d = new Date(d.getTime() + 864e5)) if (d.getDay() === wd) all.push(toISODate(d));
    const allOn = all.every((x) => picked.includes(x));
    setPicked((p) => (allOn ? p.filter((x) => !all.includes(x)) : [...new Set([...p, ...all])]));
  };

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month" className="cursor-pointer text-muted hover:text-ink">
          <Icon name="arrowLeft" size={20} />
        </button>
        <span className="text-base leading-5 font-bold text-ink-strong">{month.toLocaleString("en-US", { month: "short", year: "numeric" })}</span>
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month" className="cursor-pointer text-muted hover:text-ink">
          <Icon name="arrowRight" size={20} />
        </button>
      </div>
      {mode === "multi" && <p className="mb-3 text-center text-sm text-ink-strong">Tip: Click a weekday (e.g., SUN) to mark all Sundays off!</p>}
      <div className="mb-3 grid grid-cols-7 gap-2">
        {DAYS.map((d, i) => (
          <p
            key={d}
            onClick={() => toggleWeekday(i)}
            className={clsx(
              "flex h-[30px] items-center justify-center rounded-full text-xs leading-3 font-bold uppercase",
              mode === "multi" ? "cursor-pointer bg-[#eef1ff] text-brand hover:bg-[#e0e6ff]" : "text-faint",
            )}
          >
            {d}
          </p>
        ))}
      </div>
      <div className="grid gap-1">
        {rows.map((row, r) => (
          <div key={r} className="grid grid-cols-7 gap-2">
            {row.map((d) => {
              const iso = toISODate(d);
              const on = picked.includes(iso);
              const ok = enabled(d);
              return (
                <p
                  key={iso}
                  onClick={() => ok && toggle(iso)}
                  className={clsx(
                    "flex h-[30px] items-center justify-center rounded-full text-base leading-4",
                    !ok && "text-faint",
                    ok && !on && (mode === "multi" ? "cursor-pointer bg-[#eef1ff] text-brand hover:bg-[#e0e6ff]" : "cursor-pointer text-ink-strong hover:bg-[#f6f6f6]"),
                    on && "cursor-pointer bg-brand text-white",
                  )}
                >
                  {d.getDate()}
                </p>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={onCancel} className="flex h-[34px] flex-1 cursor-pointer items-center justify-center rounded-[64px] border border-[#ededf0] bg-white text-sm text-ink-strong hover:bg-[#fafafa]">
          Cancel
        </button>
        <button
          onClick={() => onConfirm(picked)}
          className="flex h-[34px] flex-1 cursor-pointer items-center justify-center rounded-[64px] bg-brand text-sm text-white shadow-[0_2px_0_0_#4a3ac8] hover:bg-[#6765ef] active:translate-y-[2px] active:shadow-none"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

function TimelinePoint({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center">
      <span className="flex size-10 items-center justify-center rounded-lg bg-[#eef1ff] text-brand">{icon}</span>
      <div className="ml-2">
        <p className="text-base leading-6 font-bold text-ink-strong">{title}</p>
        <p className="mt-0.5 text-base leading-4 text-muted">{sub}</p>
      </div>
    </div>
  );
}
