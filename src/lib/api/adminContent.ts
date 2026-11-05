"use client";

import { create } from "zustand";
import { api, ApiError, apiMode } from "@/lib/api/client";
import { loadQuestionBank, useApiContent } from "@/lib/api/content";
import { useAdminStore, type CollectionPatch } from "@/lib/admin/store";
import type { CaseRec, QuestionRec } from "@/lib/admin/types";

/*
 * Sends the admin's question and case edits to the server.
 *
 * The admin screens still write through lib/admin/store (they know nothing about the API), so this
 * module sits beside the store the way lib/api/progress sits beside the student's: it watches the
 * two collections, sends what changed to /admin/content, and puts the server's answer where the
 * screens read from. With no API configured none of it runs.
 *
 * The rule it keeps: **what the admin sees is what the server has.** A save is applied to the
 * screen at once (the local patch), then sent; when the server accepts it the patch is dropped and
 * the server's record takes its place, and when the server refuses it the patch is dropped too and
 * the admin is told why. A failed save never lingers as an edit that exists in one browser only.
 *
 * Only questions and cases. Every other admin collection still saves in the browser.
 */

type Col = "cases" | "questions";
type Rec = CaseRec | QuestionRec;

type Job = { kind: "save"; col: Col; id: string; rec: Rec } | { kind: "delete"; col: Col; id: string };

export interface SyncNotice {
  tone: "success" | "error" | "info";
  text: string;
}

/**
 * `busy`: how many saves are on their way, for the indicator in the admin header.
 * `phase`: "idle" until an admin signs in, "starting" while the admin's copy of the questions and
 * cases is read from the server, "ready" after. The admin screens wait while it is starting, because
 * an editor takes its starting copy of a record when it opens, and a copy taken before the case
 * videos arrived would later save the case without its video.
 */
export const useAdminSync = create<{ busy: number; phase: "idle" | "starting" | "ready" }>(() => ({ busy: 0, phase: "idle" }));

const SET_ASIDE_KEY = "nclexbase-admin-set-aside";
const RETRY_429_MS = 10_000;
const MAX_429 = 6;

let notify: ((n: SyncNotice) => void) | null = null;
const waiting: SyncNotice[] = [];
let unsubscribe: (() => void) | null = null;
let starting: Promise<void> | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let running = false;
let again = false;
// Records already dealt with, by identity. A rehydrate from another tab produces new objects for
// the same content; those are marked here without being sent.
let handled = new WeakSet<object>();
let removing = new Set<string>();
let hydrating = false;

/**
 * What this browser was already holding when the page loaded, which is how an old edit is told
 * from one made a moment ago. Sync starts a little after the page does (it waits for the session
 * and the question bank), and an admin who saves in that gap has made a fresh edit, not an old one.
 */
let atLoad: { records: WeakSet<object>; removed: Set<string> } | null = null;
if (typeof window !== "undefined") {
  useAdminStore.persist.onFinishHydration(() => {
    if (atLoad) return;
    atLoad = { records: new WeakSet(), removed: new Set() };
    for (const col of ["cases", "questions"] as const) {
      const p = patchOf(col);
      if (!p) continue;
      for (const r of Object.values(p.records)) atLoad.records.add(r as object);
      for (const id of Object.keys(p.removed)) atLoad.removed.add(`${col}:${id}`);
    }
  });
}

/** The admin shell registers a toast function here; notices raised before that are kept. */
export function setAdminSyncNotifier(fn: ((n: SyncNotice) => void) | null) {
  notify = fn;
  if (fn) while (waiting.length) fn(waiting.shift()!);
}

const say = (n: SyncNotice) => (notify ? notify(n) : waiting.push(n));
const patchOf = (col: Col) => useAdminStore.getState().data[col] as CollectionPatch<Rec> | undefined;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* Start and stop                                                      */
/* ------------------------------------------------------------------ */

