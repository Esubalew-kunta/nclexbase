"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubjectIcon } from "@/components/ui/visuals";
import type { CheatSheetRec } from "@/lib/admin/types";
import { subjectName, useCheatSheets, useSubjects } from "@/lib/content";
import { useStore } from "@/lib/store";
import type { SubjectId } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Button, Modal, UpgradeButton } from "@/components/ui/primitives";
import { PdfModal } from "@/components/ui/files";

/* eslint-disable @next/next/no-img-element */

function Star() {
  return (
    <svg viewBox="0 0 48 48" className="size-4 text-gold" fill="currentColor">
      <path d="M21.8 6.09a2.45 2.45 0 0 1 4.4 0l4.85 9.83 10.85 1.58a2.45 2.45 0 0 1 1.36 4.18l-7.85 7.65 1.85 10.8a2.45 2.45 0 0 1-3.56 2.59L24 37.62l-9.7 5.1a2.45 2.45 0 0 1-3.56-2.58l1.85-10.8-7.85-7.66a2.45 2.45 0 0 1 1.36-4.18l10.85-1.58 4.85-9.83Z" />
    </svg>
  );
}

/** Row list of cheat sheets (subject icon, title, subject, Download/Upgrade). */
export function CheatSheetList({ sheets }: { sheets: CheatSheetRec[] }) {
  const router = useRouter();
  const plan = useStore((s) => s.user.plan);
  const [preview, setPreview] = useState<CheatSheetRec | null>(null);
  return (
    <>
      {sheets.map((s) => {
        const unlocked = plan === "premium" || s.access === "free";
        return (
          <div
            key={s.id}
            onClick={() => (unlocked ? setPreview(s) : router.push("/nclex/upgrade"))}
            className="mb-2 flex cursor-pointer items-start rounded-lg border border-line bg-white px-4 py-3 shadow-card transition-[transform,border-color] duration-100 hover:scale-[1.01] hover:border-primary/40"
          >
            <div className="flex flex-col items-center justify-between">
              <SubjectIcon id={s.subject} size={24} />
            </div>
            <div className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 flex-1 flex-col justify-center px-4">
                <h4 className="text-lg leading-[22.5px] font-semibold text-ink">{s.title}</h4>
                <p className="text-base leading-6 text-muted">{subjectName(s.subject)}</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                {unlocked ? (
                  <Button onClick={(e) => (e.stopPropagation(), setPreview(s))}>Download</Button>
                ) : (
                  <UpgradeButton onClick={(e) => e.stopPropagation()} />
                )}
              </div>
            </div>
          </div>
        );
      })}
      {!sheets.length && <p className="py-10 text-center text-lg text-muted">No cheat sheets match your filters.</p>}
      {/* Sheets with an uploaded PDF (Admin > Cheat Sheets) open in the viewer; others show the template placeholder. */}
      <PdfModal file={preview?.file ?? null} title={preview?.title ?? ""} caption={preview && subjectName(preview.subject)} onClose={() => setPreview(null)} />
      <Modal open={Boolean(preview && !preview.file)} onClose={() => setPreview(null)} title={preview?.title ?? ""} width={720}>
        {preview && (
          <div className="p-6">
            <div className="flex aspect-[8.5/11] max-h-[60vh] w-full flex-col overflow-hidden rounded-lg border border-line bg-white">
              {/* Cheatsheet template header: deep teal band with a warm gold accent strip. */}
              <div className="flex items-center gap-3 bg-primary px-5 py-3">
                <img src="/assets/brand/nclexbase-mark-gold.png" alt="" className="h-7 w-auto" />
                <span className="min-w-0 flex-1 truncate text-lg font-bold text-white">{preview.title}</span>
                <span className="text-[10px] font-bold tracking-wide text-gold uppercase">NCLEXBase.com</span>
              </div>
              <div className="h-1 bg-gold" />
              <div className="grid flex-1 grid-cols-2 gap-3 bg-background p-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2 rounded-md border border-line bg-white p-3">
                    <div className={clsx("h-2.5 w-1/2 rounded", i % 3 === 0 ? "bg-primary" : "bg-primary/40")} />
                    {Array.from({ length: 5 }).map((__, k) => (
                      <div key={k} className="h-1.5 rounded bg-line" style={{ width: `${95 - k * 9}%` }} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-muted">PDF preview placeholder. The real app opens the printable cheat sheet.</p>
          </div>
        )}
      </Modal>
    </>
  );
}

/** Full Cheat Sheets page body: subject rail on the left, search + system chips + list on the right. */
export function CheatSheetBrowser({ subject: fixedSubject }: { subject?: SubjectId }) {
  const [subject, setSubject] = useState<SubjectId | "all">(fixedSubject ?? "all");
  const sheets = useCheatSheets();
  const subjects = useSubjects();
  const allLabel = fixedSubject ? `All ${subjectName(fixedSubject)}` : "All Systems";
  // On the all-sheets page the chips follow the subject picked in the rail (as on the live site):
  // a subject shows its own system chips, "all" shows the global ones.
  const chipSubject = fixedSubject ?? (subject === "all" ? undefined : subject);
  const tagsOf = (c: CheatSheetRec) => (chipSubject ? c.subjectSystems : c.systems);
  const pool = chipSubject ? sheets.filter((c) => c.subject === chipSubject) : sheets;
  /*
   * Chips are the tags actually in use, sorted. They used to come from a captured list in
   * src/data, but that list was exactly the sorted unique tags of the sheets it was captured
   * from, so deriving it is identical for the seeded content and has two advantages: a sheet
   * the admin adds brings its own chip, and a tag with no sheets behind it cannot appear.
   */
  const inUse = new Set(pool.flatMap(tagsOf));
  const chips = [...inUse].sort();
  const [system, setSystem] = useState(allLabel);
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  // Subject rail in admin order (Admin > Subjects & Systems).
  const rail = subjects.map((s) => s.id);

  const list = sheets
    .filter(
      (c) =>
        (subject === "all" || c.subject === subject) &&
        (system === allLabel || tagsOf(c).includes(system)) &&
        (!term || c.title.toLowerCase().includes(term)),
    )
    .sort((a, b) => Number(b.access === "free") - Number(a.access === "free"));

  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-0">
      {!fixedSubject && (
        <div className="shrink-0 md:mr-4 md:w-[214px]">
          <div className="flex flex-row flex-wrap gap-2 md:flex-col">
            {(["all", ...rail] as const).map((id) => {
              const on = subject === id;
              return (
                <div
                  key={id}
                  onClick={() => (setSubject(id), setSystem(allLabel))}
                  className={clsx("flex h-8 cursor-pointer items-center rounded-lg border px-3 py-2 transition-colors md:w-full", on ? "border-primary bg-primary-light" : "border-line bg-white hover:bg-primary-light")}
                >
                  <span className="mr-1 flex size-4">{id === "all" ? <Star /> : <SubjectIcon id={id} size={16} />}</span>
                  <p className={clsx("text-sm leading-[14px] capitalize", on ? "font-bold text-primary" : "text-ink")}>
                    {id === "all" ? "all" : subjectName(id)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="relative mb-4">
          <Icon name="search" size={20} className="absolute top-1/2 left-6 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter cheat sheets"
            className="h-[42px] w-full rounded-[256px] border border-line bg-white py-3 pr-6 pl-[52px] text-base text-ink transition-colors duration-200 outline-none placeholder:text-muted hover:border-faint focus:border-primary"
          />
        </div>
        <div className="mb-6 flex flex-wrap gap-2">
          {[allLabel, ...chips].map((s) => (
            <div
              key={s}
              onClick={() => setSystem(s)}
              className={clsx(
                "cursor-pointer rounded-xl border px-3 py-[9px] text-sm transition-colors duration-200",
                system === s ? "border-primary bg-primary text-white" : "border-line bg-white text-ink hover:bg-primary-light",
              )}
            >
              {s}
            </div>
          ))}
        </div>
        <CheatSheetList sheets={list} />
      </div>
    </div>
  );
}
