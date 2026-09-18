import test, { describe } from "node:test"
import assert from "node:assert"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { tagPageDescription } from "./tagDescription"

const output = "public"
const missing = !existsSync(join(output, "index.html"))
const placeholder = "No description provided"

function metaDescription(html: string): string | undefined {
  return html.match(/<meta name="description" content="([^"]*)"/)?.[1]
}

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return htmlFiles(path)
    return entry.name.endsWith(".html") ? [path] : []
  })
}

describe("tag page description", () => {
  test("applies only to tag pages", () => {
    assert.equal(tagPageDescription(undefined, "dawid.dev"), undefined)
    assert.equal(tagPageDescription("index", "dawid.dev"), undefined)
    assert.equal(tagPageDescription("dev/index", "dawid.dev"), undefined)
    assert.equal(tagPageDescription("dev/tags-and-labels", "dawid.dev"), undefined)
  })

  test("names the tag and the site", () => {
    const description = tagPageDescription("tags/Zigbee2MQTT", "dawid.dev")
    assert.ok(description)
    assert.match(description, /tagged Zigbee2MQTT:/)
    assert.match(description, /dawid\.dev/)
  })

  test("the tag index gets its own sentence", () => {
    const description = tagPageDescription("tags/index", "dawid.dev")
    assert.ok(description)
    assert.doesNotMatch(description, /tagged index/)
  })

  test("stays inside snippet length for the shortest and longest tags", () => {
    for (const slug of ["tags/ai", "tags/steganography", "tags/index"]) {
      const length = [...tagPageDescription(slug, "dawid.dev")!].length
      assert.ok(length >= 100 && length <= 160, `${slug}: ${length} characters`)
    }
  })
})

describe("built output", { skip: missing ? "run `npx quartz build` first" : false }, () => {
  test("every tag page carries its generated description", () => {
    const pages = htmlFiles(join(output, "tags"))
    assert.ok(pages.length > 10, `only ${pages.length} tag page(s) built`)

    for (const page of pages) {
      const description = metaDescription(readFileSync(page, "utf8"))
      assert.ok(description, `${page} has no meta description`)
      assert.match(description, /^Every (note|tag) on dawid\.dev/, page)
    }
  })

  test("no page ships the Quartz placeholder description", () => {
    for (const page of htmlFiles(output)) {
      assert.notEqual(metaDescription(readFileSync(page, "utf8")), placeholder, page)
    }
  })
})
