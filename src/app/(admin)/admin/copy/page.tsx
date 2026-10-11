"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { COPY, type CopyEntry } from "@/lib/admin/copy";
import { useAdminStore } from "@/lib/admin/store";
import { useConfig } from "@/lib/content";
import { AdminPage, Badge, Btn, IconBtn, Input, TextArea, toast, useUnsavedGuard } from "@/components/admin/ui";
import { DataTable, ListEmpty, ListToolbar, useList, type Column } from "@/components/admin/list";

type Row = CopyEntry & { value: string; changed: boolean };

/** Every editable piece of page text (registry: lib/admin/copy.ts). Edits are saved together. */
export default function CopyAdmin() {
  const saved = useConfig().copy;
  const [draft, setDraft] = useState<Record<string, string>>(saved);
  const [base, setBase] = useState(saved);
  if (base !== saved) {
    setBase(saved);
    setDraft(saved);
  }
  const dirtyKeys = COPY.filter((c) => (draft[c.key] ?? c.default) !== (saved[c.key] ?? c.default)).map((c) => c.key);
  useUnsavedGuard(dirtyKeys.length > 0);

  const rows: Row[] = useMemo(() => COPY.map((c) => ({ ...c, value: draft[c.key] ?? c.default, changed: (draft[c.key] ?? c.default) !== c.default })), [draft]);
  const pages = [...new Set(COPY.map((c) => c.page))];
  const list = useList<Row>({
    id: "copy",
    rows,
    search: (r) => `${r.page} ${r.label} ${r.key} ${r.value}`,
    filters: [
      { key: "page", label: "Page", options: pages.map((p) => ({ value: p, label: p })), match: (r, v) => r.page === v },
      {
        key: "changed",
        label: "Text",
        options: [
          { value: "custom", label: "Customised" },
          { value: "default", label: "Default" },
        ],
        match: (r, v) => (v === "custom" ? r.changed : !r.changed),
      },
    ],
    sorts: { page: { label: "Page", value: (r) => `${r.page} ${COPY.indexOf(r)}` } },
    defaultSort: { key: "page", dir: "asc" },
    pageSize: 100,
  });

  const set = (key: string, value: string, def: string) =>
    setDraft((d) => {
      const n = { ...d };
      if (value === def) delete n[key];
      else n[key] = value;
      return n;
    });

  const columns: Column<Row>[] = [
    {
      key: "where",
      label: "Where",
      sort: "page",
      headClassName: "w-56",
      render: (r) => (
        <div>
          <p className="text-sm font-medium">{r.label}</p>
          <p className="text-xs text-muted">{r.page}</p>
          {r.changed && (
            <Badge tone="gold" className="mt-1">
              Customised
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "text",
      label: "Text",
      render: (r) =>
        r.long ? (
          <TextArea value={r.value} rows={2} className="min-h-0" aria-label={r.label} onChange={(e) => set(r.key, e.target.value, r.default)} />
        ) : (
          <Input value={r.value} aria-label={r.label} onChange={(e) => set(r.key, e.target.value, r.default)} />
        ),
    },
    {
      key: "reset",
      label: "",
      headClassName: "w-12",
      render: (r) => (
        <IconBtn label="Back to default text" disabled={!r.changed} onClick={() => set(r.key, r.default, r.default)}>
          <RotateCcw className="size-4" />
        </IconBtn>
      ),
    },
  ];

  return (
    <AdminPage
      title="Pages & Copy"
      description="Titles, descriptions, banners and messages on student pages. Search or filter by page, edit, then save all changes at once."
      actions={
        <>
          <Btn onClick={() => setDraft(saved)} disabled={!dirtyKeys.length}>
            Discard
          </Btn>
          <Btn
            variant="primary"
            disabled={!dirtyKeys.length || COPY.some((c) => draft[c.key] !== undefined && !draft[c.key].trim())}
            onClick={() => {
              useAdminStore.getState().setConfig({ copy: draft }, `Updated page text (${dirtyKeys.length} item${dirtyKeys.length === 1 ? "" : "s"})`);
              toast("Page text saved");
            }}
          >
            Save {dirtyKeys.length ? `(${dirtyKeys.length})` : ""}
          </Btn>
        </>
      }
    >
      <ListToolbar list={list} placeholder="Search text, page or label" />
      <DataTable list={list} columns={columns} rowId={(r) => r.key} empty={<ListEmpty list={list} noun="texts" />} />
    </AdminPage>
  );
}
