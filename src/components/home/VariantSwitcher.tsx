"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";

/*
 * Review tool, not design.
 *
 * Three homepage directions are up for review at once, so this bar switches between them. It
 * is styled to look like what it is — a dark strip bolted to the top of the page — because a
 * reviewer must never wonder whether it is part of the design they are judging.
 *
 * The choice lives in the URL (`/?v=2`), so a reviewer can send a link to one specific option
 * and the person opening it sees that one. It is also remembered per browser, so coming back
 * to `/` lands on whatever you were last looking at.
 *
 * **Removing this is the point.** Once an option is chosen: delete the two losing files in
 * components/home, delete this file, and render the winner directly from app/page.tsx. One
 * small commit, nothing to untangle.
 */

export const VARIANTS = [1, 2, 3] as const;
export type Variant = (typeof VARIANTS)[number];

const STORAGE_KEY = "nclexbase-home-variant";

const NAMES: Record<Variant, string> = {
  1: "The Question",
  2: "The Plan",
  3: "The Editorial",
};

/**
 * The variant to show, and how to change it.
 *
 * Nothing is held in component state: `?v=` wins if the link has one, otherwise this browser's
 * last choice does, otherwise v1. localStorage is read as the external store it is, so there
 * is no effect to mis-sequence, nothing to go wrong when it is unreadable (a private window),
 * and no risk of a static export baking one person's choice into the HTML.
 */
export function useVariant(): [Variant, (next: Variant) => void] {
  const router = useRouter();
  const fromUrl = parse(useSearchParams().get("v"));
  const remembered = parse(useSyncExternalStore(subscribe, readSaved, readOnServer));

  const choose = (next: Variant) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Not being able to remember the choice is no reason to refuse to make it.
    }
    // The URL is the source of truth, so writing it is what re-renders. replace, not push:
    // flicking through three options should not fill up the back button.
    router.replace(`/?v=${next}`, { scroll: false });
  };

  return [fromUrl ?? remembered ?? 1, choose];
}

/** Another tab may have changed it; the same tab re-renders from the URL instead. */
function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);

  return () => window.removeEventListener("storage", onChange);
}

function readSaved(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** No storage while the page is being rendered to static HTML. */
const readOnServer = (): string | null => null;

export function VariantSwitcher({ variant, onChange }: { variant: Variant; onChange: (next: Variant) => void }) {
  return (
    <div className="sticky top-0 z-50 bg-ink text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <p className="text-xs font-semibold tracking-wider text-white/60 uppercase">Homepage options for review</p>

        <div className="flex items-center gap-1" role="group" aria-label="Homepage option">
          {VARIANTS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={variant === option}
              className={`h-7 rounded px-3 text-xs font-bold transition-colors ${
                variant === option ? "bg-gold text-ink" : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              v{option}
            </button>
          ))}
        </div>

        <p className="text-xs text-white/50">
          Showing <span className="font-semibold text-white/80">v{variant} — {NAMES[variant]}</span>
        </p>
      </div>
    </div>
  );
}

function parse(value: string | null): Variant | undefined {
  const n = Number(value);

  return VARIANTS.find((v) => v === n);
}
