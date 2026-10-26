"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { BellRing, ChevronDown, ChevronLeft, ChevronRight, Pin, Sparkles, X } from "lucide-react";
import type { SiteConfig } from "@/lib/admin/config";
import { useAdminStore } from "@/lib/admin/store";
import type { SubjectRec } from "@/lib/admin/types";
import { useAll, useConfig, useSubjects } from "@/lib/content";
import { autoFill, nextPeriod, periodDays, periodLabel, periodStart, pickForDate, planReminder, qotdPool, subjectMatches, todayISO } from "@/lib/daily";
import type { McqItem } from "@/lib/types";
import { EmailPreview } from "@/components/daily/EmailPreview";
import { SubjectSelect, SystemSelect } from "@/components/admin/parts";
import { AdminPage, Badge, Btn, confirmDialog, Dialog, Field, IconBtn, Input, Panel, Select, stripHtml, Switch, toast } from "@/components/admin/ui";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type Qotd = SiteConfig["qotd"];
type Picks = { id: string; systems: string[] | null }[];

const saveQotd = (cfg: Qotd, patch: Partial<Qotd>, summary: string) => useAdminStore.getState().setConfig({ qotd: { ...cfg, ...patch } }, summary);

export default function QotdAdmin() {
  const cfg = useConfig().qotd;
  const questions = useAll("questions");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [picked, setPicked] = useState(todayISO());
  const [choosing, setChoosing] = useState<string | null>(null);
  const [email, setEmail] = useState({ subject: cfg.emailSubject, sender: cfg.senderName });

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay());
    return Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + i));
  }, [month]);
  const pool = useMemo(() => qotdPool(), [questions]); // eslint-disable-line react-hooks/exhaustive-deps
  const selected = pickForDate(picked, cfg);
  const monthKey = iso(month).slice(0, 7);
  const monthDays = periodDays(`${monthKey}-01`, "month");
  const setCount = monthDays.filter((d) => pickForDate(d, cfg).item).length;
  const reminder = planReminder(cfg);

  const pin = (date: string, id: string | null) => {
    const schedule = { ...cfg.schedule };
    const autoDays = { ...cfg.autoDays };
    delete autoDays[date];
    if (id) schedule[date] = id;
    else delete schedule[date];
    saveQotd(cfg, { schedule, autoDays }, id ? `Set the Question of the Day for ${date}` : `Removed the Question of the Day for ${date}`);
    toast(id ? `Set for ${date}` : `${date} has no question now`);
  };
  const goTo = (start: string) => {
    setMonth(new Date(`${start}T00:00:00`));
    setPicked(start);
  };

  return (
    <AdminPage
      title="Question of the Day"
      description="Each day shows one single-answer question on the Question of the Day page and in the Daily Warmup email. Nothing is assigned on its own: set a day by hand, or pick subjects for a month and click Auto-select. Days without a question show students an empty state."
    >
      {reminder && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-gold/60 bg-gold/10 px-4 py-3 text-sm text-ink">
          <BellRing className="size-5 shrink-0 text-gold" />
          <p className="min-w-0 flex-1">
            <b>{periodLabel(reminder.start, reminder.period)}</b> has {reminder.empty} day{reminder.empty === 1 ? "" : "s"} without a question. The current {reminder.period} ends in {reminder.daysLeft} day
            {reminder.daysLeft === 1 ? "" : "s"}.
          </p>
          <Btn variant="primary" onClick={() => goTo(reminder.start)}>
            Set it up
          </Btn>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <Panel
            title={month.toLocaleString("en-US", { month: "long", year: "numeric" })}
            description={`${setCount} of ${monthDays.length} days have a question · ${pool.length} eligible questions`}
            actions={
              <div className="flex items-center gap-1">
                <IconBtn label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                  <ChevronLeft className="size-4" />
                </IconBtn>
                <Btn variant="ghost" onClick={() => goTo(todayISO())}>
                  Today
                </Btn>
                <IconBtn label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                  <ChevronRight className="size-4" />
                </IconBtn>
              </div>
            }
          >
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
              {DOW.map((d) => (
                <div key={d} className="py-1 font-semibold">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((d) => {
                const key = iso(d);
                const { item, source } = pickForDate(key, cfg);
                const inMonth = d.getMonth() === month.getMonth();
                const isToday = key === todayISO();
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPicked(key)}
                    onDoubleClick={() => setChoosing(key)}
                    className={clsx(
                      "flex min-h-[78px] cursor-pointer flex-col rounded-md border p-1.5 text-left transition-colors",
                      picked === key ? "border-primary bg-primary-light" : item ? "border-line bg-white hover:border-faint" : "border-dashed border-line bg-background hover:border-faint",
                      !inMonth && "opacity-45",
                    )}
                  >
                    <span className="mb-1 flex items-center gap-1">
                      <span className={clsx("flex size-6 items-center justify-center rounded-full text-xs font-semibold", isToday ? "bg-primary text-white" : "text-ink")}>{d.getDate()}</span>
                      {source === "auto" && <span className="rounded bg-primary-light px-1 text-[9px] font-semibold text-primary uppercase">Auto</span>}
                      {source === "manual" && <Pin className="size-3 text-gold" aria-label="Set by hand" />}
                    </span>
                    {item ? <span className="line-clamp-2 text-[11px] leading-tight text-ink">{stripHtml(item.stem)}</span> : <span className="text-[11px] text-faint">Not set</span>}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted">
              <span className="font-semibold text-primary">AUTO</span> = set by Auto-select · <Pin className="inline size-3 text-gold" /> = set by hand · dashed = no question. Click a day to preview it; double-click to choose its question.
            </p>
          </Panel>

          <AutoSelectPanel key={monthKey} cfg={cfg} pool={pool} monthKey={monthKey} />
        </div>

        <div className="space-y-4">
          <Panel
            title={new Date(`${picked}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            description={selected.source === "auto" ? "Set by Auto-select" : selected.source === "manual" ? "Set by hand" : "No question set for this day"}
            actions={
              <div className="flex gap-2">
                {selected.item && <Btn onClick={() => pin(picked, null)}>Remove</Btn>}
                <Btn variant="primary" onClick={() => setChoosing(picked)}>
                  <Pin className="size-4" />
                  {selected.item ? "Change" : "Choose a question"}
                </Btn>
              </div>
            }
          >
            {selected.item ? (
              <div className="origin-top scale-[0.92]">
                <EmailPreview item={selected.item} date={picked} link={`https://nclexbase.com/nclex/question-of-the-day?d=${picked}`} />
              </div>
            ) : (
              <p className="text-sm text-muted">Students see “No question for this day”. Choose a question, or use Auto-select for the month.</p>
            )}
          </Panel>
          <ReminderPanel cfg={cfg} />
          <Panel title="Daily Warmup email">
            <div className="space-y-3">
              <Field label="Subject line">
                <Input value={email.subject} onChange={(e) => setEmail({ ...email, subject: e.target.value })} />
              </Field>
              <Field label="Sender name">
                <Input value={email.sender} onChange={(e) => setEmail({ ...email, sender: e.target.value })} />
              </Field>
              <Btn
                variant="primary"
                disabled={email.subject === cfg.emailSubject && email.sender === cfg.senderName}
                onClick={() => (saveQotd(cfg, { emailSubject: email.subject, senderName: email.sender }, "Updated the Daily Warmup email"), toast("Email settings saved"))}
              >
                Save email settings
              </Btn>
              <p className="text-xs text-muted">Sending needs the backend; students currently see the email as a preview.</p>
            </div>
          </Panel>
        </div>
      </div>

      {choosing && <ChooseQuestion date={choosing} pool={pool} schedule={cfg.schedule} onClose={() => setChoosing(null)} onPick={(id) => (pin(choosing, id), setChoosing(null))} />}
    </AdminPage>
  );
}

/* ------------------------------------------------------------------ */
/* Auto-select for one month                                           */
/* ------------------------------------------------------------------ */

function AutoSelectPanel({ cfg, pool, monthKey }: { cfg: Qotd; pool: McqItem[]; monthKey: string }) {
  const subjects = useSubjects(true);
  const saved = cfg.months?.[monthKey];
  const [picks, setPicks] = useState<Picks>(() => saved?.subjects ?? []);
  const [open, setOpen] = useState<string | null>(null);
  const [onlyEmpty, setOnlyEmpty] = useState(true);
  const start = `${monthKey}-01`;
  const label = periodLabel(start, "month");
  const today = todayISO();
  // Past days are left alone; only today and later can be filled.
  const days = periodDays(start, "month").filter((d) => d >= today);
  const target = days.filter((d) => !onlyEmpty || !pickForDate(d, cfg).item);
  const autoInMonth = periodDays(start, "month").filter((d) => cfg.autoDays?.[d] && d >= today);
  const available = pool.filter((q) => subjectMatches(q, picks)).length;

  const toggleSubject = (id: string) => setPicks((p) => (p.some((x) => x.id === id) ? p.filter((x) => x.id !== id) : [...p, { id, systems: null }]));
  const toggleSystem = (s: SubjectRec, key: string) =>
    setPicks((p) =>
      p.map((x) => {
        if (x.id !== s.id) return x;
        const cur = x.systems ?? s.systems.map((y) => y.key);
        const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
        return { ...x, systems: next.length === s.systems.length ? null : next };
      }),
    );

  const run = async () => {
    if (!picks.length) return toast("Tick at least one subject.", "error");
    if (!available) return toast("The ticked subjects have no published multiple-choice questions.", "error");
    if (!target.length) return toast(onlyEmpty ? `Every day left in ${label} already has a question.` : `No days left to fill in ${label}.`, "error");
    if (!onlyEmpty && target.some((d) => pickForDate(d, cfg).item) && !(await confirmDialog({ title: `Replace questions in ${label}?`, body: "Days that already have a question (including ones set by hand) get a new one.", confirm: "Replace" }))) return;
    const { assign, reused } = autoFill({ days: target, picks, pool, schedule: cfg.schedule });
    const autoDays = { ...cfg.autoDays };
    Object.keys(assign).forEach((d) => (autoDays[d] = true));
    saveQotd(
      cfg,
      { schedule: { ...cfg.schedule, ...assign }, autoDays, months: { ...cfg.months, [monthKey]: { subjects: picks, filledAt: new Date().toISOString() } } },
      `Auto-selected ${Object.keys(assign).length} Questions of the Day for ${label}`,
    );
    toast(`Set ${Object.keys(assign).length} day${Object.keys(assign).length === 1 ? "" : "s"} in ${label}${reused ? ` (${reused} reuse questions from the last 90 days; add more questions to avoid this)` : ""}`);
  };

  const clearAuto = async () => {
    if (!(await confirmDialog({ title: `Clear auto-selected days in ${label}?`, body: `${autoInMonth.length} day(s) lose their question. Days set by hand and past days stay.`, confirm: "Clear", danger: true }))) return;
    const schedule = { ...cfg.schedule };
    const autoDays = { ...cfg.autoDays };
    autoInMonth.forEach((d) => (delete schedule[d], delete autoDays[d]));
    saveQotd(cfg, { schedule, autoDays }, `Cleared auto-selected Questions of the Day in ${label}`);
  };

  return (
    <Panel
      title={`Auto-select for ${label}`}
      description="Tick the subjects to take questions from (open a subject to limit it to some systems). Auto-select then sets a question on each day, sharing the days evenly between the subjects. Nothing happens until you click it."
      actions={
        autoInMonth.length > 0 && (
          <Btn variant="ghost" onClick={clearAuto}>
            <X className="size-4" />
            Clear auto days
          </Btn>
        )
      }
    >
      {saved && <p className="mb-3 text-xs text-muted">Last auto-selected {new Date(saved.filledAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} with these subjects.</p>}
      <ul className="divide-y divide-line rounded-md border border-line">
        {subjects.map((s) => {
          const pick = picks.find((x) => x.id === s.id);
          const count = pool.filter((q) => q.subject === s.id).length;
          const chosenSystems = pick ? (pick.systems ?? s.systems.map((y) => y.key)) : [];
          return (
            <li key={s.id}>
              <div className="flex items-center gap-3 px-3 py-2">
                <input type="checkbox" checked={Boolean(pick)} onChange={() => toggleSubject(s.id)} id={`qs-${s.id}`} className="size-4 accent-primary" disabled={!count} />
                <label htmlFor={`qs-${s.id}`} className={clsx("flex-1 text-sm", count ? "cursor-pointer text-ink" : "text-faint")}>
                  {s.name}
                  <span className="ml-2 text-xs text-muted">
                    {count} question{count === 1 ? "" : "s"}
                    {pick && pick.systems && ` · ${pick.systems.length} of ${s.systems.length} systems`}
                  </span>
                </label>
                {pick && s.systems.length > 0 && (
                  <Btn variant="ghost" className="h-7" onClick={() => setOpen(open === s.id ? null : s.id)}>
                    Systems
                    <ChevronDown className={clsx("size-3.5 transition-transform", open === s.id && "rotate-180")} />
                  </Btn>
                )}
              </div>
              {pick && open === s.id && (
                <div className="grid gap-1 bg-background px-10 py-2 sm:grid-cols-2">
                  {s.systems.map((y) => {
                    const n = pool.filter((q) => q.subject === s.id && q.system === y.key).length;
                    return (
                      <label key={y.key} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                        <input type="checkbox" checked={chosenSystems.includes(y.key)} onChange={() => toggleSystem(s, y.key)} className="size-3.5 accent-primary" />
                        {y.label}
                        <span className="text-xs text-muted">({n})</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Switch checked={onlyEmpty} onChange={setOnlyEmpty} label="Only fill days without a question" />
        <span className="min-w-0 flex-1 text-xs text-muted">
          {target.length} day{target.length === 1 ? "" : "s"} to fill · {available} matching question{available === 1 ? "" : "s"}
          {available > 0 && available < target.length ? " (some will repeat)" : ""}
        </span>
        <Btn variant="primary" onClick={run} disabled={!picks.length || !target.length}>
          <Sparkles className="size-4" />
          Auto-select
        </Btn>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Reminder settings                                                   */
/* ------------------------------------------------------------------ */

function ReminderPanel({ cfg }: { cfg: Qotd }) {
  const remind = cfg.remind ?? { period: "week", days: 5 };
  const set = (patch: Partial<typeof remind>) => saveQotd(cfg, { remind: { ...remind, ...patch } }, "Changed the Question of the Day reminder");
  return (
    <Panel title="Reminder" description="Shown here, on the dashboard and as a badge in the sidebar when the next week or month has days without a question.">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Check the next">
          <Select value={remind.period} onChange={(e) => set({ period: e.target.value as typeof remind.period })} className="w-36">
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="off">Off</option>
          </Select>
        </Field>
        <Field label="Days before it ends">
          <Input type="number" min={1} max={27} value={remind.days} disabled={remind.period === "off"} onChange={(e) => set({ days: Math.max(1, Math.min(27, Number(e.target.value) || 1)) })} className="w-24" />
        </Field>
      </div>
      {remind.period !== "off" && (
        <p className="mt-2 text-xs text-muted">
          Next check: {periodLabel(nextPeriod(periodStart(todayISO(), remind.period), remind.period), remind.period)}.
        </p>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Choose one day's question, with filters                             */
/* ------------------------------------------------------------------ */

function ChooseQuestion({ date, pool, schedule, onClose, onPick }: { date: string; pool: McqItem[]; schedule: Record<string, string>; onClose: () => void; onPick: (id: string) => void }) {
  const subjects = useSubjects(true);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [system, setSystem] = useState<string | null>(null);
  const [hideRecent, setHideRecent] = useState(false);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  // Another day within 90 days that already uses this question.
  const near = (id: string) => Object.entries(schedule).find(([d, v]) => v === id && d !== date && Math.abs(Date.parse(d) - Date.parse(date)) <= 90 * 864e5)?.[0];
  const matches = pool.filter(
    (x) =>
      (!subject || subjectMatches(x, [{ id: subject, systems: system ? [system] : null }])) &&
      (!hideRecent || !near(x.id)) &&
      words.every((w) => `${x.id} ${stripHtml(x.stem)} ${x.options.join(" ")} ${x.topic} ${x.system}`.toLowerCase().includes(w)),
  );
  const hits = matches.slice(0, 100);
  const where = (x: McqItem) => {
    const s = subjects.find((y) => y.id === x.subject);
    return `${s?.name ?? x.subject} · ${s?.systems.find((y) => y.key === x.system)?.label ?? x.system}`;
  };
  return (
    <Dialog open onClose={onClose} title={`Choose a question for ${date}`} width={820}>
      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <SubjectSelect value={subject} allowAll="All subjects" onChange={(v) => (setSubject(v), setSystem(null))} />
        {subject ? (
          <SystemSelect subject={subject} value={system} general="All systems" onChange={setSystem} />
        ) : (
          <Select disabled value="">
            <option value="">All systems (pick a subject first)</option>
          </Select>
        )}
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stem, options, topic, id" autoFocus className="sm:col-span-2" />
      </div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Switch checked={hideRecent} onChange={setHideRecent} label="Hide questions used within 90 days" />
        <span className="text-xs text-muted">
          {matches.length} match{matches.length === 1 ? "" : "es"}
          {matches.length > hits.length ? ` (showing ${hits.length})` : ""}
        </span>
      </div>
      <ul className="max-h-[55dvh] divide-y divide-line overflow-auto rounded-md border border-line">
        {hits.map((x) => {
          const clash = near(x.id);
          return (
            <li key={x.id}>
              <button type="button" onClick={() => onPick(x.id)} className="flex w-full cursor-pointer items-start gap-3 px-3 py-2 text-left hover:bg-primary-light">
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-sm text-ink">{stripHtml(x.stem)}</span>
                  <span className="text-xs text-muted">
                    {where(x)}
                    {x.topic ? ` · ${x.topic}` : ""} · {x.id}
                  </span>
                </span>
                {clash && <Badge tone="warning">Also on {clash}</Badge>}
              </button>
            </li>
          );
        })}
        {!hits.length && <li className="px-3 py-6 text-center text-sm text-muted">No questions match these filters.</li>}
      </ul>
    </Dialog>
  );
}
