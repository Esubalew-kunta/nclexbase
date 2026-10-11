"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { CASE_ROWS } from "@/data/cases";
import { crud, today } from "@/lib/admin/crud";
import { newId } from "@/lib/admin/store";
import type { CaseContent, CaseRec, QuestionRec, Status } from "@/lib/admin/types";
import type { CaseTab, ItemType, TabContent } from "@/lib/types";
import { useAll, useSubjects } from "@/lib/content";
import { AdminPage, Badge, Btn, confirmDialog, Dialog, EmptyState, Field, IconBtn, Input, Panel, Segmented, Select, StatusBadge, stripHtml, TextArea, toast, sameRecord, useUnsavedGuard } from "@/components/admin/ui";
import { HistoryButton, StatusPicker, SubjectSelect } from "@/components/admin/parts";
import { blankItem, TYPE_LABELS, validateItem } from "@/components/admin/items";

const api = crud("cases");
const qApi = crud("questions");

const move = <T,>(arr: T[], i: number, d: number) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};

export default function CaseEditPage() {
  const id = useSearchParams().get("id");
  const rec = useAll("cases").find((c) => c.id === id);
  if (!rec)
    return (
      <AdminPage title="Case study not found">
        <EmptyState title="This case study doesn't exist" action={<Link href="/admin/cases" className="font-semibold text-primary underline">Back to Case Studies</Link>} />
      </AdminPage>
    );
  return <CaseEditor key={rec.id} rec={rec} />;
}

