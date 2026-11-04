"use client";

import { api, ApiError, apiMode } from "@/lib/api/client";
import { useStore } from "@/lib/store";
import type { Answer, Attempt, MasteryTag, TestSession } from "@/lib/types";

/*
 * Keeps a signed-in student's progress on the server, so it follows them to a new device and
 * survives a cleared browser.
 *
 * The store (lib/store) stays the thing every screen reads. This module sits beside it: it
 * watches the store, sends what changed, and merges in what other devices sent. Nothing else in
 * the app knows the server is involved, and with no API configured none of this runs.
 *
 * How two devices stay consistent, and why it needs no coordination:
 *  - **Attempts** (every answer ever submitted) are only ever added. The union of two devices'
 *    attempts is the right answer, so there is nothing to resolve.
 *  - **Runs, tags and bookmarks** are last-writer-wins per key, by the millisecond the device
 *    changed them. Each local change is stamped; a pull applies a server copy only if it is newer
 *    than the stamp here.
 *  - A **deleted** run, **cleared** tag and **removed** bookmark are sent as such, not as absence,
 *    so a device that still has the old copy removes it instead of putting it back.
 *
 * The server only ever holds one student's data per account, and this browser may be shared. So
 * the local copy is tagged with whose it is, and signing in as someone else (or signing out)
 * clears it first: one student's answers must never be uploaded into another's account.
 */

const KEY = "nclex-progress-sync";
const DEBOUNCE_MS = 2000;
const MAX_WAIT_MS = 10000;
const PULL_EVERY_MS = 20000;
const CHUNK = { sessions: 25, rows: 500 };

interface Stamps {
  s: Record<string, number>;
  t: Record<string, number>;
  b: Record<string, number>;
}
interface Queue {
  sessions: string[];
  attempts: Attempt[];
  tags: string[];
  bookmarks: string[];
}
interface Meta {
  /** Whose progress this browser is holding. */
  owner: number | null;
  stamps: Stamps;
  /** Changes not yet confirmed by the server. Kept across a closed tab so they are not lost. */
  queue: Queue;
}

interface Snapshot {
  sessions: { id: string; data: TestSession; updatedAt: number }[];
  deletedSessions: { id: string; updatedAt: number }[];
  attempts: { itemId: string; sessionId: string; sourceId: string | null; kind: Attempt["kind"]; at: string; answer: Answer | null; time: number }[];
  tags: { itemId: string; tag: MasteryTag | null; auto: boolean; updatedAt: number }[];
  bookmarks: { itemId: string; on: boolean; updatedAt: number }[];
}

const emptyMeta = (owner: number | null): Meta => ({
  owner,
  stamps: { s: {}, t: {}, b: {} },
  queue: { sessions: [], attempts: [], tags: [], bookmarks: [] },
});

let meta: Meta = emptyMeta(null);
let started: number | null = null;
let starting: Promise<void> | null = null;
let unsubscribe: (() => void) | null = null;
let teardown: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let firstDirtyAt = 0;
let inFlight: Promise<void> | null = null;
let again = false;
let backoff = 0;
let lastPull = 0;
// True while this module is writing the server's data into the store, so that is not sent back.
let applying = false;
let stopped = false;

/* ------------------------------------------------------------------ */
/* Persistence of the sync bookkeeping                                 */
/* ------------------------------------------------------------------ */

function load(): Meta {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Meta | null;
    if (raw && raw.stamps && raw.queue) return raw;
  } catch {
    // A damaged record is the same as no record: start clean.
  }
  return emptyMeta(null);
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(meta));
  } catch {
    // Storage full or blocked: sync still works for this page view, it just will not survive a close.
  }
}

const queued = () => meta.queue.sessions.length + meta.queue.attempts.length + meta.queue.tags.length + meta.queue.bookmarks.length > 0;

/* ------------------------------------------------------------------ */
/* Store helpers                                                       */
/* ------------------------------------------------------------------ */

function writeStore(patch: Partial<ReturnType<typeof useStore.getState>>) {
  applying = true;
  try {
    useStore.setState(patch);
  } finally {
    applying = false;
  }
}

/** Forget this browser's copy of progress (not settings, not the schedule). */
function wipeLocal() {
  writeStore({ sessions: [], attempts: [], tags: {}, autoTags: {}, bookmarks: {} });
}

const attemptKey = (a: { sessionId: string; itemId: string }) => `${a.sessionId}|${a.itemId}`;

