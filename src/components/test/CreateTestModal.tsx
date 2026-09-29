"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Info, Minus, Plus, ShieldCheck } from "lucide-react";
import { SUBJECTS } from "@/data/catalog";
import { CASES } from "@/data/cases";
import { ALL_ITEMS, buildEntries } from "@/lib/bank";
import { usedItemIds, useStore } from "@/lib/store";
import type { Item, Pool, SubjectId } from "@/lib/types";
import { Checkbox, CountPill, Modal, Toggle } from "@/components/ui/primitives";

const POOLS: { id: Pool; label: string }[] = [
  { id: "unused", label: "Unused" },
  { id: "learning", label: "Learning" },
  { id: "reviewing", label: "Reviewing" },
  { id: "mastered", label: "Mastered" },
  { id: "bookmarked", label: "Bookmarked" },
];

const MAX_QUESTIONS = 150;
const caseItemIds = new Set(CASES.flatMap((c) => c.items.map((i) => i.id)));

export function CreateTestModal() {
  const open = useStore((s) => s.createTestOpen);
  const setUi = useStore((s) => s.setUi);
  // Remount on open so the form resets each time.
  return open ? <CreateTestForm onClose={() => setUi({ createTestOpen: false })} /> : null;
}

function CreateTestForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const sessions = useStore((s) => s.sessions);
  const tags = useStore((s) => s.tags);
  const bookmarks = useStore((s) => s.bookmarks);
  const plan = useStore((s) => s.user.plan);
  const createSession = useStore((s) => s.createSession);

  const [tutor, setTutor] = useState(true);
  const [timed, setTimed] = useState(false);
  const [pools, setPools] = useState<Set<Pool>>(new Set(["unused"]));
  const [subjects, setSubjects] = useState<Set<SubjectId>>(new Set(SUBJECTS.map((s) => s.id)));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [count, setCount] = useState(6);

  const used = useMemo(() => usedItemIds(sessions), [sessions]);
  const inPool = (item: Item, pool: Pool) => {
    switch (pool) {
      case "unused":
        return !used.has(item.id);
      case "bookmarked":
        return Boolean(bookmarks[item.id]);
      default:
        return tags[item.id] === pool;
    }
  };
  const poolCount = (pool: Pool) => ALL_ITEMS.filter((i) => inPool(i, pool)).length;
  const poolItems = ALL_ITEMS.filter((i) => [...pools].some((p) => inPool(i, p)));
  const selected = poolItems.filter((i) => subjects.has(i.subject));
  const max = Math.min(MAX_QUESTIONS, selected.length);
  const n = Math.min(count, max);

  const isFree = plan === "free";
  const togglePool = (p: Pool) =>
    setPools((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  const toggleSubject = (id: SubjectId) =>
    setSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const start = () => {
    if (!n) return;
    const entries = buildEntries({
      subjects: [...subjects],
      exclude: new Set(),
      include: new Set(selected.map((i) => i.id)),
      count: n,
    });
    const id = createSession({ kind: "custom", entries, tutor, timed, pool: [...pools][0] ?? "unused", timeLimit: timed ? entries.length * 90 : undefined });
    onClose();
    router.push(`/nclex/custom-test?id=${id}`);
  };

  const subjectRows = SUBJECTS.map((s) => ({
    subject: s,
    count: poolItems.filter((i) => i.subject === s.id).length,
    systems: groupBySystem(poolItems.filter((i) => i.subject === s.id)),
  }));
  const allSubjects = subjects.size === SUBJECTS.length;
  const freeCount = poolItems.length;
  const caseCount = poolItems.filter((i) => caseItemIds.has(i.id)).length;

  return (
    <Modal
      open
      onClose={onClose}
      title="Create Test"
      width={780}
      footer={
        <button
          onClick={start}
          disabled={!n}
          className="h-14 w-full rounded-full bg-brand text-lg font-semibold text-white shadow-press hover:bg-[#6a5eef] active:translate-y-px active:shadow-none disabled:opacity-50"
        >
          Start Test
        </button>
      }
    >
      <div className="px-6">
        {/* Settings */}
        <Section title="Test Settings" info="Tutor mode shows the answer and explanation after each question. Timed mode gives about 1.5 minutes per question.">
          <div className="flex flex-wrap gap-6">
            <Toggle checked={tutor} onChange={setTutor} label="Tutor" />
            <Toggle checked={timed} onChange={setTimed} label="Timed" />
          </div>
        </Section>

        {/* Pools */}
        <Section title="Question Pools" info="Pick which questions to draw from. Tag questions as Learning, Reviewing, or Mastered after you answer them.">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {POOLS.map((p) => {
              const c = poolCount(p.id);
              const on = pools.has(p.id);
              return (
                <label key={p.id} className={clsx("flex cursor-pointer items-center gap-2 text-base", on ? "text-ink" : "text-muted")}>
                  <Checkbox checked={on} onChange={() => togglePool(p.id)} />
                  {p.label}
                  <CountPill muted={!on}>{c}</CountPill>
                </label>
              );
            })}
          </div>
        </Section>

        {/* Subjects */}
        <section className="border-b border-line py-5">
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-lg font-semibold text-ink-strong">
              <Checkbox
                checked={allSubjects}
                indeterminate={!allSubjects && subjects.size > 0}
                onChange={() => setSubjects(allSubjects ? new Set() : new Set(SUBJECTS.map((s) => s.id)))}
              />
              Subjects
            </label>
            <button
              onClick={() => setExpanded(expanded.size ? new Set() : new Set(SUBJECTS.map((s) => s.id)))}
              className="flex items-center gap-1.5 text-base text-ink hover:text-brand"
            >
              {expanded.size ? <Minus className="size-4" /> : <Plus className="size-4" />}
              {expanded.size ? "Collapse All" : "Expand All"}
            </button>
          </div>

          {isFree && (
            <div className="mt-4 flex items-center gap-3 rounded-lg bg-gradient-to-r from-[#efedfd] to-[#fbeef3] px-4 py-3">
              <ShieldCheck className="size-6 shrink-0 fill-brand text-white" />
              <span className="flex-1 text-base text-ink">Upgrade to unlock all questions.</span>
              <Link href="/nclex/upgrade" onClick={onClose} className="text-base font-medium text-ink underline underline-offset-2">
                View Pricing
              </Link>
            </div>
          )}

          <div className="mt-4 grid gap-x-10 gap-y-1 sm:grid-cols-2">
            {isFree && (
              <>
                <TreeRow label="Free Questions" count={freeCount} checked={allSubjects} onToggle={() => setSubjects(allSubjects ? new Set() : new Set(SUBJECTS.map((s) => s.id)))} expanded={expanded.has("free")} onExpand={() => toggleExpand("free")} />
                {expanded.has("free") && (
                  <TreeRow nested label="Free Questions" count={freeCount} checked={allSubjects} onToggle={() => setSubjects(allSubjects ? new Set() : new Set(SUBJECTS.map((s) => s.id)))} />
                )}
                <TreeRow label="Case Studies" count={caseCount} locked />
              </>
            )}
            {subjectRows.map(({ subject, count, systems }) => (
              <div key={subject.id}>
                <TreeRow
                  label={subject.name}
                  count={isFree ? subject.standaloneCount : count}
                  locked={isFree}
                  checked={subjects.has(subject.id)}
                  onToggle={() => toggleSubject(subject.id)}
                  expanded={expanded.has(subject.id)}
                  onExpand={() => toggleExpand(subject.id)}
                />
                {!isFree &&
                  expanded.has(subject.id) &&
                  systems.map(([system, c]) => (
                    <TreeRow key={system} nested label={system} count={c} checked={subjects.has(subject.id)} onToggle={() => toggleSubject(subject.id)} />
                  ))}
              </div>
            ))}
          </div>
        </section>

        {/* Count */}
        <section className="py-5">
          <h3 className="text-lg font-semibold text-ink-strong">Number of Questions</h3>
          <p className="mt-1 text-base text-muted">You can have a maximum of {MAX_QUESTIONS} questions per test.</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-12 w-24 items-center rounded-lg border border-line px-3">
              <input
                type="number"
                min={1}
                max={max}
                value={n}
                onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
                aria-label="Number of questions"
                className="w-full bg-transparent text-base text-ink outline-none"
              />
            </div>
            <input
              type="range"
              min={1}
              max={Math.max(1, max)}
              value={n}
              onChange={(e) => setCount(Number(e.target.value))}
              aria-label="Number of questions slider"
              className="h-1.5 flex-1 cursor-pointer accent-brand"
            />
          </div>
          <p className="mt-4 text-base text-muted">
            {n ? `This test should take about ${Math.max(1, Math.round(n * 1.5))}min to complete.` : "No questions match these filters."}
          </p>
        </section>
      </div>
    </Modal>
  );
}

function Section({ title, info, children }: { title: string; info: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line py-5">
      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink-strong">
        {title}
        <span title={info} className="text-faint">
          <Info className="size-4" />
        </span>
      </h3>
      {children}
    </section>
  );
}

function TreeRow({
  label,
  count,
  locked,
  checked = false,
  onToggle,
  expanded,
  onExpand,
  nested,
}: {
  label: string;
  count: number;
  locked?: boolean;
  checked?: boolean;
  onToggle?: () => void;
  expanded?: boolean;
  onExpand?: () => void;
  nested?: boolean;
}) {
  return (
    <div className={clsx("flex h-[31px] items-center gap-2", nested && "pl-6")}>
      {locked ? (
        <span className="flex size-[18px] items-center justify-center rounded-[4px] bg-[#f1f1f3]" title="Upgrade to unlock">
          <ShieldCheck className="size-3 text-muted" />
        </span>
      ) : (
        <Checkbox checked={checked} onChange={onToggle} />
      )}
      <span className={clsx("truncate", nested ? "text-sm" : "text-base", locked ? "text-ink" : "text-ink")}>{label}</span>
      <CountPill>{count}</CountPill>
      {onExpand && (
        <button onClick={onExpand} aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`} className="ml-auto text-faint hover:text-ink">
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      )}
    </div>
  );
}

function groupBySystem(items: Item[]) {
  const map = new Map<string, number>();
  for (const i of items) map.set(i.system, (map.get(i.system) ?? 0) + 1);
  return [...map.entries()];
}
