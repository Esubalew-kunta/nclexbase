"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/*
 * Scroll-triggered motion for the homepage: two pieces, both deliberately small.
 *
 * Everything here animates `opacity` and `transform` only, never a property that forces
 * layout, and everything stops at `prefers-reduced-motion` because motion sickness is not a
 * minority problem in a nursing audience. Each element animates once and then is left alone;
 * things that re-animate every time they scroll past read as a page that cannot settle.
 */

/** Have we been asked to keep still? Read once, not watched: nobody flips this mid-scroll. */
function stillness(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Watches one element and reports when it has scrolled into view.
 *
 * `rootMargin` pulls the trigger line up from the bottom of the window, so a section starts
 * moving as it arrives rather than after the reader is already looking at it.
 */
function useInView<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    // Scheduled rather than set here and now: a setState in the body of an effect re-renders
    // the tree a second time before paint for no reason, and the lint rule is right to say so.
    if (stillness() || typeof IntersectionObserver === "undefined") {
      const now = window.setTimeout(() => setSeen(true), 0);

      return () => window.clearTimeout(now);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );
    io.observe(el);

    // A belt-and-braces reveal: if anything goes wrong with the observer, the content is
    // never left invisible.
    const failsafe = window.setTimeout(() => setSeen(true), 2500);

    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [seen]);

  return [ref, seen];
}

/**
 * Fades and lifts its children into place the first time they are scrolled to.
 *
 * `data-shown` is on the wrapper as well as the classes, so a child can key its own motion off
 * the parent's arrival (`group-data-[shown=true]:...`) without each one needing an observer.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const [ref, shown] = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-shown={shown}
      style={{ transitionDelay: `${delay}ms` }}
      className={`group transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Counts up to `value` once, when the number is scrolled to.
 *
 * A number that animates is read as a number someone is counting; a number that is simply
 * there is read as a label. It is worth the 900ms. The count is eased out so it decelerates
 * into the real figure rather than stopping dead, and the final frame is the exact value --
 * never a rounding artefact of the easing. 1.1s: long enough to read as counting, short
 * enough that a reader who scrolled here to read the number is not kept waiting for it.
 */
export function CountUp({ value, suffix = "", className = "" }: { value: number; suffix?: string; className?: string }) {
  const [ref, shown] = useInView<HTMLSpanElement>();
  const [shownValue, setShownValue] = useState(0);

  useEffect(() => {
    if (!shown) return;
    if (stillness()) {
      const now = window.setTimeout(() => setShownValue(value), 0);

      return () => window.clearTimeout(now);
    }

    const span = 1100;
    const started = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / span);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShownValue(progress === 1 ? value : Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    // If the frames never come -- a background tab, a headless browser, a throttled phone --
    // the number must still end up being the number.
    const failsafe = window.setTimeout(() => setShownValue(value), span + 800);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(failsafe);
    };
  }, [shown, value]);

  return (
    <span ref={ref} className={className}>
      {/* The real figure is in the DOM for anyone reading with assistive tech or no script. */}
      <span aria-hidden>{new Intl.NumberFormat("en-US").format(shownValue)}</span>
      {suffix}
      <span className="sr-only">
        {new Intl.NumberFormat("en-US").format(value)}
        {suffix}
      </span>
    </span>
  );
}
