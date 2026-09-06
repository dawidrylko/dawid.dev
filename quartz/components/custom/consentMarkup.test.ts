import test, { describe } from "node:test"
import assert from "node:assert"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const output = "public"
const missing = !existsSync(join(output, "index.html"))

function read(file: string): string {
  return readFileSync(join(output, file), "utf8")
}

function everyPage(): string[] {
  const pages: string[] = []

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (entry.name.endsWith(".html")) pages.push(path)
    }
  }

  walk(output)
  return pages
}

describe("built output", { skip: missing ? "run `npx quartz build` first" : false }, () => {
  test("the head bundle declares consent but never loads a tag", () => {
    const prescript = read("prescript.js")
    assert.match(prescript, /push\(arguments\)/)
    assert.match(prescript, /ads_data_redaction/)
    assert.doesNotMatch(prescript, /googletagmanager/)
  })

  test("the analytics loader ships only in the deferred bundle", () => {
    assert.match(read("postscript.js"), /googletagmanager\.com\/gtag\/js/)
  })

  test("the banner renders hidden, so no script means no measurement", () => {
    assert.match(read("index.html"), /id="cookie-consent"[^>]*\shidden/)
  })

  test("the dialog is focusable and shows where focus went", () => {
    const html = read("index.html")
    assert.match(html, /class="cookie-consent-dialog"[^>]*role="dialog"/)
    assert.match(html, /class="cookie-consent-dialog"[^>]*tabindex="-1"/)
    assert.match(read("index.css"), /\.cookie-consent-dialog:focus\s*\{[^}]*outline/)
  })

  test("no page renders a mermaid block, whose loader would fetch from a cdn", () => {
    const offenders = everyPage().filter((page) =>
      /class="[^"]*\bmermaid\b/.test(read(page.slice(output.length + 1))),
    )

    assert.deepEqual(
      offenders,
      [],
      "upstream's mermaid script imports from cdnjs.cloudflare.com on first use; self-host it or turn mermaid off before publishing a diagram",
    )
  })

  test("the youtube embed ships as a facade, not as a player", () => {
    for (const page of everyPage()) {
      const html = read(page.slice(output.length + 1))
      assert.doesNotMatch(html, /<iframe[^>]*youtube/, page)
    }
  })

  test("no page fetches a third party on its own", () => {
    const autoFetched =
      /<(?:script|link|img|iframe)[^>]*(?:src|href)="(https?:\/\/(?!dawid\.dev)[^"]*)"/g
    const offenders = new Map<string, string>()

    for (const page of everyPage()) {
      for (const [, url] of read(page.slice(output.length + 1)).matchAll(autoFetched)) {
        offenders.set(new URL(url).host, page)
      }
    }

    assert.deepEqual([...offenders.entries()], [])
  })
})
