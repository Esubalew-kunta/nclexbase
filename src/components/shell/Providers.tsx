"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useAdminStore } from "@/lib/admin/store";
import { apiMode } from "@/lib/api/client";
import { loadApiContent, loadQuestionBank, useApiContent } from "@/lib/api/content";
import { restoreSession } from "@/lib/api/auth";

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
    /*
     * API content first in API mode: lib/content reads are synchronous, so a page rendered
     * before the bootstrap lands would show empty lists and then jump.
     *
     * The session comes from the cookie, not from localStorage, so it is restored after the
     * persisted stores are back -- `/auth/me` then has the last word on whether this browser
     * is signed in, and a stale `signedIn` flag cannot outlive the real session.
     */
    Promise.resolve(apiMode() ? loadApiContent({ withBank: false }) : undefined)
      .then(() => useAdminStore.persist.rehydrate())
      .then(() => useAdminStore.setState({ hydrated: true }))
      .then(() => useStore.persist.rehydrate())
      // Only ask when this browser thinks it has a session: the Laravel session cookie is
      // HttpOnly and unreadable here, so the persisted flag is the only hint available, and
      // probing without one would make every first-time visitor provoke a 401.
      .then(() => (apiMode() && useStore.getState().user.signedIn ? restoreSession() : null))
      .then(() => useStore.getState().setUi({ hydrated: true }));
    // Another tab (e.g. /admin) saved changes: pick them up here too.
    const onStorage = (e: StorageEvent) => {
      if (e.key === "nclexbase-admin") useAdminStore.persist.rehydrate();
      if (e.key === "nclex-bootcamp-clone") useStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // The bank needs a session. Asking only once signed in keeps a guest from provoking a 401.
  const signedIn = useStore((s) => s.user.signedIn);
  useEffect(() => {
    if (apiMode() && signedIn) void loadQuestionBank();
  }, [signedIn]);

  const status = useApiContent((s) => s.status);
  const error = useApiContent((s) => s.error);

  // Rendering the app with no content would look like an empty product rather than an outage.
  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold text-ink">We could not load the site content</h1>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-[64px] bg-primary px-4 py-2 text-sm font-semibold text-white shadow-press hover:bg-primary-hover"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