/* ------------------------------------------------------------------ */
/* Pull: merge the server's copy into the store                        */
/* ------------------------------------------------------------------ */

async function pull(): Promise<void> {
  const snap = await api<Snapshot>("/progress");
  lastPull = Date.now();
  const st = useStore.getState();
  const now = Date.now();

  // ---- attempts: the union
  const have = new Set(st.attempts.map(attemptKey));
  const onServer = new Set(snap.attempts.map(attemptKey));
  const fromServer: Attempt[] = snap.attempts
    .filter((a) => !have.has(attemptKey(a)))
    .map((a) => ({ itemId: a.itemId, sessionId: a.sessionId, sourceId: a.sourceId ?? undefined, kind: a.kind, at: a.at, answer: a.answer ?? undefined, time: a.time }));
  const attempts = [...st.attempts, ...fromServer].sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : 0));
  // Mine that the server has never seen (first sync of an old browser, or sent but unconfirmed).
  for (const a of st.attempts) if (!onServer.has(attemptKey(a)) && !meta.queue.attempts.some((q) => attemptKey(q) === attemptKey(a))) meta.queue.attempts.push(a);

  // ---- runs
  let sessions = st.sessions;
  const serverIds = new Set(snap.sessions.map((s) => s.id));
  for (const d of snap.deletedSessions) {
    if (sessions.some((x) => x.id === d.id) && (meta.stamps.s[d.id] ?? 0) <= d.updatedAt) sessions = sessions.filter((x) => x.id !== d.id);
    meta.stamps.s[d.id] = Math.max(meta.stamps.s[d.id] ?? 0, d.updatedAt);
  }
  const deletedIds = new Set(snap.deletedSessions.map((d) => d.id));
  for (const s of snap.sessions) {
    const mine = sessions.find((x) => x.id === s.id);
    if (!mine) sessions = [...sessions, s.data];
    else if (s.updatedAt > (meta.stamps.s[s.id] ?? 0)) sessions = sessions.map((x) => (x.id === s.id ? s.data : x));
    else continue;
    meta.stamps.s[s.id] = s.updatedAt;
  }
  for (const s of sessions) if (!serverIds.has(s.id) && !deletedIds.has(s.id) && !meta.queue.sessions.includes(s.id)) mark("s", s.id, now);

  // ---- tags and bookmarks
  const tags = { ...st.tags };
  const autoTags = { ...st.autoTags };
  const seenTags = new Set<string>();
  for (const t of snap.tags) {
    seenTags.add(t.itemId);
    if (t.updatedAt <= (meta.stamps.t[t.itemId] ?? 0)) continue;
    if (t.tag) tags[t.itemId] = t.tag;
    else delete tags[t.itemId];
    if (t.tag && t.auto) autoTags[t.itemId] = true;
    else delete autoTags[t.itemId];
    meta.stamps.t[t.itemId] = t.updatedAt;
  }
  for (const k of Object.keys(tags)) if (!seenTags.has(k) && !meta.queue.tags.includes(k)) mark("t", k, now);

  const bookmarks = { ...st.bookmarks };
  const seenMarks = new Set<string>();
  for (const b of snap.bookmarks) {
    seenMarks.add(b.itemId);
    if (b.updatedAt <= (meta.stamps.b[b.itemId] ?? 0)) continue;
    if (b.on) bookmarks[b.itemId] = true;
    else delete bookmarks[b.itemId];
    meta.stamps.b[b.itemId] = b.updatedAt;
  }
  for (const k of Object.keys(bookmarks)) if (!seenMarks.has(k) && !meta.queue.bookmarks.includes(k)) mark("b", k, now);

  writeStore({ sessions, attempts, tags, autoTags, bookmarks });
  save();
  if (queued()) schedule();
}

/** Note a change to a run ("s"), tag ("t") or bookmark ("b"), and when it happened. */
function mark(kind: "s" | "t" | "b", key: string, at: number) {
  meta.stamps[kind][key] = at;
  const list = kind === "s" ? meta.queue.sessions : kind === "t" ? meta.queue.tags : meta.queue.bookmarks;
  if (!list.includes(key)) list.push(key);
}

/* ------------------------------------------------------------------ */
/* Push: send what changed                                             */
/* ------------------------------------------------------------------ */

