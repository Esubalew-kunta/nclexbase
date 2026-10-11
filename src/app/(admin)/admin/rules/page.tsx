"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { ScheduleItemCfg } from "@/lib/admin/config";
import { newId } from "@/lib/admin/store";
import { useAll } from "@/lib/content";
import { AdminPage, Btn, Field, IconBtn, Input, Switch } from "@/components/admin/ui";
import { ConfigPanel, useConfigSection } from "@/components/admin/config";

const move = <T,>(arr: T[], i: number, d: number) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};

type Row = { title: string; minutes: number; href?: string; id?: string };

/** Editable list of schedule assignments (title, minutes, link). */
function ItemList({ items, onChange, withLink = true, label }: { items: Row[]; onChange: (v: Row[]) => void; withLink?: boolean; label: string }) {
  return (
    <div className="space-y-1.5">
      {items.map((x, i) => (
        <div key={x.id ?? i} className="flex flex-wrap items-center gap-2">
          <Input value={x.title} aria-label={`${label} ${i + 1} title`} placeholder="Title" className="h-8 min-w-[220px] flex-1" onChange={(e) => onChange(items.map((y, k) => (k === i ? { ...y, title: e.target.value } : y)))} />
          <Input type="number" min={5} value={x.minutes} aria-label={`${label} ${i + 1} minutes`} className="h-8 w-20" onChange={(e) => onChange(items.map((y, k) => (k === i ? { ...y, minutes: Math.max(5, Number(e.target.value) || 5) } : y)))} />
          <span className="text-xs text-muted">min</span>
          {withLink && (
            <Input value={x.href ?? ""} aria-label={`${label} ${i + 1} link`} placeholder="/nclex/..." className="h-8 w-56" onChange={(e) => onChange(items.map((y, k) => (k === i ? { ...y, href: e.target.value } : y)))} />
          )}
          <IconBtn label="Move up" disabled={i === 0} onClick={() => onChange(move(items, i, -1))}>
            <ArrowUp className="size-4" />
          </IconBtn>
          <IconBtn label="Move down" disabled={i === items.length - 1} onClick={() => onChange(move(items, i, 1))}>
            <ArrowDown className="size-4" />
          </IconBtn>
          <IconBtn label="Delete" className="hover:text-error" onClick={() => onChange(items.filter((_, k) => k !== i))}>
            <Trash2 className="size-4" />
          </IconBtn>
        </div>
      ))}
      <Btn variant="ghost" className="h-8" onClick={() => onChange([...items, { id: newId("sch"), title: "", minutes: 30, href: "" }])}>
        <Plus className="size-3.5" />
        Add {label.toLowerCase()}
      </Btn>
    </div>
  );
}

const pct = (v: string) => Math.max(0, Math.min(100, Number(v) || 0));

