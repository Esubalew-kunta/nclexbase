"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { useStore } from "@/lib/store";

/*
 * The public site's header: nclexbase.com, /about, /pricing and the legal pages.
 *
 * Separate from the app's Sidebar on purpose. That one is navigation for someone who has
 * already paid attention — thirty links, a subject tree, a plan badge. A visitor who has not
 * decided anything yet needs five links and one action, and mixing the two would mean every
 * marketing page carried the whole study navigation.
 *
 * Subjects and Features are sections of the homepage, so they are `/#…` links: on the homepage
 * they scroll, from any other public page they go there first.
 */

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/#subjects", label: "Subjects" },
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
] as const;

/*
 * Log in is a nav item, not a button tucked beside the call to action.
 *
 * There is one door for everybody: `/auth/signin` checks the password and the role decides
 * where you land, so students and staff use the same link. The admin has its own form only as
 * a fallback for a browser-local prototype session, and it is reachable from the footer rather
 * than from here, because a visitor who has not signed up yet should not be reading the word
 * "admin" at the top of the page.
 */
const SIGN_IN = { href: "/auth/signin", label: "Log in" } as const;

const cta =
  "flex h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-gold px-6 text-sm font-bold text-ink-teal shadow-premium transition-[background,transform] duration-[60ms] hover:bg-[#d3b05f] active:translate-y-[2px] active:shadow-none";

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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const action = known ? (
    <Link href="/nclex" className={cta}>
      My studying
    </Link>
  ) : (
    <Link href="/auth/join" className={cta}>
      Get Started
    </Link>
  );

  return (
    <header className={`${sticky ? "sticky top-0 z-40" : ""} border-b border-line bg-surface/92 backdrop-blur`}>
      <div className="mx-auto flex h-[68px] max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="NCLEXBase home" className="shrink-0" onClick={() => setOpen(false)}>
          <Logo height={32} />
        </Link>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-8 text-[15px] font-semibold text-muted md:flex">
          {[...LINKS, ...(known ? [] : [SIGN_IN])].map((link) => {
            const active = link.href === pathname;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative py-5 transition-colors hover:text-primary ${active ? "text-primary after:absolute after:inset-x-0 after:bottom-3 after:h-0.5 after:rounded-full after:bg-primary" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 md:ml-4">
          {action}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex size-11 items-center justify-center rounded-full text-primary hover:bg-primary-light md:hidden"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Narrow screens: a panel under the bar. Big targets, one tap each, closes on use. */}
      {open && (
        <nav id="site-menu" aria-label="Main" className="animate-fade-in border-t border-line bg-surface px-4 pt-2 pb-4 md:hidden">
          <ul>
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex h-12 items-center border-b border-line/70 text-base font-semibold ${link.href === pathname ? "text-primary" : "text-ink"}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {!known && (
              <li>
                <Link href={SIGN_IN.href} onClick={() => setOpen(false)} className="flex h-12 items-center text-base font-semibold text-primary">
                  {SIGN_IN.label}
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
