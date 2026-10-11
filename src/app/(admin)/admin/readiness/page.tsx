"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { crud, today } from "@/lib/admin/crud";
import { newId } from "@/lib/admin/store";
import type { QuestionRec, ReadinessRec, Status } from "@/lib/admin/types";
import type { ItemType } from "@/lib/types";
import { useAll, useBank, useSubjects } from "@/lib/content";
import { AccessBadge, AdminPage, Badge, Btn, confirmDialog, Dialog, Drawer, Field, Input, Panel, Segmented, StatusBadge, stripHtml, Switch, toast, sameRecord, useUnsavedGuard } from "@/components/admin/ui";
import { DataTable, ListEmpty, ListToolbar, statusFilter, useList, type Column } from "@/components/admin/list";
import { DeleteRecordButton, HistoryButton, StatusPicker, subjectFilter } from "@/components/admin/parts";
import { blankItem, TYPE_LABELS } from "@/components/admin/items";

const api = crud("readiness");
const qApi = crud("questions");

export default function ReadinessAdmin() {
  const router = useRouter();
  const exams = useAll("readiness").slice().sort((a, b) => a.order - b.order);
  const questions = useAll("questions");
  const subjects = useSubjects(true);
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const pool = useMemo(() => questions.filter((q) => q.source.kind === "readiness"), [questions]);
  const live = pool.filter((q) => q.status === "published");
  const editing = open === "new" ? null : exams.find((e) => e.id === open);

  const list = useList<QuestionRec>({
    id: "readinessPool",
    rows: pool,
    search: (q) => `${q.id} ${stripHtml(q.stem)} ${q.topic}`,
    filters: [subjectFilter(subjects), { key: "type", label: "Item type", options: (Object.keys(TYPE_LABELS) as ItemType[]).map((t) => ({ value: t, label: TYPE_LABELS[t] })), match: (q, v) => q.type === v }, statusFilter()],
    sorts: { order: { label: "Order", value: (q) => q.order } },
    defaultSort: { key: "order", dir: "asc" },
  });
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;
  const columns: Column<QuestionRec>[] = [
    { key: "order", label: "#", sort: "order", headClassName: "w-12", render: (q) => <span className="text-xs text-muted tabular-nums">{q.order + 1}</span> },
    { key: "stem", label: "Question", render: (q) => <p className="line-clamp-2 max-w-xl text-sm">{stripHtml(q.stem || q.lead || "") || q.id}</p> },
    { key: "type", label: "Type", render: (q) => <Badge>{TYPE_LABELS[q.type]}</Badge> },
    { key: "subject", label: "Subject", render: (q) => <span className="text-sm text-muted">{subjectName(q.subject)}</span> },
    { key: "status", label: "In pool", render: (q) => <StatusBadge status={q.status} /> },
    {
      key: "act",
      label: "",
      render: (q) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          {q.status === "published" ? (
            <Btn variant="ghost" className="h-8" onClick={() => (qApi.update({ ...q, status: "archived" }, "archive"), toast("Removed from the pool"))}>
              <Trash2 className="size-3.5" />
              Remove
            </Btn>
          ) : (
            <Btn variant="ghost" className="h-8" onClick={() => (qApi.update({ ...q, status: "published" }, "publish"), toast("Back in the pool"))}>
              <RotateCcw className="size-3.5" />
              Restore
            </Btn>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminPage
      title="Readiness Exams"
      description="CAT readiness exams and their question pool. Add or remove exams; set each one's time, range, questions (whole pool or chosen), access and order; add, edit or remove pool questions."
      actions={
        <Btn variant="primary" onClick={() => setOpen("new")}>
          <Plus className="size-4" />
          New exam
        </Btn>
      }
    >
      <div className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="bg-background text-left text-xs text-muted uppercase">
              <tr>
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Exam</th>
                <th className="px-3 py-2.5">Time</th>
                <th className="px-3 py-2.5">Questions</th>
                <th className="px-3 py-2.5">Order</th>
                <th className="px-3 py-2.5">Access</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => (
                <tr key={e.id} onClick={() => setOpen(e.id)} className="cursor-pointer border-t border-line hover:bg-background">
                  <td className="px-3 py-2.5 text-muted">{e.number}</td>
                  <td className="px-3 py-2.5 font-medium">{e.title}</td>
                  <td className="px-3 py-2.5">
                    {Math.floor(e.minutes / 60)}h {e.minutes % 60 ? `${e.minutes % 60}m` : ""}
                  </td>
                  <td className="px-3 py-2.5">
                    {e.minQuestions}–{e.maxQuestions}
                    <span className="block text-xs text-muted">{e.questionIds?.length ? `${e.questionIds.length} chosen` : "Whole pool"}</span>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{e.shuffle ? "Shuffled" : "Fixed"}</td>
                  <td className="px-3 py-2.5">
                    <AccessBadge access={e.access} />
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={e.status} />
                  </td>
                </tr>
              ))}
              {!exams.length && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted">
                    No readiness exams. Create one with “New exam”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Panel
          title={`Question pool (${live.length} in use)`}
          description="Every readiness exam draws from this pool. Removing a question takes it out of new exams; finished exams keep their results."
          actions={
            <Btn onClick={() => setAdding(true)}>
              <Plus className="size-4" />
              Add question
            </Btn>
          }
          bodyClassName="p-3"
        >
          <ListToolbar list={list} placeholder="Search pool questions" />
          <DataTable list={list} columns={columns} rowId={(q) => q.id} onRowClick={(q) => router.push(`/admin/questions/edit?id=${encodeURIComponent(q.id)}`)} empty={<ListEmpty list={list} noun="pool questions" onCreate={() => setAdding(true)} />} />
          <p className="mt-2 text-xs text-muted">
            Questions inside readiness case studies stay with their case. Edit any question with a click, or in <Link href="/admin/questions?source=readiness" className="font-semibold text-primary underline">Question Bank</Link>.
          </p>
        </Panel>
      </div>
      {open && (open === "new" || editing) && <ExamEditor key={open} rec={editing ?? null} next={Math.max(0, ...exams.map((e) => e.number)) + 1} onClose={() => setOpen(null)} />}
      {adding && <AddPoolQuestion order={pool.length} onClose={() => setAdding(false)} />}
    </AdminPage>
  );
}

function AddPoolQuestion({ order, onClose }: { order: number; onClose: () => void }) {
  const router = useRouter();
  const subjects = useSubjects(true);
  const [type, setType] = useState<ItemType>("mcq");
  const create = () => {
    const s = subjects[0];
    const item = blankItem(type, { id: newId("rq"), subject: s?.id ?? "adult-health", system: s?.systems[0]?.key ?? "" });
    // Drafts stay out of exams until published from the editor.
    qApi.create({ ...item, source: { kind: "readiness" }, access: "free", status: "draft", order, updatedAt: today() } as QuestionRec);
    router.push(`/admin/questions/edit?id=${encodeURIComponent(item.id)}`);
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title="Add a question to the readiness pool"
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={create}>
            Create & edit
          </Btn>
        </>
      }
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {(Object.keys(TYPE_LABELS) as ItemType[])
          .filter((t) => t !== "highlightText")
          .map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`cursor-pointer rounded-md border px-3 py-2 text-left text-sm ${type === t ? "border-primary bg-primary-light font-semibold text-primary" : "border-line hover:border-faint"}`}>
              {TYPE_LABELS[t]}
            </button>
          ))}
      </div>
    </Dialog>
  );
}

