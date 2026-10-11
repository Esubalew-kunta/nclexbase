"use client";

import { AdminPage, Field, Input } from "@/components/admin/ui";
import { ConfigPanel, useConfigSection } from "@/components/admin/config";

const pct = (v: string) => Math.max(0, Math.min(100, Number(v) || 0));

export default function RulesAdmin() {
  const targets = useConfigSection("targets", "pass targets");
  const bands = useConfigSection("readinessBands", "readiness bands");
  const schedule = useConfigSection("schedule", "study schedule rules");
  const t = targets.draft;
  const b = bands.draft;
  const s = schedule.draft;
  const bandError = b.borderline >= b.high ? "“High” must be above “Borderline”." : "";
  const hourError = s.goodMaxHours >= s.busyMaxHours ? "The busy limit must be above the comfortable limit." : "";

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
        </ConfigPanel>
      </div>
    </AdminPage>
  );
}