export function startAdminContentSync(): void {
  if (!apiMode() || unsubscribe || starting) return;
  useAdminSync.setState({ phase: "starting" });
  starting = (async () => {
    // The base the screens read must be there before an edit can replace a record in it.
    // loadQuestionBank already retries a busy minute (429) or a dropped connection.
    await loadQuestionBank();
    if (!useApiContent.getState().questions) {
      say({ tone: "error", text: "The question bank could not be loaded, so edits to questions and cases cannot be saved to the server right now. Use Try again at the top of the page." });
      useAdminSync.setState({ phase: "ready" });
      return;
    }
    // The public catalogue has no case videos, so the admin reads the full case records. Saving a case
    // from a copy that lacked its video would clear the video on the server, so without them nothing is saved.
    if (!(await loadAdminCases())) {
      say({ tone: "error", text: "The case studies could not be loaded in full, so edits to questions and cases cannot be saved to the server right now. Reload the page." });
      useAdminSync.setState({ phase: "ready" });
      return;
    }
    setAside();
    handled = new WeakSet();
    removing = new Set();

    const persist = useAdminStore.persist;
    const offStart = persist.onHydrate(() => {
      hydrating = true;
    });
    const offDone = persist.onFinishHydration(() => {
      // Another tab changed the stored admin data. Whatever it sent, or will send, is its job.
      markAllHandled();
      hydrating = false;
    });
    const off = useAdminStore.subscribe((s, prev) => {
      if (hydrating) return;
      if (s.data.cases !== prev.data.cases || s.data.questions !== prev.data.questions) schedule();
    });
    unsubscribe = () => {
      off();
      offStart();
      offDone();
    };
    // Anything saved between the page loading and now has not been sent yet.
    schedule();
    useAdminSync.setState({ phase: "ready" });
  })().finally(() => {
    starting = null;
  });
}

export function stopAdminContentSync(): void {
  useAdminSync.setState({ phase: "idle" });
  unsubscribe?.();
  unsubscribe = null;
  if (timer) clearTimeout(timer);
  timer = null;
}

function markAllHandled() {
  for (const col of ["cases", "questions"] as const) {
    const p = patchOf(col);
    if (p) for (const r of Object.values(p.records)) handled.add(r as object);
  }
}

/**
 * Edits this browser was holding when the page loaded, from before saving to the server existed.
 * They are old: the server has moved on, and sending them would overwrite it. They are copied to a
 * backup key and taken out of the way, so nothing is lost and nothing stale shadows the server's
 * content. Edits made since the page loaded are not touched; they are sent.
 */
function setAside(): void {
  if (!atLoad) return;
  const s = useAdminStore.getState();
  const data = { ...s.data };
  const kept: { col: Col; records: Record<string, Rec>; removed: string[] }[] = [];
  let count = 0;

  for (const col of ["cases", "questions"] as const) {
    const p = patchOf(col);
    if (!p) continue;
    const records = Object.fromEntries(Object.entries(p.records).filter(([, r]) => atLoad!.records.has(r as object)));
    const removed = Object.keys(p.removed).filter((id) => atLoad!.removed.has(`${col}:${id}`));
    const n = Object.keys(records).length + removed.length;
    if (!n) continue;
    kept.push({ col, records, removed });
    count += n;
    // What stays is whatever was made after the page loaded.
    const rest = { records: { ...p.records }, removed: { ...p.removed } };
    for (const id of Object.keys(records)) delete rest.records[id];
    for (const id of removed) delete rest.removed[id];
    (data as Record<string, unknown>)[col] = Object.keys(rest.records).length || Object.keys(rest.removed).length ? rest : undefined;
  }
  if (!count) return;

  try {
    localStorage.setItem(`${SET_ASIDE_KEY}-${Date.now()}`, JSON.stringify({ at: new Date().toISOString(), kept }));
  } catch {
    say({ tone: "error", text: `${count} older edit${count === 1 ? "" : "s"} to questions or cases are stored only in this browser and were not sent to the server. Browser storage is full, so they could not be backed up.` });
    return;
  }
  useAdminStore.setState({ data });
  say({ tone: "info", text: `${count} older edit${count === 1 ? "" : "s"} to questions or cases made before saving to the server existed ${count === 1 ? "was" : "were"} set aside, not sent. A copy is kept in this browser's storage.` });
}

