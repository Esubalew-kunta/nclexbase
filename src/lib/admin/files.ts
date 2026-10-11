"use client";

import { useEffect, useState } from "react";
import type { FileRef } from "./types";

/*
 * Uploaded files (PDFs) for the static admin. localStorage only holds ~5 MB, so the
 * bytes go to IndexedDB and records keep a reference like "idb:<key>". The backend
 * will swap this for object storage; records then hold a normal https URL.
 */

const DB = "nclexbase-files";
const STORE = "files";
export const MAX_UPLOAD_MB = 10;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const isStored = (url: string) => url.startsWith("idb:");

/** Count pages in a PDF by its "/Type /Page" objects. Good enough for display. */
async function countPdfPages(blob: Blob): Promise<number> {
  const text = new TextDecoder("latin1").decode(await blob.arrayBuffer());
  return Math.max(1, (text.match(/\/Type\s*\/Page(?!s)/g) ?? []).length);
}

/** Validate and store a PDF. Throws an Error with a user-facing message. */
export async function storePdf(file: File): Promise<FileRef> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) throw new Error("Only PDF files can be uploaded.");
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`This file is ${(file.size / 1048576).toFixed(1)} MB. The limit is ${MAX_UPLOAD_MB} MB.`);
  const head = new TextDecoder("latin1").decode(await file.slice(0, 5).arrayBuffer());
  if (head !== "%PDF-") throw new Error("This file doesn't look like a valid PDF.");
  const key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  await tx("readwrite", (s) => s.put(file, key));
  return { url: `idb:${key}`, name: file.name, pages: await countPdfPages(file), sizeKb: Math.max(1, Math.round(file.size / 1024)) };
}

export const MAX_IMAGE_MB = 2;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

/** Validate and store an image (subject icons, coach photo). */
export async function storeImage(file: File): Promise<FileRef> {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Use a PNG, JPG, WebP, GIF or SVG image.");
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) throw new Error(`Images can be up to ${MAX_IMAGE_MB} MB.`);
  const key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  await tx("readwrite", (s) => s.put(file, key));
  return { url: `idb:${key}`, name: file.name, pages: 0, sizeKb: Math.max(1, Math.round(file.size / 1024)) };
}

export async function deleteStored(url: string) {
  if (isStored(url)) await tx("readwrite", (s) => s.delete(url.slice(4)));
}

/** All stored files, for JSON export/import. */
export async function readStored(url: string): Promise<Blob | undefined> {
  return isStored(url) ? tx<Blob | undefined>("readonly", (s) => s.get(url.slice(4)) as IDBRequest<Blob | undefined>) : undefined;
}

/** Resolve a FileRef url to something an <a> or <iframe> can open. Public paths pass through. */
export function useFileUrl(url: string | undefined | null): { href: string | null; missing: boolean } {
  const [state, setState] = useState<{ for: string; href: string | null; missing: boolean } | null>(null);
  useEffect(() => {
    if (!url || !isStored(url)) return;
    let objectUrl: string | null = null;
    let live = true;
    readStored(url)
      .then((blob) => {
        if (!live) return;
        objectUrl = blob ? URL.createObjectURL(blob) : null;
        setState({ for: url, href: objectUrl, missing: !blob });
      })
      .catch(() => live && setState({ for: url, href: null, missing: true }));
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);
  if (!url) return { href: null, missing: true };
  if (!isStored(url)) return { href: url, missing: false };
  return state?.for === url ? { href: state.href, missing: state.missing } : { href: null, missing: false };
}

/** Put a file back under its original key (JSON import). */
export async function restoreStored(url: string, blob: Blob) {
  if (isStored(url)) await tx("readwrite", (s) => s.put(blob, url.slice(4)));
}
