"use client";

import clsx from "clsx";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, Copy, Download, FileUp, Pencil, Trash2, XCircle } from "lucide-react";
import { CASE_FIELDS, CASE_SAMPLE, normalizeCase, parseCases, type CaseContext, type CaseImportRow } from "@/lib/admin/caseImport";
import type { SubjectRec } from "@/lib/admin/types";
import { useSubjects } from "@/lib/content";
import { AdminPage, Badge, Btn, confirmDialog, Dialog, IconBtn, Panel, TextArea, toast, useUnsavedGuard } from "@/components/admin/ui";
import { TickBox } from "@/components/admin/list";
import { copyText, downloadJson, JsonEditor, pretty, tryParse } from "@/components/admin/json";
import { CasePreview, saveCaseRows, useCaseContext } from "@/components/admin/caseJson";

/** The sample uses a real subject and system; fall back to the first ones if the admin changed them. */
function caseSample(subjects: SubjectRec[]) {
  const s = subjects.find((x) => x.id === CASE_SAMPLE.subject) ?? subjects[0];
  const system = s?.systems.find((y) => y.key === CASE_SAMPLE.system)?.key ?? s?.systems[0]?.key ?? CASE_SAMPLE.system;
  return { ...CASE_SAMPLE, subject: s?.id ?? CASE_SAMPLE.subject, system, questions: CASE_SAMPLE.questions.map((q) => ("system" in q ? { ...q, system } : q)) };
}

/** Check every case again (question ids can clash across cases). */
function buildRows(raws: unknown[], ctx: CaseContext, include?: boolean[]): CaseImportRow[] {
  const seen = { cases: new Set<string>(), questions: new Set<string>() };
  return raws.map((raw, i) => {
    const r = normalizeCase(raw, ctx, seen);
    return { ...r, include: r.rec ? (include?.[i] ?? true) : false };
  });
}

