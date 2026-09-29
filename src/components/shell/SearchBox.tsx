"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { CHEAT_SHEETS, LESSON_TITLES, SUBJECTS } from "@/data/catalog";
import type { SubjectId } from "@/lib/types";

type Kind = "Video" | "Cheat Sheet";
interface Hit {
  title: string;
  kind: Kind;
  subject: SubjectId;
  href: string;
  index?: string;
}

const INDEX: Hit[] = [
  ...SUBJECTS.flatMap((s, si) =>
    LESSON_TITLES[s.id].map((title, li) => ({
      title,
      kind: "Video" as const,
      subject: s.id,
      index: `${si + 1}.${li + 1}`,
      href: `/nclex/${s.id}/crash-courses`,
    })),
  ),
  ...CHEAT_SHEETS.map((c) => ({ title: c.title, kind: "Cheat Sheet" as const, subject: c.subject, href: `/nclex/cheat-sheets` })),
];

const FILTERS = ["All", "Videos", "Cheat Sheets"] as const;

export function SearchBox() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const input = useRef<HTMLInputElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => input.current?.focus());
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, []);

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const hits = INDEX.filter(
      (h) =>
        h.title.toLowerCase().includes(term) &&
        (filter === "All" || (filter === "Videos" ? h.kind === "Video" : h.kind === "Cheat Sheet")),
    );
    return SUBJECTS.map((s) => ({ subject: s, hits: hits.filter((h) => h.subject === s.id) })).filter((g) => g.hits.length);
  }, [q, filter]);

  return (
    <div ref={wrap} className="relative">
      {!open ? (
        <button
          onClick={() => {
            setOpen(true);
            requestAnimationFrame(() => input.current?.focus());
          }}
          className="flex h-[42px] w-[200px] items-center gap-2.5 rounded-full bg-white/10 px-4 text-white/70 hover:bg-white/15"
        >
          <Search className="size-[18px]" />
          <span className="flex-1 text-left">Search</span>
          <kbd className="rounded-md bg-white/15 px-1.5 py-0.5 font-sans text-xs font-semibold text-white/80">ctrl + F</kbd>
        </button>
      ) : (
        <div className="absolute top-0 left-0 z-40 w-[400px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in">
          <div className="flex h-[42px] items-center gap-2.5 px-4">
            <Search className="size-[18px] text-muted" />
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Bootcamp content"
              aria-label="Search Bootcamp content"
              className="flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
            />
            <button onClick={() => (q ? setQ("") : setOpen(false))} aria-label="Clear search" className="text-brand">
              <X className="size-5" />
            </button>
          </div>
          <div className="flex gap-2 px-4 pb-3">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "h-8 rounded-full border px-3 text-sm",
                  filter === f ? "border-brand bg-brand text-white" : "border-line text-ink hover:bg-[#f6f6f8]",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="max-h-[420px] overflow-y-auto border-t border-line">
            {!q.trim() && <p className="px-4 py-6 text-center text-sm text-muted">Search videos, cheat sheets, and topics.</p>}
            {q.trim() && !groups.length && <p className="px-4 py-6 text-center text-sm text-muted">No results for “{q}”.</p>}
            {groups.map(({ subject, hits }) => (
              <div key={subject.id}>
                <div className="bg-brand-tint px-4 py-2.5">
                  <div className="font-semibold text-brand">{subject.name}</div>
                  <div className="text-[10px] font-semibold tracking-wide text-brand/80 uppercase">
                    {hits.length} result{hits.length > 1 ? "s" : ""}
                  </div>
                </div>
                {hits.map((h) => (
                  <Link
                    key={h.kind + h.title}
                    href={h.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 border-b border-line px-6 py-3 hover:bg-[#fafafb]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-ink-strong">
                        {h.index && <span className="mr-1 font-normal text-muted">{h.index}</span>}
                        {h.title}
                      </div>
                      <div className="text-sm text-muted">{subject.name}</div>
                    </div>
                    <span
                      className={clsx(
                        "rounded-md px-2 py-0.5 text-xs font-medium",
                        h.kind === "Video" ? "bg-[#e7f7ef] text-[#2a9d62]" : "bg-[#fdecef] text-[#d9577a]",
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
