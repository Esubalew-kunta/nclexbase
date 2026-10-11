"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { crud, today } from "@/lib/admin/crud";
import { newId } from "@/lib/admin/store";
import type { MemoryTrickRec, Status } from "@/lib/admin/types";
import { useAll, useSubjects } from "@/lib/content";
import { AccessBadge, AdminPage, Badge, Btn, confirmDialog, Drawer, Field, fmtDate, Input, Segmented, StatusBadge, TextArea, toast, sameRecord, useUnsavedGuard } from "@/components/admin/ui";
import { accessFilter, BulkBar, DataTable, ListEmpty, ListToolbar, statusFilter, useEditParam, useList, useSelection, type Column, type FilterDef } from "@/components/admin/list";
import { FileDrop, HistoryButton, StatusBulkActions, StatusPicker, SubjectSelect, subjectFilter, SystemSelect, systemFilter } from "@/components/admin/parts";

const api = crud("memoryTricks");

export default function MemoryTricksAdmin() {
  const rows = useAll("memoryTricks");
  const subjects = useSubjects(true);
  const edit = useEditParam();
  const [view, setView] = useState<"list" | "coverage">("list");

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;
  const systemName = (r: MemoryTrickRec) => (r.system ? (subjects.find((s) => s.id === r.subject)?.systems.find((x) => x.key === r.system)?.label ?? r.system) : "General");

  const fileFilter: FilterDef<MemoryTrickRec> = {
    key: "file",
    label: "File",
    options: [
      { value: "has", label: "Has PDF" },
      { value: "missing", label: "Missing PDF" },
    ],
    match: (r, v) => (v === "has" ? Boolean(r.file) : !r.file),
  };
  const list = useList<MemoryTrickRec>({
    id: "memoryTricks",
    rows,
    search: (r) => `${r.id} ${r.title} ${r.description} ${r.file?.name ?? ""} ${subjectName(r.subject)} ${systemName(r)}`,
    filters: [subjectFilter(subjects), systemFilter(subjects, (r) => r.system, { general: true }), accessFilter(), statusFilter(), fileFilter],
    sorts: {
      title: { label: "Title", value: (r) => r.title },
      subject: { label: "Subject", value: (r) => `${subjectName(r.subject)} ${systemName(r)}` },
      updated: { label: "Updated", value: (r) => r.updatedAt },
      order: { label: "Order", value: (r) => r.order },
    },
    defaultSort: { key: "subject", dir: "asc" },
  });
  const sel = useSelection(list.filtered.map((r) => r.id));

  const columns: Column<MemoryTrickRec>[] = [
    {
      key: "title",
      label: "Title",
      sort: "title",
      render: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-ink">{r.title}</p>
          <p className="max-w-md truncate text-xs text-muted">{r.description}</p>
        </div>
      ),
    },
    { key: "subject", label: "Subject · System", sort: "subject", render: (r) => <span className="text-sm">{subjectName(r.subject)} <span className="text-muted">· {systemName(r)}</span></span> },
    { key: "access", label: "Access", render: (r) => <AccessBadge access={r.access} /> },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "file", label: "File", render: (r) => (r.file ? <span className="text-xs text-muted">{r.file.pages} p · {r.file.sizeKb} KB</span> : <Badge tone="error">Missing</Badge>) },
    { key: "updated", label: "Updated", sort: "updated", render: (r) => <span className="text-xs text-muted">{fmtDate(r.updatedAt)}</span> },
  ];

  const editing = edit.id === "new" ? null : rows.find((r) => r.id === edit.id);

  return (
    <AdminPage
      title="Memory Tricks"
      description="PDF memory-trick papers shown on each subject's Memory Tricks tab, filed under the whole subject (General) or one system."
      actions={
        <>
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "list", label: "List" },
              { value: "coverage", label: "Coverage" },
            ]}
          />
          <Btn variant="primary" onClick={() => edit.open("new")}>
            <Plus className="size-4" />
            New memory trick
          </Btn>
        </>
      }
    >
      {view === "coverage" ? (
        <Coverage
          rows={rows}
          onPick={(subject, system) => {
            setView("list");
            list.apply(new URLSearchParams({ subject, ...(system ? { system } : { system: "__general" }) }).toString());
          }}
        />
      ) : (
        <>
          <ListToolbar list={list} placeholder="Search title, hook, file name, id" />
          <BulkBar count={sel.selected.size} onClear={sel.clear}>
            <StatusBulkActions
              ids={[...sel.selected]}
              rows={rows}
              onStatus={(ids, s) => {
                if (s === "published" && ids.some((id) => !rows.find((r) => r.id === id)?.file)) return toast("Items without a PDF can't be published. Attach a file first.", "error");
                api.setStatus(ids, s);
                toast(`${ids.length} updated`);
              }}
              onAccess={(ids, a) => (api.patchMany(ids, { access: a }, a === "free" ? "Made free" : "Made premium"), toast(`${ids.length} updated`))}
              onDelete={(ids) => (api.hardDelete(ids), sel.clear(), toast(`${ids.length} deleted`))}
            />
          </BulkBar>
          <DataTable list={list} columns={columns} rowId={(r) => r.id} onRowClick={(r) => edit.open(r.id)} selection={sel} empty={<ListEmpty list={list} noun="memory tricks" onCreate={() => edit.open("new")} />} />
        </>
      )}

      {edit.id && (edit.id === "new" || editing) && <TrickEditor key={edit.id} rec={editing ?? null} onClose={edit.close} />}
    </AdminPage>
  );
}

