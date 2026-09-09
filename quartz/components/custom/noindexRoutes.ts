/**
 * Pages kept out of the search index.
 *
 * The legal documents are linked from every footer and stay fully reachable,
 * but they are not search landing pages: nobody should arrive at a privacy
 * policy from a result instead of the page it belongs to. Same rule, same two
 * rule as dawidrylko.com and silesiansolutions.com, which is why the list lives
 * in one place: Head.tsx turns it into a robots directive, and the Sitemap and
 * RSS emitters use it to leave those URLs out of sitemap.xml and index.xml.
 * Applying one surface without the others hands a crawler two contradictory
 * instructions about the same URL, or announces to every subscriber as the
 * newest post a page that crawlers are told is not a landing page at all.
 *
 * "noindex, follow", never "noindex, nofollow": these are ordinary 200 pages
 * that still pass internal links, so marking them dead ends would be wrong.
 */
export const NOINDEX_SLUGS = ["privacy", "cookies"] as const

export function isNoindexSlug(slug: string | undefined): boolean {
  return slug !== undefined && (NOINDEX_SLUGS as readonly string[]).includes(slug)
}
