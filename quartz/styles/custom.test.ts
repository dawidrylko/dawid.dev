import test, { describe } from "node:test"
import assert from "node:assert"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const output = "public"
const missing = !existsSync(join(output, "index.html"))

function read(file: string): string {
  return readFileSync(join(output, file), "utf8")
}

/**
 * Returns the body of the first `@media` block whose prelude matches. Brace
 * matching rather than a regex, because the emitted CSS is minified onto one
 * line and the minifier is free to rewrite the prelude: it already drops the
 * `all and` the rule is authored with.
 */
function mediaBlock(css: string, prelude: RegExp): string {
  const start = css.search(prelude)
  assert.notStrictEqual(start, -1, `no @media block matching ${prelude}`)

  const open = css.indexOf("{", start)
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++
    else if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i)
  }

  return assert.fail("unterminated @media block")
}

describe("built stylesheet", { skip: missing ? "run `npx quartz build` first" : false }, () => {
  // Below the mobile breakpoint the left sidebar is one nowrap flex row, and
  // the mobile grid gives #quartz-body a single `auto` column. An `auto` track
  // takes its content's min-content width as its automatic minimum, so as soon
  // as that row stops fitting, the track grows past the padding box and takes
  // the article, the tags and the code blocks out with it. At a 360px viewport
  // the row wanted 346.5px against the 328px left by the 1rem side padding:
  // the page overflowed by 2px and lost its whole right margin.
  //
  // Both declarations are asserted separately and on purpose. Together they
  // free 24px and the row needs 18.5px of that to fit, so neither alone gets
  // the track back inside the padding box: measured at 360px, the gap alone
  // leaves it 2.5px over and the padding alone 10.5px over. One combined
  // assertion would stay green with either half gone.
  //
  // Two limits, both worth knowing before trusting this or deleting it.
  //
  // It reads CSS text, not layout, so it cannot show the row still fits. That
  // check stays a browser run at 360px against the built output.
  //
  // What it does guard is the rule reaching the stylesheet at all. `assemble.sh`
  // skips every tracked path, so a Quartz bump cannot overwrite custom.scss; the
  // bump risk is upstream changing how that file is imported in
  // `quartz/plugins/emitters/componentResources.ts`, after which every rule in
  // it silently disappears from index.css.
  //
  // It can also go red with the source untouched. The assertions take `.5rem`
  // and `0.5rem`, but a minifier emitting `8px`, or folding the selector into a
  // list, fails them while the declaration is intact. Read a red here as "the
  // emitted CSS changed shape" and re-measure before rewriting the rule.
  const narrowSidebar = () => mediaBlock(read("index.css"), /@media[^{]*max-width:\s*380px/)

  test("the narrow-viewport sidebar keeps its tightened flex gap", () => {
    // Flex.tsx writes `gap` as an inline style, so losing `!important` here is
    // the same regression as losing the declaration.
    assert.match(narrowSidebar(), /\.flex-component\{[^}]*gap:\s*0?\.5rem\s*!important/)
  })

  test("the narrow-viewport sidebar keeps its tightened search padding", () => {
    assert.match(narrowSidebar(), /\.search>\.search-button\{[^}]*padding-right:\s*0?\.5rem/)
  })
})
