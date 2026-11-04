"use client";

import { useCallback, useMemo, useReducer } from "react";
import { createPortal } from "react-dom";
import { Eye, RotateCcw, X } from "lucide-react";
import type { CaseRec, QuestionRec } from "@/lib/admin/types";
import { caseForItem } from "@/lib/bank";
import { getConfig } from "@/lib/content";
import type { ExamSettings } from "@/lib/store";
import type { Answer, CaseStudy, Item, MasteryTag, SessionEntry, TestSession } from "@/lib/types";
import { ExamView } from "@/components/exam/ExamView";

/*
 * Admin preview: the real exam screen, answerable, saving nothing.
 *
 * It renders the same ExamView the students get. What differs is only where the state lives: here
 * it is a reducer inside this component, so answering, submitting, tagging and changing the text
 * size can never reach the student store ("nclex-bootcamp-clone"), the progress sync, the admin
 * store or the server. This file must not import `@/lib/store` for anything but a type, and must
 * not call the API. The check in web/scripts/check-preview-isolated.mjs fails the build if it does.
 */

export interface PreviewSource {
  items: Item[];
  /** The scenario the items belong to, when they are case items. */
  study?: CaseStudy;
  /** Which item to open on. */
  start: number;
  /** Shown in the banner, e.g. "Showing your unsaved changes". */
  note?: string;
}

/** What to preview for a question: its whole case when it has one, otherwise just the item. */
export function previewForQuestion(q: Item, opts: { note?: string } = {}): PreviewSource {
  const study = caseForItem(q.id);
  if (!study) return { items: [q], start: 0, note: opts.note };
  // The item being edited replaces its saved self, so unsaved changes show in context.
  const items = study.items.map((i) => (i.id === q.id ? q : i));
  return { items, study: { ...study, items }, start: Math.max(0, items.findIndex((i) => i.id === q.id)), note: opts.note };
}

/** What to preview for a case study: all its items, in order. */
export function previewForCase(rec: CaseRec, questions: QuestionRec[], opts: { note?: string } = {}): PreviewSource | null {
  if (!rec.content) return null;
  const study: CaseStudy = { id: rec.id, title: rec.title, subject: rec.subject, intro: rec.content.intro, exhibit: rec.content.exhibit, tabs: rec.content.tabs, items: questions };
  return { items: questions, study, start: 0, note: opts.note };
}

/** Why a source cannot be shown, or null when it can. */
export function previewProblem(src: PreviewSource): string | null {
  if (!src.items.length) return "This has no questions yet.";
  if (src.study && !src.study.tabs.length) return "This case study has no scenario tabs yet.";
  return null;
}

interface PState {
  session: TestSession;
  tags: Record<string, MasteryTag | undefined>;
  settings: ExamSettings;
  tipDismissed: boolean;
}

type Action =
  | { type: "answer"; itemId: string; answer: Answer }
  | { type: "submit"; itemId: string }
  | { type: "goto"; index: number }
  | { type: "mark"; itemId: string }
  | { type: "tick"; itemId: string; seconds: number }
  | { type: "tag"; itemId: string; tag: MasteryTag | null }
  | { type: "dismissTip" }
  | { type: "settings"; patch: Partial<ExamSettings> }
  | { type: "reset"; start: number };

function freshSession(src: PreviewSource): TestSession {
  const entries: SessionEntry[] = src.items.map((i) => ({ itemId: i.id, caseId: src.study?.id }));
  return {
    id: "preview",
    number: 0,
    kind: src.study ? "case" : "custom",
    title: src.study?.title ?? "Preview",
    createdAt: "",
    tutor: true,
    timed: false,
    pool: "unused",
    entries,
    answers: {},
    submitted: {},
    marked: {},
    timeSpent: {},
    current: Math.min(src.start, Math.max(0, entries.length - 1)),
    status: "active",
  };
}

