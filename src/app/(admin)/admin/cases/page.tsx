"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Download, FileJson, Plus } from "lucide-react";
import { caseToJson } from "@/lib/admin/caseImport";
import { copyText, downloadJson, pretty } from "@/components/admin/json";
import { crud, today } from "@/lib/admin/crud";
import { newId } from "@/lib/admin/store";
import type { CaseRec, CaseContent } from "@/lib/admin/types";
import { useAll, useSubjects } from "@/lib/content";
import { AccessBadge, AdminPage, Badge, Btn, Dialog, Field, fmtDate, Input, StatusBadge, stripHtml, toast } from "@/components/admin/ui";
import { accessFilter, BulkBar, DataTable, ListEmpty, ListToolbar, statusFilter, useList, useSelection, type Column } from "@/components/admin/list";
import { StatusBulkActions, SubjectSelect, subjectFilter } from "@/components/admin/parts";

const api = crud("cases");

const tabText = (c: CaseContent) =>
  c.tabs
    .map((t) => (t.content.kind === "text" ? t.content.html : t.content.kind === "notes" ? t.content.entries.map((e) => e.html).join(" ") : t.content.rows.flat().join(" ")))
    .join(" ");

export default function CasesAdmin() {
  const router = useRouter();
  const rows = useAll("cases");
  const questions = useAll("questions");
  const subjects = useSubjects(true);
  const [creating, setCreating] = useState(false);
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;
  const stems = (c: CaseRec) => (c.content ? c.content.itemIds.map((id) => questions.find((q) => q.id === id)?.stem ?? "").join(" ") : "");

  const list = useList<CaseRec>({
    id: "cases",
    rows,
    search: (c) => `${c.id} ${c.number} ${c.title} ${c.content ? `${c.content.intro} ${stripHtml(tabText(c.content))} ${stripHtml(stems(c))}` : ""}`,
    filters: [
      subjectFilter(subjects),
      {
        key: "content",
        label: "Content",
        options: [
          { value: "authored", label: "Authored" },
          { value: "sample", label: "Uses the sample case" },
        ],
        match: (c, v) => (v === "authored" ? Boolean(c.content) : !c.content),
      },
      accessFilter(),
      statusFilter(),
    ],
    sorts: {
      number: { label: "#", value: (c) => c.number },
      title: { label: "Title", value: (c) => c.title },
      subject: { label: "Subject", value: (c) => subjectName(c.subject) },
      updated: { label: "Updated", value: (c) => c.updatedAt },
    },
    defaultSort: { key: "number", dir: "asc" },
  });
  const sel = useSelection(list.filtered.map((r) => r.id));
  /** Selected cases in the import format (with their questions): edit anywhere and import back to update. */
  const selectedJson = () =>
    rows
      .filter((c) => sel.selected.has(c.id))
      .map((c) => caseToJson(c, (c.content?.itemIds ?? []).map((id) => questions.find((q) => q.id === id)).filter((q): q is (typeof questions)[number] => Boolean(q))));
  const columns: Column<CaseRec>[] = [
    { key: "number", label: "#", sort: "number", render: (c) => <span className="text-muted tabular-nums">{c.number}</span>, headClassName: "w-14" },
    { key: "title", label: "Title", sort: "title", render: (c) => <span className="font-medium">{c.title}</span> },
    { key: "subject", label: "Subject", sort: "subject", render: (c) => subjectName(c.subject) },
    { key: "content", label: "Content", render: (c) => (c.content ? <Badge tone="teal">{c.content.itemIds.length} questions · {c.content.tabs.length} tabs</Badge> : <Badge>Sample case</Badge>) },
    { key: "access", label: "Access", render: (c) => <AccessBadge access={c.access} /> },
    { key: "status", label: "Status", render: (c) => <StatusBadge status={c.status} /> },
    { key: "updated", label: "Updated", sort: "updated", render: (c) => <span className="text-xs text-muted">{fmtDate(c.updatedAt)}</span> },
  ];

  return (
    <AdminPage
      title="Case Studies"
      description="Next Gen case studies: scenario tabs plus six linked questions. Rows without authored content still work for students; they replay that subject's sample case until content is written."
      actions={
        <>
          <Btn onClick={() => router.push("/admin/cases/import")}>
            <FileJson className="size-4" />
            Bulk import (JSON)
          </Btn>
          <Btn variant="primary" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            New case study
          </Btn>
        </>
      }
    >
      <ListToolbar list={list} placeholder="Search title, scenario text, question stems" />
      <BulkBar count={sel.selected.size} onClear={sel.clear}>
        <Btn onClick={() => copyText(pretty(selectedJson()), `${sel.selected.size} case stud${sel.selected.size === 1 ? "y" : "ies"} as JSON`)}>
          <Copy className="size-4" />
          Copy JSON
        </Btn>
        <Btn onClick={() => downloadJson(selectedJson(), `nclexbase-cases-${sel.selected.size}.json`)}>
          <Download className="size-4" />
          Download JSON
        </Btn>
        <StatusBulkActions
          ids={[...sel.selected]}
          rows={rows}
          onStatus={(ids, s) => (api.setStatus(ids, s), toast(`${ids.length} updated`))}
          onAccess={(ids, a) => (api.patchMany(ids, { access: a }, a === "free" ? "Made free" : "Made premium"), toast(`${ids.length} updated`))}
          onDelete={(ids) => (api.hardDelete(ids), sel.clear())}
        />
      </BulkBar>
      <DataTable list={list} columns={columns} rowId={(c) => c.id} onRowClick={(c) => router.push(`/admin/cases/edit?id=${c.id}`)} selection={sel} empty={<ListEmpty list={list} noun="case studies" onCreate={() => setCreating(true)} />} />
      {creating && <NewCaseDialog nextNumber={Math.max(0, ...rows.map((r) => r.number)) + 1} onClose={() => setCreating(false)} />}
    </AdminPage>
  );
}

function NewCaseDialog({ nextNumber, onClose }: { nextNumber: number; onClose: () => void }) {
  const router = useRouter();
  const subjects = useSubjects(true);
  const [subject, setSubject] = useState<string>(subjects[0]?.id ?? "adult-health");
  const [title, setTitle] = useState("");
  const create = () => {
    const rec: CaseRec = {
      id: newId("case"),
      number: nextNumber,
      title: title.trim() || `Case Study: ${subjects.find((s) => s.id === subject)?.name} #${nextNumber}`,
      subject: subject as CaseRec["subject"],
      access: "premium",
      status: "draft",
      order: nextNumber,
      content: { intro: "", tabs: [{ label: "Nurses' Notes", content: { kind: "notes", heading: "", entries: [{ time: "", html: "" }] } }], itemIds: [] },
      updatedAt: today(),
    };
    api.create(rec);
    router.push(`/admin/cases/edit?id=${rec.id}`);
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title="New case study"
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={create}>
            Create draft
          </Btn>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Subject">
          <SubjectSelect value={subject} onChange={setSubject} />
        </Field>
        <Field label="Title" hint={`Leave empty to use “Case Study: Subject #${nextNumber}”.`}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </Field>
      </div>
    </Dialog>
  );
}
