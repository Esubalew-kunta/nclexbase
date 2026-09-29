"use client";

import { useEffect, type ReactNode } from "react";
import { useStore } from "@/lib/store";

/** Rehydrates persisted state after mount so static HTML and first client render match. */
export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    Promise.resolve(useStore.persist.rehydrate()).then(() => useStore.getState().setUi({ hydrated: true }));
  }, []);
  return <>{children}</>;
}
