import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

/**
 * The public pages other than the homepage: /about, /pricing, /contact, /privacy, /terms.
 *
 * They share this chrome; `/` keeps its own because the review switcher has to sit above the
 * header. When an option is chosen and the switcher goes, the homepage can move in here too.
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
    </>
  );
}
