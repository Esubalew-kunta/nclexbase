"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

/** Rehydrates persisted state after mount so static HTML and first client render match. */
export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  // Hidden shortcut to the prototype controls (not part of the live app).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        router.push("/nclex/prototype");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  useEffect(() => {
    Promise.resolve(useStore.persist.rehydrate()).then(() => useStore.getState().setUi({ hydrated: true }));
  }, []);
  return <>{children}</>;
}