function CaseEditor({ rec }: { rec: CaseRec }) {
  const router = useRouter();
  const [f, setF] = useState<CaseRec>(rec);
  const [adding, setAdding] = useState(false);
  const questions = useAll("questions");
  const subjects = useSubjects(true);
  const dirty = !sameRecord(f, rec);
  useUnsavedGuard(dirty);
  const content = f.content;
  const items = useMemo(() => (content?.itemIds ?? []).map((qid) => questions.find((q) => q.id === qid)).filter(Boolean) as QuestionRec[], [content, questions]);
  const itemProblems = items.filter((q) => validateItem(q).length).length;
  const seeded = CASE_ROWS.some((r) => r.id === rec.id);
  const setContent = (patch: Partial<CaseContent>) => setF((x) => ({ ...x, content: { ...(x.content as CaseContent), ...patch } }));

  const save = (status?: Status) => {
    const next = { ...f, title: f.title.trim(), status: status ?? f.status };
    if (!next.title) return toast("Give the case a title.", "error");
    if (next.status === "published" && next.content && (next.content.itemIds.length === 0 || itemProblems)) return toast("Add questions and fix their problems before publishing.", "error");
    api.update(next, next.status !== rec.status ? (next.status === "published" ? "publish" : next.status === "draft" ? "unpublish" : "archive") : "update");
    toast("Case study saved");
  };

  const setTab = (i: number, tab: CaseTab) => setContent({ tabs: content!.tabs.map((t, k) => (k === i ? tab : t)) });

  return (
    <AdminPage
      back={
        <Link href="/admin/cases" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="size-4" />
          Case Studies
        </Link>
      }
      title={
        <span className="flex flex-wrap items-center gap-2">
          {f.title || "Untitled case"}
          <StatusBadge status={f.status} />
        </span>
      }
      description={`${rec.id} · #${rec.number}`}
      actions={
        <>
          {seeded && (
            <Link href={`/nclex/next-gen-cases/qbanks/${rec.id}`} target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-primary hover:bg-primary-light">
              <ExternalLink className="size-4" />
              Try as student
            </Link>
          )}
          <HistoryButton<CaseRec> historyKey={`cases:${rec.id}`} onRestore={(v) => api.restore(rec.id, v)} describe={(v) => `${v.status} · ${v.content?.itemIds.length ?? 0} questions`} />
          <Btn onClick={() => save("draft")} disabled={!dirty && f.status === "draft"}>
            Save draft
          </Btn>
          <Btn variant="primary" onClick={() => save("published")}>
            {rec.status === "published" ? "Save & keep published" : "Publish"}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Panel title="Details">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr_120px]">
            <Field label="Title" required>
              <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            </Field>
            <Field label="Subject">
              <SubjectSelect value={f.subject} onChange={(v) => setF({ ...f, subject: v as CaseRec["subject"] })} />
            </Field>
            <Field label="Number">
              <Input type="number" value={f.number} onChange={(e) => setF({ ...f, number: Number(e.target.value) || f.number, order: Number(e.target.value) || f.order })} />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-4">
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
        </Panel>

        {!content ? (
          <Panel title="Content">
            <EmptyState
              title="No authored content yet"
              body={`Students who open this case get the ${subjects.find((s) => s.id === f.subject)?.name ?? ""} sample case. Write the scenario and questions to replace it.`}
              action={
                <Btn variant="primary" onClick={() => setF({ ...f, content: { intro: "", tabs: [{ label: "Nurses' Notes", content: { kind: "notes", heading: "", entries: [{ time: "", html: "" }] } }], itemIds: [] } })}>
                  Start writing content
                </Btn>
              }
            />
          </Panel>
        ) : (
          <>
            <Panel title="Scenario">
              <Field label="Intro" hint="The sentence above the tabs, e.g. “The nurse is caring for a 68-year-old client…”.">
                <TextArea value={content.intro} onChange={(e) => setContent({ intro: e.target.value })} rows={2} className="min-h-0" />
              </Field>
            </Panel>

            <Panel
              title={`Scenario tabs (${content.tabs.length})`}
              description="Tabs students read on the left side of the exam. Questions can reveal tabs progressively (see each question's “Tabs visible”)."
              actions={
                <Btn onClick={() => setContent({ tabs: [...content.tabs, { label: "New tab", content: { kind: "text", html: "" } }] })}>
                  <Plus className="size-4" />
                  Add tab
                </Btn>
              }
            >
              <div className="space-y-3">
                {content.tabs.map((t, i) => (
                  <TabEditor
                    key={i}
                    index={i}
                    tab={t}
                    total={content.tabs.length}
                    onChange={(tab) => setTab(i, tab)}
                    onMove={(d) => setContent({ tabs: move(content.tabs, i, d) })}
                    onRemove={async () => {
                      if (await confirmDialog({ title: `Remove tab “${t.label}”?`, confirm: "Remove", danger: true })) setContent({ tabs: content.tabs.filter((_, k) => k !== i) });
                    }}
                  />
                ))}
              </div>
            </Panel>

            <Panel
              title={`Questions (${items.length})`}
              description="Case studies normally have 6 questions, in exam order. Edit each question in the Question Bank editor."
              actions={
                <Btn onClick={() => setAdding(true)}>
                  <Plus className="size-4" />
                  Add question
                </Btn>
              }
            >
              {items.length === 0 ? (
                <p className="text-sm text-muted">No questions yet.</p>
              ) : (
                <ol className="divide-y divide-line rounded-md border border-line">
                  {items.map((q, i) => {
                    const problems = validateItem(q);
                    return (
                      <li key={q.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                        <span className="w-6 text-sm text-muted tabular-nums">{i + 1}.</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-ink">{stripHtml(q.stem) || <span className="text-muted italic">No stem</span>}</p>
                          <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                            <Badge>{TYPE_LABELS[q.type]}</Badge>
                            {problems.length > 0 && <Badge tone="warning">{problems.length} to fix</Badge>}
                          </p>
                        </div>
                        <label className="flex items-center gap-1 text-xs text-muted">
                          Tabs visible
                          <Select
                            value={q.tabs ?? content.tabs.length}
                            onChange={(e) => (qApi.update({ ...q, tabs: Number(e.target.value) }), toast("Saved"))}
                            className="h-8 w-16 px-1"
                          >
                            {content.tabs.map((_, k) => (
                              <option key={k} value={k + 1}>
                                {k + 1}
                              </option>
                            ))}
                          </Select>
                        </label>
                        <IconBtn label="Move up" disabled={i === 0} onClick={() => setContent({ itemIds: move(content.itemIds, i, -1) })}>
                          <ArrowUp className="size-4" />
                        </IconBtn>
                        <IconBtn label="Move down" disabled={i === items.length - 1} onClick={() => setContent({ itemIds: move(content.itemIds, i, 1) })}>
                          <ArrowDown className="size-4" />
                        </IconBtn>
                        <Link href={`/admin/questions/edit?id=${encodeURIComponent(q.id)}`} className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-primary-light hover:text-primary" aria-label="Edit question" title="Edit question">
                          <Pencil className="size-4" />
                        </Link>
                        <IconBtn
                          label="Remove from case"
                          className="hover:text-error"
                          onClick={async () => {
                            if (!(await confirmDialog({ title: "Remove this question from the case?", body: "It is archived in the Question Bank, so it can be restored later.", confirm: "Remove", danger: true }))) return;
                            setContent({ itemIds: content.itemIds.filter((x) => x !== q.id) });
                            qApi.update({ ...q, status: "archived" }, "archive");
                          }}
                        >
                          <Trash2 className="size-4" />
                        </IconBtn>
                      </li>
                    );
                  })}
                </ol>
              )}
              {dirty && <p className="mt-2 text-xs text-muted">Question order changes are saved with the case.</p>}
            </Panel>
          </>
        )}
      </div>
      {adding && content && (
        <AddCaseQuestion
          rec={f}
          onClose={() => setAdding(false)}
          onCreated={(qid) => {
            const next = { ...f, content: { ...content, itemIds: [...content.itemIds, qid] } };
            api.update(next);
            router.push(`/admin/questions/edit?id=${encodeURIComponent(qid)}`);
          }}
        />
      )}
    </AdminPage>
  );
}

function TabEditor({ tab, index, total, onChange, onMove, onRemove }: { tab: CaseTab; index: number; total: number; onChange: (t: CaseTab) => void; onMove: (d: number) => void; onRemove: () => void }) {
  const c = tab.content;
  const setKind = (kind: TabContent["kind"]) => {
    if (kind === c.kind) return;
    const text = c.kind === "text" ? c.html : c.kind === "notes" ? c.entries.map((e) => e.html).join("<br>") : "";
    onChange({
      ...tab,
      content: kind === "text" ? { kind, html: text } : kind === "notes" ? { kind, heading: "", entries: [{ time: "", html: text }] } : { kind, headers: ["", ""], rows: [["", ""]] },
    });
  };
  return (
    <div className="rounded-md border border-line">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-background px-3 py-2">
        <span className="text-xs text-muted">Tab {index + 1}</span>
        <Input value={tab.label} onChange={(e) => onChange({ ...tab, label: e.target.value })} className="h-8 max-w-xs" aria-label="Tab label" />
        <Segmented
          value={c.kind}
          onChange={setKind}
          options={[
            { value: "notes", label: "Notes" },
            { value: "text", label: "Text" },
            { value: "table", label: "Table" },
          ]}
        />
        <span className="flex-1" />
        <IconBtn label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
          <ArrowUp className="size-4" />
        </IconBtn>
        <IconBtn label="Move down" disabled={index === total - 1} onClick={() => onMove(1)}>
          <ArrowDown className="size-4" />
        </IconBtn>
        <IconBtn label="Remove tab" onClick={onRemove} className="hover:text-error">
          <Trash2 className="size-4" />
        </IconBtn>
      </div>
      <div className="p-3">
        {c.kind === "text" && <TextArea value={c.html} onChange={(e) => onChange({ ...tab, content: { ...c, html: e.target.value } })} rows={4} placeholder="HTML allowed" />}
        {c.kind === "notes" && (
          <div className="space-y-2">
            <Input value={c.heading ?? ""} onChange={(e) => onChange({ ...tab, content: { ...c, heading: e.target.value } })} placeholder="Heading, e.g. Emergency Department" className="h-8" />
            {c.entries.map((en, i) => (
              <div key={i} className="flex gap-2">
                <Input value={en.time} onChange={(e) => onChange({ ...tab, content: { ...c, entries: c.entries.map((x, k) => (k === i ? { ...x, time: e.target.value } : x)) } })} placeholder="Time" className="h-8 w-20 shrink-0" />
                <TextArea value={en.html} onChange={(e) => onChange({ ...tab, content: { ...c, entries: c.entries.map((x, k) => (k === i ? { ...x, html: e.target.value } : x)) } })} rows={3} className="min-h-0 min-w-0 flex-1" />
                <IconBtn label="Remove entry" disabled={c.entries.length <= 1} onClick={() => onChange({ ...tab, content: { ...c, entries: c.entries.filter((_, k) => k !== i) } })} className="hover:text-error">
                  <Trash2 className="size-4" />
                </IconBtn>
              </div>
            ))}
            <Btn variant="ghost" className="h-8" onClick={() => onChange({ ...tab, content: { ...c, entries: [...c.entries, { time: "", html: "" }] } })}>
              <Plus className="size-3.5" />
              Add entry
            </Btn>
          </div>
        )}
        {c.kind === "table" && <TableTabEditor value={c} onChange={(v) => onChange({ ...tab, content: v })} />}
      </div>
    </div>
  );
}

function TableTabEditor({ value, onChange }: { value: Extract<TabContent, { kind: "table" }>; onChange: (v: Extract<TabContent, { kind: "table" }>) => void }) {
  const headers = value.headers ?? value.rows[0]?.map(() => "") ?? ["", ""];
  const cols = headers.length;
  const setCell = (r: number, c: number, v: string) => onChange({ ...value, rows: value.rows.map((row, i) => (i === r ? row.map((x, k) => (k === c ? v : x)) : row)) });
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {headers.map((h, c) => (
                <th key={c} className="p-1">
                  <Input value={h} placeholder={`Header ${c + 1}`} className="h-8 font-semibold" onChange={(e) => onChange({ ...value, headers: headers.map((x, k) => (k === c ? e.target.value : x)) })} />
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {value.rows.map((row, r) => (
              <tr key={r}>
                {Array.from({ length: cols }, (_, c) => (
                  <td key={c} className="p-1">
                    <Input value={row[c] ?? ""} className="h-8" onChange={(e) => setCell(r, c, e.target.value)} />
                  </td>
                ))}
                <td className="p-1">
                  <IconBtn label="Remove row" disabled={value.rows.length <= 1} onClick={() => onChange({ ...value, rows: value.rows.filter((_, i) => i !== r) })} className="hover:text-error">
                    <Trash2 className="size-4" />
                  </IconBtn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <Btn variant="ghost" className="h-8" onClick={() => onChange({ ...value, rows: [...value.rows, Array(cols).fill("")] })}>
          <Plus className="size-3.5" />
          Add row
        </Btn>
        <Btn variant="ghost" className="h-8" onClick={() => onChange({ kind: "table", headers: [...headers, ""], rows: value.rows.map((r) => [...r, ""]) })}>
          <Plus className="size-3.5" />
          Add column
        </Btn>
        <Btn variant="ghost" className="h-8" disabled={cols <= 1} onClick={() => onChange({ kind: "table", headers: headers.slice(0, -1), rows: value.rows.map((r) => r.slice(0, cols - 1)) })}>
          Remove last column
        </Btn>
      </div>
    </div>
  );
}

function AddCaseQuestion({ rec, onClose, onCreated }: { rec: CaseRec; onClose: () => void; onCreated: (id: string) => void }) {
  const subjects = useSubjects(true);
  const [type, setType] = useState<ItemType>("mcq");
  const create = () => {
    const s = subjects.find((x) => x.id === rec.subject);
    const item = blankItem(type, { id: newId("q"), subject: rec.subject, system: s?.systems[0]?.key ?? "" });
    const q = { ...item, tabs: rec.content?.tabs.length ?? 1, source: { kind: "case", caseId: rec.id }, access: rec.access, status: "published", order: rec.content?.itemIds.length ?? 0, updatedAt: today() } as QuestionRec;
    qApi.create(q);
    onCreated(q.id);
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title="Add a question to this case"
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={create}>
            Create & edit
          </Btn>
        </>
      }
    >
      <p className="mb-3 text-sm text-muted">The case is saved and you go to the question editor. The question follows the case&apos;s publish state.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {(Object.keys(TYPE_LABELS) as ItemType[])
          .filter((t) => t !== "highlightText")
          .map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`cursor-pointer rounded-md border px-3 py-2 text-left text-sm ${type === t ? "border-primary bg-primary-light font-semibold text-primary" : "border-line hover:border-faint"}`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
      </div>
    </Dialog>
  );
}
