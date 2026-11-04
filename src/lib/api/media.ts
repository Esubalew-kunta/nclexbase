"use client";

import { ApiError, apiMode, apiUpload } from "@/lib/api/client";

/*
 * Pictures and videos for questions, sent to the server (POST /admin/media).
 *
 * The server decides what is acceptable and answers in words; this side only avoids sending what
 * it is sure to refuse (a file far over the limit, an SVG), and shrinks pictures before they go.
 */

export interface UploadedMedia {
  id: number;
  /** Same-origin address, safe to write straight into a question's HTML. */
  url: string;
  name: string;
  sizeKb: number;
  mime: string;
  kind: "image" | "video" | "file";
}

export const MAX_IMAGE_MB = 5;
export const MAX_VIDEO_MB = 50;
/** Longest side of an uploaded picture. A figure in an explanation is never wider than a screen. */
export const MAX_IMAGE_SIDE = 2000;

/** Pictures and videos can be sent to the server only when there is one. */
export const canUpload = () => apiMode();

export async function uploadMedia(file: Blob, name: string, purpose: "image" | "video", onProgress?: (fraction: number) => void): Promise<UploadedMedia> {
  const form = new FormData();
  form.set("purpose", purpose);
  form.set("file", file, name);
  try {
    const { data } = await apiUpload<{ data: UploadedMedia }>("/admin/media", form, onProgress);
    return data;
  } catch (e) {
    // When a file is bigger than the server's own upload limit, PHP throws the whole request away and
    // Laravel can only say a field is "required" or "failed to upload". Say what is actually wrong.
    if (e instanceof ApiError && (e.status === 413 || (e.status === 422 && /required|failed to upload/i.test(e.message)))) {
      throw new Error(`The server did not accept this file (${(file.size / 1048576).toFixed(1)} MB). It is probably over the server's upload limit; try a smaller file${purpose === "video" ? " or add a link instead" : ""}.`);
    }
    throw e;
  }
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/**
 * A picture ready to send: turned upright, no longer than MAX_IMAGE_SIDE, camera metadata gone
 * (drawing it to a canvas drops that), and under the size limit. A GIF is sent as it is, because
 * redrawing would freeze an animation. Throws an Error with a sentence for the admin.
 */
export async function prepareImage(file: Blob, name: string): Promise<{ blob: Blob; name: string }> {
  if (file.type === "image/svg+xml" || name.toLowerCase().endsWith(".svg")) throw new Error("SVG files are not accepted. Use a PNG, JPG, WebP or GIF picture.");
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Use a PNG, JPG, WebP or GIF picture.");
  if (file.type === "image/gif") {
    if (file.size > MAX_IMAGE_MB * 1048576) throw new Error(`This picture is ${(file.size / 1048576).toFixed(1)} MB. The limit is ${MAX_IMAGE_MB} MB.`);
    return { blob: file, name };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This file could not be read as a picture.");
  }
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  let width = Math.max(1, Math.round(bitmap.width * scale));
  let height = Math.max(1, Math.round(bitmap.height * scale));
  const type = file.type === "image/png" ? "image/png" : file.type === "image/webp" ? "image/webp" : "image/jpeg";

  for (let attempt = 0; attempt < 4; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser cannot process pictures.");
    // A JPEG has no transparency, so what was see-through becomes white rather than black.
    if (type === "image/jpeg") {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
    if (!blob) throw new Error("This picture could not be prepared.");
    if (blob.size <= MAX_IMAGE_MB * 1048576) {
      bitmap.close();
      return { blob, name: renamed(name, type) };
    }
    width = Math.round(width * 0.75);
    height = Math.round(height * 0.75);
  }
  bitmap.close();
  throw new Error(`This picture is too large even after shrinking. The limit is ${MAX_IMAGE_MB} MB.`);
}

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const renamed = (name: string, type: string) => `${name.replace(/\.[^.]*$/, "") || "picture"}.${EXT[type] ?? "png"}`;
