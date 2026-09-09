import test, { describe } from "node:test"
import assert from "node:assert"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const output = "public"
const missing = !existsSync(join(output, "index.html"))

function read(file: string): string {
  return readFileSync(join(output, file), "utf8")
}

/** Collapses the whitespace JSX leaves between the lines of a paragraph. */
function flatten(html: string): string {
  return html.replace(/\s+/g, " ")
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

  test("the bar itself is the dialog, and is focusable", () => {
    const html = read("index.html")
    assert.match(html, /id="cookie-consent"[^>]*role="dialog"/)
    assert.match(html, /id="cookie-consent"[^>]*tabindex="-1"/)
  })

  test("the bar shows no focus ring of its own, but its controls do", () => {
    const css = read("index.css")

    // The bar is focused programmatically on open and is not tab-reachable, so
    // a ring around the whole strip is the bug this rule exists to kill.
    assert.match(css, /\.cookie-consent:focus[^{]*\{[^}]*outline:\s*none/)

    // Removing the ring above must not cost keyboard users the real one.
    // Asserted per selector: one alternation stays green with either half gone,
    // which is exactly how a link would lose its ring unnoticed.
    assert.match(css, /\.cookie-consent a:focus-visible[^{]*\{[^}]*outline:\s*3px/)
    assert.match(css, /\.cookie-consent button:focus-visible[^{]*\{[^}]*outline:\s*3px/)
  })

  test("the bar sits at the bottom and locks neither scrolling nor focus", () => {
    const css = read("index.css")
    const bar = css.match(/\.cookie-consent\s*\{[^}]*\}/)?.[0] ?? ""

    assert.match(bar, /position:\s*fixed/)
    assert.match(bar, /bottom:\s*0/)
    assert.doesNotMatch(bar, /inset:\s*0/)
    assert.doesNotMatch(css, /\.cookie-consent[^{]*\{[^}]*backdrop-filter/)
    assert.doesNotMatch(read("index.html"), /id="cookie-consent"[^>]*aria-modal/)
  })

  // The banner asks the same question, in the same words, as the one on
  // dawidrylko.com. Pinned so a reword on THIS site reddens here. It cannot see
  // the other repo, so a reword there still passes unnoticed: the pair is only
  // as aligned as whoever edits one remembers to edit the other.
  test("the banner carries the wording shared with dawidrylko.com", () => {
    const html = flatten(read("index.html"))

    assert.ok(html.includes(">Analytics cookies<"), "heading")
    assert.ok(
      html.includes(
        "This site measures traffic with Google Analytics 4, which stores two cookies on your device. Nothing is loaded and nothing is stored until you agree. Refusing keeps the site fully usable.",
      ),
      "body",
    )
    assert.ok(html.includes(">Cookie policy<"), "cookie policy link")
    assert.ok(html.includes(">Privacy policy<"), "privacy policy link")
    assert.ok(html.includes("Your current choice: analytics allowed."), "allowed state")
    assert.ok(html.includes("Your current choice: analytics refused."), "refused state")

    // Refusing and accepting are one click each, on the first and only layer.
    assert.match(html, /data-consent-action="reject"[^>]*>Refuse</)
    assert.match(html, /data-consent-action="accept"[^>]*>Accept</)
    assert.doesNotMatch(html, /data-consent-action="(customise|save|back)"/)
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
