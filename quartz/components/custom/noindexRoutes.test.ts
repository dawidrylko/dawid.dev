import test, { describe } from "node:test"
import assert from "node:assert"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { NOINDEX_SLUGS, isNoindexSlug } from "./noindexRoutes"

const output = "public"
const missing = !existsSync(join(output, "index.html"))

function read(file: string): string {
  return readFileSync(join(output, file), "utf8")
}

describe("noindex slugs", () => {
  test("only the listed slugs are excluded", () => {
    assert.deepEqual([...NOINDEX_SLUGS], ["privacy", "cookies"])
    assert.equal(isNoindexSlug("privacy"), true)
    assert.equal(isNoindexSlug("cookies"), true)
    assert.equal(isNoindexSlug("index"), false)
    assert.equal(isNoindexSlug(undefined), false)
    // A near miss must not be swallowed by a substring test.
    assert.equal(isNoindexSlug("privacy-policy"), false)
  })
})

describe("built output", { skip: missing ? "run `npx quartz build` first" : false }, () => {
  // Two of the three surfaces the rule covers, asserted together on purpose.
  // Applying one without the other tells a crawler two different things about
  // the same URL, and each lives in a different file, so nothing else would
  // catch the drift. The feed is the third, below.
  test("the legal pages are noindex and stay out of the sitemap", () => {
    const sitemap = read("sitemap.xml")

    for (const slug of NOINDEX_SLUGS) {
      const html = read(`${slug}.html`)
      const robots = html.match(/<meta name="robots" content="([^"]*)"/)

      assert.ok(robots, `${slug} carries no robots directive`)
      assert.match(robots[1], /noindex/, slug)
      // These are ordinary 200 pages that still pass internal links. Marking one
      // a dead end would also be wrong for its canonical.
      assert.match(robots[1], /follow/, slug)
      assert.doesNotMatch(robots[1], /nofollow/, `${slug} must not be a dead end`)

      assert.doesNotMatch(sitemap, new RegExp(`/${slug}<`), `${slug} leaked into the sitemap`)
    }
  })

  // The third surface. A page told to crawlers that it is not a search landing
  // page has no business being announced to subscribers as the newest post
  // either. Both documents are dated later than every article and the window
  // holds ten items, so while they were in the feed they cost two real articles
  // their slot. ContentIndex runs with `enableRSS: false` and the owned emitter
  // in quartz/plugins/emitters/rss.tsx applies the same list.
  test("the legal pages stay out of the RSS feed", () => {
    const feed = read("index.xml")

    for (const slug of NOINDEX_SLUGS) {
      // Anchored on the closing tag so a longer slug cannot hide the match, and
      // checked on both fields, because link and guid are written separately.
      assert.doesNotMatch(feed, new RegExp(`<link>https://dawid\\.dev/${slug}</link>`), slug)
      assert.doesNotMatch(feed, new RegExp(`<guid>https://dawid\\.dev/${slug}</guid>`), slug)
    }
  })

  test("the feed stays full, real and discoverable", () => {
    const feed = read("index.xml")

    // Guards the emitter against the failure that would pass the assertions
    // above by emitting an empty feed, and pins the property the exclusion was
    // for: ten slots, all of them spent on articles.
    const items = (feed.match(/<item>/g) ?? []).length
    assert.equal(items, 10, `feed lists ${items} item(s)`)
    assert.match(feed, /<link>https:\/\/dawid\.dev\/dev\//)

    // Owning the feed means owning the head link ContentIndex used to attach.
    // With `enableRSS: false` upstream stops emitting one, and nothing else
    // would notice every page had quietly lost RSS autodiscovery.
    assert.match(
      read("index.html"),
      /<link rel="alternate" type="application\/rss\+xml" title="RSS Feed" href="https:\/\/dawid\.dev\/index\.xml"\/>/,
    )
  })

  test("ordinary pages stay indexable and listed", () => {
    assert.doesNotMatch(read("index.html"), /<meta name="robots"/)

    // Guards the emitter against the failure that would pass every assertion
    // above by emitting nothing at all.
    const sitemap = read("sitemap.xml")
    const urls = (sitemap.match(/<url>/g) ?? []).length
    assert.ok(urls > 50, `sitemap lists only ${urls} url(s)`)
    assert.match(sitemap, /https:\/\/dawid\.dev\/dev\//)
  })
})
