"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { CHEAT_SHEET_SUBJECT_SYSTEMS, CHEAT_SHEET_SYSTEMS } from "@/data/catalog";
import { crud, today } from "@/lib/admin/crud";
import { newId } from "@/lib/admin/store";
import type { CheatSheetRec, Status } from "@/lib/admin/types";
import { useAll, useSubjects } from "@/lib/content";
import { AccessBadge, AdminPage, Badge, Btn, confirmDialog, Drawer, Field, fmtDate, Input, Segmented, StatusBadge, toast, sameRecord, useUnsavedGuard } from "@/components/admin/ui";
import { accessFilter, BulkBar, DataTable, ListEmpty, ListToolbar, statusFilter, useEditParam, useList, useSelection, type Column, type FilterDef } from "@/components/admin/list";
import { FileDrop, HistoryButton, StatusBulkActions, StatusPicker, SubjectSelect, subjectFilter } from "@/components/admin/parts";

const api = crud("cheatSheets");

export default function CheatSheetsAdmin() {
  const rows = useAll("cheatSheets");
  const subjects = useSubjects(true);
  const edit = useEditParam();
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;
  const allTags = useMemo(() => [...new Set([...CHEAT_SHEET_SYSTEMS, ...rows.flatMap((r) => r.systems)])].sort(), [rows]);

  const tagFilter: FilterDef<CheatSheetRec> = {
    key: "tag",
    label: "System tag",
    options: allTags.map((t) => ({ value: t, label: t })),
    match: (r, v) => r.systems.includes(v) || r.subjectSystems.includes(v),
  };
  const fileFilter: FilterDef<CheatSheetRec> = {
    key: "file",
    label: "File",
    options: [
      { value: "has", label: "PDF attached" },
      { value: "missing", label: "No PDF (placeholder)" },
    ],
    match: (r, v) => (v === "has" ? Boolean(r.file) : !r.file),
  };
  const list = useList<CheatSheetRec>({
    id: "cheatSheets",
    rows,
    search: (r) => `${r.id} ${r.title} ${subjectName(r.subject)} ${r.systems.join(" ")} ${r.subjectSystems.join(" ")} ${r.file?.name ?? ""}`,
    filters: [subjectFilter(subjects), tagFilter, accessFilter(), statusFilter(), fileFilter],
    sorts: {
      title: { label: "Title", value: (r) => r.title },
      subject: { label: "Subject", value: (r) => subjectName(r.subject) },
      updated: { label: "Updated", value: (r) => r.updatedAt },
    },
    defaultSort: { key: "subject", dir: "asc" },
  });
  const sel = useSelection(list.filtered.map((r) => r.id));

  const columns: Column<CheatSheetRec>[] = [
    { key: "title", label: "Title", sort: "title", render: (r) => <span className="font-medium">{r.title}</span> },
    { key: "subject", label: "Subject", sort: "subject", render: (r) => subjectName(r.subject) },
    {
      key: "tags",
      label: "System tags",
      render: (r) => (
        <div className="flex max-w-xs flex-wrap gap-1">
          {[...new Set([...r.systems, ...r.subjectSystems])].slice(0, 3).map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
          {new Set([...r.systems, ...r.subjectSystems]).size > 3 && <Badge>+{new Set([...r.systems, ...r.subjectSystems]).size - 3}</Badge>}
        </div>
      ),
    },
    { key: "access", label: "Access", render: (r) => <AccessBadge access={r.access} /> },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "file", label: "PDF", render: (r) => (r.file ? <span className="text-xs text-muted">{r.file.pages} p · {r.file.sizeKb} KB</span> : <span className="text-xs text-muted">Placeholder</span>) },
    { key: "updated", label: "Updated", sort: "updated", render: (r) => <span className="text-xs text-muted">{fmtDate(r.updatedAt)}</span> },
  ];
  const editing = edit.id === "new" ? null : rows.find((r) => r.id === edit.id);

  return (
    <AdminPage
      title="Cheat Sheets"
      description="Printable sheets on the Cheat Sheets page and each subject's Cheat Sheets tab. Sheets without a PDF show the template placeholder to students."
      actions={
        <Btn variant="primary" onClick={() => edit.open("new")}>
          <Plus className="size-4" />
          New cheat sheet
        </Btn>
      }
    >
      <ListToolbar list={list} placeholder="Search title, subject, tag, id" />
      <BulkBar count={sel.selected.size} onClear={sel.clear}>
        <StatusBulkActions
          ids={[...sel.selected]}
          rows={rows}
          onStatus={(ids, s) => (api.setStatus(ids, s), toast(`${ids.length} updated`))}
          onAccess={(ids, a) => (api.patchMany(ids, { access: a }, a === "free" ? "Made free" : "Made premium"), toast(`${ids.length} updated`))}
          onDelete={(ids) => (api.hardDelete(ids), sel.clear(), toast(`${ids.length} deleted`))}
        />
      </BulkBar>
      <DataTable list={list} columns={columns} rowId={(r) => r.id} onRowClick={(r) => edit.open(r.id)} selection={sel} empty={<ListEmpty list={list} noun="cheat sheets" onCreate={() => edit.open("new")} />} />
      {edit.id && (edit.id === "new" || editing) && <SheetEditor key={edit.id} rec={editing ?? null} onClose={edit.close} tagOptions={allTags} />}
    </AdminPage>
  );
}

