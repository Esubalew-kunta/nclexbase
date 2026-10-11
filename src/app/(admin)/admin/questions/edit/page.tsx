"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { crud, today } from "@/lib/admin/crud";
import { newId } from "@/lib/admin/store";
import type { QuestionRec, Status } from "@/lib/admin/types";
import type { Item, ItemType } from "@/lib/types";
import { useAll, useSubjects } from "@/lib/content";
import { AdminPage, Badge, Btn, confirmDialog, EmptyState, Field, IconBtn, Input, Panel, Segmented, Select, StatusBadge, TextArea, toast, sameRecord, useUnsavedGuard } from "@/components/admin/ui";
import { HistoryButton, StatusPicker, SubjectSelect, SystemSelect } from "@/components/admin/parts";
import { AnswerSetup, blankItem, ItemPreview, TYPE_LABELS, validateItem } from "@/components/admin/items";

const api = crud("questions");

export default function QuestionEditPage() {
  const params = useSearchParams();
  const id = params.get("id") ?? "new";
  const type = (params.get("type") as ItemType) ?? "mcq";
  const rows = useAll("questions");
  const subjects = useSubjects(true);
  const existing = rows.find((r) => r.id === id);

  const initial = useMemo<QuestionRec | null>(() => {
    if (existing) return existing;
    if (id !== "new" || !TYPE_LABELS[type]) return null;
    const s = subjects[0];
    return { ...blankItem(type, { id: newId("q"), subject: s?.id ?? "adult-health", system: s?.systems[0]?.key ?? "" }), source: { kind: "standalone" }, access: "free", status: "draft", order: 999, updatedAt: today() } as QuestionRec;
  }, [existing, id, type]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!initial)
    return (
      <AdminPage title="Question not found">
        <EmptyState title="This question doesn't exist" body="It may have been deleted." action={<Link href="/admin/questions" className="font-semibold text-primary underline">Back to Question Bank</Link>} />
      </AdminPage>
    );
  return <Editor key={initial.id} initial={initial} isNew={!existing} />;
}

