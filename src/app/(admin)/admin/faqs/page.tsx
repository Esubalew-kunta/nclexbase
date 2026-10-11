"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { crud, today } from "@/lib/admin/crud";
import { newId } from "@/lib/admin/store";
import type { FaqPlacement, FaqRec, Status } from "@/lib/admin/types";
import { useAll } from "@/lib/content";
import { AdminPage, Badge, Btn, confirmDialog, Drawer, Field, fmtDate, Input, Segmented, StatusBadge, stripHtml, TextArea, toast, sameRecord, useUnsavedGuard } from "@/components/admin/ui";
import { BulkBar, DataTable, ListEmpty, ListToolbar, statusFilter, useEditParam, useList, useSelection, type Column } from "@/components/admin/list";
import { HistoryButton, StatusBulkActions, StatusPicker } from "@/components/admin/parts";

const api = crud("faqs");

const PLACEMENTS: { value: FaqPlacement; label: string; where: string }[] = [
  { value: "home", label: "Home & FAQs page", where: "Bottom of Home and the FAQs page" },
  { value: "performance", label: "Performance", where: "Performance page and subject Performance tabs" },
  { value: "readiness", label: "Readiness Exams", where: "CAT Readiness Exams page" },
  { value: "schedule", label: "Study Schedule", where: "Study Schedule page" },
  { value: "review", label: "Score report", where: "Previous test score report" },
];

export default function FaqsAdmin() {
  const rows = useAll("faqs");
  const edit = useEditParam();
  const list = useList<FaqRec>({
    id: "faqs",
    rows,
    search: (r) => `${r.id} ${r.question} ${stripHtml(r.answer)}`,
    filters: [
      { key: "placement", label: "Shown on", options: PLACEMENTS.map((p) => ({ value: p.value, label: p.label })), match: (r, v) => r.placements.includes(v as FaqPlacement) },
      statusFilter(),
    ],
    sorts: {
      order: { label: "Order", value: (r) => r.order },
      question: { label: "Question", value: (r) => r.question },
      updated: { label: "Updated", value: (r) => r.updatedAt },
    },
    defaultSort: { key: "order", dir: "asc" },
  });
  const sel = useSelection(list.filtered.map((r) => r.id));
  const columns: Column<FaqRec>[] = [
    { key: "order", label: "#", sort: "order", render: (r) => <span className="text-xs text-muted tabular-nums">{r.order}</span>, headClassName: "w-12" },
    {
      key: "question",
      label: "Question",
      sort: "question",
      render: (r) => (
        <div className="max-w-xl">
          <p className="font-medium">{r.question}</p>
          <p className="truncate text-xs text-muted">{stripHtml(r.answer)}</p>
        </div>
      ),
    },
    {
      key: "placements",
      label: "Shown on",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.placements.map((p) => (
            <Badge key={p} tone="teal">
              {PLACEMENTS.find((x) => x.value === p)?.label}
            </Badge>
          ))}
          {!r.placements.length && <Badge tone="warning">Nowhere</Badge>}
        </div>
      ),
    },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "updated", label: "Updated", sort: "updated", render: (r) => <span className="text-xs text-muted">{fmtDate(r.updatedAt)}</span> },
  ];
  const editing = edit.id === "new" ? null : rows.find((r) => r.id === edit.id);

  return (
    <AdminPage
      title="FAQs"
      description="Questions and answers shown at the bottom of student pages. One FAQ can appear on several pages; order is shared."
      actions={
        <Btn variant="primary" onClick={() => edit.open("new")}>
          <Plus className="size-4" />
          New FAQ
        </Btn>
      }
    >
      <ListToolbar list={list} placeholder="Search questions and answers" />
      <BulkBar count={sel.selected.size} onClear={sel.clear}>
        <StatusBulkActions ids={[...sel.selected]} rows={rows} onStatus={(ids, s) => (api.setStatus(ids, s), toast(`${ids.length} updated`))} onDelete={(ids) => (api.hardDelete(ids), sel.clear())} />
      </BulkBar>
      <DataTable list={list} columns={columns} rowId={(r) => r.id} onRowClick={(r) => edit.open(r.id)} selection={sel} empty={<ListEmpty list={list} noun="FAQs" onCreate={() => edit.open("new")} />} />
      {edit.id && (edit.id === "new" || editing) && <FaqEditor key={edit.id} rec={editing ?? null} onClose={edit.close} nextOrder={Math.max(0, ...rows.map((r) => r.order)) + 1} />}
    </AdminPage>
  );
}

