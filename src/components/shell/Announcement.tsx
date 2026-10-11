"use client";

import clsx from "clsx";
import Link from "next/link";
import { Megaphone, X } from "lucide-react";
import { useAnnouncements } from "@/lib/content";
import { useStore } from "@/lib/store";
import { todayISO } from "@/lib/daily";

/** Site-wide notices from Admin > Announcements. Students can dismiss each one; editing its message shows it again. */
export function Announcement() {
  const list = useAnnouncements();
  const plan = useStore((s) => s.user.plan);
  const hydrated = useStore((s) => s.hydrated);
  const dismissed = useStore((s) => s.dismissedTips);
  const dismiss = useStore((s) => s.dismissTip);
  if (!hydrated) return null;
  const today = todayISO();
  const live = list.filter(
    (a) => a.message.trim() && (!a.start || today >= a.start) && (!a.end || today <= a.end) && (a.audience === "all" || a.audience === plan) && !dismissed[`announcement:${a.id}:${a.message}`],
  );
  if (!live.length) return null;

  return (
    <div className="mb-4 space-y-2">
      {live.map((a) => {
        const premium = a.tone === "premium";
        const key = `announcement:${a.id}:${a.message}`;
        return (
          <div
            key={a.id}
            role="status"
            className={clsx("flex items-center gap-3 rounded-lg border px-4 py-3 text-base text-ink", premium ? "border-gold/60 bg-gold/10" : "border-primary/25 bg-primary-light")}
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
      })}
    </div>
  );
}
