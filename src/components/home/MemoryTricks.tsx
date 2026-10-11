"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { GENERAL } from "@/data/memoryTricks";
import type { FileRef, MemoryTrickRec } from "@/lib/admin/types";
import { useMemoryTricks, useSubjectRec } from "@/lib/content";
import { useStore } from "@/lib/store";
import type { SubjectId } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Banner, Button, UpgradeButton } from "@/components/ui/primitives";
import { FileLink, PdfModal } from "@/components/ui/files";

const ALL = "All";
type Trick = MemoryTrickRec & { file: FileRef };

/**
 * Subject tab "Memory Tricks": PDF memory-trick papers filed under the subject (General)
 * or one of its systems. Search + system chips with counts, grouped list, PDF viewer.
 * Content and system names come from the admin (Memory Tricks, Subjects & Systems).
 */
export function MemoryTricksBrowser({ subject }: { subject: SubjectId }) {
  const all = useMemoryTricks(subject);
  const tricks = useMemo(() => all.filter((t): t is Trick => Boolean(t.file)), [all]);
  const rec = useSubjectRec(subject);
  const plan = useStore((s) => s.user.plan);
  const [system, setSystem] = useState(ALL);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Trick | null>(null);
  const term = q.trim().toLowerCase();

  // General first, then the subject's visible systems in admin order. Keys stay stable; labels can be renamed.
  const groups = useMemo(() => [{ key: GENERAL, label: GENERAL }, ...(rec?.systems.filter((s) => s.visible).map((s) => ({ key: s.key, label: s.label })) ?? [])], [rec]);
  const labelOf = (key: string) => groups.find((g) => g.key === key)?.label ?? key;
  const groupOf = (t: Trick) => t.system ?? GENERAL;
  const count = (g: string) => tricks.filter((t) => groupOf(t) === g).length;
  const matches = tricks.filter(
    (t) => (system === ALL || groupOf(t) === system) && (!term || `${t.title} ${t.description} ${labelOf(groupOf(t))}`.toLowerCase().includes(term)),
  );
  const shown = groups.filter((g) => matches.some((t) => groupOf(t) === g.key));
  const unlocked = (t: Trick) => t.access === "free" || plan === "premium";

  return (
    <>
      <Banner>Memory tricks turn high-yield facts into something you won&apos;t forget. Each one is a printable PDF filed under its system.</Banner>

      <div className="relative mb-4">
        <Icon name="search" size={20} className="absolute top-1/2 left-6 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search memory tricks"
          aria-label="Search memory tricks"
          className="h-[42px] w-full rounded-[256px] border border-line bg-white py-3 pr-6 pl-[52px] text-base text-ink transition-colors outline-none placeholder:text-muted hover:border-faint focus:border-primary"
        />
      </div>

      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Filter by system">
        {[{ key: ALL, label: "All Systems" }, ...groups].map((g) => {
          const n = g.key === ALL ? tricks.length : count(g.key);
          if (g.key === GENERAL && !n) return null;
          const on = system === g.key;
          return (
            <button
              key={g.key}
              role="tab"
              aria-selected={on}
              onClick={() => setSystem(g.key)}
              className={clsx(
                "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-[9px] text-sm whitespace-nowrap transition-colors",
                on ? "border-primary bg-primary text-white" : n ? "border-line bg-white text-ink hover:bg-primary-light" : "border-line bg-white text-muted hover:bg-primary-light",
              )}
            >
              {g.label}
              <span className={clsx("rounded-full px-1.5 text-xs leading-5 font-semibold", on ? "bg-white/20 text-white" : "bg-primary-light text-primary")}>{n}</span>
            </button>
          );
        })}
      </div>

      {shown.map((g) => {
        const rows = matches.filter((t) => groupOf(t) === g.key);
        return (
          <section key={g.key} className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-ink">
              {g.label}
              <span className="text-sm font-normal text-muted">
                {rows.length} PDF{rows.length === 1 ? "" : "s"}
              </span>
            </h3>
            {rows.map((t) => (
              <div
                key={t.id}
                onClick={() => unlocked(t) && setOpen(t)}
                className={clsx(
                  "mb-2 flex items-center gap-4 rounded-lg border border-line bg-white px-4 py-3 shadow-card transition-[transform,border-color] duration-100",
                  unlocked(t) && "cursor-pointer hover:scale-[1.01] hover:border-primary/40",
                )}
              >
                <span className="flex h-12 w-10 shrink-0 flex-col items-center justify-center rounded-md border border-primary/20 bg-primary-light text-primary">
                  <FileText className="size-5" />
                  <span className="text-[9px] leading-3 font-bold">PDF</span>
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-lg leading-[22.5px] font-semibold text-ink">{t.title}</h4>
                  <p className="truncate text-base leading-6 text-muted">{t.description}</p>
                  <p className="text-sm text-muted">
                    {t.file.pages} page{t.file.pages === 1 ? "" : "s"} · {t.file.sizeKb} KB
                    {t.access === "premium" && <span className="ml-2 rounded-full border border-gold/50 bg-gold/10 px-2 py-px text-xs font-semibold text-ink">Premium</span>}
                  </p>
                </div>
                {unlocked(t) ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button onClick={(e) => (e.stopPropagation(), setOpen(t))}>View</Button>
                    <FileLink
                      file={t.file}
                      download
                      label={`Download ${t.title}`}
                      className="hidden size-[42px] items-center justify-center rounded-full border border-primary text-primary transition-colors hover:bg-primary-light sm:flex"
                    >
                      <Download className="size-4" />
                    </FileLink>
                  </div>
                ) : (
                  <UpgradeButton onClick={(e) => e.stopPropagation()} />
                )}
              </div>
            ))}
          </section>
        );
      })}

      {!shown.length && (
        <div className="rounded-lg border border-dashed border-line bg-white px-6 py-12 text-center">
          <FileText className="mx-auto mb-3 size-8 text-faint" />
          <p className="text-lg font-semibold text-ink">{term ? `No memory tricks match “${q}”.` : `No memory tricks for ${system === ALL ? "this subject" : labelOf(system)} yet.`}</p>
          <p className="mt-1 text-base text-muted">{term ? "Try a different word or clear the filters." : "New PDFs are added regularly."}</p>
          {(term || system !== ALL) && (
            <button onClick={() => (setQ(""), setSystem(ALL))} className="mt-4 cursor-pointer text-base font-semibold text-primary underline hover:text-primary-hover">
              Show all memory tricks
            </button>
          )}
        </div>
      )}

      <PdfModal file={open?.file ?? null} title={open?.title ?? ""} caption={open && `${rec?.name} · ${labelOf(groupOf(open))}`} onClose={() => setOpen(null)} />
    </>
  );
}
