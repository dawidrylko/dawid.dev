import { GlobalConfiguration } from "../../cfg"
import { getDate } from "../../components/Date"
import { FullSlug, SimpleSlug, joinSegments, simplifySlug } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import { isNoindexSlug } from "../../components/custom/noindexRoutes"

/**
 * Owned sitemap emitter, replacing the one inside upstream's ContentIndex.
 *
 * Upstream offers no per-page filter and emitters run in parallel, so a
 * post-processing pass could not reliably rewrite its output. ContentIndex is
 * therefore configured with `enableSiteMap: false` in quartz.config.ts and this
 * emits the file instead, leaving out the pages Head.tsx marks noindex.
 *
 * Deliberately a faithful copy of upstream's `generateSiteMap` shape (same
 * urlset, same lastmod), so a bump that changes the sitemap format shows up as
 * a diff to port rather than a silent divergence.
 */
function generateSiteMap(
  cfg: GlobalConfiguration,
  entries: [SimpleSlug, Date | undefined][],
): string {
  const base = cfg.baseUrl ?? ""
  const urls = entries
    .map(
      ([slug, date]) => `<url>
    <loc>https://${joinSegments(base, encodeURI(slug))}</loc>
    ${date && `<lastmod>${date.toISOString()}</lastmod>`}
  </url>`,
    )
    .join("")
  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`
}

export const Sitemap: QuartzEmitterPlugin = () => ({
  name: "Sitemap",
  getQuartzComponents() {
    return []
  },
  async *emit(ctx, content) {
    const cfg = ctx.cfg.configuration
    const entries: [SimpleSlug, Date | undefined][] = []

    for (const [, file] of content) {
      const slug = file.data.slug!
      if (isNoindexSlug(slug)) continue
      entries.push([simplifySlug(slug), getDate(cfg, file.data) ?? new Date()])
    }

    yield write({
      ctx,
      content: generateSiteMap(cfg, entries),
      slug: "sitemap" as FullSlug,
      ext: ".xml",
    })
  },
  async *partialEmit() {},
})
