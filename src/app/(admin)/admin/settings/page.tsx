"use client";

import { useRef, useState } from "react";
import { Download, RotateCcw, Upload } from "lucide-react";
import { EXPERIMENTS } from "@/lib/features";
import { isStored, readStored, restoreStored } from "@/lib/admin/files";
import { useAdminStore } from "@/lib/admin/store";
import { COLLECTION_LABELS, type CollectionName } from "@/lib/admin/types";
import { todayISO } from "@/lib/daily";
import { AdminPage, Btn, confirmDialog, Dialog, Field, Input, Panel, Select, Switch, toast } from "@/components/admin/ui";
import { ConfigPanel, useConfigSection } from "@/components/admin/config";
import { ImageDrop } from "@/components/admin/parts";

const EXPORT_VERSION = 1;

/** Every IndexedDB file referenced by admin data, so exports carry the uploaded PDFs too. */
function storedUrls(value: unknown): string[] {
  const out = new Set<string>();
  JSON.stringify(value, (_, v) => {
    if (typeof v === "string" && isStored(v)) out.add(v);
    return v;
  });
  return [...out];
}

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

export default function SettingsAdmin() {
  const branding = useConfigSection("branding", "branding");
  const exam = useConfigSection("exam", "exam settings");
  const flags = useConfigSection("flags", "feature flags");
  const b = branding.draft;
  const e = exam.draft;

  return (
    <AdminPage title="Settings" description="Site-wide settings, the admin sign-in, and backups of everything the admin has changed.">
      <div className="space-y-4">
        <ConfigPanel section={branding} title="Branding & links" description="Name, links and the coach shown on score messages. Logo files are the official set and aren't changed here.">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Site name">
              <Input value={b.siteName} onChange={(x) => branding.setDraft({ ...b, siteName: x.target.value })} />
            </Field>
            <Field label="Support email">
              <Input type="email" value={b.supportEmail} onChange={(x) => branding.setDraft({ ...b, supportEmail: x.target.value })} />
            </Field>
            <Field label="Terms of Use URL">
              <Input value={b.termsUrl} onChange={(x) => branding.setDraft({ ...b, termsUrl: x.target.value })} />
            </Field>
            <Field label="Privacy Policy URL">
              <Input value={b.privacyUrl} onChange={(x) => branding.setDraft({ ...b, privacyUrl: x.target.value })} />
            </Field>
            <Field label="Coach name" hint="Shown with the coach photo next to score messages.">
              <Input value={b.coachName} onChange={(x) => branding.setDraft({ ...b, coachName: x.target.value })} />
            </Field>
            <Field label="Coach photo">
              <ImageDrop value={b.coachPhotoUrl || null} onChange={(f) => branding.setDraft({ ...b, coachPhotoUrl: f?.url ?? "" })} />
            </Field>
          </div>
        </ConfigPanel>

        <ConfigPanel section={exam} title="Exam" description="Defaults for new students (existing students keep their own settings), and the AI assistant.">
          <div className="grid gap-4 md:grid-cols-2">
            <Switch checked={e.askAi} onChange={(v) => exam.setDraft({ ...e, askAi: v })} label="Ask NCLEXBase AI" description="Show the AI box under explanations." />
            <Field label="Default text size">
              <Select value={e.defaults.textSize} onChange={(x) => exam.setDraft({ ...e, defaults: { ...e.defaults, textSize: Number(x.target.value) } })} className="w-32">
                {[14, 15, 16, 17, 18, 20, 22].map((n) => (
                  <option key={n} value={n}>
                    {n}px
                  </option>
                ))}
              </Select>
            </Field>
            {(
              [
                ["answerStats", "Answer stats", "Show how other students answered."],
                ["timer", "Timer", "Show the timer in case studies."],
                ["restrictions", "NCLEX restrictions", "Pearson-like delays; no cross-out."],
                ["shortcuts", "Keyboard shortcuts hints", ""],
                ["gridView", "Grid view in navigator", ""],
                ["hoverPreview", "Hover preview in navigator", ""],
              ] as const
            ).map(([k, label, desc]) => (
              <Switch key={k} checked={e.defaults[k]} onChange={(v) => exam.setDraft({ ...e, defaults: { ...e.defaults, [k]: v } })} label={label} description={desc} />
            ))}
          </div>
        </ConfigPanel>

        <ConfigPanel section={flags} title="Feature flags" description="Proposed features registered in lib/features.ts. Switching one on here turns it on for every student.">
          {EXPERIMENTS.length ? (
            <div className="space-y-3">
              {EXPERIMENTS.map((x) => (
                <Switch key={x.key} checked={Boolean(flags.draft[x.key])} onChange={(v) => flags.setDraft({ ...flags.draft, [x.key]: v })} label={x.name} description={x.description} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No experiments are registered yet. New features added behind a flag will appear here.</p>
          )}
        </ConfigPanel>

        <AdminAccount />
        <DataPanel />
      </div>
    </AdminPage>
  );
}

function AdminAccount() {
  const creds = useAdminStore((s) => s.credentials);
  const [email, setEmail] = useState(creds.email);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const error = !/^\S+@\S+\.\S+$/.test(email) ? "Enter a valid email." : pw && pw.length < 8 ? "Use at least 8 characters." : pw !== pw2 ? "Passwords don't match." : "";
  return (
    <Panel title="Admin sign-in" description="The single super admin account. Prototype only: stored in this browser, not encrypted. Real accounts and roles come with the backend.">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="New password" hint="Leave empty to keep the current one.">
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="Repeat new password" error={error && (pw || pw2) ? error : ""}>
          <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
        </Field>
      </div>
      <Btn
        variant="primary"
        className="mt-3"
        disabled={Boolean(error) || (email === creds.email && !pw)}
        onClick={() => {
          useAdminStore.getState().setCredentials({ email: email.trim(), password: pw || creds.password });
          useAdminStore.setState((s) => ({ session: s.session && { ...s.session, email: email.trim() } }));
          setPw("");
          setPw2("");
          toast("Sign-in updated");
        }}
      >
        Update sign-in
      </Btn>
    </Panel>
  );
}

interface ExportFile {
  app: "nclexbase-admin";
  version: number;
  exportedAt: string;
  data: ReturnType<typeof useAdminStore.getState>["data"];
  config: ReturnType<typeof useAdminStore.getState>["config"];
  files: Record<string, string>;
}

function DataPanel() {
  const data = useAdminStore((s) => s.data);
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ExportFile | null>(null);
  const edited = (Object.keys(data) as CollectionName[]).map((k) => [k, Object.keys(data[k]?.records ?? {}).length, Object.keys(data[k]?.removed ?? {}).length] as const).filter(([, a, b]) => a || b);
  const bytes = typeof window !== "undefined" ? (localStorage.getItem("nclexbase-admin")?.length ?? 0) : 0;

  const exportJson = async () => {
    const s = useAdminStore.getState();
    const files: Record<string, string> = {};
    for (const url of storedUrls({ data: s.data, config: s.config })) {
      const blob = await readStored(url);
      if (blob) files[url] = await toDataUrl(blob);
    }
    const payload: ExportFile = { app: "nclexbase-admin", version: EXPORT_VERSION, exportedAt: new Date().toISOString(), data: s.data, config: s.config, files };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `nclexbase-admin-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported (${Object.keys(files).length} uploaded file${Object.keys(files).length === 1 ? "" : "s"} included)`);
  };

  const readImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as ExportFile;
      if (parsed.app !== "nclexbase-admin" || typeof parsed.data !== "object") throw new Error();
      setPending(parsed);
    } catch {
      toast("That file isn't an NCLEXBase admin export.", "error");
    }
  };

  const applyImport = async () => {
    if (!pending) return;
    for (const [url, dataUrl] of Object.entries(pending.files ?? {})) await restoreStored(url, await (await fetch(dataUrl)).blob());
    useAdminStore.getState().importData({ data: pending.data, config: pending.config });
    setPending(null);
    toast("Import applied");
  };

  return (
    <Panel title="Data & backup" description="Everything the admin changed lives in this browser. Export it to keep a backup or move it to another computer; the same file will seed the real database later.">
      <div className="mb-4 rounded-md border border-line bg-background p-3 text-sm">
        {edited.length ? (
          <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {edited.map(([k, a, r]) => (
              <li key={k}>
                <span className="font-medium text-ink">{COLLECTION_LABELS[k]}s</span>: <span className="text-muted">{a} edited/new{r ? `, ${r} deleted` : ""}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No content changes yet; everything is the original seed.</p>
        )}
        <p className="mt-2 text-xs text-muted">Admin data size: {(bytes / 1024).toFixed(1)} KB of about 5 MB browser storage (uploaded PDFs are stored separately).</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn variant="primary" onClick={exportJson}>
          <Download className="size-4" />
          Export JSON
        </Btn>
        <Btn onClick={() => input.current?.click()}>
          <Upload className="size-4" />
          Import JSON
        </Btn>
        <Btn
          variant="danger"
          onClick={async () => {
            if (
              !(await confirmDialog({
                title: "Reset all content to the seed?",
                body: "Every admin edit, new item and setting is removed (uploaded files stay in storage). Export first if you might need it.",
                confirm: "Reset everything",
                danger: true,
                typeToConfirm: "RESET",
              }))
            )
              return;
            useAdminStore.getState().resetData();
            toast("All content reset to the seed");
          }}
        >
          <RotateCcw className="size-4" />
          Reset to seed
        </Btn>
        <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={(e) => (void readImport(e.target.files?.[0]), (e.target.value = ""))} />
      </div>
      <Dialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        title="Import admin data?"
        footer={
          <>
            <Btn onClick={() => setPending(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={applyImport}>
              Replace current data
            </Btn>
          </>
        }
      >
        {pending && (
          <div className="space-y-2 text-sm text-ink">
            <p>Exported {new Date(pending.exportedAt).toLocaleString()}. This replaces all current admin changes with:</p>
            <ul className="list-disc pl-6">
              {(Object.keys(pending.data) as CollectionName[]).map((k) => (
                <li key={k}>
                  {COLLECTION_LABELS[k]}s: {Object.keys(pending.data[k]?.records ?? {}).length} edited/new
                </li>
              ))}
              <li>{Object.keys(pending.config ?? {}).length} settings sections</li>
              <li>{Object.keys(pending.files ?? {}).length} uploaded files</li>
            </ul>
          </div>
        )}
      </Dialog>
    </Panel>
  );
}
