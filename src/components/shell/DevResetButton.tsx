"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

/**
 * TEMPORARY prototype control: clears everything this clone saved in the browser.
 * To remove it, set SHOW_DEV_RESET to false (or delete this file and its one use in TopBar.tsx).
 */
export const SHOW_DEV_RESET = true;

export function DevResetButton() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  if (!SHOW_DEV_RESET) return null;
  return (
    <button
      onClick={() => {
        if (!confirm("Clear all locally saved data (tests, tags, study schedule, settings)?")) return;
        useStore.getState().resetAll();
        setDone(true);
        setTimeout(() => setDone(false), 1500);
        router.push("/nclex");
      }}
      title="Prototype only: clear data saved in this browser"
      className="mr-2 flex h-[42px] cursor-pointer items-center gap-1.5 rounded-3xl border border-dashed border-white/40 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/30"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
      </svg>
      {done ? "Cleared" : "Clear data"}
    </button>
  );
}