/* ------------------------------------------------------------------ */
/* Finding and sending changes                                         */
/* ------------------------------------------------------------------ */

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void run(), 250);
}

async function run() {
  if (running) {
    again = true;
    return;
  }
  running = true;
  try {
    do {
      again = false;
      await pass();
    } while (again);
  } finally {
    running = false;
  }
}

function collect(): Job[] {
  const jobs: Job[] = [];
  for (const col of ["cases", "questions"] as const) {
    const p = patchOf(col);
    if (!p) continue;
    for (const [id, rec] of Object.entries(p.records)) if (!handled.has(rec as object)) jobs.push({ kind: "save", col, id, rec });
    for (const id of Object.keys(p.removed)) if (!removing.has(`${col}:${id}`)) jobs.push({ kind: "delete", col, id });
  }
  return jobs;
}

/** Cases before the questions that name them, and a case's removal after its questions'. */
const rank = (j: Job) => (j.kind === "save" ? (j.col === "cases" ? 0 : 1) : j.col === "questions" ? 2 : 3);

async function pass() {
  let todo = collect();
  if (!todo.length) return;
  for (const j of todo) {
    if (j.kind === "save") handled.add(j.rec as object);
    else removing.add(`${j.col}:${j.id}`);
  }
  const total = todo.length;
  useAdminSync.setState((s) => ({ busy: s.busy + total }));

  const problems: string[] = [];
  try {
    // A new case and its new questions need each other to exist, so up to three rounds:
    // the case first without the questions that are not there yet, then the questions, then the case again.
    for (let round = 0; round < 3 && todo.length; round++) {
      const next: Job[] = [];
      for (const job of [...todo].sort((a, b) => rank(a) - rank(b))) {
        const out = await send(job);
        if (out.state === "ok") continue;
        if (out.state === "again" && round < 2) next.push(job);
        else {
          problems.push(out.state === "again" ? `${label(job)}: some of its questions could not be saved first.` : `${label(job)}: ${out.message}`);
          revert(job);
        }
      }
      todo = next;
    }
  } finally {
    useAdminSync.setState((s) => ({ busy: Math.max(0, s.busy - total) }));
  }

  if (problems.length) {
    say({ tone: "error", text: `Not saved to the server. ${problems.slice(0, 3).join(" ")}${problems.length > 3 ? ` And ${problems.length - 3} more.` : ""}` });
  }
}

const label = (j: Job) => `${j.col === "cases" ? "Case study" : "Question"} ${j.id}`;

type Outcome = { state: "ok" } | { state: "again" } | { state: "failed"; message: string };

async function send(job: Job): Promise<Outcome> {
  try {
    if (job.kind === "delete") return await sendDelete(job);
    return await sendSave(job);
  } catch (err) {
    return { state: "failed", message: describe(err) };
  }
}

async function sendSave(job: Extract<Job, { kind: "save" }>): Promise<Outcome> {
  const { col, id } = job;
  const existing = baseIds(col).has(id);
  let body: Rec = job.rec;
  let trimmed = false;

  if (col === "cases") {
    const rec = job.rec as CaseRec;
    if (rec.content) {
      const known = baseIds("questions");
      const itemIds = rec.content.itemIds.filter((q) => known.has(q));
      trimmed = itemIds.length !== rec.content.itemIds.length;
      body = { ...rec, content: { ...rec.content, itemIds } };
    }
  }

  const { data } = await withRetry(() =>
    existing ? api<{ data: Rec }>(`/admin/content/${col}/${encodeURIComponent(id)}`, { method: "PUT", body }) : api<{ data: Rec }>(`/admin/content/${col}`, { method: "POST", body }),
  );

  replaceInBase(col, id, data);
  // A case written without some of its questions stays an edit until they exist and it can be sent whole.
  if (trimmed) return { state: "again" };
  dropPatch(col, id, job.rec);
  return { state: "ok" };
}

