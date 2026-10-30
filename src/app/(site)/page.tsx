import { HomeV1 } from "@/components/home/HomeV1";

/*
 * nclexbase.com.
 *
 * Three homepage directions were built and reviewed behind a `?v=` switcher; the owner chose
 * this one on 2026-10-30, so the switcher, the two losing variants and their illustrations are
 * gone and `/` renders the winner directly. The page sits under the site layout now, which is
 * where the header and footer come from -- it had its own copy of both only because the review
 * bar needed the top of the window.
 *
 * The whole site stays out of search engines: set once in the root layout's `robots` metadata
 * and enforced again by robots.txt and the server's X-Robots-Tag.
 */
export default function HomePage() {
  return <HomeV1 />;
}
