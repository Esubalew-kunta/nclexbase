"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Answer, Attempt, MasteryTag, Pool, SessionEntry, SubjectId, TestSession } from "./types";
import { scoreItem } from "./scoring";
import { itemById } from "./bank";
import { getConfig } from "./content";
import { EMPTY_EDITS, type CustomAssignment, type ScheduleEdits, type SpeedKey, type Tone } from "./schedule";

export interface ExamSettings {
  textSize: number;
  answerStats: boolean;
  shortcuts: boolean;
  restrictions: boolean;
  gridView: boolean;
  hoverPreview: boolean;
  timer: boolean;
}

export interface Schedule {
  start: string;
  exam: string | null;
  daysOff: number[];
  /** Specific dates off (ISO), from the days-off calendar. */
  offDates?: string[];
  createdAt: string;
  /** Study speed scales assignment durations (custom assignments are unaffected). */
  speed?: SpeedKey;
}

/** Study schedule calendar preferences (Settings modal + view dropdown). */
export interface SchedulePrefs {
  view: "day" | "week" | "full";
  weekStart: 0 | 1;
  compact: boolean;
  hideCompleted: boolean;
}

interface PersistedState {
  /** `signedIn`: prototype session (see lib/demo.ts); student pages send signed-out visitors to /auth/signin. */
  /** `referredBy`: referral code from the join link (?ref=), used for the friend's discount. */
  user: { name: string; email: string; plan: "free" | "premium"; signedIn?: boolean; referredBy?: string; /** From the server; undefined in the prototype, which has no mail. */ emailVerified?: boolean };
  sessions: TestSession[];
  /**
   * Every answer ever submitted. Outlives its session, so a Reset clears the run and leaves
   * the history. Performance and the "used" pool read this, not the sessions.
   */
  attempts: Attempt[];
  tags: Record<string, MasteryTag>;
  /**
   * Questions whose tag the app set from the score. A tag the student chose is theirs and is
   * never changed by a later answer; one the app set follows the latest score, as on the live app.
   */
  autoTags: Record<string, true>;
  bookmarks: Record<string, boolean>;
  schedule: Schedule | null;
  /** Daily Warmup (pro): one question emailed every day. Front-end only for now; sending needs the backend. */
  warmup: { enabled: boolean; email: string };
  scheduleEdits: ScheduleEdits;
  schedulePrefs: SchedulePrefs;
  streak: { count: number; lastDay: string };
  examSettings: ExamSettings;
  flags: Record<string, boolean>;
  sidebarSubjectsOpen: boolean;
  /** Onboarding tips the user has dismissed (e.g. "tag-questions"). */
  dismissedTips: Record<string, boolean>;
}

interface UiState {
  hydrated: boolean;
  createTestOpen: boolean;
  /** Pre-checks a subject (and optionally one system) when Create Test is opened from a subject row. */
  createTestPreset: { subject: SubjectId; system?: string } | null;
  mobileNavOpen: boolean;
  contactOpen: boolean;
}

interface Actions {
  setUi: (patch: Partial<UiState>) => void;
  setPlan: (plan: "free" | "premium") => void;
  createSession: (opts: {
    kind: TestSession["kind"];
    title?: string;
    entries: SessionEntry[];
    tutor: boolean;
    timed: boolean;
    pool: Pool;
    timeLimit?: number;
    sourceId?: string;
  }) => string;
  answer: (sessionId: string, itemId: string, answer: Answer) => void;
  submit: (sessionId: string, itemId: string) => void;
  goTo: (sessionId: string, index: number) => void;
  toggleMark: (sessionId: string, itemId: string) => void;
  tick: (sessionId: string, itemId: string, seconds: number) => void;
  endSession: (sessionId: string) => void;
  setTag: (itemId: string, tag: MasteryTag | null) => void;
  toggleBookmark: (itemId: string) => void;
  setSchedule: (s: Schedule | null) => void;
  setSchedulePrefs: (patch: Partial<SchedulePrefs>) => void;
  toggleAssignment: (id: string) => void;
  patchAssignment: (id: string, patch: { date?: string; tone?: Tone; minutes?: number }) => void;
  addCustomAssignment: (a: CustomAssignment) => void;
  patchCustomAssignment: (id: string, patch: Partial<CustomAssignment>) => void;
  deleteAssignment: (id: string) => void;
  restoreAssignment: (id: string) => void;
  /** Move not-yet-done assignments to new dates (Rebalance). */
  applyRebalance: (dates: Record<string, string>) => void;
  setWarmup: (patch: Partial<{ enabled: boolean; email: string }>) => void;
  setExamSettings: (patch: Partial<ExamSettings>) => void;
  setFlag: (key: string, on: boolean) => void;
  touchStreak: () => void;
  resetProgress: () => void;
  /** Wipe everything saved in this browser (tests, tags, schedule, settings, user). */
  resetAll: () => void;
  deleteSession: (sessionId: string) => void;
  setSidebarSubjectsOpen: (open: boolean) => void;
  dismissTip: (key: string) => void;
}