export default function ImportCasesPage() {
  const router = useRouter();
  const subjects = useSubjects(true);
  const context = useCaseContext();
  const [text, setText] = useState("");
  const [parseError, setParseError] = useState("");
  const [rows, setRows] = useState<CaseImportRow[] | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const file = useRef<HTMLInputElement>(null);
  useUnsavedGuard(Boolean(text.trim()) || Boolean(rows?.length));

  const preview = () => {
    const parsed = parseCases(text);
    if ("error" in parsed) {
      setParseError(parsed.error);
      setRows(null);
      return;
    }
    setParseError("");
    if (!parsed.items.length) return setParseError("The list is empty.");
    setRows(buildRows(parsed.items, context()));
  };
  const setRaws = (raws: unknown[], include: boolean[]) => setRows(buildRows(raws, context(), include));

  const loadFile = async (f: File | undefined) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".json")) return toast("Choose a .json file.", "error");
    setText(await f.text());
    setRows(null);
    setParseError("");
    toast(`Loaded ${f.name}. Click “Preview import” to check it.`);
  };

  const counts = useMemo(() => {
    const r = rows ?? [];
    const chosen = r.filter((x) => x.include && x.rec);
    return {
      total: r.length,
      errors: r.filter((x) => !x.rec).length,
      chosen: chosen.length,
      updates: chosen.filter((x) => x.mode === "update").length,
      published: chosen.filter((x) => x.rec!.status === "published").length,
      questions: chosen.reduce((n, x) => n + x.questions.length, 0),
    };
  }, [rows]);

  const runImport = async () => {
    if (!rows || !counts.chosen) return;
    const skipped = rows.length - counts.chosen;
    const ok = await confirmDialog({
      title: `Import ${counts.chosen} case stud${counts.chosen === 1 ? "y" : "ies"}?`,
      body: `${counts.chosen - counts.updates} new, ${counts.updates} updated, ${counts.questions} questions in total${skipped ? `, ${skipped} skipped` : ""}. Updated cases keep their old version in History.`,
      confirm: "Import",
    });
    if (!ok) return;
    const fresh = buildRows(
      rows.map((r) => r.raw),
      context(),
      rows.map((r) => r.include),
    );
    const chosen = fresh.filter((r) => r.include && r.rec);
    if (chosen.length !== counts.chosen) {
      setRows(fresh);
      return toast("Some cases changed while you were reviewing. Check the list and try again.", "error");
    }
    const res = saveCaseRows(chosen, "from JSON");
    toast(`Saved ${res.created + res.updated} case stud${res.created + res.updated === 1 ? "y" : "ies"} with ${res.questions} questions`);
    setText("");
    setRows(null);
    router.push("/admin/cases?sort=updated&dir=desc");
  };

  const row = editing != null && rows ? rows[editing] : null;
  const sample = pretty([caseSample(subjects)]);

  return (
    <AdminPage
      back={
        <Link href="/admin/cases" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="size-4" />
          Case Studies
        </Link>
      }
      title="Bulk import case studies"
      description="Each case study is one JSON object: details, scenario tabs and its questions. Review and fix them here, then import. Nothing is saved until you click Import. A case id that already exists updates that case."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
        <Panel
          title="1. Paste or upload JSON"
          description="A list of case studies: [ { … }, { … } ]."
          actions={
            <Btn onClick={() => file.current?.click()}>
              <FileUp className="size-4" />
              Upload .json
            </Btn>
          }
        >
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={20}
            spellCheck={false}
            placeholder={'[\n  {\n    "title": "…",\n    "subject": "adult-health",\n    "tabs": [ … ],\n    "questions": [ … ]\n  }\n]'}
            aria-label="Case studies JSON"
            invalid={Boolean(parseError)}
            className="font-mono text-xs"
          />
          {parseError && <p className="mt-2 text-sm text-error">{parseError}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Btn variant="primary" onClick={preview} disabled={!text.trim()}>
              Preview import
            </Btn>
            <Btn variant="ghost" onClick={() => setText(sample)}>
              Fill with the sample case
            </Btn>
            {text && (
              <Btn
                variant="ghost"
                onClick={() => {
                  setText("");
                  setRows(null);
                  setParseError("");
                }}
              >
                Clear
              </Btn>
            )}
          </div>
          <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => (void loadFile(e.target.files?.[0]), (e.target.value = ""))} />
        </Panel>

        <Panel
          title="JSON format"
          description={
            <>
              One complete case study. Questions use the same format as the{" "}
              <Link href="/admin/questions/import" className="font-semibold text-primary underline">
                question import
              </Link>{" "}
              (samples for every type are there).
            </>
          }
          actions={
            <div className="flex gap-2">
              <Btn onClick={() => copyText(sample, "sample case")}>
                <Copy className="size-4" />
                Copy
              </Btn>
              <Btn onClick={() => downloadJson([caseSample(subjects)], "nclexbase-case-template.json")}>
                <Download className="size-4" />
                Template
              </Btn>
            </div>
          }
        >
          <pre className="max-h-[340px] overflow-auto rounded-md border border-line bg-background p-3 font-mono text-xs leading-5 break-words whitespace-pre-wrap text-ink">{sample}</pre>
          <dl className="mt-3 space-y-2 text-sm">
            {CASE_FIELDS.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[90px_1fr] gap-2">
                <dt className="font-mono text-xs font-semibold text-primary">{k}</dt>
                <dd className="text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      {rows && (
        <Panel
          className="mt-4"
          title="2. Review"
          description="Click a case to see it as students will and to fix its JSON. Cases with errors can't be imported until they're fixed or removed."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {counts.updates > 0 && <Badge tone="teal">{counts.updates} updates</Badge>}
              <Badge tone="success">{counts.published} ready to publish</Badge>
              <Badge tone="warning">{counts.chosen - counts.published} as drafts</Badge>
              {counts.errors > 0 && <Badge tone="error">{counts.errors} with errors</Badge>}
            </div>
          }
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-background text-left text-xs whitespace-nowrap text-muted uppercase">
                <tr>
                  <th className="w-10 px-4 py-2">
                    <TickBox
                      label="Include every valid case"
                      checked={counts.chosen > 0 && counts.chosen === counts.total - counts.errors}
                      indeterminate={counts.chosen > 0 && counts.chosen < counts.total - counts.errors}
                      onChange={() => {
                        const on = counts.chosen < counts.total - counts.errors;
                        setRows(rows.map((r) => ({ ...r, include: Boolean(r.rec) && on })));
                      }}
                    />
                  </th>
                  <th className="w-10 px-2 py-2">#</th>
                  <th className="px-3 py-2">Case study</th>
                  <th className="px-3 py-2">Subject</th>
                  <th className="px-3 py-2">Content</th>
                  <th className="px-3 py-2">Result</th>
                  <th className="w-24 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const raw = (typeof r.raw === "object" && r.raw ? r.raw : {}) as Record<string, unknown>;
                  const list = r.rec ? r.warnings : r.errors;
                  return (
                    <tr key={i} onClick={() => setEditing(i)} className={clsx("cursor-pointer border-t border-line align-top hover:bg-primary-light/50", !r.rec && "bg-error/5")}>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {r.rec ? (
                          <TickBox label={`Include case ${i + 1}`} checked={r.include} onChange={() => setRows(rows.map((x, k) => (k === i ? { ...x, include: !x.include } : x)))} />
                        ) : (
                          <AlertTriangle className="size-4 text-error" aria-label="Has errors" />
                        )}
                      </td>
                      <td className="px-2 py-3 text-xs text-muted tabular-nums">{i + 1}</td>
                      <td className="max-w-[320px] px-3 py-3">
                        <p className="font-medium text-ink">{r.rec?.title ?? (typeof raw.title === "string" ? raw.title : <span className="text-muted italic">No title</span>)}</p>
                        {r.rec && <p className="text-xs text-muted">#{r.rec.number}</p>}
                      </td>
                      <td className="px-3 py-3">{subjects.find((s) => s.id === r.rec?.subject)?.name ?? (typeof raw.subject === "string" ? raw.subject : "—")}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {r.rec ? (
                          <Badge tone="teal">
                            {r.rec.content!.tabs.length} tabs · {r.questions.length} questions
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="max-w-[360px] px-3 py-3">
                        <div className="space-y-1">
                          {r.rec && r.mode === "update" && <Badge tone="teal">Updates {r.rec.id}</Badge>}
                          {!r.rec ? (
                            <Badge tone="error">
                              <XCircle className="size-3" />
                              Error
                            </Badge>
                          ) : r.rec.status === "published" ? (
                            <Badge tone="success">
                              <CheckCircle2 className="size-3" />
                              Ready to publish
                            </Badge>
                          ) : (
                            <Badge tone="warning">Draft</Badge>
                          )}
                          {list.slice(0, 2).map((p) => (
                            <p key={p} className={clsx("text-xs", r.rec ? "text-muted" : "text-error")}>
                              {p}
                            </p>
                          ))}
                          {list.length > 2 && <p className="text-xs text-muted">+{list.length - 2} more</p>}
                          {r.dropped.length > 0 && <p className="text-xs text-muted">{r.dropped.length} question(s) no longer listed will be archived.</p>}
                        </div>
                      </td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end">
                          <IconBtn label={`Review and edit case ${i + 1}`} onClick={() => setEditing(i)}>
                            <Pencil className="size-4" />
                          </IconBtn>
                          <IconBtn
                            label={`Remove case ${i + 1} from the import`}
                            onClick={() =>
                              setRaws(
                                rows.filter((_, k) => k !== i).map((x) => x.raw),
                                rows.filter((_, k) => k !== i).map((x) => x.include),
                              )
                            }
                            className="hover:text-error"
                          >
                            <Trash2 className="size-4" />
                          </IconBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
            <p className="text-sm text-muted">
              {counts.chosen} of {counts.total} selected · {counts.questions} questions
            </p>
            <Btn variant="primary" onClick={runImport} disabled={!counts.chosen}>
              Import {counts.chosen} case stud{counts.chosen === 1 ? "y" : "ies"}
            </Btn>
          </div>
        </Panel>
      )}

      {row && editing != null && rows && (
        <CaseDialog
          key={editing}
          index={editing}
          row={row}
          context={context}
          onClose={() => setEditing(null)}
          onSave={(raw) => {
            setRaws(
              rows.map((x, k) => (k === editing ? raw : x.raw)),
              rows.map((x) => x.include || !x.rec),
            );
            setEditing(null);
          }}
          onRemove={() => {
            setRaws(
              rows.filter((_, k) => k !== editing).map((x) => x.raw),
              rows.filter((_, k) => k !== editing).map((x) => x.include),
            );
            setEditing(null);
          }}
        />
      )}
    </AdminPage>
  );
}

function CaseDialog({ index, row, context, onClose, onSave, onRemove }: { index: number; row: CaseImportRow; context: () => CaseContext; onClose: () => void; onSave: (raw: unknown) => void; onRemove: () => void }) {
  const [draft, setDraft] = useState(() => pretty(row.raw));
  const checked = useMemo(() => {
    const p = tryParse(draft);
    if ("error" in p) return { raw: undefined, rec: null, questions: [], errors: [p.error], warnings: [] as string[] };
    return normalizeCase(p.value, context(), { cases: new Set(), questions: new Set() });
  }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps
  const changed = draft !== pretty(row.raw);
  return (
    <Dialog
      open
      onClose={onClose}
      width={1240}
      title={`Case study ${index + 1}`}
      footer={
        <>
          <Btn variant="danger" onClick={onRemove} className="mr-auto">
            <Trash2 className="size-4" />
            Remove from import
          </Btn>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => onSave(checked.raw)} disabled={!changed || checked.raw === undefined}>
            Apply changes
          </Btn>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <JsonEditor label="Case study JSON" value={draft} onChange={setDraft} rows={30} errors={checked.errors} warnings={checked.warnings} ok={checked.rec ? (checked.rec.status === "published" ? "Ready to publish." : "Valid. It will be saved as a draft.") : undefined} />
        <div className="min-w-0">
          <p className="mb-1 text-sm font-medium text-ink">Student preview</p>
          {checked.rec ? (
            <CasePreview key={draft} rec={checked.rec} questions={checked.questions.map((q) => q.rec!)} />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-line px-6 text-center text-sm text-muted">Fix the errors on the left to see the preview.</div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
