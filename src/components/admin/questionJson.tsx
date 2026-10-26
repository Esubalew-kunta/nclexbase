"use client";

/* Question JSON: import context, per-type samples, and the "Edit as JSON" view of the question editor. */

import { useState } from "react";
import { today } from "@/lib/admin/crud";
import { newId } from "@/lib/admin/store";
import { normalizeRow, questionToJson, SAMPLES, type ImportContext } from "@/lib/admin/questionImport";
import type { QuestionRec, SubjectRec } from "@/lib/admin/types";
import type { ItemType } from "@/lib/types";
import { getAll, useSubjects } from "@/lib/content";
import { blankItem, validateItem } from "./items";
import { JsonEditor, pretty, tryParse } from "./json";

/** Samples use real subjects; if the admin renamed or removed one, fall back to the first subject and system. */
export function sampleFor(type: ItemType, subjects: SubjectRec[]) {
  const s = SAMPLES[type];
  const subject = subjects.find((x) => x.id === s.subject);
  if (subject?.systems.some((y) => y.key === s.system)) return s;
  const fallback = subject ?? subjects[0];
  return { ...s, subject: fallback?.id ?? s.subject, system: fallback?.systems[0]?.key ?? s.system };
}

/** Builds a fresh context on each call, so checks see the bank as it is right now. */
export function useImportContext(): () => ImportContext {
  const subjects = useSubjects(true);
  return () => ({
    subjects,
    existing: new Map(getAll("questions").map((q) => [q.id, q])),
    newId: () => newId("q"),
    blank: blankItem,
    validate: validateItem,
    today: today(),
  });
}

/**
 * The question as JSON. Every valid edit is applied to the editor straight away (so the
 * preview follows); invalid JSON just shows its problems until it is fixed.
 */
export function QuestionJsonEditor({ q, onChange }: { q: QuestionRec; onChange: (rec: QuestionRec) => void }) {
  const context = useImportContext();
  const [text, setText] = useState(() => pretty(questionToJson(q)));
  const [result, setResult] = useState<{ errors: string[]; warnings: string[] }>({ errors: [], warnings: [] });

  const edit = (next: string) => {
    setText(next);
    const p = tryParse(next);
    if ("error" in p) return setResult({ errors: [p.error], warnings: [] });
    const r = normalizeRow(p.value, context(), new Set(), { lockId: q.id });
    setResult({ errors: r.errors, warnings: r.warnings });
    // Things the JSON doesn't carry stay as they are in the editor.
    if (r.rec) onChange({ ...r.rec, source: q.source, order: q.order, video: q.video, updatedAt: q.updatedAt } as QuestionRec);
  };

  return (
    <JsonEditor
      label="Question JSON"
      value={text}
      onChange={edit}
      rows={30}
      errors={result.errors}
      warnings={result.warnings}
      ok="Valid. Changes show in the preview; click Save to keep them."
    />
  );
}