export type Store = PersistedState & UiState & Actions;

const today = () => new Date().toISOString().slice(0, 10);

const initial: PersistedState = {
  user: { name: "", email: "student@example.com", plan: "free", signedIn: false },
  sessions: [],
  attempts: [],
  tags: {},
  autoTags: {},
  bookmarks: {},
  schedule: null,
  warmup: { enabled: false, email: "" },
  scheduleEdits: EMPTY_EDITS,
  schedulePrefs: { view: "day", weekStart: 0, compact: true, hideCompleted: false },
  streak: { count: 1, lastDay: today() },
  examSettings: {
    textSize: 16,
    answerStats: true,
    shortcuts: false,
    restrictions: true,
    gridView: false,
    hoverPreview: true,
    timer: true,
  },
  flags: {},
  sidebarSubjectsOpen: false,
  dismissedTips: {},
};

const patchSession = (sessions: TestSession[], id: string, fn: (s: TestSession) => TestSession) =>
  sessions.map((s) => (s.id === id ? fn(s) : s));

const attemptOf = (session: TestSession, itemId: string, answer: Answer | undefined): Attempt => ({
  itemId,
  sessionId: session.id,
  sourceId: session.sourceId,
  kind: session.kind,
  at: new Date().toISOString(),
  answer,
  time: session.timeSpent[itemId] ?? 0,
});

