"use client";

import { useConfig } from "./content";
import { useStore } from "./store";

/**
 * Feature flags for proposed features. Each experiment is off by default so
 * the clone matches production; toggle them for everyone in Admin > Settings,
 * for this browser in Account > Prototype Controls,
 * or with `?feature=<key>` in the URL.
 */
export interface Experiment {
  key: string;
  name: string;
  description: string;
}

export const EXPERIMENTS: Experiment[] = [];

export function useFeature(key: string): boolean {
  // On when the admin switched it on for everyone (Admin > Settings) or this browser did (Prototype Controls).
  const global = Boolean(useConfig().flags[key]);
  const on = useStore((s) => Boolean(s.flags[key])) || global;
  const hydrated = useStore((s) => s.hydrated);
  // Read the URL only after hydration so the static HTML and first render match.
  if (hydrated && new URLSearchParams(window.location.search).getAll("feature").includes(key)) return true;
  return on;
}
