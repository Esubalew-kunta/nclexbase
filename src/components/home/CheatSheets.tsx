"use client";

import clsx from "clsx";
import { useState } from "react";
import { Download } from "lucide-react";
import { subjectById } from "@/data/catalog";
import { useStore } from "@/lib/store";
import type { SubjectId } from "@/lib/types";
import { Modal, UpgradeButton } from "@/components/ui/primitives";

interface Sheet {
  title: string;
  subject: SubjectId;
  system: string;
}

export function FilterPills({ options, value, onChange, small }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; small?: boolean }) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "rounded-full font-semibold transition-colors",
            small ? "h-8 px-3 text-sm" : "h-9 px-4 text-[15px]",
            value === o.value ? "bg-white text-brand" : "bg-white/10 text-white hover:bg-white/15",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Stylized thumbnail standing in for the PDF preview image. */
function SheetThumb({ title }: { title: string }) {
  return (
    <div className="flex h-[150px] flex-col gap-1.5 rounded-t-lg bg-[#f4f3fb] p-4">
      <div className="flex items-center gap-2">
        <span className="rounded bg-brand px-1.5 py-0.5 text-[8px] font-bold text-white">BOOTCAMP.COM</span>
        <span className="truncate text-[11px] font-bold text-brand italic">{title}</span>
      </div>
      <div className="grid flex-1 grid-cols-3 gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1 rounded bg-white p-1.5">
            <div className={clsx("h-1.5 w-2/3 rounded", i % 3 === 0 ? "bg-[#f8b4b4]" : "bg-[#c8c3f7]")} />
            <div className="h-1 w-full rounded bg-[#ececef]" />
            <div className="h-1 w-5/6 rounded bg-[#ececef]" />
            <div className="h-1 w-3/4 rounded bg-[#ececef]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CheatSheetGrid({ sheets }: { sheets: Sheet[] }) {
  const plan = useStore((s) => s.user.plan);
  const [preview, setPreview] = useState<Sheet | null>(null);
  return (
    <>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sheets.map((s, i) => (
          <div key={s.title} className="bg-card flex flex-col rounded-lg shadow-card">
            <SheetThumb title={s.title} />
            <div className="flex flex-1 items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-ink-strong">{s.title}</div>
                <div className="text-sm text-muted">{subjectById(s.subject).name}</div>
              </div>
              {plan === "premium" || i < 6 ? (
                <button onClick={() => setPreview(s)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-white shadow-press">
                  <Download className="size-4" />
                  Download
                </button>
              ) : (
                <UpgradeButton size="sm" />
              )}
            </div>
          </div>
        ))}
        {!sheets.length && <p className="col-span-full py-10 text-center text-white/80">No cheat sheets match these filters.</p>}
      </div>
      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} title={preview?.title ?? ""} width={640}>
        <div className="p-6">
          {preview && <SheetThumb title={preview.title} />}
          <p className="mt-4 text-center text-sm text-muted">PDF downloads are placeholders in the static prototype.</p>
        </div>
      </Modal>
    </>
  );
}
