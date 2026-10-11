"use client";

import { useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { crud, today } from "@/lib/admin/crud";
import { newId } from "@/lib/admin/store";
import type { CodeRec } from "@/lib/admin/types";
import { useAll } from "@/lib/content";
import { todayISO } from "@/lib/daily";
import { AdminPage, Badge, Btn, confirmDialog, Drawer, Field, fmtDate, IconBtn, Input, Segmented, toast, sameRecord, useUnsavedGuard } from "@/components/admin/ui";
import { BulkBar, DataTable, ListEmpty, ListToolbar, useEditParam, useList, useSelection, type Column } from "@/components/admin/list";
import { DeleteRecordButton, HistoryButton } from "@/components/admin/parts";

const api = crud("codes");
const state = (c: CodeRec) => (c.status === "disabled" ? "disabled" : c.expiresAt && c.expiresAt < todayISO() ? "expired" : c.used >= c.seats ? "full" : "active");
const randomCode = () => Array.from({ length: 2 }, () => Math.random().toString(36).slice(2, 6).toUpperCase()).join("-");

export default function CodesAdmin() {
  const rows = useAll("codes");
  const edit = useEditParam();
  const list = useList<CodeRec>({
    id: "codes",
    rows,
    search: (c) => `${c.code} ${c.institution}`,
    filters: [
      {
        key: "state",
        label: "State",
        options: [
          { value: "active", label: "Active" },
          { value: "full", label: "All seats used" },
          { value: "expired", label: "Expired" },
          { value: "disabled", label: "Disabled" },
        ],
        match: (c, v) => state(c) === v,
      },
    ],
    sorts: {
      code: { label: "Code", value: (c) => c.code },
      inst: { label: "Institution", value: (c) => c.institution },
      expires: { label: "Expires", value: (c) => c.expiresAt || "9999" },
      usage: { label: "Usage", value: (c) => c.used / Math.max(1, c.seats) },
    },
    defaultSort: { key: "expires", dir: "asc" },
  });
  const sel = useSelection(list.filtered.map((c) => c.id));
  const columns: Column<CodeRec>[] = [
    { key: "code", label: "Code", sort: "code", render: (c) => <span className="font-mono font-semibold">{c.code}</span> },
    { key: "inst", label: "Institution", sort: "inst", render: (c) => c.institution },
    {
      key: "usage",
      label: "Seats used",
      sort: "usage",
      render: (c) => (
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-primary-light">
            <span className={`block h-full ${c.used >= c.seats ? "bg-warning" : "bg-primary"}`} style={{ width: `${Math.min(100, (c.used / Math.max(1, c.seats)) * 100)}%` }} />
          </span>
          <span className="text-xs text-muted tabular-nums">
            {c.used} / {c.seats}
          </span>
        </div>
      ),
    },
    { key: "expires", label: "Expires", sort: "expires", render: (c) => <span className="text-sm">{c.expiresAt ? fmtDate(c.expiresAt) : "Never"}</span> },
    {
      key: "state",
      label: "State",
      render: (c) => {
        const s = state(c);
        return <Badge tone={s === "active" ? "success" : s === "full" ? "warning" : s === "expired" ? "neutral" : "error"}>{s === "full" ? "Full" : s[0].toUpperCase() + s.slice(1)}</Badge>;
      },
    },
  ];
  const editing = edit.id === "new" ? null : rows.find((c) => c.id === edit.id);
  return (
    <AdminPage
      title="Institution Codes"
      description="Codes that schools give their students. Students enter them on Account › Redeem Institutional Code to get Premium; each redemption uses a seat."
      actions={
        <Btn variant="primary" onClick={() => edit.open("new")}>
          <Plus className="size-4" />
          New code
        </Btn>
      }
    >
      <ListToolbar list={list} placeholder="Search code or institution" />
      <BulkBar count={sel.selected.size} onClear={sel.clear}>
        <Btn onClick={() => (api.patchMany([...sel.selected], { status: "disabled" }, "Disabled code"), toast("Updated"))}>Disable</Btn>
        <Btn onClick={() => (api.patchMany([...sel.selected], { status: "active" }, "Enabled code"), toast("Updated"))}>Enable</Btn>
      </BulkBar>
      <DataTable list={list} columns={columns} rowId={(c) => c.id} onRowClick={(c) => edit.open(c.id)} selection={sel} empty={<ListEmpty list={list} noun="codes" onCreate={() => edit.open("new")} />} />
      {edit.id && (edit.id === "new" || editing) && <CodeEditor key={edit.id} rec={editing ?? null} rows={rows} onClose={edit.close} />}
    </AdminPage>
  );
}

function CodeEditor({ rec, rows, onClose }: { rec: CodeRec | null; rows: CodeRec[]; onClose: () => void }) {
  const initial = useMemo<CodeRec>(() => rec ?? { id: newId("code"), code: randomCode(), institution: "", seats: 30, used: 0, expiresAt: "", status: "active", updatedAt: today() }, [rec]);
  const [f, setF] = useState(initial);
  const dirty = !sameRecord(f, initial);
  useUnsavedGuard(dirty);
  const clash = rows.some((c) => c.id !== f.id && c.code.toLowerCase() === f.code.trim().toLowerCase());
  const error = !/^[A-Z0-9-]{4,24}$/.test(f.code.trim()) ? "Use 4-24 letters, numbers or dashes." : clash ? "That code is already used." : !f.institution.trim() ? "Add the institution." : f.seats < f.used ? `At least ${f.used} seats (already used).` : "";
  const save = () => {
    if (error) return toast(error, "error");
    const next = { ...f, code: f.code.trim().toUpperCase(), institution: f.institution.trim() };
    if (rec) api.update(next);
    else api.create(next);
    toast("Code saved");
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
      title={rec ? `Code ${rec.code}` : "New institution code"}
      footer={
        <>
          {rec && <HistoryButton<CodeRec> historyKey={`codes:${rec.id}`} onRestore={(v) => (api.restore(rec.id, v), onClose())} describe={(v) => `${v.code} · ${v.seats} seats`} />}
          {rec && <DeleteRecordButton status={undefined} noun="code" onDelete={() => (api.hardDelete([rec.id]), onClose())} />}
          <span className="flex-1" />
          <Btn onClick={close}>Cancel</Btn>
          <Btn variant="primary" onClick={save}>
            Save
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Code" error={error.startsWith("Use") || clash ? error : ""} hint="Students type this exactly (not case sensitive).">
          <div className="flex gap-2">
            <Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} className="font-mono" disabled={Boolean(rec && rec.used)} />
            {!(rec && rec.used) && (
              <IconBtn label="Generate a code" onClick={() => setF({ ...f, code: randomCode() })} className="size-9 border border-line">
                <RefreshCw className="size-4" />
              </IconBtn>
            )}
          </div>
        </Field>
        <Field label="Institution" required>
          <Input value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Seats" hint={`${f.used} used`}>
            <Input type="number" min={f.used} value={f.seats} onChange={(e) => setF({ ...f, seats: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Expires" hint="Empty = never">
            <Input type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} />
          </Field>
        </div>
        <Field label="Status">
          <Segmented
            value={f.status}
            onChange={(v) => setF({ ...f, status: v })}
            options={[
              { value: "active", label: "Active" },
              { value: "disabled", label: "Disabled" },
            ]}
          />
        </Field>
        {error && !error.startsWith("Use") && !clash && <p className="text-sm text-error">{error}</p>}
      </div>
    </Drawer>
  );
}
