"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { useStore } from "@/lib/store";

/*
 * The public site's header: nclexbase.com, /about, /pricing and the legal pages.
 *
 * Separate from the app's Sidebar on purpose. That one is navigation for someone who has
 * already paid attention — thirty links, a subject tree, a plan badge. A visitor who has not
 * decided anything yet needs four links and one action, and mixing the two would mean every
 * marketing page carried the whole study navigation.
 */

/** The public pages, in header order. */
const LINKS = [
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * @param sticky  Whether the header follows the scroll. The homepage turns it off: the review
 *   switcher is pinned up there instead, and two bars competing for `top: 0` overlap.
 */
export function SiteHeader({ sticky = true }: { sticky?: boolean } = {}) {
  // Until the persisted store is back, everyone is a visitor: rendering the signed-in state
  // first and correcting it would flash the wrong header on every load.
  const hydrated = useStore((s) => s.hydrated);
  const signedIn = useStore((s) => s.user.signedIn);
  const known = hydrated && signedIn;

  return (
    <header className={`${sticky ? "sticky top-0 z-40" : ""} border-b border-line bg-surface/90 backdrop-blur`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="NCLEXBase home" className="shrink-0">
          <Logo height={28} />
        </Link>

        <nav className="ml-auto hidden items-center gap-7 text-sm font-semibold text-muted sm:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:ml-7">
          {known ? (
            <Link
              href="/nclex"
              className="flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-press transition-[background,transform] duration-[50ms] hover:bg-primary-hover active:translate-y-[2px] active:shadow-none"
            >
              Go to my studying
            </Link>
          ) : (
            <>
              <Link href="/auth/signin" className="hidden h-10 items-center px-3 text-sm font-semibold text-primary hover:text-primary-hover sm:flex">
                Log in
              </Link>
              <Link
                href="/auth/join"
                className="flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-press transition-[background,transform] duration-[50ms] hover:bg-primary-hover active:translate-y-[2px] active:shadow-none"
              >
                Start free
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Narrow screens: the nav moves below the logo rather than behind a hamburger. Four
          links fit on one line, and a menu nobody needs is a tap nobody should have to make. */}
      <nav className="flex items-center gap-6 border-t border-line px-4 py-2.5 text-sm font-semibold text-muted sm:hidden">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="transition-colors hover:text-primary">
            {link.label}
          </Link>
        ))}
        {!known && (
          <Link href="/auth/signin" className="ml-auto text-primary">
            Log in
          </Link>
        )}
      </nav>
    </header>
  );
}
