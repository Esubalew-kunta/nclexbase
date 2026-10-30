import { HelpWidget } from "@/components/site/HelpWidget";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

/**
 * Every public page: `/`, /about, /pricing, /contact, /privacy, /terms.
 *
 * The homepage used to carry its own copy of this chrome, because the homepage review switcher
 * had to sit above the header. The switcher is gone, so it lives here with the rest.
 *
 * Nothing sets `robots` here. The root layout already tells every page in the site not to be
 * indexed, and repeating it per page is how one eventually gets missed.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
      {/* Public pages only. The app has its own chrome, and a floating button over a timed
          exam would be an invitation to lose a question. */}
      <HelpWidget />
    </>
  );
}