export default function RulesAdmin() {
  const targets = useConfigSection("targets", "pass targets");
  const bands = useConfigSection("readinessBands", "readiness bands");
  const schedule = useConfigSection("schedule", "study schedule rules");
  const totalsSec = useConfigSection("totals", "catalog totals");
  const questions = useAll("questions");
  const caseRows = useAll("cases");
  const tot = totalsSec.draft;
  const bank = {
    cases: caseRows.filter((c) => c.status === "published").length,
    standalone: questions.filter((q) => q.source.kind === "standalone" && q.status === "published").length,
    readiness: questions.filter((q) => q.source.kind === "readiness" && q.status === "published").length,
    performanceQuestions: questions.filter((q) => q.status === "published").length,
  };
  const t = targets.draft;
  const b = bands.draft;
  const s = schedule.draft;
  const bandError = b.borderline >= b.high ? "“High” must be above “Borderline”." : "";
  const hourError =
    s.goodMaxHours >= s.busyMaxHours
      ? "The busy limit must be above the comfortable limit."
      : [...s.intro, ...s.review].some((x) => !x.title.trim()) || s.blocks.some((x) => !x.title.trim())
        ? "Every assignment needs a title."
        : "";
  const setItems = (k: "intro" | "review", v: Row[]) =>
    schedule.setDraft({ ...s, [k]: v.map((x, i): ScheduleItemCfg => ({ id: x.id ?? `${k}-${i}`, title: x.title, minutes: x.minutes, href: x.href ?? "" })) });

  return (
    <AdminPage title="Targets & Rules" description="The numbers behind Performance, readiness results and the study schedule. Changes apply to every student immediately.">
      <div className="space-y-4">
        <ConfigPanel section={targets} title="Pass targets" description="Performance page. Students who meet all targets are shown as ready to pass.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Score target (%)" hint="Correct points / total points across all attempts.">
              <Input type="number" value={t.score} onChange={(e) => targets.setDraft({ ...t, score: pct(e.target.value) })} className="w-28" />
            </Field>
            <Field label="Question usage target (%)" hint="Share of the question bank answered at least once.">
              <Input type="number" value={t.usage} onChange={(e) => targets.setDraft({ ...t, usage: pct(e.target.value) })} className="w-28" />
            </Field>
          </div>
          <p className="mt-2 text-xs text-muted">The third target is always “attempt every published readiness exam”.</p>
        </ConfigPanel>

        <ConfigPanel section={bands} invalid={bandError} title="Readiness exam bands" description="Labels next to each readiness exam on the Performance page.">
          <div className="flex flex-wrap items-end gap-4">
            <Field label="High from (%)">
              <Input type="number" value={b.high} onChange={(e) => bands.setDraft({ ...b, high: pct(e.target.value) })} className="w-28" invalid={Boolean(bandError)} />
            </Field>
            <Field label="Borderline from (%)" error={bandError}>
              <Input type="number" value={b.borderline} onChange={(e) => bands.setDraft({ ...b, borderline: pct(e.target.value) })} className="w-28" invalid={Boolean(bandError)} />
            </Field>
            <p className="pb-2 text-sm text-muted">Below {b.borderline}% shows as Low.</p>
          </div>
        </ConfigPanel>

        <ConfigPanel section={schedule} invalid={hourError} title="Study schedule" description="When a student creates a schedule, the hours per day decide the colour and message they see.">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted uppercase">Workload messages</p>
            <div className="flex flex-wrap items-end gap-4">
              <Field label="Comfortable up to (hours/day)">
                <Input type="number" min={1} value={s.goodMaxHours} onChange={(e) => schedule.setDraft({ ...s, goodMaxHours: Math.max(1, Number(e.target.value) || 1) })} className="w-28" />
              </Field>
              <Field label="Busy up to (hours/day)" error={hourError}>
                <Input type="number" min={1} value={s.busyMaxHours} onChange={(e) => schedule.setDraft({ ...s, busyMaxHours: Math.max(1, Number(e.target.value) || 1) })} className="w-28" invalid={Boolean(hourError)} />
              </Field>
            </div>
            <Field label={`Message up to ${s.goodMaxHours} h/day (green)`}>
              <Input value={s.goodMessage} onChange={(e) => schedule.setDraft({ ...s, goodMessage: e.target.value })} />
            </Field>
            <Field label={`Message up to ${s.busyMaxHours} h/day (amber)`}>
              <Input value={s.busyMessage} onChange={(e) => schedule.setDraft({ ...s, busyMessage: e.target.value })} />
            </Field>
            <Field label={`Message above ${s.busyMaxHours} h/day (red)`}>
              <Input value={s.heavyMessage} onChange={(e) => schedule.setDraft({ ...s, heavyMessage: e.target.value })} />
            </Field>
          </div>
            <div className="border-t border-line pt-4">
              <p className="mb-2 text-xs font-semibold text-muted uppercase">Plan template</p>
              <div className="space-y-4">
                <Field label="Day-one assignments">
                  <ItemList label="Assignment" items={s.intro} onChange={(v) => setItems("intro", v)} />
                </Field>
                <div className="flex flex-wrap items-end gap-4">
                  <Switch checked={s.ngnOverview.enabled} onChange={(v) => schedule.setDraft({ ...s, ngnOverview: { ...s.ngnOverview, enabled: v } })} label="Next Gen overview" description="An optional course assignment early in the plan." />
                  <Input value={s.ngnOverview.title} aria-label="Next Gen overview title" className="h-8 max-w-xs" onChange={(e) => schedule.setDraft({ ...s, ngnOverview: { ...s.ngnOverview, title: e.target.value } })} />
                  <Field label="Minutes">
                    <Input type="number" min={5} value={s.ngnOverview.minutes} className="h-8 w-20" onChange={(e) => schedule.setDraft({ ...s, ngnOverview: { ...s.ngnOverview, minutes: Math.max(5, Number(e.target.value) || 5) } })} />
                  </Field>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Field label="Minutes per case study">
                    <Input type="number" min={5} value={s.caseMinutes} className="w-24" onChange={(e) => schedule.setDraft({ ...s, caseMinutes: Math.max(5, Number(e.target.value) || 5) })} />
                  </Field>
                  <Field label="Minutes per readiness exam">
                    <Input type="number" min={30} value={s.readinessMinutes} className="w-24" onChange={(e) => schedule.setDraft({ ...s, readinessMinutes: Math.max(30, Number(e.target.value) || 30) })} />
                  </Field>
                  <Field label="Review pair after every N assignments" hint="0 = no review days">
                    <Input type="number" min={0} value={s.reviewEvery} className="w-24" onChange={(e) => schedule.setDraft({ ...s, reviewEvery: Math.max(0, Number(e.target.value) || 0) })} />
                  </Field>
                </div>
                <Field label="Standalone practice blocks" hint="Repeated in this order to fill the plan between case studies.">
                  <ItemList label="Block" withLink={false} items={s.blocks} onChange={(v) => schedule.setDraft({ ...s, blocks: v.map((x) => ({ title: x.title, minutes: x.minutes })) })} />
                </Field>
                <Field label="Review assignments">
                  <ItemList label="Review" items={s.review} onChange={(v) => setItems("review", v)} />
                </Field>
                <p className="text-xs text-muted">Case studies and readiness exams come from their tabs automatically (published only).</p>
              </div>
            </div>
        </ConfigPanel>

        <ConfigPanel section={totalsSec} title="Catalog totals" description="Totals students see on Home, in Create Test and on Performance. They mirror the full product; set your own or use what is published in the bank.">
          <div className="space-y-2">
            {(
              [
                ["cases", "Case study questions", "Home, Create Test"],
                ["standalone", "Standalone questions", "Home"],
                ["readiness", "Readiness exam questions", "Home and Performance"],
                ["performanceQuestions", "Questions counted on Performance", "Question Usage target"],
              ] as const
            ).map(([k, label, hint]) => (
              <div key={k} className="grid items-center gap-2 sm:grid-cols-[1fr_120px_auto]">
                <span className="text-sm text-ink">
                  {label}
                  <span className="block text-xs text-muted">{hint}</span>
                </span>
                <Input type="number" min={0} value={tot[k]} aria-label={label} onChange={(e) => totalsSec.setDraft({ ...tot, [k]: Math.max(0, Number(e.target.value) || 0) })} />
                <Btn variant="ghost" onClick={() => totalsSec.setDraft({ ...tot, [k]: bank[k] })}>
                  Use bank ({bank[k]})
                </Btn>
              </div>
            ))}
          </div>
        </ConfigPanel>
      </div>
    </AdminPage>
  );
}
