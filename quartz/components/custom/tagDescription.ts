const TAG_PREFIX = "tags/"

export function tagPageDescription(slug: string | undefined, site: string): string | undefined {
  if (!slug?.startsWith(TAG_PREFIX)) return undefined
  const tag = slug.slice(TAG_PREFIX.length)
  if (tag === "index") {
    return `Every tag on ${site}, each leading to the notes filed under it: software engineering, architecture, DevOps, IoT, security and AI.`
  }
  return `Every note on ${site} tagged ${tag}: working notes on software engineering, architecture, DevOps, IoT and security.`
}
