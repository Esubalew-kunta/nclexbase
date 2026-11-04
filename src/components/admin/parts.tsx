"use client";

/* Pieces shared by several admin editors: file upload, version history, taxonomy pickers, bulk actions. */

import clsx from "clsx";
import { useRef, useState, type ReactNode } from "react";
import { Archive, FileText, History, Trash2, UploadCloud } from "lucide-react";
import { deleteStored, MAX_IMAGE_MB, MAX_UPLOAD_MB, storeImage, storePdf, storeVideo, useFileUrl, videoAccept, videoLimitMb } from "@/lib/admin/files";
import { apiMode } from "@/lib/api/client";
import { parseVideoLink, VIDEO_LINK_MESSAGE, type ParsedVideoLink } from "@/lib/videoLink";
import { VideoPlayer } from "@/components/exam/VideoPlayer";
import type { ExplanationVideo } from "@/lib/types";
import { useAdminStore } from "@/lib/admin/store";
import type { Access, FileRef, Status, SubjectRec } from "@/lib/admin/types";
import { useSubjects } from "@/lib/content";
import { PdfFrame } from "@/components/ui/files";
import { Btn, confirmDialog, Dialog, fmtDateTime, Input, Segmented, Select, toast } from "./ui";
import type { FilterDef } from "./list";

const NO_VERSIONS: never[] = [];

/* ------------------------------------------------------------------ */
/* PDF upload                                                          */
/* ------------------------------------------------------------------ */

