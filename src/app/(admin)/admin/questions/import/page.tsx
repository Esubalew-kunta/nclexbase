"use client";

import clsx from "clsx";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, Copy, Download, FileUp, Pencil, Trash2, XCircle } from "lucide-react";
import { copyText, downloadJson, JsonEditor, pretty, tryParse } from "@/components/admin/json";
import { sampleFor, useImportContext } from "@/components/admin/questionJson";
import { useAdminStore } from "@/lib/admin/store";
import { COMMON_FIELDS, IMPORT_TYPES, normalizeRow, parseImport, type ImportContext, type ImportRow } from "@/lib/admin/questionImport";
import type { SubjectRec } from "@/lib/admin/types";
import type { ItemType } from "@/lib/types";
import { getAll, useSubjects } from "@/lib/content";
import { AdminPage, Badge, Btn, confirmDialog, Dialog, IconBtn, Panel, Select, stripHtml, TextArea, toast, useUnsavedGuard } from "@/components/admin/ui";
import { TickBox } from "@/components/admin/list";
import { ItemPreview, TYPE_LABELS } from "@/components/admin/items";

/** Samples use real subjects; if the admin renamed or removed one, fall back to the first subject and system. */
/** Re-check every row (ids can clash across rows, so one edit can change another row's result). */
function buildRows(raws: unknown[], ctx: ImportContext, include?: boolean[]): ImportRow[] {
  const seen = new Set<string>();
  return raws.map((raw, i) => {
    const r = normalizeRow(raw, ctx, seen);
    return { ...r, include: r.rec ? (include?.[i] ?? true) : false };
  });
}