function ExamEditor({ rec, next, onClose }: { rec: ReadinessRec | null; next: number; onClose: () => void }) {
  const initial = useMemo<ReadinessRec>(
    () => rec ?? { id: newId("readiness"), number: next, title: `CAT Readiness Exam ${next}`, minQuestions: 85, maxQuestions: 150, minutes: 300, shuffle: true, access: "premium", status: "draft", order: next, updatedAt: today() },
    [rec], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [f, setF] = useState(initial);
  const [picking, setPicking] = useState(!!initial.questionIds?.length);
  const dirty = !sameRecord(f, initial);
  useUnsavedGuard(dirty);
  const error = !f.title.trim() ? "Add a name." : picking && !f.questionIds?.length ? "Pick at least one question, or use the whole pool." : f.minQuestions < 1 || f.maxQuestions < f.minQuestions ? "The maximum must be at least the minimum." : f.minutes < 10 ? "Allow at least 10 minutes." : "";
  const save = (status?: Status) => {
    if (error) return toast(error, "error");
    const nextRec = { ...f, title: f.title.trim(), status: status ?? f.status };
    if (rec) api.update(nextRec, nextRec.status !== rec.status ? (nextRec.status === "published" ? "publish" : nextRec.status === "draft" ? "unpublish" : "archive") : "update");
    else api.create(nextRec);
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
      title={rec ? rec.title : "New readiness exam"}
      footer={
        <>
          {rec && <HistoryButton<ReadinessRec> historyKey={`readiness:${rec.id}`} onRestore={(v) => (api.restore(rec.id, v), onClose())} describe={(v) => `${v.title} · ${v.minutes} min`} />}
          {rec && <DeleteRecordButton status={rec.status} noun="exam" onDelete={() => (api.hardDelete([rec.id]), onClose())} />}
          <span className="flex-1" />
          <Btn onClick={close}>Cancel</Btn>
          <Btn onClick={() => save("draft")}>Save draft</Btn>
          <Btn variant="primary" onClick={() => save("published")}>
            {rec?.status === "published" ? "Save & keep published" : "Publish"}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
          <Field label="Name" required>
            <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          </Field>
          <Field label="Number">
            <Input type="number" min={1} value={f.number} onChange={(e) => setF({ ...f, number: Number(e.target.value) || f.number, order: Number(e.target.value) || f.order })} />
          </Field>
        </div>
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
        <Switch checked={f.shuffle} onChange={(v) => setF({ ...f, shuffle: v })} label="Shuffle the questions" description="Off = questions in pool order. On = case groups reordered (each exam number gives a different order)." />
        <Field label="Questions">
          <Segmented
            value={picking ? "pick" : "all"}
            onChange={(v) => (setPicking(v === "pick"), v === "all" && setF({ ...f, questionIds: undefined }))}
            options={[
              { value: "all", label: "Whole pool" },
              { value: "pick", label: "Choose questions" },
            ]}
          />
        </Field>
        {picking && <QuestionPicker value={f.questionIds ?? []} onChange={(ids) => setF({ ...f, questionIds: ids.length ? ids : undefined })} />}
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

/** Choose which published pool questions an exam uses. A case study is picked as a whole. */
function QuestionPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const bank = useBank();
  const questions = useAll("questions");
  const subjects = useSubjects(true);
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const out: { key: string; label: string; subject: string; ids: string[] }[] = [];
    const pool = questions.filter((x) => x.source.kind === "readiness" && x.status === "published").sort((a, b) => a.order - b.order);
    for (const x of pool) {
      const c = bank.caseOf.get(x.id);
      const last = out[out.length - 1];
      if (c && last?.key === `case:${c.id}`) last.ids.push(x.id);
      else out.push({ key: c ? `case:${c.id}` : x.id, label: c ? `Case study: ${c.title}` : stripHtml(x.stem || x.lead || "") || x.id, subject: x.subject, ids: [x.id] });
    }
    return out;
  }, [questions, bank]);
  const picked = new Set(value);
  const isOn = (g: (typeof groups)[number]) => g.ids.some((id) => picked.has(id));
  const needle = q.trim().toLowerCase();
  const shown = needle ? groups.filter((g) => `${g.label} ${g.ids.join(" ")}`.toLowerCase().includes(needle)) : groups;
  const count = groups.filter(isOn).reduce((n, g) => n + g.ids.length, 0);
  const toggle = (gs: typeof groups, on: boolean) => {
    const next = new Set(value);
    for (const g of gs)
      for (const id of g.ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
    onChange(groups.flatMap((g) => g.ids).filter((id) => next.has(id)));
  };
  return (
    <div className="rounded-md border border-line">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-background px-2 py-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pool questions" aria-label="Search pool questions" className="h-8 min-w-[180px] flex-1" />
        <Btn variant="ghost" className="h-8" onClick={() => toggle(shown, true)}>
          Select shown
        </Btn>
        <Btn variant="ghost" className="h-8" onClick={() => toggle(shown, false)}>
          Clear shown
        </Btn>
      </div>
      <ul className="max-h-72 divide-y divide-line overflow-y-auto">
        {shown.map((g) => (
          <li key={g.key}>
            <label className="flex cursor-pointer items-start gap-2 px-3 py-2 text-sm hover:bg-background">
              <input type="checkbox" checked={isOn(g)} onChange={(e) => toggle([g], e.target.checked)} className="mt-0.5 accent-primary" />
              <span className="flex-1">
                <span className="line-clamp-2">{g.label}</span>
                <span className="text-xs text-muted">
                  {subjects.find((s) => s.id === g.subject)?.name ?? g.subject}
                  {g.ids.length > 1 && ` · ${g.ids.length} items`}
                </span>
              </span>
            </label>
          </li>
        ))}
        {!shown.length && <li className="px-3 py-6 text-center text-sm text-muted">No published pool questions match.</li>}
      </ul>
      <p className="border-t border-line px-3 py-2 text-xs text-muted">
        {count} question{count === 1 ? "" : "s"} chosen. Only published pool questions are listed; removing one from the pool also removes it from this exam.
      </p>
    </div>
  );
}
