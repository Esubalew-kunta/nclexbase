"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";

/*
 * Words in an explanation that show a picture, or play a sound, while the pointer is over them.
 *
 * The stored HTML keeps the media inside the link, hidden:
 *   <span class="hover-link" tabindex="0">words<span class="hover-card"><img src alt></span></span>
 * so the picture is an ordinary <img> in the explanation (the admin's Pictures box edits it like any
 * other) and the words still read fine with no script. This reads that markup and shows the card in
 * front of everything, next to the words: over a mouse, on keyboard focus, and on a tap.
 *
 * Presentation only: it imports no store and makes no request, so the admin preview can use it.
 */

interface Card {
  kind: "img" | "audio";
  src: string;
  alt: string;
  /** Centre of the words, and the edge the card hangs from. */
  x: number;
  top: number;
  bottom: number;
}

const WIDTH = 340;
const GAP = 8;
const CLOSE_DELAY = 180;

function read(link: HTMLElement): Card | null {
  const img = link.querySelector<HTMLImageElement>(".hover-card img");
  const audio = link.querySelector<HTMLAudioElement>(".hover-card audio");
  const media = img ?? audio;
  const src = img ? img.getAttribute("src") : audio?.getAttribute("src");
  if (!media || !src) return null;
  const r = link.getBoundingClientRect();
  return { kind: img ? "img" : "audio", src, alt: img?.getAttribute("alt") ?? "", x: r.left + r.width / 2, top: r.top, bottom: r.bottom };
}

export function HoverHtml({ html, className }: { html: string; className?: string }) {
  const [card, setCard] = useState<Card | null>(null);
  const [full, setFull] = useState<{ src: string; alt: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const keep = () => clearTimeout(timer.current);
  const leave = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCard(null), CLOSE_DELAY);
  }, []);
  const show = (e: { target: EventTarget }) => {
    const link = (e.target as Element).closest?.<HTMLElement>(".hover-link");
    if (!link) return;
    keep();
    const next = read(link);
    if (next) setCard(next);
  };
  const hide = (e: { target: EventTarget }) => {
    if ((e.target as Element).closest?.(".hover-link")) leave();
  };

  useEffect(() => () => clearTimeout(timer.current), []);
  // Scrolling moves the words away from a card that does not follow them.
  useEffect(() => {
    if (!card) return;
    const close = () => setCard(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [card]);
  useEffect(() => {
    if (!card && !full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (full) setFull(null);
      else setCard(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, full]);

  const left = card ? Math.min(Math.max(card.x - WIDTH / 2, GAP), window.innerWidth - WIDTH - GAP) : 0;
  const above = card ? card.top > 280 : true;

  return (
    <>
      <span
        className={className}
        onMouseOver={show}
        onMouseOut={hide}
        onFocus={show}
        onBlur={hide}
        // A tap has no hover: it opens the card, and a second tap on the words closes it.
        onClick={(e) => {
          const link = (e.target as Element).closest?.<HTMLElement>(".hover-link");
          if (!link) return;
          const next = read(link);
          setCard((now) => (now && next && now.src === next.src && Math.abs(now.x - next.x) < 1 ? null : next));
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {card &&
        createPortal(
          <div
            role="dialog"
            aria-label={card.alt || "Picture"}
            onMouseEnter={keep}
            onMouseLeave={leave}
            style={{ position: "fixed", left, width: WIDTH, zIndex: 80, ...(above ? { bottom: window.innerHeight - card.top + GAP } : { top: card.bottom + GAP }) }}
            className="rounded-xl border border-line bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.18)]"
          >
            {card.kind === "img" ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.src} alt={card.alt} className="mx-auto block max-h-[50vh] w-auto max-w-full object-contain" />
                <button
                  type="button"
                  onClick={() => (setFull({ src: card.src, alt: card.alt }), setCard(null))}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink hover:bg-primary-light"
                >
                  <Maximize2 className="size-4" aria-hidden />
                  Expand to full view
                </button>
              </>
            ) : (
              <audio controls preload="auto" src={card.src} className="block w-full" aria-label={card.alt || "Sound"} />
            )}
          </div>,
          document.body,
        )}
      {full &&
        createPortal(
          <div role="dialog" aria-modal="true" aria-label={full.alt || "Picture"} onClick={() => setFull(null)} className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={full.src} alt={full.alt} className="max-h-full max-w-full rounded-lg bg-white object-contain" />
            <button type="button" aria-label="Close" onClick={() => setFull(null)} className="absolute right-4 top-4 rounded-full bg-white p-2 text-ink shadow">
              <X className="size-5" aria-hidden />
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
