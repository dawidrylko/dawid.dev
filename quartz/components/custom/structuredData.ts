import type { Element, ElementContent, Root } from "hast"
import { isNoindexSlug } from "./noindexRoutes"

/**
 * JSON-LD for every page, as one @graph.
 *
 * dawid.dev is the English workshop of the person dawidrylko.com describes, so
 * the Person node reuses that site's @id instead of minting a second entity.
 * Both sites then point at one node and a consumer merges what each says about
 * it. Keep the @id byte-identical to the one in dawidrylko.com's live markup.
 *
 * Notes are TechArticle rather than BlogPosting: they are reference material
 * (commands, configurations, fixes) filed by topic, not entries in a dated
 * stream. dateModified is whatever Quartz computed, which is the created date
 * unless the note carries a `modified:` key. Google reads both as Article, so the choice costs nothing there.
 */
export const PERSON_ID = "https://dawidrylko.com/#person"

const PERSON = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: "Dawid Ryłko",
  url: "https://dawidrylko.com/",
  sameAs: [
    "https://dawid.dev/",
    "https://github.com/dawidrylko",
    "https://www.linkedin.com/in/dawidrylko",
  ],
}

const SITE_NAME = "dawid.dev"

// Verbatim copies of other people's documents (BIP-32, a product page). An
// article node would claim Dawid wrote them.
const THIRD_PARTY_PREFIX = "sources/"

export interface Citation {
  "@type": "CreativeWork"
  name: string
  url: string
}

export interface PageInput {
  slug: string
  baseUrl: string
  locale: string
  title: string
  description: string
  created?: Date
  modified?: Date
  tree?: Root
}

export type PageKind = "article" | "collection" | "none"

export function pageKind(slug: string): PageKind {
  if (slug === "index" || slug === "404" || isNoindexSlug(slug)) return "none"
  if (slug.startsWith("tags/")) return "none"
  if (slug.endsWith("/index")) return "collection"
  if (slug.startsWith(THIRD_PARTY_PREFIX)) return "none"
  return "article"
}

// The same address sitemap.xml lists: no .html, a folder ends in a slash.
export function pageUrl(baseUrl: string, slug: string): string {
  const path =
    slug === "index" ? "" : slug.endsWith("/index") ? slug.slice(0, -"index".length) : slug
  return `https://${baseUrl}/${encodeURI(path)}`
}

function isElement(node: ElementContent | Root["children"][number], tag: string): node is Element {
  return node.type === "element" && node.tagName === tag
}

function isAbsoluteLink(node: Element): boolean {
  const href = node.properties?.href
  return node.tagName === "a" && typeof href === "string" && /^https?:\/\//.test(href)
}

// Text of the item in reading order, plus where the first absolute link ends.
function linkedText(item: Element): { full: string; link?: Element; linkEnd: number } {
  let full = ""
  let link: Element | undefined
  let linkEnd = -1
  const walk = (node: ElementContent) => {
    if (node.type === "text") full += node.value
    if (node.type !== "element") return
    node.children.forEach(walk)
    if (!link && isAbsoluteLink(node)) {
      link = node
      linkEnd = full.length
    }
  }
  item.children.forEach(walk)
  return { full, link, linkEnd }
}

/**
 * Items of the ordered list right under a `## Sources` heading. The notes write
 * each item as "Publisher, [Title](url): what it supports", so the name is the
 * text up to the colon that follows the link.
 */
export function sourcesCitations(tree: Root | undefined): Citation[] {
  if (!tree) return []
  const nodes = tree.children.filter((node): node is Element => node.type === "element")
  const heading = nodes.findIndex(
    (node) => isElement(node, "h2") && node.properties?.id === "sources",
  )
  const list = heading === -1 ? undefined : nodes[heading + 1]
  if (!list || !isElement(list, "ol")) return []

  return list.children.flatMap((item) => {
    if (!isElement(item, "li")) return []
    const { full, link, linkEnd } = linkedText(item)
    if (!link) return []
    const colon = full.indexOf(":", linkEnd)
    const name = (colon === -1 ? full : full.slice(0, colon)).replace(/\s+/g, " ").trim()
    const href = link.properties.href as string
    return [{ "@type": "CreativeWork" as const, name, url: href }]
  })
}

function isoDate(date: Date | undefined): string | undefined {
  return date && !isNaN(date.getTime()) ? date.toISOString() : undefined
}

export function structuredData(page: PageInput): object {
  const siteUrl = `https://${page.baseUrl}/`
  const websiteId = `${siteUrl}#website`
  const graph: object[] = [
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: siteUrl,
      name: SITE_NAME,
      inLanguage: page.locale,
      publisher: { "@id": PERSON_ID },
    },
    PERSON,
  ]

  const url = pageUrl(page.baseUrl, page.slug)
  const kind = pageKind(page.slug)
  if (kind === "article") {
    const citation = sourcesCitations(page.tree)
    graph.push({
      "@type": "TechArticle",
      "@id": `${url}#article`,
      headline: page.title,
      description: page.description,
      url,
      mainEntityOfPage: url,
      datePublished: isoDate(page.created),
      dateModified: isoDate(page.modified),
      inLanguage: page.locale,
      author: { "@id": PERSON_ID },
      isPartOf: { "@id": websiteId },
      ...(citation.length > 0 ? { citation } : {}),
    })
  } else if (kind === "collection") {
    graph.push({
      "@type": "CollectionPage",
      "@id": url,
      url,
      name: page.title,
      description: page.description,
      inLanguage: page.locale,
      isPartOf: { "@id": websiteId },
    })
  }

  return { "@context": "https://schema.org", "@graph": graph }
}

// "</script>" inside a string would close the element early. JSON accepts the
// escaped form, so the parsed value does not change.
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
