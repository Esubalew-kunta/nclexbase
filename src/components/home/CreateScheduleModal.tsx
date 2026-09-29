"use client";

import clsx from "clsx";
import { useState } from "react";
import { ArrowRight, CalendarDays, Rocket, Sun, Target } from "lucide-react";
import { useStore } from "@/lib/store";
import { WEEKDAYS, formatLong, parseDate, toISODate } from "@/lib/schedule";
import { Modal } from "@/components/ui/primitives";

export function CreateScheduleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Mount the form only while open so it re-reads the saved schedule each time.
  return open ? <ScheduleForm onClose={onClose} /> : null;
}

function ScheduleForm({ onClose }: { onClose: () => void }) {
  const existing = useStore((s) => s.schedule);
  const setSchedule = useStore((s) => s.setSchedule);
  const [start, setStart] = useState(existing?.start ?? toISODate(new Date()));
  const [exam, setExam] = useState<string>(existing?.exam ?? "");
  const [noDate, setNoDate] = useState(existing ? existing.exam === null : false);
  const [daysOff, setDaysOff] = useState<number[]>(existing?.daysOff ?? []);

  const ready = Boolean(start && (noDate || (exam && exam > start)));
  const weeks = exam && !noDate ? Math.round((parseDate(exam).getTime() - parseDate(start).getTime()) / (7 * 864e5)) : null;

  const create = () => {
    setSchedule({ start, exam: noDate ? null : exam, daysOff, createdAt: new Date().toISOString() });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={existing ? "Edit Study Schedule" : "Create Study Schedule"} width={858}>
      <div className="grid md:grid-cols-2">
        <div className="space-y-0 px-6 md:border-r md:border-line">
          <Field icon={Rocket} title="Start Date" hint="Your study schedule will begin on this date.">
            <DateInput value={start} onChange={setStart} />
          </Field>
          <Field icon={Target} title="Exam Date" hint="Your exam date can be updated anytime.">
            <DateInput value={exam} onChange={setExam} disabled={noDate} min={start} placeholder="Select a date" />
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-base text-ink">
              <input type="checkbox" checked={noDate} onChange={(e) => setNoDate(e.target.checked)} className="size-4 accent-brand" />
              I don&apos;t have an exam date yet.
            </label>
          </Field>
          <Field icon={Sun} title="Days Off" hint="We recommend taking one day off per week." last>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d, i) => (
                <button
                  key={d}
                  onClick={() => setDaysOff((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))}
                  className={clsx(
                    "h-9 rounded-full border px-3 text-sm font-medium",
                    daysOff.includes(i) ? "border-brand bg-brand text-white" : "border-line bg-[#f7f7f9] text-ink hover:border-brand/40",
                  )}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="flex flex-col bg-[#fafafb] px-6 py-6">
          <h3 className="text-lg font-semibold text-ink-strong">Your Schedule</h3>
          <div className="mt-4 rounded-lg border border-line bg-white p-4">
            <TimelinePoint icon={Rocket} title={formatLong(parseDate(start))} sub="Start Date" />
            <div className="ml-[19px] border-l-2 border-dotted border-brand/50 py-3 pl-8">
              <div className="rounded-lg border border-line px-3 py-2.5 text-base text-muted">
                {noDate
                  ? "We'll build an 8-week plan. Add your exam date anytime."
                  : weeks != null
                    ? `${weeks} weeks of study${daysOff.length ? `, ${daysOff.length} day${daysOff.length > 1 ? "s" : ""} off per week` : ""}.`
                    : "Choose an exam date to see your Study Schedule timeline."}
              </div>
            </div>
            <TimelinePoint icon={Target} title={noDate ? "No exam date" : exam ? formatLong(parseDate(exam)) : "Select a date"} sub="Exam Date" />
          </div>
          <div className="mt-auto pt-8">
            <button
              onClick={create}
              disabled={!ready}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand text-lg font-semibold text-white shadow-press hover:bg-[#6a5eef] disabled:bg-[#ececef] disabled:text-muted disabled:shadow-none"
            >
              {existing ? "Update Study Schedule" : "Create Study Schedule"}
              <ArrowRight className="size-5" />
            </button>
            <p className="mt-3 text-center text-base text-muted">You can adjust your schedule anytime</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Field({ icon: Icon, title, hint, children, last }: { icon: typeof Rocket; title: string; hint: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={clsx("py-6", !last && "border-b border-line")}>
      <h4 className="flex items-center gap-2 text-lg font-semibold text-ink-strong">
        <Icon className="size-[18px] text-brand" />
        {title}
      </h4>
      <p className="mt-1 mb-4 text-base text-muted">{hint}</p>
      {children}
    </section>
  );
}

function DateInput({ value, onChange, disabled, min, placeholder }: { value: string; onChange: (v: string) => void; disabled?: boolean; min?: string; placeholder?: string }) {
  return (
    <label className={clsx("flex h-12 items-center rounded-lg border border-line px-4", disabled && "opacity-50")}>
      <input
        type="date"
        value={value}
        min={min}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder ?? "Date"}
        className="flex-1 bg-transparent text-base text-ink outline-none [&::-webkit-calendar-picker-indicator]:opacity-0"
      />
      <CalendarDays className="size-5 text-ink" />
    </label>
  );
}

function TimelinePoint({ icon: Icon, title, sub }: { icon: typeof Rocket; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-lg bg-brand-tint">
        <Icon className="size-5 text-brand" />
      </span>
      <div>
        <div className="font-semibold text-ink-strong">{title}</div>
        <div className="text-base text-muted">{sub}</div>
      </div>
    </div>
  );
}
