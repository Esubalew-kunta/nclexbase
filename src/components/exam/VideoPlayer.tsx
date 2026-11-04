"use client";

import { useFileUrl } from "@/lib/admin/files";
import { parseVideoLink } from "@/lib/videoLink";
import type { ExplanationVideo } from "@/lib/types";

/**
 * Plays an explanation video: an uploaded file in the browser's own player, a direct link the same
 * way, and a YouTube or Vimeo link in that service's player.
 *
 * A link is checked again here, from the address, every time it is shown. The player address that
 * was stored with it is never used, so a record that was edited by hand (or saved before the rules
 * tightened) cannot point an iframe at somewhere the rules do not allow.
 */
export function VideoPlayer({ video, title, className }: { video: ExplanationVideo; title: string; className?: string }) {
  const isLink = video.kind === "link";
  const { href } = useFileUrl(isLink ? null : video.url);
  const box = className ?? "aspect-video w-full rounded bg-black";

  if (isLink) {
    const link = parseVideoLink(video.url);
    if (!link) return null;
    if (link.provider === "file") return <video src={link.embedUrl} controls preload="metadata" aria-label={`Video explanation: ${title}`} className={box} />;
    return (
      <iframe
        src={link.embedUrl}
        title={`Video explanation: ${title}`}
        className={box}
        loading="lazy"
        allow="fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        // Scripts are what a player is; the rest (top navigation, forms, downloads) stays off.
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      />
    );
  }

  if (!href) return null;
  return <video src={href} controls preload="metadata" aria-label={`Video explanation: ${title}`} className={box} />;
}
