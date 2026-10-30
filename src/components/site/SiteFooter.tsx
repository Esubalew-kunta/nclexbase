"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { SITE_NAME } from "@/lib/brand";
import { useConfig } from "@/lib/content";

/*
 * The public site's footer.
 *
 * Three columns and a line of small print. The site name, support address and legal URLs come
 * from config, so the admin owns them — the same rule the rest of the app follows.
 *
 * Deliberately short: bootcamp.com's footer carries five columns including a blog, an
 * ambassador programme and eight sibling products. We have none of those, and a footer padded
 * out with links that go nowhere is worse than a small one.
 */
/**
 * @param flush  No top margin, for a page that ends in a full-width band the footer should sit
 *   against. The homepage is that page -- it closes on the dark call to action -- so it is the
 *   default there, rather than something the page has to remember to pass.
 */
export function SiteFooter({ flush }: { flush?: boolean } = {}) {
  const onHome = usePathname() === "/";
  const { branding } = useConfig();
  const name = branding.siteName || SITE_NAME;

  return (
    <footer className={`${(flush ?? onHome) ? "" : "mt-24 "}border-t border-line bg-surface`}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Logo height={26} />
          <p className="mt-3 max-w-56 text-sm leading-5 text-muted">NCLEX preparation built around the questions themselves.</p>
        </div>

        <Column title="Studying">
          <Item href="/auth/join">Create an account</Item>
          <Item href="/auth/signin">Log in</Item>
          <Item href="/pricing">Pricing</Item>
        </Column>

        <Column title="NCLEXBase">
          <Item href="/about">About us</Item>
          <Item href="/contact">Contact</Item>
          {branding.supportEmail && (
            <li>
              <a href={`mailto:${branding.supportEmail}`} className="transition-colors hover:text-primary">
                {branding.supportEmail}
              </a>
            </li>
          )}
        </Column>

        <Column title="Legal">
          <Item href="/privacy">Privacy policy</Item>
          <Item href="/terms">Terms of use</Item>
        </Column>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs leading-5 text-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {name}. All rights reserved.
          </p>
          {/* NCLEX-RN is the NCSBN's trademark. Saying so is both correct and the thing every
              credible prep site does; leaving it out reads as carelessness. */}
          <p>NCLEX-RN® and NCLEX-PN® are registered trademarks of the NCSBN, which does not endorse this site.</p>
        </div>
      </div>
    </footer>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-xs font-bold tracking-wider text-ink uppercase">{title}</h2>
      <ul className="space-y-2 text-sm text-muted">{children}</ul>
    </div>
  );
}

function Item({ href, children }: { href: React.ComponentProps<typeof Link>["href"]; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="transition-colors hover:text-primary">
        {children}
      </Link>
    </li>
  );
}
