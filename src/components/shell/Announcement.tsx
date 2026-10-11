"use client";

import clsx from "clsx";
import Link from "next/link";
import { Megaphone, X } from "lucide-react";
import { useConfig } from "@/lib/content";
import { useStore } from "@/lib/store";
import { todayISO } from "@/lib/daily";

/** Site-wide notice set in Admin > Home & Navigation. Students can dismiss each message once. */
export function Announcement() {
  const a = useConfig().announcement;
  const plan = useStore((s) => s.user.plan);
  const hydrated = useStore((s) => s.hydrated);
  const dismissed = useStore((s) => s.dismissedTips);
  const dismiss = useStore((s) => s.dismissTip);
  if (!hydrated || !a.enabled || !a.message.trim()) return null;
  const today = todayISO();
  if ((a.start && today < a.start) || (a.end && today > a.end)) return null;
  if (a.audience !== "all" && a.audience !== plan) return null;
  const key = `announcement:${a.message}`;
  if (dismissed[key]) return null;

  const premium = a.tone === "premium";
  return (
    <div
      role="status"
      className={clsx(
        "mb-4 flex items-center gap-3 rounded-lg border px-4 py-3 text-base text-ink",
        premium ? "border-gold/60 bg-gold/10" : "border-primary/25 bg-primary-light",
      )}
    >
      <Megaphone className={clsx("size-5 shrink-0", premium ? "text-gold" : "text-primary")} />
      <p className="min-w-0 flex-1">
        {a.message}
        {a.linkLabel && a.linkHref && (
          <Link href={a.linkHref} className="ml-2 font-semibold whitespace-nowrap text-primary underline hover:text-primary-hover">
            {a.linkLabel}
          </Link>
        )}
      </p>
      <button onClick={() => dismiss(key)} aria-label="Dismiss announcement" className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-white hover:text-primary">
        <X className="size-4" />
      </button>
    </div>
  );
}