function onChange(s: ReturnType<typeof useStore.getState>, p: ReturnType<typeof useStore.getState>) {
  if (applying || stopped) return;
  const now = Date.now();
  let changed = false;

  if (s.attempts !== p.attempts && s.attempts.length > p.attempts.length) {
    meta.queue.attempts.push(...s.attempts.slice(p.attempts.length));
    changed = true;
  }

  if (s.sessions !== p.sessions) {
    const before = new Map(p.sessions.map((x) => [x.id, x]));
    const after = new Set<string>();
    for (const x of s.sessions) {
      after.add(x.id);
      if (before.get(x.id) !== x) {
        mark("s", x.id, now);
        changed = true;
      }
    }
    // A run that was there and is not now: a Reset. Sent as a deletion, not as silence.
    for (const id of before.keys()) {
      if (after.has(id)) continue;
      mark("s", id, now);
      changed = true;
    }
  }

  if (s.tags !== p.tags || s.autoTags !== p.autoTags) {
    for (const k of new Set([...Object.keys(s.tags), ...Object.keys(p.tags)])) {
      if (s.tags[k] === p.tags[k] && Boolean(s.autoTags[k]) === Boolean(p.autoTags[k])) continue;
      mark("t", k, now);
      changed = true;
    }
  }

  if (s.bookmarks !== p.bookmarks) {
    for (const k of new Set([...Object.keys(s.bookmarks), ...Object.keys(p.bookmarks)])) {
      if (Boolean(s.bookmarks[k]) === Boolean(p.bookmarks[k])) continue;
      mark("b", k, now);
      changed = true;
    }
  }

  if (changed) {
    save();
    schedule();
  }
}

/** Send soon, but never let a steady stream of changes (the exam clock ticks every second) hold it off for long. */
function schedule(delay = DEBOUNCE_MS) {
  if (stopped) return;
  if (!firstDirtyAt) firstDirtyAt = Date.now();
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void flush(), Math.min(delay, Math.max(0, firstDirtyAt + MAX_WAIT_MS - Date.now())));
}

const chunks = <T,>(list: T[], size: number): T[][] => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

/**
 * Send everything queued. Safe to call at any time and from anywhere: a second call while one is
 * running just asks for another pass when it finishes.
 */
export function flush(opts: { keepalive?: boolean } = {}): Promise<void> {
  if (!apiMode() || stopped) return Promise.resolve();
  if (inFlight) {
    again = true;
    return inFlight;
  }
  if (!queued()) return Promise.resolve();

  if (timer) clearTimeout(timer);
  timer = null;
  firstDirtyAt = 0;

  inFlight = (async () => {
    // What is being sent now. Anything changed meanwhile stays queued for the next pass.
    const st = useStore.getState();
    const sentSessions = [...meta.queue.sessions];
    const sentTags = [...meta.queue.tags];
    const sentMarks = [...meta.queue.bookmarks];
    const sentAttempts = [...meta.queue.attempts];
    const stampAt = { s: { ...meta.stamps.s }, t: { ...meta.stamps.t }, b: { ...meta.stamps.b } };

    const sessions = sentSessions.map((id) => {
      const run = st.sessions.find((x) => x.id === id);
      return run ? { id, data: run, updatedAt: stampAt.s[id] } : { id, deleted: true, updatedAt: stampAt.s[id] };
    });
    const tags = sentTags.map((itemId) => ({ itemId, tag: st.tags[itemId] ?? null, auto: Boolean(st.autoTags[itemId]), updatedAt: stampAt.t[itemId] }));
    const bookmarks = sentMarks.map((itemId) => ({ itemId, on: Boolean(st.bookmarks[itemId]), updatedAt: stampAt.b[itemId] }));
    const attempts = sentAttempts.map((a) => ({ ...a, answer: a.answer ?? null, sourceId: a.sourceId ?? null }));

    const bodies: Record<string, unknown>[] = [
      ...chunks(sessions, CHUNK.sessions).map((c) => ({ sessions: c })),
      ...chunks(attempts, CHUNK.rows).map((c) => ({ attempts: c })),
      ...chunks(tags, CHUNK.rows).map((c) => ({ tags: c })),
      ...chunks(bookmarks, CHUNK.rows).map((c) => ({ bookmarks: c })),
    ];

    try {
      for (const body of bodies) await api("/progress", { body, keepalive: opts.keepalive });
      // Confirmed. Remove what was sent, unless it changed again while it was in flight.
      meta.queue.sessions = meta.queue.sessions.filter((id) => !sentSessions.includes(id) || meta.stamps.s[id] !== stampAt.s[id]);
      meta.queue.tags = meta.queue.tags.filter((k) => !sentTags.includes(k) || meta.stamps.t[k] !== stampAt.t[k]);
      meta.queue.bookmarks = meta.queue.bookmarks.filter((k) => !sentMarks.includes(k) || meta.stamps.b[k] !== stampAt.b[k]);
      meta.queue.attempts = meta.queue.attempts.filter((a) => !sentAttempts.includes(a));
      backoff = 0;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Signed out elsewhere. Keep the queue; the next sign-in as this student sends it.
        halt();
        stopped = true;
      } else if (err instanceof ApiError && (err.status === 422 || err.status === 413)) {
        // The server has looked at this batch and will never accept it, so retrying forever would
        // block everything behind it. Say so loudly and move on. Anything else that is not a
        // success (a 404 while the API is being deployed, a 5xx, a rate limit) is worth another go.
        console.error("Progress could not be saved and was dropped:", err.message, err.errors);
        meta.queue = { sessions: [], attempts: [], tags: [], bookmarks: [] };
      } else {
        // Offline, a server error or a rate limit: try again, a little slower each time.
        backoff = Math.min(60000, backoff ? backoff * 2 : 5000);
        setTimeout(() => schedule(0), backoff);
      }
    } finally {
      save();
    }
  })().finally(() => {
    inFlight = null;
    if (again) {
      again = false;
      if (queued()) void flush(opts);
    }
  });
  return inFlight;
}