function reduce(s: PState, a: Action): PState {
  const withSession = (patch: Partial<TestSession>): PState => ({ ...s, session: { ...s.session, ...patch } });
  switch (a.type) {
    case "answer":
      return withSession({ answers: { ...s.session.answers, [a.itemId]: a.answer } });
    case "submit":
      return withSession({ submitted: { ...s.session.submitted, [a.itemId]: true } });
    case "goto":
      return withSession({ current: a.index });
    case "mark":
      return withSession({ marked: { ...s.session.marked, [a.itemId]: !s.session.marked[a.itemId] } });
    case "tick":
      return withSession({ timeSpent: { ...s.session.timeSpent, [a.itemId]: (s.session.timeSpent[a.itemId] ?? 0) + a.seconds } });
    case "tag": {
      const tags = { ...s.tags };
      if (a.tag) tags[a.itemId] = a.tag;
      else delete tags[a.itemId];
      return { ...s, tags };
    }
    case "dismissTip":
      return { ...s, tipDismissed: true };
    case "settings":
      return { ...s, settings: { ...s.settings, ...a.patch } };
    case "reset":
      return { ...s, session: { ...s.session, answers: {}, submitted: {}, marked: {}, timeSpent: {}, current: a.start }, tags: {} };
  }
}

export function ExamPreview({ source, onClose }: { source: PreviewSource; onClose: () => void }) {
  const [state, dispatch] = useReducer(reduce, source, (src): PState => ({ session: freshSession(src), tags: {}, settings: { ...getConfig().exam.defaults }, tipDismissed: false }));
  const byId = useMemo(() => new Map(source.items.map((i) => [i.id, i])), [source.items]);
  const getItem = useCallback((id: string) => byId.get(id) as Item, [byId]);
  const getCase = useCallback((id: string) => (source.study && byId.has(id) ? source.study : undefined), [source.study, byId]);
  const onTick = useCallback((itemId: string, seconds: number) => dispatch({ type: "tick", itemId, seconds }), []);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-white" role="dialog" aria-label="Preview" data-testid="exam-preview">
      <div className="flex h-10 shrink-0 items-center gap-3 bg-gold px-3 text-sm text-ink">
        <Eye className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">
          <b>Preview.</b> This is how students see it. Nothing you do here is saved.
          {source.note && <span className="ml-2 rounded bg-white/60 px-1.5 py-0.5 text-xs font-semibold">{source.note}</span>}
        </span>
        <button
          type="button"
          onClick={() => dispatch({ type: "reset", start: source.start })}
          className="flex h-7 cursor-pointer items-center gap-1 rounded px-2 font-semibold hover:bg-white/50"
        >
          <RotateCcw className="size-3.5" />
          Start over
        </button>
        <button type="button" onClick={onClose} data-testid="preview-close" className="flex h-7 cursor-pointer items-center gap-1 rounded px-2 font-semibold hover:bg-white/50">
          <X className="size-3.5" />
          Close
        </button>
      </div>
      <ExamView
        className="min-h-0 flex-1"
        session={state.session}
        review={false}
        getItem={getItem}
        getCase={getCase}
        tags={state.tags}
        bookmarks={NO_BOOKMARKS}
        settings={state.settings}
        tipDismissed={state.tipDismissed}
        plan="premium"
        onAnswer={(itemId, answer) => dispatch({ type: "answer", itemId, answer })}
        onSubmit={(itemId) => dispatch({ type: "submit", itemId })}
        onGoTo={(index) => dispatch({ type: "goto", index })}
        onToggleMark={(itemId) => dispatch({ type: "mark", itemId })}
        onTick={onTick}
        onTag={(itemId, tag) => dispatch({ type: "tag", itemId, tag })}
        onDismissTip={() => dispatch({ type: "dismissTip" })}
        onSettings={(patch) => dispatch({ type: "settings", patch })}
        onFinish={onClose}
        onExitReview={onClose}
      />
    </div>,
    document.body,
  );
}

const NO_BOOKMARKS: Record<string, boolean> = {};