async function sendDelete(job: Extract<Job, { kind: "delete" }>): Promise<Outcome> {
  const { col, id } = job;
  try {
    await withRetry(() => api(`/admin/content/${col}/${encodeURIComponent(id)}`, { method: "DELETE" }));
  } catch (err) {
    // Already gone is what was asked for.
    if (!(err instanceof ApiError && err.status === 404)) throw err;
  }
  removeFromBase(col, id);
  clearRemoved(col, id);
  return { state: "ok" };
}

/** The platform allows 60 requests a minute; a big bulk change waits its turn instead of failing. */
async function withRetry<T>(go: () => Promise<T>): Promise<T> {
  for (let n = 0; ; n++) {
    try {
      return await go();
    } catch (err) {
      if (err instanceof ApiError && err.status === 429 && n < MAX_429) {
        await sleep(RETRY_429_MS);
        continue;
      }
      throw err;
    }
  }
}

function describe(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "You are signed out. Sign in again, then repeat the change.";
    if (err.status === 403) return "This account is not an admin.";
    const record = err.errors?.record;
    if (record?.length) return record.join(" ");
    return err.message;
  }
  return "The server could not be reached.";
}

/* ------------------------------------------------------------------ */
/* Where the screens read from                                         */
/* ------------------------------------------------------------------ */

function baseList(col: Col): Rec[] {
  const s = useApiContent.getState();
  return ((col === "questions" ? s.questions : s.collections.cases) ?? []) as Rec[];
}

const baseIds = (col: Col) => new Set(baseList(col).map((r) => r.id));

function setBase(col: Col, list: Rec[]) {
  if (col === "questions") useApiContent.setState({ questions: list as QuestionRec[] });
  else useApiContent.setState((s) => ({ collections: { ...s.collections, cases: list as CaseRec[] } }));
}

/** Every case study with its video, as the admin API serves it. False when they could not be read. */
async function loadAdminCases(): Promise<boolean> {
  try {
    const all: CaseRec[] = [];
    for (let page = 1; ; page++) {
      const res = await withRetry(() => api<{ data: CaseRec[]; meta: { lastPage: number } }>(`/admin/content/cases?per_page=200&page=${page}`));
      all.push(...res.data);
      if (page >= res.meta.lastPage) break;
    }
    setBase("cases", all);
    useApiContent.setState({ caseVideos: Object.fromEntries(all.filter((c) => c.content?.video).map((c) => [c.id, c.content!.video!])) });
    return true;
  } catch {
    return false;
  }
}

function replaceInBase(col: Col, id: string, saved: Rec) {
  if (col === "cases") {
    // Keep the video map the student view reads in step with what was just saved.
    const video = (saved as CaseRec).content?.video;
    useApiContent.setState((s) => {
      const next = { ...s.caseVideos };
      if (video) next[id] = video;
      else delete next[id];
      return { caseVideos: next };
    });
  }
  const list = baseList(col);
  setBase(col, list.some((r) => r.id === id) ? list.map((r) => (r.id === id ? saved : r)) : [...list, saved]);
}

function removeFromBase(col: Col, id: string) {
  setBase(
    col,
    baseList(col).filter((r) => r.id !== id),
  );
}

/** Drop the local edit once the server has it, unless the admin has edited again since. */
function dropPatch(col: Col, id: string, rec: Rec) {
  useAdminStore.setState((s) => {
    const cur = s.data[col] as CollectionPatch<Rec> | undefined;
    if (!cur || cur.records[id] !== rec) return s;
    const records = { ...cur.records };
    delete records[id];
    return { data: { ...s.data, [col]: { ...cur, records } } };
  });
}

function clearRemoved(col: Col, id: string) {
  removing.delete(`${col}:${id}`);
  useAdminStore.setState((s) => {
    const cur = s.data[col] as CollectionPatch<Rec> | undefined;
    if (!cur?.removed[id]) return s;
    const removed = { ...cur.removed };
    delete removed[id];
    return { data: { ...s.data, [col]: { ...cur, removed } } };
  });
}

/** The server refused: put the screen back to what the server has. */
function revert(job: Job) {
  if (job.kind === "save") dropPatch(job.col, job.id, job.rec);
  else clearRemoved(job.col, job.id);
}
