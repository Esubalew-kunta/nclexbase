"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Answer, MasteryTag, Pool, SessionEntry, TestSession } from "./types";
import { scoreItem } from "./scoring";
import { itemById } from "./bank";

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
}

interface PersistedState {
  user: { name: string; email: string; plan: "free" | "premium" };
  sessions: TestSession[];
  tags: Record<string, MasteryTag>;
  bookmarks: Record<string, boolean>;
  schedule: Schedule | null;
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
  user: { name: "", email: "student@example.com", plan: "free" },
  sessions: [],
  tags: {},
  bookmarks: {},
  schedule: null,
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

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initial,
      hydrated: false,
      createTestOpen: false,
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
          // Live behavior: answering auto-tags the question (full credit → Mastered,
          // partial → Reviewing, none → Learning) unless the user already tagged it.
          let tags = s.tags;
          if (session && !s.tags[itemId]) {
            const { earned, max } = scoreItem(itemById(itemId), session.answers[itemId]);
            tags = { ...s.tags, [itemId]: earned >= max ? "mastered" : earned > 0 ? "reviewing" : "learning" };
          }
          return { tags, sessions: patchSession(s.sessions, sid, (x) => ({ ...x, submitted: { ...x.submitted, [itemId]: true } })) };
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
        set((s) => ({
          sessions: patchSession(s.sessions, sid, (x) => {
            // Ending a test marks every item used; unanswered items score 0, as on the live app.
            const submitted = { ...x.submitted };
            for (const e of x.entries) submitted[e.itemId] = true;
            return { ...x, submitted, status: "ended" };
          }),
        })),

      setTag: (itemId, tag) =>
        set((s) => {
          const tags = { ...s.tags };
          if (tag) tags[itemId] = tag;
          else delete tags[itemId];
          return { tags };
        }),

      toggleBookmark: (itemId) => set((s) => ({ bookmarks: { ...s.bookmarks, [itemId]: !s.bookmarks[itemId] } })),
      setSchedule: (schedule) => set({ schedule }),
      setExamSettings: (patch) => set((s) => ({ examSettings: { ...s.examSettings, ...patch } })),
      setFlag: (key, on) => set((s) => ({ flags: { ...s.flags, [key]: on } })),

      touchStreak: () =>
        set((s) => {
          const t = today();
          if (s.streak.lastDay === t) return {};
          const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
          return { streak: { count: s.streak.lastDay === yesterday ? s.streak.count + 1 : 1, lastDay: t } };
        }),

      resetProgress: () => set({ sessions: [], tags: {}, bookmarks: {} }),
      resetAll: () => {
        useStore.persist.clearStorage();
        set({ ...initial, streak: { count: 1, lastDay: today() }, createTestOpen: false, mobileNavOpen: false, contactOpen: false });
      },
      setSidebarSubjectsOpen: (sidebarSubjectsOpen) => set({ sidebarSubjectsOpen }),
      deleteSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
      dismissTip: (key) => set((s) => ({ dismissedTips: { ...s.dismissedTips, [key]: true } })),
    }),
    {
      name: "nclex-bootcamp-clone",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // Deep-merge settings so fields added later (e.g. examSettings.timer) get defaults.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PersistedState>;
        return { ...current, ...p, examSettings: { ...current.examSettings, ...(p.examSettings ?? {}) }, user: { ...current.user, ...(p.user ?? {}) } };
      },
      partialize: (s): PersistedState => ({
        user: s.user,
        sessions: s.sessions,
        tags: s.tags,
        bookmarks: s.bookmarks,
        schedule: s.schedule,
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
export function usedItemIds(sessions: TestSession[]): Set<string> {
  const used = new Set<string>();
  for (const s of sessions) for (const id of Object.keys(s.submitted)) if (s.submitted[id]) used.add(id);
  return used;
}

/** Latest submitted answer per item, across sessions. */
export function latestAttempts(sessions: TestSession[]) {
  const map = new Map<string, { session: TestSession; answer: Answer }>();
  for (const s of sessions)
    for (const e of s.entries)
      if (s.submitted[e.itemId] && s.answers[e.itemId]) map.set(e.itemId, { session: s, answer: s.answers[e.itemId] });
  return map;
}
