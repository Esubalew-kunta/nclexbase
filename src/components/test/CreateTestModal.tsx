"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { subjectById, TOTALS } from "@/data/catalog";
import { buildEntries, studyItems } from "@/lib/bank";
import { useBank, useCaseRows, useConfig, useSubjects } from "@/lib/content";
import { usedItemIds, useStore } from "@/lib/store";
import type { Item, Pool, SubjectId } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Checkbox, CountPill, Modal, Toggle } from "@/components/ui/primitives";

const POOLS: { id: Pool; label: string; tone: "brand" | "bad" | "warn" | "good" }[] = [
  { id: "unused", label: "Unused", tone: "brand" },
  { id: "learning", label: "Learning", tone: "bad" },
  { id: "reviewing", label: "Reviewing", tone: "warn" },
  { id: "mastered", label: "Mastered", tone: "good" },
  { id: "bookmarked", label: "Bookmarked", tone: "brand" },
];

const MAX_QUESTIONS = 150;

function LockBox() {
  return (
    <span className="flex size-[18px] shrink-0 items-center justify-center rounded-[4px] bg-background">
      <Icon name="shield" size={11} className="text-gold" />
    </span>
  );
}

function Info({ tip }: { tip: string }) {
  return (
    <span className="group relative ml-1.5 flex text-muted" tabIndex={0}>
      <svg viewBox="0 0 28 28" className="size-4" fill="currentColor">
        <path d="M2 14a12 12 0 1 0 24 0 12 12 0 0 0-24 0Zm13.25-6a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0ZM14 11c.55 0 1 .45 1 1v8a1 1 0 1 1-2 0v-8c0-.55.45-1 1-1Z" />
      </svg>
      <span className="pointer-events-none absolute top-6 left-1/2 z-10 hidden w-64 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-sm font-normal text-white shadow-lg group-hover:block group-focus:block">
        {tip}
      </span>
    </span>
  );
}

export function CreateTestModal() {
  const open = useStore((s) => s.createTestOpen);
  const setUi = useStore((s) => s.setUi);
  return open ? <CreateTestForm onClose={() => setUi({ createTestOpen: false, createTestPreset: null })} /> : null;
}

interface Node {
  id: string;
  label: string;
  count: number;
  locked: boolean;
  subject?: SubjectId;
  children: { id: string; label: string; count: number; locked: boolean; system?: string }[];
}

function CreateTestForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const sessions = useStore((s) => s.sessions);
  const tags = useStore((s) => s.tags);
  const bookmarks = useStore((s) => s.bookmarks);
  const plan = useStore((s) => s.user.plan);
  const createSession = useStore((s) => s.createSession);
  const preset = useStore((s) => s.createTestPreset);
  const isFree = plan === "free";

  const [tutor, setTutor] = useState(true);
  const [timed, setTimed] = useState(false);
  const [pools, setPools] = useState<Set<Pool>>(new Set(["unused"]));
  const [expanded, setExpanded] = useState<Set<string>>(() => (!isFree && preset ? new Set([preset.subject]) : new Set()));
  const [count, setCount] = useState(6);

  const bank = useBank();
  const allItems = useMemo(() => studyItems(), [bank]); // eslint-disable-line react-hooks/exhaustive-deps
  const caseRows = useCaseRows();
  const subjects = useSubjects();
  const freeQuestions = useConfig().freeTier.freeQuestions;
  const used = useMemo(() => usedItemIds(sessions), [sessions]);
  const inPool = (item: Item, pool: Pool) =>
    pool === "unused" ? !used.has(item.id) : pool === "bookmarked" ? Boolean(bookmarks[item.id]) : tags[item.id] === pool;
  const poolCount = (pool: Pool) => {
    const n = allItems.filter((i) => inPool(i, pool)).length;
    // Free accounts see the free-question allowance (Admin > Plans & Access) minus what they've used.
    return pool === "unused" && isFree ? Math.max(0, freeQuestions - used.size) : n;
  };

  const nodes: Node[] = [
    {
      id: "cases",
      label: "Case Studies",
      count: TOTALS.cases,
      locked: isFree,
      children: caseRows.map((r) => ({ id: `case:${r.id}`, label: r.title, count: r.number <= 2 ? 5 : 6, locked: isFree })),
    },
    ...subjects.map((s) => {
      // Question counts mirror the live catalog; systems and names come from Admin > Subjects & Systems.
      const live = subjectById(s.id);
      return {
        id: s.id,
        label: s.name,
        count: live.standaloneCount,
        locked: isFree,
        subject: s.id,
        children: s.systems
          .filter((sys) => sys.visible)
          .map((sys) => ({ id: `${s.id}:${sys.key}`, label: sys.label, count: live.systems.find((x) => x.name === sys.key)?.count ?? 0, locked: isFree, system: sys.key })),
      };
    }),
  ];
  const leftIds = ["cases", "adult-health", "child-health", "fundamentals"];
  const [selected, setSelected] = useState<Set<string>>(() => {
    if (isFree) return new Set(["free", "free:all"]);
    const node = preset && nodes.find((n) => n.id === preset.subject);
    if (node) {
      const sys = node.children.filter((c) => c.id === `${node.id}:${preset.system}`);
      return sys.length ? new Set(sys.map((c) => c.id)) : new Set([node.id, ...node.children.map((c) => c.id)]);
    }
    return new Set(nodes.flatMap((n) => [n.id, ...n.children.map((c) => c.id)]));
  });

  const toggleSel = (ids: string[], on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      ids.forEach((id) => (on ? n.add(id) : n.delete(id)));
      return n;
    });
  const toggleExp = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // Items available for the test given pools + selection.
  const poolItems = allItems.filter((i) => [...pools].some((p) => inPool(i, p)));
  const chosen = poolItems.filter((i) =>
    isFree ? selected.has("free") : selected.has(i.subject) || [...selected].some((id) => id === `${i.subject}:${i.system}`),
  );
  const selectedCount = isFree
    ? selected.has("free")
      ? poolCount("unused")
      : 0
    : nodes.reduce((a, n) => a + n.children.filter((c) => selected.has(c.id)).reduce((b, c) => b + c.count, 0), 0);
  const max = Math.min(MAX_QUESTIONS, selectedCount);
  const n = Math.min(count, max);
  const allSelectable = isFree ? ["free", "free:all"] : nodes.flatMap((x) => [x.id, ...x.children.map((c) => c.id)]);
  // Live: on free accounts the "Subjects" select-all box stays unchecked.
  const allOn = !isFree && allSelectable.every((id) => selected.has(id));
  const someOn = allSelectable.some((id) => selected.has(id));

  const start = () => {
    if (!n || !chosen.length) return;
    const entries = buildEntries({ subjects: "all", exclude: new Set(), include: new Set(chosen.map((i) => i.id)), count: n });
    const id = createSession({ kind: "custom", entries, tutor, timed, pool: [...pools][0] ?? "unused", timeLimit: timed ? entries.length * 90 : undefined });
    onClose();
    router.push(`/nclex/custom-test?id=${id}`);
  };

  const renderNode = (node: Node) => {
    const exp = expanded.has(node.id);
    const childIds = node.children.map((c) => c.id);
    const on = selected.has(node.id);
    return (
      <div key={node.id}>
        <div className="flex cursor-pointer items-center justify-between rounded hover:bg-primary-light" onClick={() => toggleExp(node.id)}>
          <label className="flex items-center pl-1" onClick={(e) => e.stopPropagation()}>
            {node.locked ? <LockBox /> : <Checkbox checked={on} onChange={(v) => toggleSel([node.id, ...childIds], v)} />}
            <div className="px-2 py-1.5 text-base text-ink">{node.label}</div>
            <CountPill>{node.count}</CountPill>
          </label>
          <Icon name={exp ? "chevronDownBold" : "chevronRight"} size={18} className="text-primary" />
        </div>
        {exp && (
          <div className="flex flex-col pl-5 text-sm">
            {node.children.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center rounded pl-1.5 hover:bg-primary-light">
                {c.locked ? <LockBox /> : <Checkbox checked={selected.has(c.id)} onChange={(v) => toggleSel([c.id], v)} />}
                <div className="px-2 py-1.5 text-ink">{c.label}</div>
                <CountPill>{c.count}</CountPill>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Create Test"
      width={780}
      bodyClassName="px-6 pb-6"
      footer={
        <div className="border-t border-line bg-white px-6 py-4">
          <button
            onClick={start}
            disabled={!n}
            className="flex h-14 w-full cursor-pointer items-center justify-center rounded-[64px] bg-primary p-4 text-lg leading-[18px] font-semibold text-white shadow-press transition-[background,box-shadow,transform] duration-[50ms] hover:bg-primary-hover active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:bg-faint disabled:shadow-none"
          >
            Start Test
          </button>
        </div>
      }
    >
      <Section>
        <div className="mb-4 flex items-center">
          <h4 className="text-lg leading-[22.5px] font-semibold text-ink">Test Settings</h4>
          <Info tip="Tutor mode shows the correct answer and explanation after each question. Timed mode gives you about 1.5 minutes per question, like the real exam." />
        </div>
        <div className="flex">
          <Toggle checked={tutor} onChange={setTutor} label="Tutor" />
          <Toggle checked={timed} onChange={setTimed} label="Timed" />
        </div>
      </Section>

      <Section>
        <div className="mb-2 flex items-center">
          <h4 className="text-lg leading-[22.5px] font-semibold text-ink">Question Pools</h4>
          <Info tip="Build tests from questions you haven't used yet, or from questions you've tagged as Learning, Reviewing, Mastered, or Bookmarked." />
        </div>
        <div className="flex flex-wrap items-center gap-x-4">
          {POOLS.map((p) => {
            const c = poolCount(p.id);
            const on = pools.has(p.id);
            const disabled = c === 0;
            return (
              <div key={p.id} className="flex items-center">
                <label className={clsx("flex items-center", disabled ? "cursor-default" : "cursor-pointer")}>
                  <Checkbox
                    checked={on && !disabled}
                    disabled={disabled}
                    onChange={() =>
                      setPools((s) => {
                        const x = new Set(s);
                        if (x.has(p.id)) x.delete(p.id);
                        else x.add(p.id);
                        return x;
                      })
                    }
                  />
                  <span className={clsx("px-2 py-1.5 text-base text-ink", disabled && "opacity-50")}>{p.label}</span>
                </label>
                <CountPill tone={disabled ? "muted" : p.tone}>{c}</CountPill>
              </div>
            );
          })}
        </div>
      </Section>

      <Section>
        <div className="mb-4 flex items-center justify-between px-1">
          <label className="flex cursor-pointer items-center">
            <Checkbox checked={allOn} indeterminate={!isFree && !allOn && someOn} onChange={(v) => toggleSel(allSelectable, v)} />
            <h4 className="ml-1.5 text-lg leading-[22.5px] font-semibold text-ink">Subjects</h4>
          </label>
          <button
            onClick={() => setExpanded(expanded.size ? new Set() : new Set(["free", ...nodes.map((x) => x.id)]))}
            className="flex cursor-pointer items-center gap-2 text-base leading-4 text-ink"
          >
            {expanded.size ? (
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
            {expanded.size ? "Collapse All" : "Expand All"}
          </button>
        </div>

        {isFree && (
          <Link
            href="/nclex/upgrade"
            onClick={onClose}
            className="mb-4 flex items-center gap-2 rounded-lg border border-gold/50 bg-gold/10 px-4 py-3 transition-colors hover:bg-gold/20"
          >
            <Icon name="shield" size={20} className="text-gold" />
            <p className="text-base leading-6 text-ink">Upgrade to unlock all questions.</p>
            <p className="ml-auto text-base leading-6 font-semibold text-primary underline">View Pricing</p>
          </Link>
        )}

        <div className="flex flex-col gap-1 sm:flex-row sm:gap-8">
          <div className="flex-1">
            {isFree && (
              <div>
                <div className="flex cursor-pointer items-center justify-between rounded hover:bg-primary-light" onClick={() => toggleExp("free")}>
                  <label className="flex items-center pl-1" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.has("free")} onChange={(v) => toggleSel(["free", "free:all"], v)} />
                    <div className="px-2 py-1.5 text-base text-ink">Free Questions</div>
                    <CountPill>{poolCount("unused")}</CountPill>
                  </label>
                  <Icon name={expanded.has("free") ? "chevronDownBold" : "chevronRight"} size={18} className="text-primary" />
                </div>
                {expanded.has("free") && (
                  <div className="pl-5 text-sm">
                    <label className="flex cursor-pointer items-center rounded pl-1.5 hover:bg-primary-light">
                      <Checkbox checked={selected.has("free:all")} onChange={(v) => toggleSel(["free", "free:all"], v)} />
                      <div className="px-2 py-1.5 text-ink">Free Questions</div>
                      <CountPill>{poolCount("unused")}</CountPill>
                    </label>
                  </div>
                )}
              </div>
            )}
            {nodes.filter((x) => leftIds.includes(x.id)).map(renderNode)}
          </div>
          <div className="flex-1">{nodes.filter((x) => !leftIds.includes(x.id)).map(renderNode)}</div>
        </div>
      </Section>

      <div className="py-4">
        <h4 className="mb-2 text-lg leading-[22.5px] font-semibold text-ink">Number of Questions</h4>
        <p className="mb-4 text-base leading-4 text-muted">You can have a maximum of {MAX_QUESTIONS} questions per test.</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-[42px] w-[100px] items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 focus-within:border-faint">
            <input
              type="number"
              min={1}
              max={max}
              value={n}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
              aria-label="Number of questions"
              className="w-[42px] appearance-none bg-transparent text-base leading-4 text-ink outline-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div className="flex flex-col bg-background">
              <button onClick={() => setCount(Math.min(max, n + 1))} aria-label="More" className="flex h-2 w-4 cursor-pointer items-center justify-center text-muted hover:text-primary">
                <svg viewBox="0 0 9 6" className="h-1.5 w-[9px]" fill="currentColor"><path d="M4.5 0 9 6H0z" /></svg>
              </button>
              <button onClick={() => setCount(Math.max(1, n - 1))} aria-label="Fewer" className="flex h-2 w-4 cursor-pointer items-center justify-center text-muted hover:text-primary">
                <svg viewBox="0 0 9 6" className="h-1.5 w-[9px]" fill="currentColor"><path d="M4.5 6 0 0h9z" /></svg>
              </button>
            </div>
          </div>
          <input
            type="range"
            min={1}
            max={Math.max(1, max)}
            value={n}
            disabled={!max}
            onChange={(e) => setCount(Number(e.target.value))}
            aria-label="Number of questions slider"
            className="range-brand flex-1"
            style={{ ["--fill" as string]: `${max > 1 ? ((n - 1) / (max - 1)) * 100 : 100}%` }}
          />
        </div>
        <p className="my-4 text-base leading-4 text-muted">
          {n ? `This test should take about ${Math.round(n * 1.5)}min to complete.` : "Select at least one subject to create a test."}
        </p>
      </div>
    </Modal>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <div className="border-b border-line py-4">{children}</div>;
}