export default function ImportQuestionsPage() {
  const router = useRouter();
  const subjects = useSubjects(true);
  const context = useImportContext();
  const [text, setText] = useState("");
  const [parseError, setParseError] = useState("");
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const file = useRef<HTMLInputElement>(null);
  useUnsavedGuard(Boolean(text.trim()) || Boolean(rows?.length));

  const preview = () => {
    const parsed = parseImport(text);
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
      published: chosen.filter((x) => x.rec!.status === "published").length,
      drafts: chosen.filter((x) => x.rec!.status !== "published").length,
      updates: chosen.filter((x) => x.mode === "update").length,
    };
  }, [rows]);

  const runImport = async () => {
    if (!rows || !counts.chosen) return;
    const skipped = rows.length - counts.chosen;
    const ok = await confirmDialog({
      title: `Import ${counts.chosen} question${counts.chosen === 1 ? "" : "s"}?`,
      body: `${counts.chosen - counts.updates} new, ${counts.updates} updated (${counts.published} published, ${counts.drafts} not published)${skipped ? `, ${skipped} skipped` : ""}. Updated questions keep their old version in History.`,
      confirm: "Import",
    });
    if (!ok) return;
    // Ids are checked again here in case the bank changed while reviewing.
    const fresh = buildRows(
      rows.map((r) => r.raw),
      context(),
      rows.map((r) => r.include),
    );
    const start = Math.max(0, ...getAll("questions").filter((q) => q.source.kind === "standalone").map((q) => q.order)) + 1;
    const chosen = fresh.filter((r) => r.include && r.rec);
    if (chosen.length !== counts.chosen) {
      setRows(fresh);
      return toast("Some rows changed while you were reviewing. Check the list and try again.", "error");
    }
    const created = chosen.filter((r) => r.mode === "create").map((r, i) => ({ ...r.rec!, order: start + i }));
    const updated = chosen.filter((r) => r.mode === "update");
    const save = useAdminStore.getState().save;
    if (created.length) save("questions", created, { action: "import", label: `Imported ${created.length} new question${created.length === 1 ? "" : "s"} from JSON` });
    if (updated.length)
      save(
        "questions",
        updated.map((r) => r.rec!),
        { action: "import", label: `Updated ${updated.length} question${updated.length === 1 ? "" : "s"} from JSON`, previous: updated.map((r) => r.previous) },
      );
    toast(`Saved ${chosen.length} question${chosen.length === 1 ? "" : "s"} (${created.length} new, ${updated.length} updated)`);
    setText("");
    setRows(null);
    router.push("/admin/questions?source=standalone&sort=updated&dir=desc");
  };

  const row = editing != null && rows ? rows[editing] : null;

  return (
    <AdminPage
      back={
        <Link href="/admin/questions" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="size-4" />
          Question Bank
        </Link>
      }
      title="Bulk import questions"
      description="Paste or upload questions as JSON, review and fix them here, then import them all at once. Nothing is saved until you click Import. Questions without an id are added as new standalone questions; an id that is already in the bank updates that question."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
        <Panel
          title="1. Paste or upload JSON"
          description="A list of questions: [ { … }, { … } ]. Use the samples on the right for the exact format of each type."
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
            placeholder={'[\n  {\n    "type": "mcq",\n    "subject": "adult-health",\n    "system": "Cardiovascular",\n    …\n  }\n]'}
            aria-label="Questions JSON"
            invalid={Boolean(parseError)}
            className="font-mono text-xs"
          />
          {parseError && <p className="mt-2 text-sm text-error">{parseError}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Btn variant="primary" onClick={preview} disabled={!text.trim()}>
              Preview import
            </Btn>
            <Btn variant="ghost" onClick={() => setText(pretty(IMPORT_TYPES.map((t) => sampleFor(t, subjects))))}>
              Fill with one sample of every type
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

        <FormatGuide subjects={subjects} />
      </div>

      {rows && (
        <Panel
          className="mt-4"
          title="2. Review"
          description="Click a row to see it as students will and to fix its JSON. Rows with errors can't be imported until they're fixed or removed."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {counts.updates > 0 && <Badge tone="teal">{counts.updates} updates</Badge>}
              <Badge tone="success">{counts.published} ready to publish</Badge>
              <Badge tone="warning">{counts.drafts} as drafts</Badge>
              {counts.errors > 0 && <Badge tone="error">{counts.errors} with errors</Badge>}
            </div>
          }
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-background text-left text-xs whitespace-nowrap text-muted uppercase">
                <tr>
                  <th className="w-10 px-4 py-2">
                    <TickBox
                      label="Include every valid row"
                      checked={counts.chosen > 0 && counts.chosen === counts.total - counts.errors}
                      indeterminate={counts.chosen > 0 && counts.chosen < counts.total - counts.errors}
                      onChange={() => {
                        const on = counts.chosen < counts.total - counts.errors;
                        setRows(rows.map((r) => ({ ...r, include: Boolean(r.rec) && on })));
                      }}
                    />
                  </th>
                  <th className="w-10 px-2 py-2">#</th>
                  <th className="px-3 py-2">Question</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Subject · System</th>
                  <th className="px-3 py-2">Result</th>
                  <th className="w-24 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <ReviewRow
                    key={i}
                    index={i}
                    row={r}
                    subjects={subjects}
                    onToggle={() => setRows(rows.map((x, k) => (k === i ? { ...x, include: !x.include } : x)))}
                    onOpen={() => setEditing(i)}
                    onRemove={() =>
                      setRaws(
                        rows.filter((_, k) => k !== i).map((x) => x.raw),
                        rows.filter((_, k) => k !== i).map((x) => x.include),
                      )
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
            <p className="text-sm text-muted">
              {counts.chosen} of {counts.total} selected
              {counts.total - counts.chosen > 0 ? ` · ${counts.total - counts.chosen} will be skipped` : ""}
            </p>
            <Btn variant="primary" onClick={runImport} disabled={!counts.chosen}>
              Import {counts.chosen} question{counts.chosen === 1 ? "" : "s"}
            </Btn>
          </div>
        </Panel>
      )}

      {row && editing != null && rows && (
        <RowDialog
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

/* ------------------------------------------------------------------ */
/* Review table row                                                    */
/* ------------------------------------------------------------------ */

function rawField(raw: unknown, key: string): string {
  const v = typeof raw === "object" && raw ? (raw as Record<string, unknown>)[key] : undefined;
  return typeof v === "string" ? v : "";
}

function ResultCell({ row }: { row: ImportRow }) {
  const list = row.rec ? row.warnings : row.errors;
  return (
    <div className="space-y-1">
      {row.rec && row.mode === "update" && <Badge tone="teal">Updates {row.rec.id}</Badge>}
      {!row.rec ? (
        <Badge tone="error">
          <XCircle className="size-3" />
          Error
        </Badge>
      ) : row.rec.status === "published" ? (
        <Badge tone="success">
          <CheckCircle2 className="size-3" />
          Ready to publish
        </Badge>
      ) : (
        <Badge tone="warning">Draft</Badge>
      )}
      {list.slice(0, 2).map((p) => (
        <p key={p} className={clsx("text-xs", row.rec ? "text-muted" : "text-error")}>
          {p}
        </p>
      ))}
      {list.length > 2 && <p className="text-xs text-muted">+{list.length - 2} more</p>}
    </div>
  );
}

function ReviewRow({ index, row, subjects, onToggle, onOpen, onRemove }: { index: number; row: ImportRow; subjects: SubjectRec[]; onToggle: () => void; onOpen: () => void; onRemove: () => void }) {
  const rec = row.rec;
  const subject = subjects.find((s) => s.id === rec?.subject);
  const type = rec?.type ?? (rawField(row.raw, "type") as ItemType);
  const stem = stripHtml(rec ? rec.stem || ("html" in rec ? rec.html : "") : rawField(row.raw, "stem") || rawField(row.raw, "html"));
  return (
    <tr onClick={onOpen} className={clsx("cursor-pointer border-t border-line align-top hover:bg-primary-light/50", !rec && "bg-error/5")}>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        {rec ? <TickBox label={`Include question ${index + 1}`} checked={row.include} onChange={onToggle} /> : <AlertTriangle className="size-4 text-error" aria-label="Has errors" />}
      </td>
      <td className="px-2 py-3 text-xs text-muted tabular-nums">{index + 1}</td>
      <td className="max-w-[360px] px-3 py-3">
        <p className="line-clamp-2 text-ink">{stem || <span className="text-muted italic">No stem</span>}</p>
        {rec && <p className="mt-0.5 text-xs text-muted">{rec.topic}</p>}
      </td>
      <td className="px-3 py-3 whitespace-nowrap">{TYPE_LABELS[type] ? <Badge>{TYPE_LABELS[type]}</Badge> : <span className="text-xs text-error">Unknown</span>}</td>
      <td className="px-3 py-3 text-sm">
        {subject ? (
          <>
            {subject.name} <span className="text-muted">· {subject.systems.find((x) => x.key === rec?.system)?.label}</span>
          </>
        ) : (
          <span className="text-muted">
            {rawField(row.raw, "subject") || "—"} · {rawField(row.raw, "system") || "—"}
          </span>
        )}
      </td>
      <td className="max-w-[320px] px-3 py-3">
        <ResultCell row={row} />
      </td>
      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end">
          <IconBtn label={`Review and edit question ${index + 1}`} onClick={onOpen}>
            <Pencil className="size-4" />
          </IconBtn>
          <IconBtn label={`Remove question ${index + 1} from the import`} onClick={onRemove} className="hover:text-error">
            <Trash2 className="size-4" />
          </IconBtn>
        </div>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/* Review / edit one row                                               */
/* ------------------------------------------------------------------ */

function RowDialog({ index, row, context, onClose, onSave, onRemove }: { index: number; row: ImportRow; context: () => ImportContext; onClose: () => void; onSave: (raw: unknown) => void; onRemove: () => void }) {
  const [draft, setDraft] = useState(() => pretty(row.raw));
  const checked = useMemo(() => {
    const p = tryParse(draft);
    if ("error" in p) return { raw: undefined, rec: null, errors: [p.error], warnings: [] as string[], mode: "create" as const };
    return normalizeRow(p.value, context(), new Set());
  }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps
  const changed = draft !== pretty(row.raw);

  return (
    <Dialog
      open
      onClose={onClose}
      width={1180}
      title={`Question ${index + 1}`}
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
        <JsonEditor
          label="Question JSON"
          value={draft}
          onChange={setDraft}
          errors={checked.errors}
          warnings={checked.warnings}
          ok={checked.rec ? `${checked.mode === "update" ? `Updates ${checked.rec.id}. ` : ""}${checked.rec.status === "published" ? "Ready to publish." : "Valid. It will be saved as a draft."}` : undefined}
        />
        <div className="min-w-0">
          <p className="mb-1 text-sm font-medium text-ink">Student preview</p>
          {checked.rec ? (
            <ItemPreview key={draft} item={checked.rec} />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-line px-6 text-center text-sm text-muted">Fix the errors on the left to see the preview.</div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Format guide: samples per type, field reference, valid subjects     */
/* ------------------------------------------------------------------ */

function FormatGuide({ subjects }: { subjects: SubjectRec[] }) {
  const [type, setType] = useState<ItemType>("mcq");
  const [tab, setTab] = useState<"sample" | "fields" | "subjects">("sample");
  const sample = pretty([sampleFor(type, subjects)]);
  const all = () => pretty(IMPORT_TYPES.map((t) => sampleFor(t, subjects)));

  const download = () => downloadJson(IMPORT_TYPES.map((t) => sampleFor(t, subjects)), "nclexbase-questions-template.json");

  return (
    <Panel
      title="JSON format"
      description="Copy a sample, replace the text with your questions, and repeat the object for each question."
      actions={
        <Btn onClick={download}>
          <Download className="size-4" />
          Template
        </Btn>
      }
    >
      <div className="mb-3 flex gap-1 rounded-md border border-line bg-background p-0.5 text-sm" role="tablist">
        {(
          [
            ["sample", "Samples by type"],
            ["fields", "Fields"],
            ["subjects", "Subjects & systems"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={clsx("flex-1 cursor-pointer rounded px-2 py-1.5 font-medium transition-colors", tab === k ? "bg-white text-primary shadow-sm" : "text-muted hover:text-ink")}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "sample" && (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Select value={type} onChange={(e) => setType(e.target.value as ItemType)} aria-label="Question type" className="w-auto min-w-[220px] flex-1">
              {IMPORT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]} ({t})
                </option>
              ))}
            </Select>
            <Btn onClick={() => copyText(sample, `${TYPE_LABELS[type]} sample`)}>
              <Copy className="size-4" />
              Copy
            </Btn>
            <Btn variant="ghost" onClick={() => copyText(all(), "all samples")}>
              Copy all types
            </Btn>
          </div>
          <pre className="max-h-[440px] overflow-auto rounded-md break-words whitespace-pre-wrap border border-line bg-background p-3 font-mono text-xs leading-5 text-ink">{sample}</pre>
        </>
      )}

      {tab === "fields" && (
        <dl className="max-h-[500px] space-y-2 overflow-auto text-sm">
          {COMMON_FIELDS.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[120px_1fr] gap-2">
              <dt className="font-mono text-xs font-semibold text-primary">{k}</dt>
              <dd className="text-muted">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {tab === "subjects" && (
        <div className="max-h-[500px] space-y-3 overflow-auto text-sm">
          {subjects.map((s) => (
            <div key={s.id}>
              <p className="font-semibold text-ink">
                {s.name} <span className="font-mono text-xs font-normal text-primary">&quot;{s.id}&quot;</span>
              </p>
              <p className="text-xs leading-5 text-muted">{s.systems.map((x) => x.label).join(" · ") || "No systems yet"}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