function FaqEditor({ rec, onClose, nextOrder }: { rec: FaqRec | null; onClose: () => void; nextOrder: number }) {
  const initial = useMemo<FaqRec>(() => rec ?? { id: newId("faq"), question: "", answer: "", placements: ["home"], status: "draft", order: nextOrder, updatedAt: today() }, [rec]); // eslint-disable-line react-hooks/exhaustive-deps
  const [f, setF] = useState(initial);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [tried, setTried] = useState(false);
  const dirty = !sameRecord(f, initial);
  useUnsavedGuard(dirty);

  const save = (status?: Status) => {
    setTried(true);
    const next = { ...f, question: f.question.trim(), status: status ?? f.status };
    if (!next.question || !stripHtml(next.answer)) return toast("Add both a question and an answer.", "error");
    if (next.status === "published" && !next.placements.length) return toast("Pick at least one page to show it on.", "error");
    if (rec) api.update(next, next.status !== rec.status ? (next.status === "published" ? "publish" : next.status === "draft" ? "unpublish" : "archive") : "update");
    else api.create(next);
    toast(rec ? "FAQ saved" : "FAQ created");
    onClose();
  };
  const close = async () => {
    if (dirty && !(await confirmDialog({ title: "Discard changes?", body: "Your edits haven't been saved.", confirm: "Discard", danger: true }))) return;
    onClose();
  };

  return (
    <Drawer
      open
      width={640}
      onClose={close}
      title={rec ? "Edit FAQ" : "New FAQ"}
      footer={
        <>
          {rec && <HistoryButton<FaqRec> historyKey={`faqs:${rec.id}`} onRestore={(v) => (api.restore(rec.id, v), onClose())} describe={(v) => v.question} />}
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
        <Field label="Question" required error={tried && !f.question.trim() ? "Add the question." : ""}>
          <Input value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} autoFocus />
        </Field>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">
              Answer <span className="text-error">*</span>
            </span>
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { value: "edit", label: "HTML" },
                { value: "preview", label: "Preview" },
              ]}
            />
          </div>
          {tab === "edit" ? (
            <TextArea value={f.answer} onChange={(e) => setF({ ...f, answer: e.target.value })} rows={10} className="font-mono text-xs" placeholder="<p>Answer text. Use <strong>, <a href>, <ul><li> for formatting.</p>" />
          ) : (
            <div className="faq-answer min-h-[160px] rounded-md border border-line bg-primary-light/40 p-4 text-base leading-7 text-ink [&_a]:text-primary" dangerouslySetInnerHTML={{ __html: f.answer || "<p><em>Nothing yet.</em></p>" }} />
          )}
          <p className="mt-1 text-xs text-muted">Simple HTML: paragraphs, bold, links and lists. Students see exactly the preview.</p>
        </div>
        <Field label="Show on">
          <div className="grid gap-2 sm:grid-cols-2">
            {PLACEMENTS.map((p) => {
              const on = f.placements.includes(p.value);
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setF({ ...f, placements: on ? f.placements.filter((x) => x !== p.value) : [...f.placements, p.value] })}
                  className={clsx("cursor-pointer rounded-md border px-3 py-2 text-left transition-colors", on ? "border-primary bg-primary-light" : "border-line bg-white hover:border-faint")}
                >
                  <span className={clsx("block text-sm font-medium", on ? "text-primary" : "text-ink")}>{p.label}</span>
                  <span className="block text-xs text-muted">{p.where}</span>
                </button>
              );
            })}
          </div>
        </Field>
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Status">
            <StatusPicker value={f.status} onChange={(v) => setF({ ...f, status: v })} />
          </Field>
          <Field label="Order" hint="Lower shows first.">
            <Input type="number" value={f.order} onChange={(e) => setF({ ...f, order: Number(e.target.value) || 0 })} className="w-24" />
          </Field>
        </div>
      </div>
    </Drawer>
  );
}
