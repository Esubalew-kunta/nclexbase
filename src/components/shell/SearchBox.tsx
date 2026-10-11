"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CheatSheetRec, LessonRec, MemoryTrickRec, SubjectRec } from "@/lib/admin/types";
import { usePublished, useSubjects } from "@/lib/content";
import { useStore } from "@/lib/store";
import type { SubjectId } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

type Kind = "Video" | "Cheat Sheet" | "Memory Trick";
interface Hit {
  title: string;
  kind: Kind;
  subject: SubjectId;
  href: string;
  index?: string;
  locked: boolean;
}

function buildIndex(subjects: SubjectRec[], lessons: LessonRec[], sheets: CheatSheetRec[], tricks: MemoryTrickRec[]): Hit[] {
  const hits: Hit[] = [];
  const shown = new Set(subjects.map((s) => s.id));
  for (const s of subjects)
    lessons
      .filter((l) => l.course === s.id)
      .forEach((l, i) => {
        if (l.type === "video") hits.push({ title: l.title, kind: "Video", subject: s.id, index: `1.${i + 1}`, href: `/nclex/${s.id}/videos`, locked: l.access === "premium" });
      });
  for (const c of sheets)
    if (shown.has(c.subject)) hits.push({ title: c.title, kind: "Cheat Sheet", subject: c.subject, href: `/nclex/${c.subject}/cheat-sheets`, locked: c.access === "premium" });
  for (const t of tricks)
    if (shown.has(t.subject) && t.file) hits.push({ title: t.title, kind: "Memory Trick", subject: t.subject, href: `/nclex/${t.subject}/memory-tricks`, locked: t.access === "premium" });
  return hits;
}

const FILTERS = ["All", "Videos", "Cheat Sheets", "Memory Tricks"] as const;
const FILTER_KIND: Record<(typeof FILTERS)[number], Kind | null> = { All: null, Videos: "Video", "Cheat Sheets": "Cheat Sheet", "Memory Tricks": "Memory Trick" };

export function SearchBox() {
  const [focused, setFocused] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const plan = useStore((s) => s.user.plan);
  const input = useRef<HTMLInputElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const subjects = useSubjects();
  const lessons = usePublished("lessons");
  const sheets = usePublished("cheatSheets");
  const tricks = usePublished("memoryTricks");
  const index = useMemo(() => buildIndex(subjects, lessons, sheets, tricks), [subjects, lessons, sheets, tricks]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        input.current?.focus();
      }
      if (e.key === "Escape") {
        setFocused(false);
        input.current?.blur();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setFocused(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, []);

  const term = q.trim().toLowerCase();
  const groups = useMemo(() => {
    if (!term) return [];
    const hits = index.filter(
      (h) => h.title.toLowerCase().includes(term) && (!FILTER_KIND[filter] || h.kind === FILTER_KIND[filter]),
    );
    return subjects.map((s) => ({ subject: s, hits: hits.filter((h) => h.subject === s.id) })).filter((g) => g.hits.length);
  }, [term, filter, index, subjects]);

  const active = focused || Boolean(q);
  const showResults = active && Boolean(term);

  return (
    <div ref={wrap} className="relative mr-4 flex transition-[max-width] duration-200 ease-in-out" style={{ width: active ? 400 : 200 }}>
      <div
        className={clsx(
          "flex h-[42px] w-full items-center border px-4 py-2 transition-[box-shadow,background,border] duration-200",
          active ? "border-primary bg-white" : "border-line bg-white hover:border-faint",
          showResults ? "rounded-t-[21px]" : "rounded-3xl",
        )}
      >
        <Icon name="search" size={20} className={active ? "text-primary" : "text-muted"} />
        <input
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search"
          aria-label="Search NCLEXBase content"
          className="h-full min-w-0 flex-1 bg-transparent pl-2.5 text-base text-ink outline-none placeholder:text-muted"
        />
        {!active && (
          <kbd className="flex h-5 items-center justify-center rounded-lg bg-primary-light px-2 font-sans text-sm leading-none font-semibold text-muted">ctrl + F</kbd>
        )}
        {active && q && (
          <button onClick={() => (setQ(""), input.current?.focus())} aria-label="Clear search" className="cursor-pointer text-primary">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-[42px] left-0 z-40 flex w-full flex-col overflow-hidden rounded-b-[21px] border border-t-0 border-primary bg-white shadow-[0_16px_30px_rgba(9,68,72,0.18)]">
          <div className="flex gap-2 overflow-auto px-4 pt-2 pb-3">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "flex shrink-0 cursor-pointer items-center justify-center rounded-xl border px-2.5 py-1.5 text-sm whitespace-nowrap",
                  filter === f ? "border-primary bg-primary text-white" : "border-line bg-white text-ink hover:bg-primary-light",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex max-h-[420px] flex-col overflow-auto">
            {!groups.length && <p className="px-4 py-6 text-center text-sm text-muted">No results for “{q}”.</p>}
            {groups.map(({ subject, hits }) => (
              <div key={subject.id}>
                <Link
                  href={`/nclex/${subject.id}`}
                  onClick={() => setFocused(false)}
                  className="flex flex-col justify-center border-b border-line bg-primary-light px-4 py-3 hover:bg-primary/15"
                >
                  <h5 className="text-base leading-5 font-semibold text-primary">{subject.name}</h5>
                  <p className="mt-1 text-[10px] leading-[10px] font-semibold text-primary uppercase">
                    {hits.length} {hits.length === 1 ? "result" : "results"}
                  </p>
                </Link>
                {hits.map((h) => (
                  <Link
                    key={h.kind + h.title}
                    href={h.locked && plan === "free" ? "/nclex/upgrade" : h.href}
                    onClick={() => setFocused(false)}
                    className="flex items-center justify-between gap-3 border-b border-line py-3 pr-4 pl-6 hover:bg-primary-light"
                  >
                    <h5 className="text-base leading-5 font-semibold text-ink">
                      {h.index && <span className="mr-1 font-normal text-muted">{h.index}</span>}
                      {h.title}
                    </h5>
                    <span
                      className={clsx(
                        "shrink-0 rounded-lg border px-2 py-1 text-xs leading-3",
                        h.kind === "Video" ? "border-primary/30 bg-primary-light text-primary" : h.kind === "Memory Trick" ? "border-gold/50 bg-gold/10 text-ink" : "border-info/30 bg-white text-info",
                      )}
                    >
                      {h.kind}
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
