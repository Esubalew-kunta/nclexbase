"use client";

import { Suspense } from "react";
import { HomeV1 } from "@/components/home/HomeV1";
import { HomeV2 } from "@/components/home/HomeV2";
import { HomeV3 } from "@/components/home/HomeV3";
import { VariantSwitcher, useVariant } from "@/components/home/VariantSwitcher";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

/*
 * nclexbase.com.
 *
 * Until this commit `/` was a meta refresh into `/nclex`, so the site had no public front
 * door at all. It now has one — three of them, while an option is being chosen.
 *
 * Header and footer are shared by all three variants on purpose: the review is about the page,
 * not about the chrome, and a reviewer comparing three different navigation bars would be
 * answering a question nobody asked. Each variant owns everything between them.
 *
 * The whole site stays out of search engines. That is set once in the root layout's `robots`
 * metadata and enforced again by robots.txt and the server's X-Robots-Tag, so these new pages
 * inherit it with nothing to remember.
 */
export default function HomePage() {
  return (
    /*
     * useSearchParams reads `?v=`, which needs a boundary for the static export. The fallback
     * renders v1 rather than nothing: a static host cannot know the query string, so this is
     * the HTML every visitor is served first, and an empty page that fills in a moment later
     * is a worse first paint than the default option shown immediately.
     */
    <Suspense
      fallback={
        <Shell>
          <HomeV1 />
        </Shell>
      }
    >
      <Home />
    </Suspense>
  );
}

function Home() {
  const [variant, choose] = useVariant();

  return (
    <>
      <VariantSwitcher variant={variant} onChange={choose} />
      <Shell>{variant === 1 ? <HomeV1 /> : variant === 2 ? <HomeV2 /> : <HomeV3 />}</Shell>
    </>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Not sticky here: the review switcher holds the top of the window instead. */}
      <SiteHeader sticky={false} />
      {children}
      <SiteFooter />
    </>
  );
}