/** Free-text tag input with suggestions. */
function TagInput({ value, onChange, suggestions }: { value: string[]; onChange: (v: string[]) => void; suggestions: string[] }) {
  const [text, setText] = useState("");
  const add = (t: string) => {
    const v = t.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setText("");
  };
  const open = suggestions.filter((s) => !value.includes(s) && (!text || s.toLowerCase().includes(text.toLowerCase()))).slice(0, 8);
  return (
    <div className="rounded-md border border-line bg-white p-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary-light py-0.5 pr-1 pl-2 text-xs font-semibold text-primary">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="cursor-pointer rounded-full p-0.5 hover:bg-white">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(text);
            }
            if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
          }}
          placeholder={value.length ? "" : "Type a system and press Enter"}
          className="min-w-[160px] flex-1 text-sm outline-none"
        />
      </div>
      {open.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 border-t border-line pt-2">
          {open.map((s) => (
            <button type="button" key={s} onClick={() => add(s)} className="cursor-pointer rounded-full border border-line px-2 py-0.5 text-xs text-muted hover:border-primary hover:text-primary">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SheetEditor({ rec, onClose, tagOptions }: { rec: CheatSheetRec | null; onClose: () => void; tagOptions: string[] }) {
  const subjects = useSubjects(true);
  const initial = useMemo<CheatSheetRec>(
    () =>
      rec ?? {
        id: newId("cs"),
        title: "",
        subject: subjects[0]?.id ?? "adult-health",
        systems: [],
        subjectSystems: [],
        access: "premium",
        status: "draft",
        order: 999,
        file: null,
        updatedAt: today(),
      },
    [rec], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [f, setF] = useState(initial);
  const [tried, setTried] = useState(false);
  const dirty = !sameRecord(f, initial);
  useUnsavedGuard(dirty);
  const set = <K extends keyof CheatSheetRec>(k: K, v: CheatSheetRec[K]) => setF((x) => ({ ...x, [k]: v }));
  const subjectChips = [...new Set([...(CHEAT_SHEET_SUBJECT_SYSTEMS[f.subject] ?? []), ...(subjects.find((s) => s.id === f.subject)?.systems.map((s) => s.label) ?? [])])];

  const save = (status?: Status) => {
    setTried(true);
    const next = { ...f, title: f.title.trim(), status: status ?? f.status };
    if (!next.title) return toast("Add a title first.", "error");
    if (rec) api.update(next, next.status !== rec.status ? (next.status === "published" ? "publish" : next.status === "draft" ? "unpublish" : "archive") : "update");
    else api.create(next);
    toast(rec ? "Cheat sheet saved" : "Cheat sheet created");
    onClose();
  };
  const close = async () => {
    if (dirty && !(await confirmDialog({ title: "Discard changes?", body: "Your edits haven't been saved.", confirm: "Discard", danger: true }))) return;
    onClose();
  };

  return (
    <Drawer
      open
      onClose={close}
      title={rec ? `Edit: ${rec.title}` : "New cheat sheet"}
      footer={
        <>
          {rec && <HistoryButton<CheatSheetRec> historyKey={`cheatSheets:${rec.id}`} onRestore={(v) => (api.restore(rec.id, v), onClose())} describe={(v) => v.title} />}
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
        <Field label="Title" required error={tried && !f.title.trim() ? "Add a title." : ""}>
          <Input value={f.title} onChange={(e) => set("title", e.target.value)} autoFocus invalid={tried && !f.title.trim()} />
        </Field>
        <Field label="Subject" required>
          <SubjectSelect value={f.subject} onChange={(v) => set("subject", v as CheatSheetRec["subject"])} />
        </Field>
        <Field label="Subject tab chips" hint="Filter chips this sheet appears under on the subject's Cheat Sheets tab.">
          <TagInput value={f.subjectSystems} onChange={(v) => set("subjectSystems", v)} suggestions={subjectChips} />
        </Field>
        <Field label="All-sheets page chips" hint="Filter chips on the main Cheat Sheets page (shared across subjects).">
          <TagInput value={f.systems} onChange={(v) => set("systems", v)} suggestions={tagOptions} />
        </Field>
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
        </div>
        <Field label="PDF" hint="Optional for now: without a file, students see the cheatsheet template placeholder.">
          <FileDrop value={f.file} onChange={(v) => set("file", v)} />
        </Field>
        <p className={clsx("text-xs text-muted")}>Id: {f.id}</p>
      </div>
    </Drawer>
  );
}
