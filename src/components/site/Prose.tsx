import type { ReactNode } from "react";

/*
 * The reading layout for the written pages: About, Privacy, Terms, Contact.
 *
 * One column, one measure, one set of heading sizes. These pages are read, not navigated, and
 * a legal page that styles itself is a legal page where one clause ends up looking more
 * important than another.
 */

export function PageHeader({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        {eyebrow && <p className="text-xs font-bold tracking-[0.18em] text-gold uppercase">{eyebrow}</p>}
        <h1 className="mt-4 text-4xl leading-[1.1] font-extrabold tracking-tight text-ink sm:text-5xl">{title}</h1>
        {intro && <p className="mt-5 text-xl leading-8 text-muted">{intro}</p>}
      </div>
    </header>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">{children}</div>;
}

/** A titled block of a written page. `id` so a clause can be linked to directly. */
export function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section className="mb-11 scroll-mt-24" id={id}>
      <h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2>
      <div className="mt-3 space-y-4 text-[17px] leading-7 text-muted">{children}</div>
    </section>
  );
}

/** When a page was last changed. Legal pages are not credible without one. */
export function Updated({ date }: { date: string }) {
  return <p className="mb-11 text-sm text-faint">Last updated {date}</p>;
}
