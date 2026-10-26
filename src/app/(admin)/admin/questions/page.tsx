"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Download, FileJson, MoveRight, Plus } from "lucide-react";
import { questionToJson } from "@/lib/admin/questionImport";
import { copyText, downloadJson, pretty } from "@/components/admin/json";
import { crud } from "@/lib/admin/crud";
import type { QuestionRec } from "@/lib/admin/types";
import type { ItemType } from "@/lib/types";
import { useAll, useSubjects } from "@/lib/content";
import { AccessBadge, AdminPage, Badge, Btn, Dialog, Field, fmtDate, StatusBadge, stripHtml, toast } from "@/components/admin/ui";
import { accessFilter, BulkBar, DataTable, ListEmpty, ListToolbar, statusFilter, useList, useSelection, type Column } from "@/components/admin/list";
import { StatusBulkActions, SubjectSelect, subjectFilter, SystemSelect, systemFilter } from "@/components/admin/parts";
import { TYPE_LABELS, validateItem } from "@/components/admin/items";

const api = crud("questions");

const optionText = (q: QuestionRec): string => {
  const parts: string[] = [];
  if ("options" in q) parts.push(...q.options);
  if ("choices" in q) parts.push(...q.choices);
  if ("rows" in q) parts.push(...q.rows.map((r) => (typeof r === "string" ? r : `${r.label} ${r.segments.join(" ")}`)));
  if (q.type === "bowtie") parts.push(...q.conditions, ...q.actions, ...q.parameters);
  if (q.type === "dropdown") parts.push(q.template, ...q.blanks.flatMap((b) => b.options));
  if (q.type === "dragCloze") parts.push(q.template);
  return parts.join(" ");
};

export default function QuestionsAdmin() {
  const router = useRouter();
  const rows = useAll("questions");
  const cases = useAll("cases");
  const subjects = useSubjects(true);
  const [creating, setCreating] = useState(useSearchParams().get("new") === "1");
  const [moving, setMoving] = useState(false);
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;
  const systemName = (q: QuestionRec) => subjects.find((s) => s.id === q.subject)?.systems.find((x) => x.key === q.system)?.label ?? q.system;
  const sourceLabel = (q: QuestionRec) => (q.source.kind === "standalone" ? "Standalone" : q.source.kind === "readiness" ? "Readiness exam" : `Case: ${cases.find((c) => q.source.kind === "case" && c.id === q.source.caseId)?.title ?? "?"}`);

  const list = useList<QuestionRec>({
    id: "questions",
    rows,
    search: (q) => `${q.id} ${stripHtml(q.lead ?? "")} ${stripHtml(q.stem)} ${optionText(q)} ${q.topic} ${stripHtml(q.rationale.explanation)}`,
    filters: [
      subjectFilter(subjects),
      systemFilter(subjects, (q) => q.system),
      { key: "type", label: "Item type", options: (Object.keys(TYPE_LABELS) as ItemType[]).map((t) => ({ value: t, label: TYPE_LABELS[t] })), match: (q, v) => q.type === v },
      {
        key: "source",
        label: "Used in",
        options: [
          { value: "standalone", label: "Standalone" },
          { value: "case", label: "Case studies" },
          { value: "readiness", label: "Readiness exams" },
        ],
        match: (q, v) => q.source.kind === v,
      },
      statusFilter(),
      accessFilter(),
      {
        key: "difficulty",
        label: "Avg score",
        options: [
          { value: "hard", label: "Hard (< 40%)" },
          { value: "medium", label: "Medium (40-70%)" },
          { value: "easy", label: "Easy (> 70%)" },
        ],
        match: (q, v) => (v === "hard" ? q.avgPercent < 40 : v === "easy" ? q.avgPercent > 70 : q.avgPercent >= 40 && q.avgPercent <= 70),
      },
      {
        key: "health",
        label: "Needs work",
        options: [
          { value: "invalid", label: "Has problems" },
          { value: "noRationale", label: "No rationale" },
          { value: "noLinks", label: "No linked sheet/video" },
        ],
        match: (q, v) => (v === "invalid" ? validateItem(q).length > 0 : v === "noRationale" ? !stripHtml(q.rationale.explanation) : !q.linkedSheet && !q.linkedVideo),
      },
    ],
    sorts: {
      id: { label: "Id", value: (q) => q.id },
      subject: { label: "Subject", value: (q) => `${subjectName(q.subject)} ${systemName(q)}` },
      avg: { label: "Avg %", value: (q) => q.avgPercent },
      updated: { label: "Updated", value: (q) => q.updatedAt },
    },
    defaultSort: { key: "updated", dir: "desc" },
  });
  const sel = useSelection(list.filtered.map((r) => r.id));
  const selectedRows = rows.filter((r) => sel.selected.has(r.id));
  const onlyStandalone = selectedRows.every((r) => r.source.kind === "standalone");
  /** Selected questions in the import format: edit them anywhere and import them back to update. */
  const selectedJson = () => selectedRows.map((q) => questionToJson(q));

  const columns: Column<QuestionRec>[] = [
    {
      key: "stem",
      label: "Question",
      sort: "id",
      render: (q) => (
        <div className="max-w-[460px]">
          <p className="line-clamp-2 text-sm">{stripHtml(q.stem) || <span className="text-muted italic">No stem</span>}</p>
          <p className="text-xs text-muted">{q.id}</p>
        </div>
      ),
    },
    { key: "type", label: "Type", render: (q) => <Badge>{TYPE_LABELS[q.type]}</Badge> },
    { key: "subject", label: "Subject · System", sort: "subject", render: (q) => <span className="text-sm">{subjectName(q.subject)} <span className="text-muted">· {systemName(q)}</span></span> },
    { key: "source", label: "Used in", render: (q) => <span className="text-xs text-muted">{sourceLabel(q)}</span> },
    { key: "access", label: "Access", render: (q) => (q.source.kind === "standalone" ? <AccessBadge access={q.access} /> : <span className="text-xs text-muted">From parent</span>) },
    { key: "status", label: "Status", render: (q) => <StatusBadge status={q.status} /> },
    { key: "avg", label: "Avg %", sort: "avg", render: (q) => <span className="tabular-nums">{q.avgPercent}%</span> },
    { key: "updated", label: "Updated", sort: "updated", render: (q) => <span className="text-xs text-muted">{fmtDate(q.updatedAt)}</span> },
  ];

  return (
    <AdminPage
      title="Question Bank"
      description="Every question: standalone, inside case studies, and in the readiness exams. Standalone questions can be added, published or archived here; case and readiness questions are edited here but belong to their case or exam."
      actions={
        <>
          <Btn onClick={() => router.push("/admin/questions/import")}>
            <FileJson className="size-4" />
            Bulk import (JSON)
          </Btn>
          <Btn variant="primary" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            New question
          </Btn>
        </>
      }
    >
      <ListToolbar list={list} placeholder="Search stem, options, rationale, topic, id" />
      <BulkBar count={sel.selected.size} onClear={sel.clear}>
        <Btn onClick={() => copyText(pretty(selectedJson()), `${sel.selected.size} question${sel.selected.size === 1 ? "" : "s"} as JSON`)}>
          <Copy className="size-4" />
          Copy JSON
        </Btn>
        <Btn onClick={() => downloadJson(selectedJson(), `nclexbase-questions-${sel.selected.size}.json`)}>
          <Download className="size-4" />
          Download JSON
        </Btn>
        {onlyStandalone ? (
          <>
            <StatusBulkActions
              ids={[...sel.selected]}
              rows={rows}
              onStatus={(ids, s) => {
                const bad = ids.filter((id) => s === "published" && validateItem(rows.find((r) => r.id === id)!).length);
                if (bad.length) return toast(`${bad.length} selected question${bad.length === 1 ? " has" : "s have"} problems. Open them and fix before publishing.`, "error");
                api.setStatus(ids, s);
                toast(`${ids.length} updated`);
              }}
              onAccess={(ids, a) => (api.patchMany(ids, { access: a }, a === "free" ? "Made free" : "Made premium"), toast(`${ids.length} updated`))}
              onDelete={(ids) => (api.hardDelete(ids), sel.clear())}
            />
            <Btn onClick={() => setMoving(true)}>
              <MoveRight className="size-4" />
              Move to system
            </Btn>
          </>
        ) : (
          <span className="text-sm text-muted">Bulk changes apply to standalone questions only. Narrow the selection with “Used in: Standalone”.</span>
        )}
      </BulkBar>
      <DataTable
        list={list}
        columns={columns}
        rowId={(q) => q.id}
        onRowClick={(q) => router.push(`/admin/questions/edit?id=${encodeURIComponent(q.id)}`)}
        selection={sel}
        empty={<ListEmpty list={list} noun="questions" onCreate={() => setCreating(true)} />}
      />
      {creating && <NewQuestionDialog onClose={() => setCreating(false)} />}
      {moving && <MoveDialog ids={[...sel.selected]} onClose={() => setMoving(false)} onDone={sel.clear} />}
    </AdminPage>
  );
}

function NewQuestionDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [type, setType] = useState<ItemType>("mcq");
  const choices = (Object.keys(TYPE_LABELS) as ItemType[]).filter((t) => t !== "highlightText");
  return (
    <Dialog
      open
      onClose={onClose}
      title="New standalone question"
      width={560}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => router.push(`/admin/questions/edit?id=new&type=${type}`)}>
            Continue
          </Btn>
        </>
      }
    >
      <p className="mb-3 text-sm text-muted">Pick the item type. It can&apos;t be changed later, because the answer format depends on it.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {choices.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`cursor-pointer rounded-md border px-3 py-2 text-left text-sm transition-colors ${type === t ? "border-primary bg-primary-light font-semibold text-primary" : "border-line hover:border-faint"}`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>
    </Dialog>
  );
}

function MoveDialog({ ids, onClose, onDone }: { ids: string[]; onClose: () => void; onDone: () => void }) {
  const subjects = useSubjects(true);
  const [subject, setSubject] = useState<string>(subjects[0]?.id ?? "");
  const [system, setSystem] = useState<string | null>(subjects[0]?.systems[0]?.key ?? null);
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Move ${ids.length} question${ids.length === 1 ? "" : "s"}`}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn
            variant="primary"
            disabled={!system}
            onClick={() => {
              api.patchMany(ids, { subject: subject as QuestionRec["subject"], system: system! }, "Moved to another system");
              toast(`${ids.length} moved`);
              onDone();
              onClose();
            }}
          >
            Move
          </Btn>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Subject">
          <SubjectSelect
            value={subject}
            onChange={(v) => {
              setSubject(v);
              setSystem(subjects.find((s) => s.id === v)?.systems[0]?.key ?? null);
            }}
          />
        </Field>
        <Field label="System">
          <SystemSelect subject={subject} value={system} onChange={setSystem} />
        </Field>
      </div>
    </Dialog>
  );
}
