"use client";

/* JSON helpers shared by the import screens and the "Edit as JSON" views. */

import { AlertTriangle, CheckCircle2, Copy, XCircle } from "lucide-react";
import { Btn, TextArea, toast } from "./ui";

export const pretty = (v: unknown) => JSON.stringify(v, null, 2);

export async function copyText(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`Copied ${what}`);
  } catch {
    toast("Couldn't copy. Select the text and copy it by hand.", "error");
  }
}

export function downloadJson(data: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([pretty(data)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parse without throwing: the value, or a readable error. */
export function tryParse(text: string): { value: unknown } | { error: string } {
  try {
    return { value: JSON.parse(text) };
  } catch (e) {
    return { error: `Not valid JSON: ${e instanceof Error ? e.message : "parse error"}. Check for missing commas, quotes or brackets.` };
  }
}

/** Monospace JSON box with Copy and Format, plus the problems found in it. */
export function JsonEditor({
  value,
  onChange,
  label,
  rows = 24,
  errors = [],
  warnings = [],
  ok,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  rows?: number;
  errors?: string[];
  warnings?: string[];
  /** Message when there are no problems. */
  ok?: string;
}) {
  const format = () => {
    const p = tryParse(value);
    if ("value" in p) onChange(pretty(p.value));
    else toast(p.error, "error");
  };
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-2">
        <p className="flex-1 text-sm font-medium text-ink">{label}</p>
        <Btn variant="ghost" className="h-8" onClick={format}>
          Format
        </Btn>
        <Btn className="h-8" onClick={() => copyText(value, "JSON")}>
          <Copy className="size-3.5" />
          Copy
        </Btn>
      </div>
      <TextArea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} spellCheck={false} aria-label={label} invalid={errors.length > 0} className="font-mono text-xs" />
      <div className="mt-2 space-y-1">
        {errors.map((p) => (
          <p key={p} className="flex gap-1.5 text-xs text-error">
            <XCircle className="mt-px size-3.5 shrink-0" />
            {p}
          </p>
        ))}
        {warnings.map((p) => (
          <p key={p} className="flex gap-1.5 text-xs text-ink">
            <AlertTriangle className="mt-px size-3.5 shrink-0 text-warning" />
            {p}
          </p>
        ))}
        {!errors.length && !warnings.length && ok && (
          <p className="flex gap-1.5 text-xs text-success">
            <CheckCircle2 className="mt-px size-3.5 shrink-0" />
            {ok}
          </p>
        )}
      </div>
    </div>
  );
}
