"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useAdminStore } from "@/lib/admin/store";

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
    // Admin content first, so student pages never render seed data and then jump.
    Promise.resolve(useAdminStore.persist.rehydrate())
      .then(() => useAdminStore.setState({ hydrated: true }))
      .then(() => useStore.persist.rehydrate())
      .then(() => useStore.getState().setUi({ hydrated: true }));
    // Another tab (e.g. /admin) saved changes: pick them up here too.
    const onStorage = (e: StorageEvent) => {
      if (e.key === "nclexbase-admin") useAdminStore.persist.rehydrate();
      if (e.key === "nclex-bootcamp-clone") useStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return <>{children}</>;
}