/* ------------------------------------------------------------------ */
/* Start and stop                                                      */
/* ------------------------------------------------------------------ */

/**
 * Begin syncing for this student. Call it whenever the signed-in student is known; calling it
 * again for the same student does nothing, and for a different one starts over cleanly.
 */
export function startProgressSync(userId: number, who: { email: string; previousEmail?: string }): Promise<void> {
  if (!apiMode() || typeof window === "undefined") return Promise.resolve();
  if (started === userId && starting) return starting;
  if (started !== null && started !== userId) halt();

  started = userId;
  stopped = false;
  starting = (async () => {
    // The persisted store has to be back first, or "what is local" would be an empty default.
    if (!useStore.persist.hasHydrated()) await new Promise<void>((resolve) => useStore.persist.onFinishHydration(() => resolve()));

    meta = load();
    // Whose is the progress in this browser? Normally the record says. A browser that held
    // progress before this existed has no record, and then the best evidence is who was signed
    // in last: if it is the same person, the progress is theirs and goes up to the server rather
    // than being thrown away; if it is anyone else, it is not theirs and must not be uploaded.
    const mine = meta.owner !== null ? meta.owner === userId : Boolean(who.previousEmail) && who.previousEmail?.toLowerCase() === who.email.toLowerCase();
    if (!mine) {
      wipeLocal();
      meta = emptyMeta(userId);
    } else {
      meta.owner = userId;
    }
    save();

    try {
      await pull();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        halt();
        stopped = true;
        return;
      }
      // Offline or a server hiccup: carry on with what is local; the next visit pulls again.
      console.warn("Progress could not be loaded yet:", err instanceof Error ? err.message : err);
    }

    unsubscribe = useStore.subscribe(onChange);
    const onVisible = () => {
      if (document.visibilityState === "hidden") void flush({ keepalive: true });
      else if (Date.now() - lastPull > PULL_EVERY_MS) void pull().catch(() => undefined);
    };
    const onHide = () => void flush({ keepalive: true });
    const onOnline = () => void flush();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("online", onOnline);
    teardown = () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("online", onOnline);
    };
    if (queued()) schedule(0);
  })();
  return starting;
}

function halt() {
  unsubscribe?.();
  teardown?.();
  unsubscribe = teardown = null;
  if (timer) clearTimeout(timer);
  timer = null;
  started = null;
  starting = null;
  firstDirtyAt = 0;
}

/**
 * Stop syncing. With `wipe` (signing out) the last changes are sent first, while the session is
 * still good, and then this browser's copy of the progress is cleared so the next person to use
 * it starts clean.
 */
export async function stopProgressSync(opts: { wipe?: boolean } = {}): Promise<void> {
  if (!apiMode() || typeof window === "undefined") return;
  if (starting) await starting.catch(() => undefined);
  if (opts.wipe && started !== null) {
    // Best effort, and not allowed to hold sign-out hostage if the network is down.
    await Promise.race([flush(), new Promise<void>((resolve) => setTimeout(resolve, 3000))]).catch(() => undefined);
  }
  halt();
  stopped = true;
  if (opts.wipe) {
    wipeLocal();
    meta = emptyMeta(null);
    save();
  }
}
