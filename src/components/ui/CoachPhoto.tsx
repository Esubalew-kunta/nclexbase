"use client";

import { useFileUrl } from "@/lib/admin/files";
import { useConfig } from "@/lib/content";

/* eslint-disable @next/next/no-img-element */

/** The coach shown next to score messages (photo and name: Admin > Settings > Branding). */
export function CoachPhoto({ className }: { className: string }) {
  const { coachPhotoUrl, coachName } = useConfig().branding;
  const { href } = useFileUrl(coachPhotoUrl || null);
  if (!href) return null;
  return <img src={href} alt={coachName} title={coachName} className={className} />;
}