function Editor({ initial, isNew }: { initial: QuestionRec; isNew: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState<QuestionRec>(initial);
  const cases = useAll("cases");
  const sheets = useAll("cheatSheets");
  const lessons = useAll("lessons");
  const dirty = !sameRecord(q, initial);
  useUnsavedGuard(dirty);
  const canSave = isNew || dirty;
  const problems = validateItem(q);
  const standalone = q.source.kind === "standalone";
  const caseRec = q.source.kind === "case" ? cases.find((c) => q.source.kind === "case" && c.id === q.source.caseId) : undefined;
  const set = (patch: Partial<Item> | Partial<QuestionRec>) => setQ((x) => ({ ...x, ...patch }) as QuestionRec);

  const save = (status?: Status) => {
    const next = { ...q, status: status ?? q.status } as QuestionRec;
    if (next.status === "published" && problems.length) return toast("Fix the problems listed on the right before publishing.", "error");
    if (isNew) api.create(next);
    else api.update(next, next.status !== initial.status ? (next.status === "published" ? "publish" : next.status === "draft" ? "unpublish" : "archive") : "update");
    toast(isNew ? "Question created" : "Question saved");
    if (isNew) router.replace(`/admin/questions/edit?id=${encodeURIComponent(next.id)}`);
  };

  const r = q.rationale;
  const setR = (patch: Partial<Item["rationale"]>) => set({ rationale: { ...r, ...patch } });

  return (
    <AdminPage
      back={
        <Link href="/admin/questions" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="size-4" />
          Question Bank
        </Link>
      }
      title={
        <span className="flex flex-wrap items-center gap-2">
          {isNew ? "New question" : "Edit question"}
          <Badge>{TYPE_LABELS[q.type]}</Badge>
          <StatusBadge status={q.status} />
        </span>
      }
      description={
        <>
          {q.id}
          {caseRec && (
            <>
              {" · part of "}
              <Link href={`/admin/cases/edit?id=${caseRec.id}`} className="font-semibold text-primary underline">
                {caseRec.title}
              </Link>
            </>
          )}
          {q.source.kind === "readiness" && " · part of the CAT Readiness Exam bank"}
        </>
      }
      actions={
        <>
          {!isNew && <HistoryButton<QuestionRec> historyKey={`questions:${q.id}`} onRestore={(v) => api.restore(q.id, v)} describe={(v) => `${v.status} · ${v.stem.replace(/<[^>]+>/g, "").slice(0, 40)}`} />}
          <Btn onClick={() => save("draft")} disabled={!canSave || !standalone}>
            Save draft
          </Btn>
          <Btn variant="primary" onClick={() => save(standalone ? "published" : undefined)} disabled={!canSave}>
            {standalone ? (q.status === "published" && !isNew ? "Save & keep published" : "Publish") : "Save"}
          </Btn>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
        <div className="space-y-4">
          <Panel title="Classification">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Subject" required>
                <SubjectSelect value={q.subject} onChange={(v) => set({ subject: v as Item["subject"], system: "" })} />
              </Field>
              <Field label="System" required error={!q.system ? "Pick a system." : ""}>
                <SystemSelect subject={q.subject} value={q.system || null} onChange={(v) => set({ system: v ?? "" })} general="Choose…" />
              </Field>
              <Field label="Topic" hint="Shown under the explanation, e.g. “Sepsis”.">
                <Input value={q.topic} onChange={(e) => set({ topic: e.target.value })} />
              </Field>
              <Field label="Average score (%)" hint="Shown to students as “% of students answered correctly”.">
                <Input type="number" min={0} max={100} value={q.avgPercent} onChange={(e) => set({ avgPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} />
              </Field>
              {standalone ? (
                <>
                  <Field label="Access">
                    <Segmented
                      value={q.access}
                      onChange={(v) => set({ access: v })}
                      options={[
                        { value: "free", label: "Free pool" },
                        { value: "premium", label: "Premium" },
                      ]}
                    />
                  </Field>
                  <Field label="Status">
                    <StatusPicker value={q.status} onChange={(v) => set({ status: v })} />
                  </Field>
                </>
              ) : (
                <p className="text-sm text-muted sm:col-span-2">Access and publishing follow the {q.source.kind === "case" ? "case study" : "readiness exam"} this question belongs to.</p>
              )}
            </div>
          </Panel>

          <Panel title="Question">
            <div className="space-y-3">
              <Field label="Lead-in (optional)" hint="A sentence shown above the stem, e.g. the client's situation.">
                <TextArea value={q.lead ?? ""} onChange={(e) => set({ lead: e.target.value || undefined })} rows={2} className="min-h-0" />
              </Field>
              {q.type !== "highlightText" && (
                <Field label="Stem" required hint="HTML allowed: <b>, <i>, <br>.">
                  <TextArea value={q.stem} onChange={(e) => set({ stem: e.target.value })} rows={3} />
                </Field>
              )}
            </div>
          </Panel>

          <Panel title="Answer" description={TYPE_LABELS[q.type]}>
            <AnswerSetup item={q} set={(p) => set(p)} />
          </Panel>

          <Panel title="Rationale" description="Shown after the student submits (tutor mode) and in review.">
            <div className="space-y-3">
              <Field label="Explanation" required hint="HTML allowed.">
                <TextArea value={r.explanation} onChange={(e) => setR({ explanation: e.target.value })} rows={5} />
              </Field>
              <Field label="Why the other options are wrong (optional)">
                <div className="space-y-2">
                  {(r.incorrect ?? []).map((x, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={x.label} placeholder="Option" className="w-40 shrink-0" onChange={(e) => setR({ incorrect: r.incorrect!.map((y, k) => (k === i ? { ...y, label: e.target.value } : y)) })} />
                      <Input value={x.text} placeholder="Why it's wrong" onChange={(e) => setR({ incorrect: r.incorrect!.map((y, k) => (k === i ? { ...y, text: e.target.value } : y)) })} />
                      <IconBtn label="Remove" onClick={() => setR({ incorrect: r.incorrect!.filter((_, k) => k !== i) })} className="hover:text-error">
                        <Trash2 className="size-4" />
                      </IconBtn>
                    </div>
                  ))}
                  <Btn variant="ghost" className="h-8" onClick={() => setR({ incorrect: [...(r.incorrect ?? []), { label: "", text: "" }] })}>
                    <Plus className="size-3.5" />
                    Add explanation
                  </Btn>
                </div>
              </Field>
              <Field label="Key takeaways (optional)">
                <div className="space-y-2">
                  {r.takeaway.map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={t} onChange={(e) => setR({ takeaway: r.takeaway.map((y, k) => (k === i ? e.target.value : y)) })} />
                      <IconBtn label="Remove" onClick={() => setR({ takeaway: r.takeaway.filter((_, k) => k !== i) })} className="hover:text-error">
                        <Trash2 className="size-4" />
                      </IconBtn>
                    </div>
                  ))}
                  <Btn variant="ghost" className="h-8" onClick={() => setR({ takeaway: [...r.takeaway, ""] })}>
                    <Plus className="size-3.5" />
                    Add takeaway
                  </Btn>
                </div>
              </Field>
            </div>
          </Panel>

          <Panel title="Linked study material" description="Cards shown under the explanation.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Cheat sheet">
                <Select value={q.linkedSheet ?? ""} onChange={(e) => set({ linkedSheet: e.target.value || undefined })}>
                  <option value="">None</option>
                  {sheets
                    .filter((s) => s.subject === q.subject)
                    .map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Crash course video">
                <Select value={q.linkedVideo ?? ""} onChange={(e) => set({ linkedVideo: e.target.value || undefined })}>
                  <option value="">None</option>
                  {lessons
                    .filter((l) => l.course === q.subject && l.type === "video")
                    .map((l) => (
                      <option key={l.id} value={l.title}>
                        {l.title}
                      </option>
                    ))}
                </Select>
              </Field>
            </div>
          </Panel>

          {!isNew && standalone && q.status === "archived" && (
            <Panel title="Danger zone">
              <Btn
                variant="danger"
                onClick={async () => {
                  if (!(await confirmDialog({ title: "Delete this question permanently?", body: "Past test sessions that used it will show it as removed.", confirm: "Delete", danger: true }))) return;
                  api.hardDelete([q.id]);
                  router.replace("/admin/questions");
                }}
              >
                <Trash2 className="size-4" />
                Delete permanently
              </Btn>
            </Panel>
          )}
        </div>

        <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <div className={`rounded-lg border px-3 py-2.5 text-sm ${problems.length ? "border-warning/50 bg-warning/10" : "border-success/30 bg-success/10"}`}>
            {problems.length ? (
              <>
                <p className="mb-1 flex items-center gap-1.5 font-semibold text-ink">
                  <AlertTriangle className="size-4 text-warning" />
                  {problems.length} thing{problems.length === 1 ? "" : "s"} to fix before publishing
                </p>
                <ul className="list-disc pl-6 text-ink">
                  {problems.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="flex items-center gap-1.5 font-semibold text-success">
                <CheckCircle2 className="size-4" />
                Ready to publish
              </p>
            )}
          </div>
          <ItemPreview item={q} />
        </div>
      </div>
    </AdminPage>
  );
}
