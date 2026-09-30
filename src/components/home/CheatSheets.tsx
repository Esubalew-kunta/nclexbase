"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CHEAT_SHEET_SUBJECT_ORDER, CHEAT_SHEET_SYSTEMS, CHEAT_SHEETS, subjectById, type CheatSheet } from "@/data/catalog";
import { useStore } from "@/lib/store";
import type { SubjectId } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Button, Modal, UpgradeButton } from "@/components/ui/primitives";

/* eslint-disable @next/next/no-img-element */

function Star() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" fill="#f3d456">
      <path d="M21.8 6.09a2.45 2.45 0 0 1 4.4 0l4.85 9.83 10.85 1.58a2.45 2.45 0 0 1 1.36 4.18l-7.85 7.65 1.85 10.8a2.45 2.45 0 0 1-3.56 2.59L24 37.62l-9.7 5.1a2.45 2.45 0 0 1-3.56-2.58l1.85-10.8-7.85-7.66a2.45 2.45 0 0 1 1.36-4.18l10.85-1.58 4.85-9.83Z" />
    </svg>
  );
}

/** Row list of cheat sheets (subject icon, title, subject, Download/Upgrade). */
export function CheatSheetList({ sheets }: { sheets: CheatSheet[] }) {
  const router = useRouter();
  const plan = useStore((s) => s.user.plan);
  const [preview, setPreview] = useState<CheatSheet | null>(null);
  return (
    <>
      {sheets.map((s) => {
        const unlocked = plan === "premium" || s.free;
        return (
          <div
            key={s.title}
            onClick={() => (unlocked ? setPreview(s) : router.push("/nclex/upgrade"))}
            className="bg-card mb-2 flex cursor-pointer items-start rounded-lg px-4 py-3 shadow-card transition-transform duration-100 hover:scale-[1.01]"
          >
            <div className="flex flex-col items-center justify-between">
              <img src={`/assets/subjects/${s.subject}.png`} alt="" className="size-6" />
            </div>
            <div className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 flex-1 flex-col justify-center px-4">
                <h4 className="text-lg leading-[22.5px] font-semibold text-ink">{s.title}</h4>
                <p className="text-base leading-6 text-muted">{subjectById(s.subject).name}</p>
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
      {!sheets.length && <p className="py-10 text-center text-lg text-white/70">No cheat sheets match your filters.</p>}
      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} title={preview?.title ?? ""} width={720}>
        {preview && (
          <div className="p-6">
            <div className="flex aspect-[8.5/11] max-h-[60vh] w-full flex-col gap-3 overflow-hidden rounded-lg border border-[#ededf0] bg-[#fafafa] p-6">
              <div className="flex items-center gap-2">
                <span className="rounded bg-brand px-2 py-0.5 text-[10px] font-bold text-white">BOOTCAMP.COM</span>
                <span className="text-lg font-bold text-brand italic">{preview.title}</span>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2 rounded-md bg-white p-3">
                    <div className={clsx("h-2.5 w-1/2 rounded", i % 3 === 0 ? "bg-[#f8b4b4]" : "bg-[#c8c3f7]")} />
                    {Array.from({ length: 5 }).map((__, k) => (
                      <div key={k} className="h-1.5 rounded bg-[#ededf0]" style={{ width: `${95 - k * 9}%` }} />
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
  const [system, setSystem] = useState("All Systems");
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();

  const list = CHEAT_SHEETS.filter(
    (c) =>
      (subject === "all" || c.subject === subject) &&
      (system === "All Systems" || c.systems.includes(system)) &&
      (!term || c.title.toLowerCase().includes(term)),
  ).sort((a, b) => Number(b.free) - Number(a.free));

  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-0">
      {!fixedSubject && (
        <div className="shrink-0 md:mr-4 md:w-[214px]">
          <div className="flex flex-row flex-wrap gap-2 md:flex-col">
            {(["all", ...CHEAT_SHEET_SUBJECT_ORDER] as const).map((id) => {
              const on = subject === id;
              return (
                <div
                  key={id}
                  onClick={() => setSubject(id)}
                  className={clsx("flex h-8 cursor-pointer items-center rounded-lg px-3 py-2 transition-colors md:w-full", on ? "bg-white" : "bg-white/10 hover:bg-white/20")}
                >
                  <span className="mr-1 flex size-4">{id === "all" ? <Star /> : <img src={`/assets/subjects/${id}.png`} alt="" className="size-4" />}</span>
                  <p className={clsx("text-sm leading-[14px] capitalize", on ? "font-bold text-ink-strong" : "text-white")}>
                    {id === "all" ? "all" : subjectById(id).name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="relative mb-4">
          <Icon name="search" size={20} className="absolute top-1/2 left-6 -translate-y-1/2 text-white/70" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter cheat sheets"
            className="h-[42px] w-full rounded-[256px] bg-white/10 py-3 pr-6 pl-[52px] text-base text-white transition-colors duration-200 outline-none placeholder:text-white/70 hover:bg-white/15 focus:bg-white/15"
          />
        </div>
        <div className="mb-6 flex flex-wrap gap-2">
          {["All Systems", ...CHEAT_SHEET_SYSTEMS].map((s) => (
            <div
              key={s}
              onClick={() => setSystem(s)}
              className={clsx("cursor-pointer rounded-xl px-3 py-[9px] text-sm text-white transition-colors duration-200 hover:bg-white/30", system === s ? "bg-white/30" : "bg-white/10")}
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
