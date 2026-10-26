"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { BellRing, CalendarRange, ChevronLeft, ChevronRight, CopyPlus, Pencil, Pin, Plus, Trash2 } from "lucide-react";
import type { QotdPlan, QotdQuota, SiteConfig } from "@/lib/admin/config";
import { newId, useAdminStore } from "@/lib/admin/store";
import { useAll, useConfig, useSubjects } from "@/lib/content";
import { nextPeriod, periodDays, periodEnd, periodLabel, periodStart, pickForDate, planReminder, qotdPool, quotaMatches, resolvePlan, todayISO, type QotdSource } from "@/lib/daily";
import type { McqItem } from "@/lib/types";
import { EmailPreview } from "@/components/daily/EmailPreview";
import { SubjectSelect, SystemSelect } from "@/components/admin/parts";
import { AdminPage, Badge, Btn, confirmDialog, Dialog, Field, IconBtn, Input, Panel, Segmented, Select, stripHtml, Switch, toast } from "@/components/admin/ui";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type Qotd = SiteConfig["qotd"];

const saveQotd = (cfg: Qotd, patch: Partial<Qotd>, summary: string) => useAdminStore.getState().setConfig({ qotd: { ...cfg, ...patch } }, summary);

export default function QotdAdmin() {
  const cfg = useConfig().qotd;
  const questions = useAll("questions");
  const subjects = useSubjects(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [picked, setPicked] = useState(todayISO());
  const [choosing, setChoosing] = useState<string | null>(null);
  const [planning, setPlanning] = useState<QotdPlan | "new" | null>(null);
  const [planDefaults, setPlanDefaults] = useState<Pick<QotdPlan, "period" | "start"> | null>(null);
  const [email, setEmail] = useState({ subject: cfg.emailSubject, sender: cfg.senderName });

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay());
    return Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + i));
  }, [month]);
  const pool = useMemo(() => qotdPool(), [questions]); // eslint-disable-line react-hooks/exhaustive-deps
  const selected = pickForDate(picked, cfg);
  const pinnedCount = Object.keys(cfg.schedule).filter((d) => d >= todayISO()).length;
  const reminder = planReminder(cfg);
  const labelOf = (subject: string, system: string | null) => {
    const s = subjects.find((x) => x.id === subject);
    if (!s) return "Any subject";
    return system ? `${s.name} · ${s.systems.find((y) => y.key === system)?.label ?? system}` : s.name;
  };

  const pin = (date: string, id: string | null) => {
    const schedule = { ...cfg.schedule };
    if (id) schedule[date] = id;
    else delete schedule[date];
    saveQotd(cfg, { schedule }, id ? `Scheduled the Question of the Day for ${date}` : `Cleared the Question of the Day for ${date}`);
    toast(id ? `Scheduled for ${date}` : `${date} is automatic again`);
  };
  const openNewPlan = (defaults?: Pick<QotdPlan, "period" | "start">) => {
    setPlanDefaults(defaults ?? null);
    setPlanning("new");
  };

  return (
    <AdminPage
      title="Question of the Day"
      description="Each day shows one single-answer question on the Question of the Day page and in the Daily Warmup email. Pin a question to a date yourself, or let plans choose automatically (how many questions from which subject or system each week or month). Days with neither use the rotation."
    >
      {reminder && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-gold/60 bg-gold/10 px-4 py-3 text-sm text-ink">
          <BellRing className="size-5 shrink-0 text-gold" />
          <p className="min-w-0 flex-1">
            <b>{periodLabel(reminder.start, reminder.period)}</b> has no plan yet. The current {reminder.period} ends in {reminder.daysLeft} day{reminder.daysLeft === 1 ? "" : "s"}; without a plan those days use the rotation.
          </p>
          <Btn variant="primary" onClick={() => openNewPlan({ period: reminder.period, start: reminder.start })}>
            Plan {reminder.period === "week" ? "next week" : "next month"}
          </Btn>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel
          title={month.toLocaleString("en-US", { month: "long", year: "numeric" })}
          description={`${pinnedCount} upcoming day${pinnedCount === 1 ? "" : "s"} pinned · ${pool.length} eligible questions`}
          actions={
            <div className="flex items-center gap-1">
              <IconBtn label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                <ChevronLeft className="size-4" />
              </IconBtn>
              <Btn variant="ghost" onClick={() => (setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), setPicked(todayISO()))}>
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
                    picked === key ? "border-primary bg-primary-light" : "border-line bg-white hover:border-faint",
                    !inMonth && "opacity-45",
                  )}
                >
                  <span className="mb-1 flex items-center gap-1">
                    <span className={clsx("flex size-6 items-center justify-center rounded-full text-xs font-semibold", isToday ? "bg-primary text-white" : "text-ink")}>{d.getDate()}</span>
                    {source.kind === "plan" && <span className="rounded bg-primary-light px-1 text-[9px] font-semibold text-primary uppercase">Plan</span>}
                  </span>
                  {item && (
                    <span className={clsx("line-clamp-2 text-[11px] leading-tight", source.kind === "pinned" ? "font-medium text-ink" : "text-muted")}>
                      {source.kind === "pinned" && <Pin className="mr-0.5 inline size-3 text-gold" />}
                      {stripHtml(item.stem)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted">
            <Pin className="inline size-3 text-gold" /> pinned by you · <span className="font-semibold text-primary">PLAN</span> chosen by a plan · plain = rotation. Click a day to preview it; double-click to pin a question.
          </p>
        </Panel>

        <div className="space-y-4">
          <Panel
            title={new Date(`${picked}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            description={<SourceText source={selected.source} labelOf={labelOf} />}
            actions={
              <div className="flex gap-2">
                {selected.source.kind === "pinned" && <Btn onClick={() => pin(picked, null)}>Unpin</Btn>}
                <Btn variant="primary" onClick={() => setChoosing(picked)}>
                  <Pin className="size-4" />
                  {selected.source.kind === "pinned" ? "Change" : "Pin a question"}
                </Btn>
              </div>
            }
          >
            {selected.item ? (
              <div className="origin-top scale-[0.92]">
                <EmailPreview item={selected.item} date={picked} link={`https://nclexbase.com/nclex/question-of-the-day?d=${picked}`} />
              </div>
            ) : (
              <p className="text-sm text-muted">No eligible questions. Publish a multiple-choice question first.</p>
            )}
          </Panel>
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

      <PlansPanel cfg={cfg} pool={pool} labelOf={labelOf} onNew={() => openNewPlan()} onEdit={setPlanning} onPick={(start) => (setMonth(new Date(`${start}T00:00:00`)), setPicked(start))} />

      {choosing && <ChooseQuestion date={choosing} pool={pool} schedule={cfg.schedule} onClose={() => setChoosing(null)} onPick={(id) => (pin(choosing, id), setChoosing(null))} />}
      {planning && (
        <PlanDialog
          cfg={cfg}
          pool={pool}
          plan={planning === "new" ? null : planning}
          defaults={planDefaults}
          onClose={() => setPlanning(null)}
        />
      )}
    </AdminPage>
  );
}

function SourceText({ source, labelOf }: { source: QotdSource; labelOf: (subject: string, system: string | null) => string }) {
  if (source.kind === "pinned") return <>Pinned by an admin</>;
  if (source.kind === "rotation") return <>Automatic rotation (no plan covers this day)</>;
  return (
    <>
      From the plan for {periodLabel(source.plan.start, source.plan.period)} · {source.quota ? labelOf(source.quota.subject, source.quota.system) : "any subject (days left after the quotas)"}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Plans list + reminder settings                                      */
/* ------------------------------------------------------------------ */

function PlansPanel({
  cfg,
  pool,
  labelOf,
  onNew,
  onEdit,
  onPick,
}: {
  cfg: Qotd;
  pool: McqItem[];
  labelOf: (subject: string, system: string | null) => string;
  onNew: () => void;
  onEdit: (p: QotdPlan) => void;
  onPick: (start: string) => void;
}) {
  const today = todayISO();
  const plans = [...(cfg.plans ?? [])].sort((a, b) => a.start.localeCompare(b.start) || a.period.localeCompare(b.period));
  const current = plans.filter((p) => periodEnd(p.start, p.period) >= today);
  const past = plans.filter((p) => periodEnd(p.start, p.period) < today);
  const [showPast, setShowPast] = useState(false);
  const remind = cfg.remind ?? { period: "week", days: 5 };

  const repeat = (p: QotdPlan) => {
    let start = nextPeriod(p.start, p.period);
    while ((cfg.plans ?? []).some((x) => x.period === p.period && x.start === start)) start = nextPeriod(start, p.period);
    const copy: QotdPlan = { ...p, id: newId("qplan"), start, quotas: p.quotas.map((q) => ({ ...q, id: newId("quota") })) };
    saveQotd(cfg, { plans: [...(cfg.plans ?? []), copy] }, `Copied the Question of the Day plan to ${periodLabel(start, p.period)}`);
    toast(`Copied to ${periodLabel(start, p.period)}`);
  };
  const remove = async (p: QotdPlan) => {
    if (!(await confirmDialog({ title: `Delete the plan for ${periodLabel(p.start, p.period)}?`, body: "Its days go back to the rotation (pinned days stay pinned).", confirm: "Delete plan", danger: true }))) return;
    saveQotd(cfg, { plans: (cfg.plans ?? []).filter((x) => x.id !== p.id) }, `Deleted the Question of the Day plan for ${periodLabel(p.start, p.period)}`);
  };

  const row = (p: QotdPlan) => {
    const res = resolvePlan(p, pool, cfg.schedule);
    const asked = p.quotas.reduce((n, q) => n + q.count, 0);
    return (
      <li key={p.id} className="flex flex-wrap items-start gap-3 px-3 py-3">
        <CalendarRange className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => onPick(p.start)} className="cursor-pointer text-left text-sm font-semibold text-ink hover:text-primary hover:underline">
            {periodLabel(p.start, p.period)}
          </button>
          <p className="text-xs text-muted">
            {p.quotas.length ? p.quotas.map((q) => `${q.count} × ${labelOf(q.subject, q.system)}`).join(" · ") : "No quotas: every day from any subject"}
            {asked < res.freeDays ? ` · ${res.freeDays - asked} day${res.freeDays - asked === 1 ? "" : "s"} from any subject` : ""}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {res.over > 0 && <Badge tone="warning">Asks for {res.over} more than the {res.freeDays} open days</Badge>}
            {res.short.map((s) => (
              <Badge key={s.quota.id} tone="error">
                {labelOf(s.quota.subject, s.quota.system)}: only {s.got} of {s.wanted} questions available
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex">
          <IconBtn label={`Edit the plan for ${periodLabel(p.start, p.period)}`} onClick={() => onEdit(p)}>
            <Pencil className="size-4" />
          </IconBtn>
          <IconBtn label={`Copy to the next ${p.period}`} onClick={() => repeat(p)}>
            <CopyPlus className="size-4" />
          </IconBtn>
          <IconBtn label={`Delete the plan for ${periodLabel(p.start, p.period)}`} onClick={() => remove(p)} className="hover:text-error">
            <Trash2 className="size-4" />
          </IconBtn>
        </div>
      </li>
    );
  };

  return (
    <Panel
      className="mt-4"
      title="Automatic selection plans"
      description="Decide how many questions come from each subject or system in a week (Mon–Sun) or a month. The questions are picked and spread over the days automatically, with no repeats inside the period. A week plan overrides a month plan; pinned days always win."
      actions={
        <Btn variant="primary" onClick={onNew}>
          <Plus className="size-4" />
          New plan
        </Btn>
      }
    >
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-md border border-line bg-background p-3">
        <Field label="Remind me to plan">
          <Select value={remind.period} onChange={(e) => saveQotd(cfg, { remind: { ...remind, period: e.target.value as typeof remind.period } }, "Changed the Question of the Day reminder")} className="w-44">
            <option value="week">Every week</option>
            <option value="month">Every month</option>
            <option value="off">Off</option>
          </Select>
        </Field>
        <Field label="Days before it ends">
          <Input
            type="number"
            min={1}
            max={27}
            value={remind.days}
            disabled={remind.period === "off"}
            onChange={(e) => saveQotd(cfg, { remind: { ...remind, days: Math.max(1, Math.min(27, Number(e.target.value) || 1)) } }, "Changed the Question of the Day reminder")}
            className="w-24"
          />
        </Field>
        <p className="min-w-0 flex-1 text-xs text-muted">The reminder shows on this page, on the dashboard and as a badge in the sidebar when the next {remind.period === "month" ? "month" : "week"} has no plan.</p>
      </div>

      {current.length ? (
        <ul className="divide-y divide-line rounded-md border border-line">{current.map(row)}</ul>
      ) : (
        <p className="rounded-md border border-dashed border-line px-4 py-6 text-center text-sm text-muted">No current or upcoming plans. Every day uses the rotation unless you pin a question.</p>
      )}
      {past.length > 0 && (
        <div className="mt-3">
          <Btn variant="ghost" onClick={() => setShowPast(!showPast)}>
            {showPast ? "Hide" : "Show"} {past.length} past plan{past.length === 1 ? "" : "s"}
          </Btn>
          {showPast && <ul className="mt-2 divide-y divide-line rounded-md border border-line opacity-80">{past.map(row)}</ul>}
        </div>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Create / edit a plan                                                */
/* ------------------------------------------------------------------ */

/** The current period and the next few, as choices for a new plan. */
function startOptions(period: QotdPlan["period"]) {
  const out: string[] = [];
  let s = periodStart(todayISO(), period);
  for (let i = 0; i < (period === "week" ? 12 : 6); i++) {
    out.push(s);
    s = nextPeriod(s, period);
  }
  return out;
}

function PlanDialog({ cfg, pool, plan, defaults, onClose }: { cfg: Qotd; pool: McqItem[]; plan: QotdPlan | null; defaults: Pick<QotdPlan, "period" | "start"> | null; onClose: () => void }) {
  const plans = cfg.plans ?? [];
  const taken = (period: QotdPlan["period"], start: string) => plans.some((p) => p.id !== plan?.id && p.period === period && p.start === start);
  const firstFree = (period: QotdPlan["period"]) => startOptions(period).find((s) => !taken(period, s)) ?? startOptions(period)[0];
  const [f, setF] = useState<QotdPlan>(() => plan ?? { id: newId("qplan"), period: defaults?.period ?? "week", start: defaults?.start ?? firstFree(defaults?.period ?? "week"), quotas: [] });
  const options = [...new Set([...(plan ? [plan.start] : []), ...startOptions(f.period)])].filter((s) => periodStart(s, f.period) === s);
  const dayCount = periodDays(f.start, f.period).length;
  const pinned = periodDays(f.start, f.period).filter((d) => cfg.schedule[d]).length;
  const open = dayCount - pinned;
  const asked = f.quotas.reduce((n, q) => n + q.count, 0);
  const clash = taken(f.period, f.start);

  const setQuota = (id: string, patch: Partial<QotdQuota>) => setF({ ...f, quotas: f.quotas.map((q) => (q.id === id ? { ...q, ...patch } : q)) });
  const available = (q: Pick<QotdQuota, "subject" | "system">) => pool.filter((x) => quotaMatches(x, q)).length;

  const save = () => {
    if (clash) return toast(`There is already a plan for ${periodLabel(f.start, f.period)}.`, "error");
    const quotas = f.quotas.filter((q) => q.count > 0);
    const next = plan ? plans.map((p) => (p.id === plan.id ? { ...f, quotas } : p)) : [...plans, { ...f, quotas }];
    saveQotd(cfg, { plans: next }, `${plan ? "Updated" : "Created"} the Question of the Day plan for ${periodLabel(f.start, f.period)}`);
    toast(`Plan saved for ${periodLabel(f.start, f.period)}`);
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      width={760}
      title={plan ? `Edit plan · ${periodLabel(plan.start, plan.period)}` : "New plan"}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={save} disabled={clash}>
            Save plan
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
          <Field label="Period">
            <Segmented
              value={f.period}
              onChange={(period) => setF({ ...f, period, start: firstFree(period) })}
              options={[
                { value: "week", label: "Week" },
                { value: "month", label: "Month" },
              ]}
            />
          </Field>
          <Field label={f.period === "week" ? "Week (Monday to Sunday)" : "Month"} error={clash ? "This period already has a plan. Edit that one instead." : ""}>
            <Select value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })}>
              {options.map((s) => (
                <option key={s} value={s}>
                  {periodLabel(s, f.period)}
                  {taken(f.period, s) ? " (has a plan)" : ""}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-ink">Questions per subject or system</p>
          <div className="overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-background text-left text-xs text-muted uppercase">
                <tr>
                  <th className="px-3 py-2">Subject</th>
                  <th className="px-3 py-2">System</th>
                  <th className="w-24 px-3 py-2">Questions</th>
                  <th className="w-28 px-3 py-2">Available</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {f.quotas.map((q) => {
                  const n = available(q);
                  return (
                    <tr key={q.id} className="border-t border-line">
                      <td className="px-3 py-1.5">
                        <SubjectSelect value={q.subject} allowAll="Any subject" onChange={(subject) => setQuota(q.id, { subject, system: null })} />
                      </td>
                      <td className="px-3 py-1.5">{q.subject ? <SystemSelect subject={q.subject} value={q.system} general="Any system" onChange={(system) => setQuota(q.id, { system })} /> : <span className="text-xs text-muted">—</span>}</td>
                      <td className="px-3 py-1.5">
                        <Input type="number" min={0} max={31} value={q.count} aria-label="Number of questions" onChange={(e) => setQuota(q.id, { count: Math.max(0, Math.min(31, Number(e.target.value) || 0)) })} className="h-8" />
                      </td>
                      <td className={clsx("px-3 py-1.5 text-xs tabular-nums", n < q.count ? "font-semibold text-error" : "text-muted")}>
                        {n} question{n === 1 ? "" : "s"}
                      </td>
                      <td className="px-1">
                        <IconBtn label="Remove this line" onClick={() => setF({ ...f, quotas: f.quotas.filter((x) => x.id !== q.id) })} className="hover:text-error">
                          <Trash2 className="size-4" />
                        </IconBtn>
                      </td>
                    </tr>
                  );
                })}
                {!f.quotas.length && (
                  <tr>
                    <td colSpan={5} className="px-3 py-5 text-center text-sm text-muted">
                      No lines yet. Add one, e.g. 3 questions from Adult Health · Cardiovascular.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Btn variant="ghost" className="mt-2" onClick={() => setF({ ...f, quotas: [...f.quotas, { id: newId("quota"), subject: "", system: null, count: 1 }] })}>
            <Plus className="size-4" />
            Add line
          </Btn>
        </div>

        <div className={clsx("rounded-md border px-3 py-2 text-sm", asked > open ? "border-warning/50 bg-warning/10 text-ink" : "border-line bg-background text-muted")}>
          {dayCount} days{pinned ? `, ${pinned} already pinned` : ""}: <b className="text-ink">{open}</b> to fill. Lines ask for <b className="text-ink">{asked}</b>
          {asked < open && `; the other ${open - asked} come from any subject`}
          {asked > open && `, ${asked - open} more than there are days. Lines are filled top to bottom, so the last ones get fewer.`}
        </div>
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Manual pick with filters                                            */
/* ------------------------------------------------------------------ */

function ChooseQuestion({ date, pool, schedule, onClose, onPick }: { date: string; pool: McqItem[]; schedule: Record<string, string>; onClose: () => void; onPick: (id: string) => void }) {
  const subjects = useSubjects(true);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [system, setSystem] = useState<string | null>(null);
  const [hideRecent, setHideRecent] = useState(false);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  // Questions pinned within 90 days of this date.
  const near = (id: string) => Object.entries(schedule).find(([d, v]) => v === id && d !== date && Math.abs(Date.parse(d) - Date.parse(date)) <= 90 * 864e5)?.[0];
  const matches = pool.filter(
    (x) =>
      quotaMatches(x, { subject, system }) &&
      (!hideRecent || !near(x.id)) &&
      words.every((w) => `${x.id} ${stripHtml(x.stem)} ${x.options.join(" ")} ${x.topic} ${x.system}`.toLowerCase().includes(w)),
  );
  const hits = matches.slice(0, 100);
  const where = (x: McqItem) => {
    const s = subjects.find((y) => y.id === x.subject);
    return `${s?.name ?? x.subject} · ${s?.systems.find((y) => y.key === x.system)?.label ?? x.system}`;
  };
  return (
    <Dialog open onClose={onClose} title={`Pick a question for ${date}`} width={820}>
      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <SubjectSelect value={subject} allowAll="All subjects" onChange={(v) => (setSubject(v), setSystem(null))} />
        {subject ? <SystemSelect subject={subject} value={system} general="All systems" onChange={setSystem} /> : <Select disabled value=""><option value="">All systems (pick a subject first)</option></Select>}
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stem, options, topic, id" autoFocus className="sm:col-span-2" />
      </div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Switch checked={hideRecent} onChange={setHideRecent} label="Hide questions pinned within 90 days" />
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