export function FileDrop({ value, onChange }: { value: FileRef | null; onChange: (f: FileRef | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  const take = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const ref = await storePdf(file);
      onChange(ref);
      toast(`Uploaded ${file.name}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3 rounded-md border border-line bg-background p-3">
          <span className="flex h-11 w-9 shrink-0 flex-col items-center justify-center rounded border border-primary/20 bg-primary-light text-primary">
            <FileText className="size-4" />
            <span className="text-[8px] font-bold">PDF</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{value.name}</p>
            <p className="text-xs text-muted">
              {value.pages ? `${value.pages} page${value.pages === 1 ? "" : "s"} · ` : ""}
              {value.sizeKb ? `${value.sizeKb} KB · ` : ""}
              {value.url.startsWith("idb:") ? "Uploaded" : "Seed file"}
            </p>
          </div>
          <Btn onClick={() => setPreview(true)}>Preview</Btn>
          <Btn onClick={() => input.current?.click()}>Replace</Btn>
          <Btn
            variant="danger"
            onClick={async () => {
              if (!(await confirmDialog({ title: "Remove this file?", body: "Students won't see this item until a new PDF is attached.", confirm: "Remove file", danger: true }))) return;
              await deleteStored(value.url);
              onChange(null);
            }}
          >
            Remove
          </Btn>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => (e.preventDefault(), setOver(true))}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            void take(e.dataTransfer.files[0]);
          }}
          className={clsx(
            "flex w-full cursor-pointer flex-col items-center rounded-md border-2 border-dashed px-4 py-7 text-center transition-colors",
            over ? "border-primary bg-primary-light" : "border-line bg-background hover:border-primary/50",
          )}
        >
          <UploadCloud className="mb-2 size-7 text-primary" />
          <span className="text-sm font-semibold text-ink">{busy ? "Uploading…" : "Drop a PDF here or click to choose"}</span>
          <span className="mt-0.5 text-xs text-muted">PDF only, up to {MAX_UPLOAD_MB} MB. Page count is read automatically.</span>
        </button>
      )}
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
      <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => (void take(e.target.files?.[0]), (e.target.value = ""))} />
      <Dialog open={preview && Boolean(value)} onClose={() => setPreview(false)} title={value?.name ?? ""} width={900}>
        {value && <PdfFrame file={value} title={value.name} className="h-[65dvh]" />}
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Video (question explanation videos): upload a file, or add a link   */
/* ------------------------------------------------------------------ */

/** What a link is called in the panel. Worked out from the address, never stored: the server keeps only the address. */
const linkLabel = (l: ParsedVideoLink | null) => (l?.provider === "youtube" ? "YouTube video" : l?.provider === "vimeo" ? "Vimeo video" : "Video file");

export function VideoDrop({ value, onChange }: { value: ExplanationVideo | undefined; onChange: (v: ExplanationVideo | undefined) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  // Which way a new video is added, and whether an existing link is being changed.
  const [how, setHow] = useState<"upload" | "link">("upload");
  const [editingLink, setEditingLink] = useState(false);
  const [text, setText] = useState("");
  const isLink = value?.kind === "link";
  const limit = videoLimitMb();

  const take = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setProgress(null);
    setError("");
    try {
      // A replaced video keeps its visibility; a first upload starts visible.
      onChange({ ...(await storeVideo(file, setProgress)), visible: value?.visible ?? true });
      toast(`Uploaded ${file.name}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const addLink = () => {
    const link = parseVideoLink(text);
    if (!link) return setError(`That link can't be used. ${VIDEO_LINK_MESSAGE}`);
    setError("");
    // `name` is the address, the same value the server gives back, so a saved record equals the edited one.
    onChange({ kind: "link", url: link.url, provider: link.provider, embedUrl: link.embedUrl, name: link.url, sizeKb: 0, visible: value?.visible ?? true });
    setText("");
    setEditingLink(false);
    toast("Link added");
  };

  const uploading = busy ? (progress !== null ? `Uploading ${Math.round(progress * 100)}%` : "Uploading…") : null;

  const linkForm = (
    <div>
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => (setText(e.target.value), setError(""))}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
          placeholder="https://www.youtube.com/watch?v=..."
          aria-label="Video link"
          autoFocus={editingLink}
        />
        <Btn variant="primary" onClick={addLink} disabled={!text.trim()}>
          {isLink ? "Use this link" : "Add link"}
        </Btn>
        {editingLink && (
          <Btn
            onClick={() => {
              setEditingLink(false);
              setText("");
              setError("");
            }}
          >
            Cancel
          </Btn>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">A YouTube or Vimeo address, or a direct https link to an .mp4 or .webm file. Without a video, students see only the written explanation.</p>
    </div>
  );

  return (
    <div>
      {value ? (
        <div className="space-y-2 rounded-md border border-line bg-background p-3">
          <VideoPlayer video={value} title="preview" className="aspect-video w-full rounded bg-black" />
          {isLink && editingLink ? (
            linkForm
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-sm text-ink">
                {isLink ? linkLabel(parseVideoLink(value.url)) : value.name}{" "}
                <span className="text-xs text-muted">
                  {isLink ? `· link · ${value.url}` : `· ${value.sizeKb >= 1024 ? `${(value.sizeKb / 1024).toFixed(1)} MB` : `${value.sizeKb} KB`}`}
                </span>
              </p>
              {isLink ? (
                <Btn
                  onClick={() => {
                    setText(value.url);
                    setEditingLink(true);
                  }}
                >
                  Change link
                </Btn>
              ) : (
                <Btn onClick={() => input.current?.click()} disabled={busy}>
                  {uploading ?? "Replace"}
                </Btn>
              )}
              <Btn
                variant="danger"
                onClick={async () => {
                  if (await confirmDialog({ title: "Remove this video?", body: "Students won't see a video for this question. Save the question to apply.", confirm: "Remove video", danger: true })) onChange(undefined);
                }}
              >
                Remove
              </Btn>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <Segmented
            value={how}
            onChange={(v) => (setHow(v), setError(""))}
            options={[
              { value: "upload", label: "Upload a video" },
              { value: "link", label: "Add a link" },
            ]}
          />
          {how === "upload" ? (
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => (e.preventDefault(), setOver(true))}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                void take(e.dataTransfer.files[0]);
              }}
              className={clsx(
                "flex w-full cursor-pointer flex-col items-center rounded-md border-2 border-dashed px-4 py-7 text-center transition-colors",
                over ? "border-primary bg-primary-light" : "border-line bg-background hover:border-primary/50",
              )}
            >
              <UploadCloud className="mb-2 size-7 text-primary" />
              <span className="text-sm font-semibold text-ink">{uploading ?? "Drop a video here or click to choose"}</span>
              <span className="mt-0.5 text-xs text-muted">
                {apiMode() ? "MP4, WebM or OGG" : "MP4, WebM, OGG or MOV"}, up to {limit} MB. Without a video, students see only the written explanation.
              </span>
            </button>
          ) : (
            linkForm
          )}
        </div>
      )}
      {error && (
        <p className="mt-1 text-xs text-error" role="alert">
          {error}
        </p>
      )}
      <input ref={input} type="file" accept={videoAccept()} className="hidden" onChange={(e) => (void take(e.target.files?.[0]), (e.target.value = ""))} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Version history                                                     */
/* ------------------------------------------------------------------ */

export function HistoryButton<T>({ historyKey, onRestore, describe }: { historyKey: string; onRestore: (rec: T) => void; describe?: (rec: T) => ReactNode }) {
  const versions = useAdminStore((s) => s.history[historyKey]) ?? NO_VERSIONS;
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn onClick={() => setOpen(true)} disabled={!versions.length} title={versions.length ? undefined : "No earlier versions yet"}>
        <History className="size-4" />
        History{versions.length ? ` (${versions.length})` : ""}
      </Btn>
      <Dialog open={open} onClose={() => setOpen(false)} title="Earlier versions" width={560}>
        <p className="mb-3 text-sm text-muted">The last {versions.length} saved versions, newest first. Restoring keeps the current version in history too.</p>
        <ul className="divide-y divide-line rounded-md border border-line">
          {versions.map((v, i) => (
            <li key={i} className="flex items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">{fmtDateTime(v.at)}</p>
                <p className="truncate text-xs text-muted">
                  by {v.by}
                  {describe && <> · {describe(v.record as T)}</>}
                </p>
              </div>
              <Btn
                onClick={async () => {
                  if (!(await confirmDialog({ title: "Restore this version?", body: "The record goes back to how it was at this time.", confirm: "Restore" }))) return;
                  onRestore(v.record as T);
                  setOpen(false);
                  toast("Earlier version restored");
                }}
              >
                Restore
              </Btn>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Taxonomy pickers + filters                                          */
/* ------------------------------------------------------------------ */

export function SubjectSelect({ value, onChange, allowAll, id }: { value: string; onChange: (v: string) => void; allowAll?: string; id?: string }) {
  const subjects = useSubjects(true);
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {allowAll !== undefined && <option value="">{allowAll}</option>}
      {subjects.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
          {s.visible ? "" : " (hidden)"}
        </option>
      ))}
    </Select>
  );
}

export function SystemSelect({ subject, value, onChange, general }: { subject: string; value: string | null; onChange: (v: string | null) => void; general?: string }) {
  const rec = useSubjects(true).find((s) => s.id === subject);
  return (
    <Select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
      {general !== undefined && <option value="">{general}</option>}
      {value && !rec?.systems.some((s) => s.key === value) && <option value={value}>{value} (not in Subjects &amp; Systems)</option>}
      {rec?.systems.map((s) => (
        <option key={s.key} value={s.key}>
          {s.label}
          {s.visible ? "" : " (hidden)"}
        </option>
      ))}
    </Select>
  );
}

export const subjectFilter = <T extends { subject: string }>(subjects: SubjectRec[]): FilterDef<T> => ({
  key: "subject",
  label: "Subject",
  options: subjects.map((s) => ({ value: s.id, label: s.name })),
  match: (r, v) => r.subject === v,
});

/** System filter that lists only the chosen subject's systems (or every system when no subject is chosen). */
export const systemFilter = <T extends { subject: string }>(subjects: SubjectRec[], get: (r: T) => string | null | string[], opts: { general?: boolean } = {}): FilterDef<T> => ({
  key: "system",
  label: "System",
  dependsOn: "subject",
  options: ({ values }) => {
    const pool = values.subject ? subjects.filter((s) => s.id === values.subject) : subjects;
    const seen = new Map<string, string>();
    for (const s of pool) for (const x of s.systems) if (!seen.has(x.key)) seen.set(x.key, x.label);
    const list = [...seen].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
    return opts.general ? [{ value: "__general", label: "General (whole subject)" }, ...list] : list;
  },
  match: (r, v) => {
    const sys = get(r);
    if (v === "__general") return sys === null;
    return Array.isArray(sys) ? sys.includes(v) : sys === v;
  },
});

/* ------------------------------------------------------------------ */
/* Bulk status / access actions                                        */
/* ------------------------------------------------------------------ */

export function StatusBulkActions({
  ids,
  rows,
  onStatus,
  onAccess,
  onDelete,
}: {
  ids: string[];
  rows: { id: string; status: Status }[];
  onStatus: (ids: string[], s: Status) => void;
  onAccess?: (ids: string[], a: Access) => void;
  onDelete?: (ids: string[]) => void;
}) {
  const archived = rows.filter((r) => ids.includes(r.id) && r.status === "archived").map((r) => r.id);
  return (
    <>
      <Btn variant="primary" onClick={() => onStatus(ids, "published")}>
        Publish
      </Btn>
      <Btn onClick={() => onStatus(ids, "draft")}>Move to draft</Btn>
      <Btn onClick={() => onStatus(ids, "archived")}>
        <Archive className="size-4" />
        Archive
      </Btn>
      {onAccess && (
        <>
          <Btn onClick={() => onAccess(ids, "free")}>Make free</Btn>
          <Btn variant="premium" onClick={() => onAccess(ids, "premium")}>
            Make premium
          </Btn>
        </>
      )}
      {onDelete && archived.length > 0 && (
        <Btn
          variant="danger"
          onClick={async () => {
            if (!(await confirmDialog({ title: `Delete ${archived.length} archived item${archived.length === 1 ? "" : "s"}?`, body: "This can't be undone. Only archived items are deleted.", confirm: "Delete permanently", danger: true })))
              return;
            onDelete(archived);
          }}
        >
          <Trash2 className="size-4" />
          Delete archived ({archived.length})
        </Btn>
      )}
    </>
  );
}

/** Publish-state controls at the top of an editor. */
export function StatusPicker({ value, onChange }: { value: Status; onChange: (s: Status) => void }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value as Status)} className="w-auto">
      <option value="draft">Draft (hidden from students)</option>
      <option value="published">Published</option>
      <option value="archived">Archived</option>
    </Select>
  );
}

/* ------------------------------------------------------------------ */
/* Image upload (subject icons, coach photo)                           */
/* ------------------------------------------------------------------ */

export function ImageDrop({ value, onChange, size = 64 }: { value: FileRef | string | null; onChange: (f: FileRef | null) => void; size?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const url = typeof value === "string" ? value : value?.url;
  const { href } = useFileUrl(url || null);
  const take = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    try {
      onChange(await storeImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
  };
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-background" style={{ width: size, height: size }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {href ? <img src={href} alt="" className="size-full object-contain" /> : <span className="text-xs text-muted">None</span>}
        </span>
        <Btn onClick={() => input.current?.click()}>{url ? "Replace image" : "Upload image"}</Btn>
        {url && (
          <Btn variant="ghost" onClick={() => onChange(null)}>
            Remove
          </Btn>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
      <p className="mt-1 text-xs text-muted">PNG, JPG, WebP, GIF or SVG, up to {MAX_IMAGE_MB} MB.</p>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => (void take(e.target.files?.[0]), (e.target.value = ""))} />
    </div>
  );
}

/** Permanent delete inside an editor. Records with a status must be archived first (two-step delete). */
export function DeleteRecordButton({ status, noun, onDelete }: { status?: Status; noun: string; onDelete: () => void }) {
  if (status && status !== "archived") return null;
  return (
    <Btn
      variant="danger"
      onClick={async () => {
        if (!(await confirmDialog({ title: `Delete this ${noun} permanently?`, body: "This can't be undone. Export a backup in Settings first if you might need it.", confirm: "Delete", danger: true }))) return;
        onDelete();
      }}
    >
      <Trash2 className="size-4" />
      Delete
    </Btn>
  );
}