function Coverage({ rows, onPick }: { rows: MemoryTrickRec[]; onPick: (subject: string, system: string | null) => void }) {
  const subjects = useSubjects(true);
  const live = rows.filter((r) => r.status !== "archived");
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Memory tricks per system (drafts included, archived left out). Empty cells are gaps worth filling. Click a cell to see its list.</p>
      {subjects.map((s) => {
        const n = (sys: string | null) => live.filter((r) => r.subject === s.id && r.system === sys).length;
        const cells = [{ key: null as string | null, label: "General" }, ...s.systems.map((x) => ({ key: x.key as string | null, label: x.label }))];
        const empty = cells.filter((c) => c.key !== null && !n(c.key)).length;
        return (
          <div key={s.id} className="rounded-lg border border-line bg-white p-3">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="font-semibold text-ink">{s.name}</h3>
              <span className="text-xs text-muted">
                {live.filter((r) => r.subject === s.id).length} total · {empty} empty system{empty === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cells.map((c) => {
                const count = n(c.key);
                return (
                  <button
                    key={c.label}
                    onClick={() => onPick(s.id, c.key)}
                    className={clsx(
                      "flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors hover:border-primary",
                      count ? "border-primary/25 bg-primary-light text-primary" : "border-dashed border-error/40 bg-error/5 text-error",
                    )}
                  >
                    {c.label}
                    <span className="font-bold tabular-nums">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const blank = (subject: string): MemoryTrickRec => ({
  id: newId("mt"),
  title: "",
  subject: subject as MemoryTrickRec["subject"],
  system: null,
  description: "",
  access: "free",
  status: "draft",
  order: 999,
  file: null,
  updatedAt: today(),
});

function TrickEditor({ rec, onClose }: { rec: MemoryTrickRec | null; onClose: () => void }) {
  const subjects = useSubjects(true);
  const initial = useMemo(() => rec ?? blank(subjects[0]?.id ?? "adult-health"), [rec]); // eslint-disable-line react-hooks/exhaustive-deps
  const [f, setF] = useState<MemoryTrickRec>(initial);
  const [tried, setTried] = useState(false);
  const dirty = !sameRecord(f, initial);
  useUnsavedGuard(dirty);
  const set = <K extends keyof MemoryTrickRec>(k: K, v: MemoryTrickRec[K]) => setF((x) => ({ ...x, [k]: v }));

  const errors = {
    title: !f.title.trim() ? "Add a title." : "",
    description: !f.description.trim() ? "Add the one-line hook students see under the title." : "",
    file: f.status === "published" && !f.file ? "Attach the PDF before publishing." : "",
  };
  const invalid = Object.values(errors).some(Boolean);

  const save = (status?: Status) => {
    const next = { ...f, title: f.title.trim(), description: f.description.trim(), status: status ?? f.status };
    setTried(true);
    if (!next.title || !next.description || (next.status === "published" && !next.file)) return toast("Fix the highlighted fields first.", "error");
    if (rec) api.update(next, next.status !== rec.status ? (next.status === "published" ? "publish" : next.status === "draft" ? "unpublish" : "archive") : "update");
    else api.create(next);
    toast(rec ? "Memory trick saved" : "Memory trick created");
    onClose();
  };
  const close = async () => {
    if (dirty && !(await confirmDialog({ title: "Discard changes?", body: "Your edits to this memory trick haven't been saved.", confirm: "Discard", danger: true }))) return;
    onClose();
  };

  return (
    <Drawer
      open
      onClose={close}
      title={rec ? `Edit: ${rec.title}` : "New memory trick"}
      footer={
        <>
          {rec && <HistoryButton<MemoryTrickRec> historyKey={`memoryTricks:${rec.id}`} onRestore={(v) => (api.restore(rec.id, v), onClose())} describe={(v) => `${v.title} · ${v.status}`} />}
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
        <Field label="Title" required error={tried ? errors.title : ""}>
          <Input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Fetal Heart Rate Patterns" invalid={tried && Boolean(errors.title)} autoFocus />
        </Field>
        <Field label="Hook" required hint="The memorable phrase shown under the title, e.g. “VEAL CHOP”." error={tried ? errors.description : ""}>
          <TextArea value={f.description} onChange={(e) => set("description", e.target.value)} rows={2} className="min-h-0" invalid={tried && Boolean(errors.description)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Subject" required>
            <SubjectSelect value={f.subject} onChange={(v) => setF((x) => ({ ...x, subject: v as MemoryTrickRec["subject"], system: null }))} />
          </Field>
          <Field label="System" hint="General = applies to the whole subject.">
            <SystemSelect subject={f.subject} value={f.system} onChange={(v) => set("system", v)} general="General (whole subject)" />
          </Field>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Access">
            <Segmented
              value={f.access}
              onChange={(v) => set("access", v)}
              options={[
                { value: "free", label: "Free" },
                { value: "premium", label: "Premium" },
              ]}
            />
          </Field>
          <Field label="Status">
            <StatusPicker value={f.status} onChange={(v) => set("status", v)} />
          </Field>
          <Field label="Order" hint="Lower shows first.">
            <Input type="number" value={f.order} onChange={(e) => set("order", Number(e.target.value) || 0)} className="w-24" />
          </Field>
        </div>
        <Field label="PDF" required error={tried ? errors.file : ""}>
          <FileDrop value={f.file} onChange={(v) => set("file", v)} />
        </Field>
        {invalid && tried && <p className="text-xs text-error">Some fields need attention.</p>}
      </div>
    </Drawer>
  );
}
