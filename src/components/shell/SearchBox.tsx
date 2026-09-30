"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CHEAT_SHEETS, LESSONS, SUBJECTS } from "@/data/catalog";
import { useStore } from "@/lib/store";
import type { SubjectId } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

type Kind = "Video" | "Cheat Sheet";
interface Hit {
  title: string;
  kind: Kind;
  subject: SubjectId;
  href: string;
  index?: string;
  locked: boolean;
}

function buildIndex(): Hit[] {
  const hits: Hit[] = [];
  for (const s of SUBJECTS)
    LESSONS[s.id].forEach((l, i) => {
      if (l.type === "video") hits.push({ title: l.title, kind: "Video", subject: s.id, index: `1.${i + 1}`, href: `/nclex/${s.id}/videos`, locked: l.locked });
    });
  for (const c of CHEAT_SHEETS) hits.push({ title: c.title, kind: "Cheat Sheet", subject: c.subject, href: `/nclex/${c.subject}/cheat-sheets`, locked: !c.free });
  return hits;
}

const FILTERS = ["All", "Videos", "Cheat Sheets"] as const;

export function SearchBox() {
  const [focused, setFocused] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const plan = useStore((s) => s.user.plan);
  const input = useRef<HTMLInputElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const index = useMemo(() => buildIndex(), []);

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
      (h) => h.title.toLowerCase().includes(term) && (filter === "All" || (filter === "Videos" ? h.kind === "Video" : h.kind === "Cheat Sheet")),
    );
    return SUBJECTS.map((s) => ({ subject: s, hits: hits.filter((h) => h.subject === s.id) })).filter((g) => g.hits.length);
  }, [term, filter, index]);

  const active = focused || Boolean(q);
  const showResults = active && Boolean(term);

  return (
    <div ref={wrap} className="relative mr-4 flex transition-[max-width] duration-200 ease-in-out" style={{ width: active ? 400 : 200 }}>
      <div
        className={clsx(
          "flex h-[42px] w-full items-center border px-4 py-2 transition-[box-shadow,background,border] duration-200",
          active ? "border-white bg-white" : "border-white/5 bg-white/10",
          showResults ? "rounded-t-[21px]" : "rounded-3xl",
        )}
      >
        <Icon name="search" size={20} className={active ? "text-brand" : "text-white/70"} />
        <input
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search"
          aria-label="Search Bootcamp content"
          className={clsx(
            "h-full min-w-0 flex-1 bg-transparent pl-2.5 text-base outline-none",
            active ? "text-ink-strong placeholder:text-muted" : "text-white placeholder:text-white/70",
          )}
        />
        {!active && (
          <kbd className="flex h-5 items-center justify-center rounded-lg bg-black/10 px-2 font-sans text-sm leading-none font-semibold text-white/70">ctrl + F</kbd>
        )}
        {active && q && (
          <button onClick={() => (setQ(""), input.current?.focus())} aria-label="Clear search" className="cursor-pointer text-brand">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-[42px] left-0 z-40 flex w-full flex-col overflow-hidden rounded-b-[21px] bg-white shadow-[0_16px_30px_rgba(0,0,0,0.24)]">
          <div className="flex gap-2 overflow-auto px-4 pt-2 pb-3">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "flex cursor-pointer items-center justify-center rounded-xl border px-2.5 py-1.5 text-sm",
                  filter === f ? "border-brand bg-brand text-white" : "border-black/10 bg-white text-ink-strong hover:bg-[#f6f6f6]",
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
                  className="flex flex-col justify-center border-b border-black/5 bg-[#eef1ff] px-4 py-3 hover:bg-[#e0e6ff]"
                >
                  <h5 className="text-base leading-5 font-semibold text-brand">{subject.name}</h5>
                  <p className="mt-1 text-[10px] leading-[10px] font-semibold text-brand uppercase">
                    {hits.length} {hits.length === 1 ? "result" : "results"}
                  </p>
                </Link>
                {hits.map((h) => (
                  <Link
                    key={h.kind + h.title}
                    href={h.locked && plan === "free" ? "/nclex/upgrade" : h.href}
                    onClick={() => setFocused(false)}
                    className="flex items-center justify-between gap-3 border-b border-black/5 py-3 pr-4 pl-6 hover:bg-[#f6f6f6]"
                  >
                    <h5 className="text-base leading-5 font-semibold text-ink-strong">
                      {h.index && <span className="mr-1 font-normal text-muted">{h.index}</span>}
                      {h.title}
                    </h5>
                    <span
                      className={clsx(
                        "shrink-0 rounded-lg border px-2 py-1 text-xs leading-3",
                        h.kind === "Video" ? "border-[#d1fae5] bg-[#d1fae5]/25 text-[#047857]" : "border-[#fae8ff] bg-[#fae8ff]/25 text-[#a21caf]",
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
