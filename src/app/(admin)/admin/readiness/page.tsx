"use client";

import { useMemo, useState } from "react";
import { crud } from "@/lib/admin/crud";
import type { ReadinessRec, Status } from "@/lib/admin/types";
import type { ItemType } from "@/lib/types";
import { useAll, useSubjects } from "@/lib/content";
import { AccessBadge, AdminPage, Btn, confirmDialog, Drawer, Field, Input, Panel, Segmented, StatusBadge, toast, sameRecord, useUnsavedGuard } from "@/components/admin/ui";
import { HistoryButton, StatusPicker } from "@/components/admin/parts";
import { TYPE_LABELS } from "@/components/admin/items";

const api = crud("readiness");

export default function ReadinessAdmin() {
  const exams = useAll("readiness").slice().sort((a, b) => a.order - b.order);
  const questions = useAll("questions");
  const subjects = useSubjects(true);
  const [open, setOpen] = useState<string | null>(null);
  const pool = questions.filter((q) => q.source.kind === "readiness");

  // Pool mix: how the readiness bank spreads across subjects and item types.
  const bySubject = useMemo(() => subjects.map((s) => ({ name: s.name, n: pool.filter((q) => q.subject === s.id).length })).filter((x) => x.n), [pool, subjects]);
  const byType = useMemo(() => {
    const m = new Map<ItemType, number>();
    for (const q of pool) m.set(q.type, (m.get(q.type) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1]);
  }, [pool]);
  const editing = exams.find((e) => e.id === open);

  return (
    <AdminPage title="Readiness Exams" description="CAT readiness exams: name, time limit, question range, and who can take them. The question bank behind them is edited in Question Bank (filter “Used in: Readiness exams”).">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="bg-background text-left text-xs text-muted uppercase">
              <tr>
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Exam</th>
                <th className="px-3 py-2.5">Time</th>
                <th className="px-3 py-2.5">Questions</th>
                <th className="px-3 py-2.5">Access</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => (
                <tr key={e.id} onClick={() => setOpen(e.id)} className="cursor-pointer border-t border-line hover:bg-background">
                  <td className="px-3 py-2.5 text-muted">{e.number}</td>
                  <td className="px-3 py-2.5 font-medium">{e.title}</td>
                  <td className="px-3 py-2.5">{Math.floor(e.minutes / 60)}h {e.minutes % 60 ? `${e.minutes % 60}m` : ""}</td>
                  <td className="px-3 py-2.5">
                    {e.minQuestions}–{e.maxQuestions}
                  </td>
                  <td className="px-3 py-2.5">
                    <AccessBadge access={e.access} />
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={e.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Panel title={`Question pool (${pool.length})`} description="Shared by all readiness exams; exams 2-4 present it in a different order.">
          <p className="mb-1 text-xs font-semibold text-muted uppercase">By subject</p>
          <ul className="mb-3 space-y-1">
            {bySubject.map((s) => (
              <li key={s.name} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">{s.name}</span>
                <span className="h-1.5 w-20 overflow-hidden rounded-full bg-primary-light">
                  <span className="block h-full bg-primary" style={{ width: `${(s.n / pool.length) * 100}%` }} />
                </span>
                <span className="w-8 text-right text-xs text-muted tabular-nums">{s.n}</span>
              </li>
            ))}
          </ul>
          <p className="mb-1 text-xs font-semibold text-muted uppercase">By item type</p>
          <ul className="space-y-1">
            {byType.map(([t, n]) => (
              <li key={t} className="flex justify-between text-sm">
                <span>{TYPE_LABELS[t]}</span>
                <span className="text-xs text-muted tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      {editing && <ExamEditor key={editing.id} rec={editing} onClose={() => setOpen(null)} />}
    </AdminPage>
  );
}

function ExamEditor({ rec, onClose }: { rec: ReadinessRec; onClose: () => void }) {
  const [f, setF] = useState(rec);
  const dirty = !sameRecord(f, rec);
  useUnsavedGuard(dirty);
  const error = !f.title.trim() ? "Add a name." : f.minQuestions < 1 || f.maxQuestions < f.minQuestions ? "The maximum must be at least the minimum." : f.minutes < 10 ? "Allow at least 10 minutes." : "";
  const save = (status?: Status) => {
    if (error) return toast(error, "error");
    const next = { ...f, title: f.title.trim(), status: status ?? f.status };
    api.update(next, next.status !== rec.status ? (next.status === "published" ? "publish" : next.status === "draft" ? "unpublish" : "archive") : "update");
    toast("Exam saved");
    onClose();
  };
  const close = async () => {
    if (dirty && !(await confirmDialog({ title: "Discard changes?", confirm: "Discard", danger: true }))) return;
    onClose();
  };
  return (
    <Drawer
      open
      onClose={close}
      title={rec.title}
      footer={
        <>
          <HistoryButton<ReadinessRec> historyKey={`readiness:${rec.id}`} onRestore={(v) => (api.restore(rec.id, v), onClose())} describe={(v) => `${v.title} · ${v.minutes} min`} />
          <span className="flex-1" />
          <Btn onClick={close}>Cancel</Btn>
          <Btn variant="primary" onClick={() => save()}>
            Save
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" required>
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Time limit (minutes)" hint={`${Math.floor(f.minutes / 60)} h ${f.minutes % 60} min`}>
            <Input type="number" min={10} value={f.minutes} onChange={(e) => setF({ ...f, minutes: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Min questions">
            <Input type="number" min={1} value={f.minQuestions} onChange={(e) => setF({ ...f, minQuestions: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Max questions">
            <Input type="number" min={1} value={f.maxQuestions} onChange={(e) => setF({ ...f, maxQuestions: Number(e.target.value) || 0 })} />
          </Field>
        </div>
        <p className="text-xs text-muted">Time and range are shown on the exam intro; the time limit is enforced (with 1.5x / 2x accommodations on top).</p>
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Access">
            <Segmented
              value={f.access}
              onChange={(v) => setF({ ...f, access: v })}
              options={[
                { value: "free", label: "Free" },
                { value: "premium", label: "Premium" },
              ]}
            />
          </Field>
          <Field label="Status">
            <StatusPicker value={f.status} onChange={(v) => setF({ ...f, status: v })} />
          </Field>
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    </Drawer>
  );
}
