import { GlobalConfiguration } from "../../cfg"
import { getDate } from "../../components/Date"
import { escapeHTML } from "../../util/escape"
import { FullSlug, SimpleSlug, joinSegments, simplifySlug } from "../../util/path"
import { BuildCtx } from "../../util/ctx"
import { ProcessedContent } from "../vfile"
import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import { i18n } from "../../i18n"
import { isNoindexSlug } from "../../components/custom/noindexRoutes"

/**
 * Owned RSS emitter, replacing the one inside upstream's ContentIndex.
 *
 * Same constraint as the sitemap: upstream offers no per-page filter and
 * emitters run in parallel, so its output cannot be rewritten afterwards.
 * ContentIndex is therefore configured with `enableRSS: false` in
 * quartz.config.ts and this emits index.xml instead, leaving out the pages
 * Head.tsx marks noindex.
 *
 * Without it the two legal documents sat at the top of the feed forever. They
 * are dated later than every article, the window holds ten items, so they both
 * announced themselves as the newest posts and pushed two real articles out.
 * A page told to crawlers it is not a search landing page has no business being
 * the newest thing a subscriber sees.
 *
 * ContentIndex keeps emitting static/contentIndex.json over the full content
 * set, so the legal pages stay in the site search and in link popovers. Only
 * the feed loses them.
 *
 * Deliberately a faithful copy of upstream's `generateRSSFeed` shape (same
 * channel fields, same item fields, same sort), so a bump that changes the feed
 * format shows up as a diff to port rather than a silent divergence.
 *
 * Three upstream options are NOT carried over, because quartz.config.ts sets
 * none of them and each would add surface to re-port on every bump:
 * `rssFullHtml` (feed items would carry rendered page HTML instead of the
 * description), `rssSlug` (the output name, fixed here to index.xml, which is
 * also what the head link below points at) and `includeEmptyFiles`, which on
 * ContentIndex also gates the content index. Setting any of them on
 * ContentIndex would silently stop applying to the feed.
 */
const RSS_LIMIT = 10

type FeedEntry = {
  slug: SimpleSlug
  title: string
  description: string
  date: Date
}

function generateRSSFeed(cfg: GlobalConfiguration, entries: FeedEntry[], limit: number): string {
  const base = cfg.baseUrl ?? ""

  const items = entries
    .map(
      ({ slug, title, description, date }) => `<item>
    <title>${escapeHTML(title)}</title>
    <link>https://${joinSegments(base, encodeURI(slug))}</link>
    <guid>https://${joinSegments(base, encodeURI(slug))}</guid>
    <description><![CDATA[ ${description} ]]></description>
    <pubDate>${date.toUTCString()}</pubDate>
  </item>`,
    )
    .join("")

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
    <channel>
      <title>${escapeHTML(cfg.pageTitle)}</title>
      <link>https://${base}</link>
      <description>${i18n(cfg.locale).pages.rss.lastFewNotes({ count: limit })} on ${escapeHTML(
        cfg.pageTitle,
      )}</description>
      <generator>Quartz -- quartz.jzhao.xyz</generator>
      ${items}
    </channel>
  </rss>`
}

function emitRSS(ctx: BuildCtx, content: ProcessedContent[]) {
  const cfg = ctx.cfg.configuration
  const entries: FeedEntry[] = []

  for (const [, file] of content) {
    const slug = file.data.slug!
    if (isNoindexSlug(slug)) continue
    entries.push({
      slug: simplifySlug(slug),
      title: file.data.frontmatter?.title!,
      description: file.data.description ?? "",
      date: getDate(cfg, file.data) ?? new Date(),
    })
  }

  // Upstream sorts newest first and only compares titles when a date is
  // missing on one side. That branch is unreachable here for the same reason it
  // is unreachable there: the fallback above gives every entry a date. Sort is
  // stable, so equal dates keep content order, exactly as upstream leaves them.
  entries.sort((a, b) => b.date.getTime() - a.date.getTime())

  return write({
    ctx,
    content: generateRSSFeed(cfg, entries.slice(0, RSS_LIMIT), RSS_LIMIT),
    slug: "index" as FullSlug,
    ext: ".xml",
  })
}

export const RSS: QuartzEmitterPlugin = () => ({
  name: "RSS",
  getQuartzComponents() {
    return []
  },
  async *emit(ctx, content) {
    yield emitRSS(ctx, content)
  },
  // The feed is derived from the whole content set, not from the changed files,
  // so a partial rebuild still has to rewrite all of it. Upstream's ContentIndex
  // declares no partialEmit and is given a full re-emit; an empty one here would
  // instead leave index.xml stale under `quartz build --serve` until restart.
  async *partialEmit(ctx, content) {
    yield emitRSS(ctx, content)
  },
  // ContentIndex attaches this head link when it owns the feed. With
  // `enableRSS: false` it stops, and without this every page would lose RSS
  // autodiscovery while index.xml carried on being emitted.
  externalResources: (ctx) => ({
    additionalHead: [
      <link
        rel="alternate"
        type="application/rss+xml"
        title="RSS Feed"
        href={`https://${ctx.cfg.configuration.baseUrl}/index.xml`}
      />,
    ],
  }),
})
