/* eslint-disable @next/next/no-img-element */

/*
 * The illustration beside "Study Tools for Real Progress": a phone running the real app, a
 * cheat sheet behind it, a small progress card and a sticky note.
 *
 * The phone screen is a screenshot of the product, not a drawing of one — the case-study exam
 * as it renders at 390 px, captured at 2x (`public/assets/home/app-exam.jpg`). A drawn
 * stand-in was the first version and it undercut the page: a visitor who cannot tell whether
 * the app exists is the whole problem this section has to solve, and a mock screen is exactly
 * what a site with nothing to show would draw. Re-shoot it the same way whenever the exam
 * screen changes; the frame expects a 390 x 844 viewport (9:19.5), which is the frame's own
 * ratio, so the whole screen shows and nothing is sliced. A zoomed-in crop was tried first and
 * was worse: it cut words at both edges, which reads as a broken screenshot rather than a
 * phone. Nobody reads this text; they read "that is a real question screen", and the shape of
 * the thing — exam bar, chart tabs, the NCLEX chrome — is what carries that.
 *
 * The exam screen was chosen over the app's home: it is the part that is ours and unusual
 * (chart tabs, highlight items, the NCLEX chrome), and it carries no subject icons — those are
 * still the scraped set, which must not travel onto a public page.
 *
 * Everything around the phone stays markup, so it keeps the brand tokens and stays sharp.
 * Drawn on a fixed 340 x 440 canvas and scaled as one piece, so the overlaps hold at any
 * width instead of drifting apart as the column narrows.
 */
export function StudyToolsArt({ className = "" }: { className?: string }) {
  return (
    <div className={`relative mx-auto h-[440px] w-[340px] origin-top max-[380px]:scale-[0.92] ${className}`} aria-hidden>
      {/* The mint disc everything sits on. */}
      <div className="absolute top-8 left-6 size-72 rounded-full bg-primary-light" />

      {/* Plant, behind the sticky note. */}
      <svg viewBox="0 0 90 150" className="absolute right-0 bottom-8 h-36 w-auto" fill="none">
        <path d="M45 118c-2-34-10-60-26-84 22 6 32 30 34 58 1-30 8-58 30-72-2 30-8 56-20 98" fill="#2f8f8a" opacity=".9" />
        <path d="M45 118c0-28 2-50 8-76 8 22 8 52 3 76z" fill="#0e5a5c" />
        <path d="M30 118h30l-4 28H34z" fill="#e7d9bd" />
      </svg>

      {/* Cheat sheet, behind the phone. */}
      <div className="absolute top-0 left-[158px] w-[172px] rounded-2xl bg-surface p-4 shadow-[0_18px_40px_-14px_rgba(7,39,42,0.35)]">
        <p className="text-[13px] leading-4 font-bold text-primary">NCLEX Cheat Sheet</p>
        <p className="text-xs text-muted">(Topic)</p>
        <div className="mt-3 space-y-1.5 rounded-lg border border-line p-2.5">
          <div className="h-1.5 w-full rounded-full bg-primary-light" />
          <div className="h-1.5 w-4/5 rounded-full bg-primary-light" />
          <div className="h-1.5 w-3/5 rounded-full bg-primary-light" />
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-line" />
          <div className="h-1.5 w-11/12 rounded-full bg-line" />
        </div>
      </div>

      {/* Progress card, in front of the phone's right edge. */}
      <div className="absolute top-[222px] left-[140px] z-10 w-[190px] rounded-2xl bg-surface p-3.5 shadow-[0_18px_40px_-14px_rgba(7,39,42,0.35)]">
        <p className="text-xs font-bold text-primary">Where you lose marks</p>
        <div className="mt-2.5 flex h-14 items-end gap-2">
          {[38, 62, 46, 84, 70].map((h, i) => (
            <span key={i} className={`flex-1 rounded-t-md ${i === 3 ? "bg-clay" : "bg-primary/80"}`} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      {/* Phone. The screenshot fills the glass; the notch sits on top of it, as on a real one. */}
      <div className="absolute top-12 left-1 z-[5] h-[372px] w-[172px] -rotate-[5deg] rounded-[34px] bg-ink-teal p-1.5 shadow-[0_30px_50px_-18px_rgba(7,39,42,0.6)]">
        <div className="relative h-full overflow-hidden rounded-[28px] bg-surface">
          <img src="/assets/home/app-home.jpg" alt="" width={780} height={1688} className="size-full object-cover object-top" />
          <span className="absolute top-2 left-1/2 h-1.5 w-11 -translate-x-1/2 rounded-full bg-ink-teal/80" />
          {/* A hairline of the brand teal over the glass: the screenshot is JPEG and its very
              top row can bruise, and this reads as the phone's own bezel reflection. */}
          <span className="absolute inset-x-0 top-0 h-px bg-ink-teal/20" />
        </div>
      </div>

      {/* Sticky note. */}
      <div className="absolute right-0 -bottom-1 z-20 w-[132px] rotate-[4deg] rounded-md rounded-br-2xl bg-[#f6efd9] px-4 pt-4 pb-5 font-hand text-[25px] leading-[1.05] text-[#5b4a1f] shadow-[0_14px_30px_-10px_rgba(91,74,31,0.45)]">
        Small steps. Big progress.
      </div>
    </div>
  );
}