/** The history a v1 student already has, so the new rule does not start them from zero. */
function attemptsFromSessions(sessions: TestSession[]): Attempt[] {
  const out: Attempt[] = [];
  for (const s of sessions)
    for (const e of s.entries)
      if (s.submitted?.[e.itemId])
        out.push({ itemId: e.itemId, sessionId: s.id, sourceId: s.sourceId, kind: s.kind, at: s.createdAt, answer: s.answers?.[e.itemId], time: s.timeSpent?.[e.itemId] ?? 0 });
  return out;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initial,
      hydrated: false,
      createTestOpen: false,
      createTestPreset: null,
      mobileNavOpen: false,
      contactOpen: false,

      setUi: (patch) => set(patch),
      setPlan: (plan) => set((s) => ({ user: { ...s.user, plan } })),

      createSession: (opts) => {
        const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        const number = get().sessions.filter((s) => s.kind === "custom").length + 1;
        const session: TestSession = {
          id,
          number,
          kind: opts.kind,
          title: opts.title ?? `Previous Test #${number}`,
          createdAt: new Date().toISOString(),
          tutor: opts.tutor,
          timed: opts.timed,
          pool: opts.pool,
          entries: opts.entries,
          answers: {},
          submitted: {},
          marked: {},
          timeSpent: {},
          current: 0,
          status: "active",
          timeLimit: opts.timeLimit,
          sourceId: opts.sourceId,
        };
        set((s) => ({ sessions: [...s.sessions, session] }));
        get().touchStreak();
        return id;
      },

      answer: (sid, itemId, answer) =>
        set((s) => ({ sessions: patchSession(s.sessions, sid, (x) => ({ ...x, answers: { ...x.answers, [itemId]: answer } })) })),

      submit: (sid, itemId) =>
        set((s) => {
          const session = s.sessions.find((x) => x.id === sid);
          if (!session) return s;
          const answer = session.answers[itemId];
          // Submitting twice must not count twice.
          const already = s.attempts.some((a) => a.sessionId === sid && a.itemId === itemId);
          const attempts = already ? s.attempts : [...s.attempts, attemptOf(session, itemId, answer)];

          // Live behavior: answering tags the question by its score (full credit: Mastered, some:
          // Reviewing, none: Learning). A tag the student set themselves is left alone; one the app
          // set follows the latest score.
          let { tags, autoTags } = s;
          if (!s.tags[itemId] || s.autoTags[itemId]) {
            const { earned, max } = scoreItem(itemById(itemId), answer);
            tags = { ...s.tags, [itemId]: earned >= max ? "mastered" : earned > 0 ? "reviewing" : "learning" };
            autoTags = { ...s.autoTags, [itemId]: true };
          }
          return { attempts, tags, autoTags, sessions: patchSession(s.sessions, sid, (x) => ({ ...x, submitted: { ...x.submitted, [itemId]: true } })) };
        }),

      goTo: (sid, index) => set((s) => ({ sessions: patchSession(s.sessions, sid, (x) => ({ ...x, current: index })) })),

      toggleMark: (sid, itemId) =>
        set((s) => ({
          sessions: patchSession(s.sessions, sid, (x) => ({ ...x, marked: { ...x.marked, [itemId]: !x.marked[itemId] } })),
        })),

      tick: (sid, itemId, seconds) =>
        set((s) => ({
          sessions: patchSession(s.sessions, sid, (x) => ({
            ...x,
            timeSpent: { ...x.timeSpent, [itemId]: (x.timeSpent[itemId] ?? 0) + seconds },
          })),
        })),

      endSession: (sid) =>
        set((s) => {
          const session = s.sessions.find((x) => x.id === sid);
          if (!session) return s;
          // Ending a test marks every item used; unanswered items score 0, as on the live app.
          const submitted = { ...session.submitted };
          const attempts = [...s.attempts];
          for (const e of session.entries) {
            if (!submitted[e.itemId] && !attempts.some((a) => a.sessionId === sid && a.itemId === e.itemId)) attempts.push(attemptOf(session, e.itemId, session.answers[e.itemId]));
            submitted[e.itemId] = true;
          }
          return { attempts, sessions: patchSession(s.sessions, sid, (x) => ({ ...x, submitted, status: "ended" })) };
        }),

      setTag: (itemId, tag) =>
        set((s) => {
          const tags = { ...s.tags };
          if (tag) tags[itemId] = tag;
          else delete tags[itemId];
          // Whatever the student does with a tag, it is theirs from here on.
          const autoTags = { ...s.autoTags };
          delete autoTags[itemId];
          return { tags, autoTags };
        }),

      toggleBookmark: (itemId) => set((s) => ({ bookmarks: { ...s.bookmarks, [itemId]: !s.bookmarks[itemId] } })),
      // A new (or cleared) schedule starts with a clean slate of edits.
      setSchedule: (schedule) => set((s) => ({ schedule, scheduleEdits: schedule && s.schedule ? s.scheduleEdits : EMPTY_EDITS })),
      setSchedulePrefs: (patch) => set((s) => ({ schedulePrefs: { ...s.schedulePrefs, ...patch } })),
      toggleAssignment: (id) => set((s) => ({ scheduleEdits: { ...s.scheduleEdits, done: { ...s.scheduleEdits.done, [id]: !s.scheduleEdits.done[id] } } })),
      patchAssignment: (id, patch) =>
        set((s) => ({ scheduleEdits: { ...s.scheduleEdits, overrides: { ...s.scheduleEdits.overrides, [id]: { ...s.scheduleEdits.overrides[id], ...patch } } } })),
      addCustomAssignment: (a) => set((s) => ({ scheduleEdits: { ...s.scheduleEdits, custom: [...s.scheduleEdits.custom, a] } })),
      patchCustomAssignment: (id, patch) =>
        set((s) => ({ scheduleEdits: { ...s.scheduleEdits, custom: s.scheduleEdits.custom.map((c) => (c.id === id ? { ...c, ...patch } : c)) } })),
      deleteAssignment: (id) => set((s) => ({ scheduleEdits: { ...s.scheduleEdits, deleted: { ...s.scheduleEdits.deleted, [id]: true } } })),
      restoreAssignment: (id) =>
        set((s) => {
          const deleted = { ...s.scheduleEdits.deleted };
          delete deleted[id];
          return { scheduleEdits: { ...s.scheduleEdits, deleted } };
        }),
      applyRebalance: (dates) =>
        set((s) => {
          const overrides = { ...s.scheduleEdits.overrides };
          for (const [id, date] of Object.entries(dates)) overrides[id] = { ...overrides[id], date };
          return { scheduleEdits: { ...s.scheduleEdits, overrides } };
        }),
      setWarmup: (patch) => set((s) => ({ warmup: { ...s.warmup, ...patch } })),
      setExamSettings: (patch) => set((s) => ({ examSettings: { ...s.examSettings, ...patch } })),
      setFlag: (key, on) => set((s) => ({ flags: { ...s.flags, [key]: on } })),

      touchStreak: () =>
        set((s) => {
          const t = today();
          if (s.streak.lastDay === t) return {};
          const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
          return { streak: { count: s.streak.lastDay === yesterday ? s.streak.count + 1 : 1, lastDay: t } };
        }),

      resetProgress: () => set({ sessions: [], attempts: [], tags: {}, autoTags: {}, bookmarks: {} }),
      resetAll: () => {
        useStore.persist.clearStorage();
        set({ ...initial, streak: { count: 1, lastDay: today() }, createTestOpen: false, createTestPreset: null, mobileNavOpen: false, contactOpen: false });
      },
      setSidebarSubjectsOpen: (sidebarSubjectsOpen) => set({ sidebarSubjectsOpen }),
      deleteSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
      dismissTip: (key) => set((s) => ({ dismissedTips: { ...s.dismissedTips, [key]: true } })),
    }),
    {
      name: "nclex-bootcamp-clone",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // v1 kept progress only inside the sessions. v2 keeps every answer in `attempts` as well, so
      // what a student has already done is carried over once rather than lost to the new rule.
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Partial<PersistedState>;
        if (version < 2) return { ...p, attempts: attemptsFromSessions(p.sessions ?? []), autoTags: {} } as PersistedState;
        return p as PersistedState;
      },
      // Deep-merge settings so fields added later (e.g. examSettings.timer) get defaults.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PersistedState>;
        // A brand-new student starts with the exam defaults set in Admin > Settings.
        if (!p.examSettings) current = { ...current, examSettings: { ...current.examSettings, ...getConfig().exam.defaults } };
        return { ...current, ...p, warmup: { ...current.warmup, ...(p.warmup ?? {}) }, schedulePrefs: { ...current.schedulePrefs, ...(p.schedulePrefs ?? {}) }, scheduleEdits: { ...current.scheduleEdits, ...(p.scheduleEdits ?? {}) }, examSettings: { ...current.examSettings, ...(p.examSettings ?? {}) }, user: { ...current.user, ...(p.user ?? {}), signedIn: p.user ? (p.user.signedIn ?? true) : false } };
      },
      partialize: (s): PersistedState => ({
        user: s.user,
        sessions: s.sessions,
        attempts: s.attempts,
        tags: s.tags,
        autoTags: s.autoTags,
        bookmarks: s.bookmarks,
        schedule: s.schedule,
        warmup: s.warmup,
        scheduleEdits: s.scheduleEdits,
        schedulePrefs: s.schedulePrefs,
        streak: s.streak,
        examSettings: s.examSettings,
        flags: s.flags,
        sidebarSubjectsOpen: s.sidebarSubjectsOpen,
        dismissedTips: s.dismissedTips,
      }),
    },
  ),
);

/* ------------------------------------------------------------------ */
/* Derived selectors                                                   */
/* ------------------------------------------------------------------ */

/** Item ids the user has submitted in any test. */
/** Every question that has ever been submitted. Once used, always used, even after a Reset. */
export function usedItemIds(attempts: Attempt[]): Set<string> {
  return new Set(attempts.map((a) => a.itemId));
}

/**
 * The first run of a case study or exam, and how many runs there have been.
 *
 * "First" is by when it was started, not by what is left in the sessions list: a Reset deletes the
 * session but not its attempts, which is the point.
 */
export function firstRun(attempts: Attempt[], sourceId: string): { attempts: Attempt[]; runs: number } | null {
  const mine = attempts.filter((a) => a.sourceId === sourceId);
  if (!mine.length) return null;
  const order: string[] = [];
  for (const a of mine) if (!order.includes(a.sessionId)) order.push(a.sessionId);
  return { attempts: mine.filter((a) => a.sessionId === order[0]), runs: order.length };
}
