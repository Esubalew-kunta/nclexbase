"use client";

import { useFileUrl } from "@/lib/admin/files";
import { useConfig } from "@/lib/content";
import { LogoMark } from "@/components/ui/Logo";

/* eslint-disable @next/next/no-img-element */

/**
 * The avatar shown next to score messages (name and photo: Admin > Settings > Branding).
 *
 * With no photo set it shows the NCLEXBase mark on a teal disc, never nothing: the message
 * banners it sits in are padded on the left to make room for a 42-48px circle, so returning
 * null would leave a gap beside every message.
 *
 * It used to default to a photograph of a named person employed by another company, carried in
 * with the clone. The default is the brand now, and a photo only appears if the admin uploads
 * one of their own.
 *
 * `className` positions and sizes the circle, so the fallback takes it verbatim.
 */
export function CoachPhoto({ className }: { className: string }) {
  const { coachPhotoUrl, coachName } = useConfig().branding;
  const { href } = useFileUrl(coachPhotoUrl || null);

  if (href) return <img src={href} alt={coachName} title={coachName} className={className} />;

  return (
    <span aria-hidden className={`${className} flex items-center justify-center bg-primary`}>
      <LogoMark size={20} />
    </span>
  );
}
