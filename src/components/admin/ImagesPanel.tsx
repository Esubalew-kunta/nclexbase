"use client";

import { useRef, useState } from "react";
import { Crop, ImagePlus, Replace, Trash2 } from "lucide-react";
import { appendImage, findImages, removeImage, replaceImage, withAttr, withoutAttr, type HtmlImage } from "@/lib/admin/imageHtml";
import { canUpload, prepareImage, uploadMedia } from "@/lib/api/media";
import type { Item } from "@/lib/types";
import { Btn, confirmDialog, IconBtn, Input, Panel, toast } from "./ui";
import { CropDialog } from "./CropDialog";

/*
 * The pictures inside one question: the ones in the question itself and the ones in the
 * explanation students read after they answer. For each: see it, describe it, replace it, crop it,
 * delete it, and add a new one.
 *
 * A picture is just an <img> in the question's HTML, so every change is a text edit of that one tag
 * (lib/admin/imageHtml.ts) and nothing else in the text moves. Replacing or cropping never changes
 * the old file, it uploads a new one, so a figure that other questions also show stays as it was
 * for them. The old file is cleaned up later by `php artisan media:prune` once nothing uses it.
 */

type Where = "question" | "explanation";

export function ImagesPanel({ item, onChange }: { item: Item; onChange: (patch: Partial<Item>) => void }) {
  // A highlight question keeps its whole passage, prompt included, in `html`; every other type in `stem`.
  const questionKey = item.type === "highlightText" ? "html" : "stem";
  const questionHtml = (item.type === "highlightText" ? item.html : item.stem) ?? "";
  const explanation = item.rationale.explanation ?? "";

  const put = (where: Where, html: string) => {
    if (where === "question") onChange({ [questionKey]: html } as Partial<Item>);
    else onChange({ rationale: { ...item.rationale, explanation: html } });
  };

  return (
    <Panel title="Pictures" description="Pictures in the question and in the explanation students see after they answer. Changes apply to this question only; save the question to keep them.">
      <div className="space-y-5">
        <Section title="In the question" where="question" html={questionHtml} onHtml={(h) => put("question", h)} />
        <Section title="In the explanation" where="explanation" html={explanation} onHtml={(h) => put("explanation", h)} />
      </div>
      {!canUpload() && <p className="mt-3 text-xs text-muted">Uploading, replacing and cropping need the server, so they are off in this offline copy. You can still describe and delete pictures.</p>}
    </Panel>
  );
}

function Section({ title, where, html, onHtml }: { title: string; where: Where; html: string; onHtml: (html: string) => void }) {
  const images = findImages(html);
  const add = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const addFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const ready = await prepareImage(file, file.name);
      const up = await uploadMedia(ready.blob, ready.name, "image");
      onHtml(appendImage(html, up.url));
      toast("Picture added");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label={title}>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <span className="text-xs text-muted">{images.length === 0 ? "No pictures" : `${images.length} picture${images.length === 1 ? "" : "s"}`}</span>
        <span className="flex-1" />
        <Btn onClick={() => add.current?.click()} disabled={busy || !canUpload()} title={canUpload() ? undefined : "Needs the server"}>
          <ImagePlus className="size-4" />
          {busy ? "Uploading…" : "Add picture"}
        </Btn>
        <input ref={add} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" data-testid={`add-picture-${where}`} onChange={(e) => (void addFile(e.target.files?.[0]), (e.target.value = ""))} />
      </div>
      {error && (
        <p className="mb-2 text-xs text-error" role="alert">
          {error}
        </p>
      )}
      {images.length > 0 && (
        <ul className="divide-y divide-line rounded-md border border-line">
          {images.map((img) => (
            <Row key={`${img.index}-${img.src}`} img={img} where={where} html={html} onHtml={onHtml} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Row({ img, where, html, onHtml }: { img: HtmlImage; where: Where; html: string; onHtml: (html: string) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cropping, setCropping] = useState(false);
  const label = decodeURIComponent(img.src.split("?")[0].split("/").pop() || img.src || "picture");

  /** Put a new file where this picture is. The old file is left alone. */
  const swap = async (blob: Blob, name: string) => {
    const ready = await prepareImage(blob, name);
    const up = await uploadMedia(ready.blob, ready.name, "image");
    // A new picture has its own shape, so a width or height written for the old one must go.
    const tag = withoutAttr(withoutAttr(withAttr(img.tag, "src", up.url), "width"), "height");
    onHtml(replaceImage(html, img.index, tag));
  };

  const replace = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setError("");
    try {
      await swap(f, f.name);
      toast("Picture replaced");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!(await confirmDialog({ title: "Delete this picture?", body: img.hoverText ? `The words “${img.hoverText}” stay in the explanation as plain text. Other questions that show the same picture keep it. Save the question to apply.` : "It is taken out of this question. Other questions that show the same picture keep it. Save the question to apply.", confirm: "Delete picture", danger: true }))) return;
    onHtml(removeImage(html, img.index));
  };

  return (
    <li className="flex flex-wrap items-center gap-3 p-2.5" data-testid={`picture-${where}`}>
      <a href={img.src} target="_blank" rel="noreferrer" className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-line bg-background" title="Open full size">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.src} alt={img.alt} className="max-h-full max-w-full object-contain" />
      </a>
      <div className="min-w-0 flex-1 basis-56">
        <p className="truncate text-xs text-muted" title={img.src}>
          {img.hoverText ? `Shown when hovering “${img.hoverText}” · ${label}` : label}
        </p>
        <Input value={img.alt} onChange={(e) => onHtml(replaceImage(html, img.index, withAttr(img.tag, "alt", e.target.value)))} placeholder="Describe the picture (read aloud to screen reader users)" aria-label="Picture description" className="mt-1 h-8" />
        {error && (
          <p className="mt-1 text-xs text-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Btn onClick={() => file.current?.click()} disabled={busy || !canUpload()} title={canUpload() ? undefined : "Needs the server"}>
          <Replace className="size-4" />
          {busy ? "Uploading…" : "Replace"}
        </Btn>
        <Btn onClick={() => setCropping(true)} disabled={busy || !canUpload()} title={canUpload() ? undefined : "Needs the server"}>
          <Crop className="size-4" />
          Crop
        </Btn>
        <IconBtn label="Delete picture" onClick={remove} className="hover:text-error">
          <Trash2 className="size-4" />
        </IconBtn>
        <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" data-testid={`replace-picture-${where}`} onChange={(e) => (void replace(e.target.files?.[0]), (e.target.value = ""))} />
      </div>
      {cropping && (
        <CropDialog
          src={img.src}
          name={label}
          onCancel={() => setCropping(false)}
          onApply={async (blob, name) => {
            await swap(blob, name);
            setCropping(false);
            toast("Picture cropped");
          }}
        />
      )}
    </li>
  );
}
