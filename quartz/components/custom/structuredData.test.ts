import test, { describe } from "node:test"
import assert from "node:assert"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join, relative } from "node:path"
import type { Root } from "hast"
import { h } from "hastscript"
import {
  PERSON_ID,
  pageKind,
  pageUrl,
  serializeJsonLd,
  sourcesCitations,
  structuredData,
} from "./structuredData"

const output = "public"
const missing = !existsSync(join(output, "index.html"))

type Node = Record<string, any>

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return htmlFiles(path)
    return entry.name.endsWith(".html") ? [path] : []
  })
}

function blocks(html: string): string[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map(
    (match) => match[1],
  )
}

function graph(file: string): Node[] {
  const found = blocks(readFileSync(join(output, file), "utf8"))
  assert.equal(found.length, 1, `${file} carries ${found.length} JSON-LD block(s)`)
  return JSON.parse(found[0])["@graph"]
}

function node(nodes: Node[], type: string): Node | undefined {
  return nodes.find((n) => n["@type"] === type)
}

function sources(...items: ReturnType<typeof h>[]): Root {
  return h(null, [h("h2", { id: "sources" }, "Sources"), h("ol", items)]) as Root
}

describe("page kind", () => {
  test("notes are articles, folders are collections", () => {
    assert.equal(pageKind("dev/three-controls-before-you-trust-a-green-run"), "article")
    assert.equal(pageKind("dev/basics/Busy-Beaver-Problem"), "article")
    assert.equal(pageKind("dev/index"), "collection")
    assert.equal(pageKind("sources/index"), "collection")
  })

  test("pages that are not Dawid's articles get no page node", () => {
    for (const slug of ["index", "404", "privacy", "cookies", "tags/index", "tags/dev"]) {
      assert.equal(pageKind(slug), "none", slug)
    }
    // Verbatim third-party documents: an article node would claim authorship.
    assert.equal(pageKind("sources/Bitcoin-Improvement-Proposal-(BIP)-32"), "none")
  })
})

describe("page url", () => {
  test("matches the sitemap form", () => {
    assert.equal(pageUrl("dawid.dev", "index"), "https://dawid.dev/")
    assert.equal(pageUrl("dawid.dev", "dev/index"), "https://dawid.dev/dev/")
    assert.equal(pageUrl("dawid.dev", "dev/git/Git-Hooks"), "https://dawid.dev/dev/git/Git-Hooks")
  })
})

describe("sources citations", () => {
  test("names each item by publisher and title, up to the colon after the link", () => {
    const tree = sources(
      h("li", [
        "Node.js documentation, ",
        h("a", { href: "https://nodejs.org/api/test.html" }, "Test runner"),
        ": default patterns (",
        h("code", "**/*.test.js"),
        ").",
      ]),
      h("li", [h("p", ["GitHub, ", h("a", { href: "https://github.com/x/y" }, "tags: v7"), "."])]),
    )
    assert.deepEqual(sourcesCitations(tree), [
      {
        "@type": "CreativeWork",
        name: "Node.js documentation, Test runner",
        url: "https://nodejs.org/api/test.html",
      },
      // No colon after the link: the whole item is the name. A colon inside the
      // link text does not cut it short.
      { "@type": "CreativeWork", name: "GitHub, tags: v7.", url: "https://github.com/x/y" },
    ])
  })

  test("skips items without an absolute link", () => {
    const tree = sources(
      h("li", ["Own note, ", h("a", { href: "../other" }, "other"), ": context."]),
      h("li", "No link at all."),
    )
    assert.deepEqual(sourcesCitations(tree), [])
  })

  test("reads only an ordered list right under the Sources heading", () => {
    const link = h("a", { href: "https://example.com/" }, "Example")
    const unordered = h(null, [h("h2", { id: "sources" }, "Sources"), h("ul", [h("li", [link])])])
    const otherHeading = h(null, [h("h2", { id: "further-reading" }), h("ol", [h("li", [link])])])
    assert.deepEqual(sourcesCitations(unordered as Root), [])
    assert.deepEqual(sourcesCitations(otherHeading as Root), [])
    assert.deepEqual(sourcesCitations(undefined), [])
  })
})

describe("serialization", () => {
  test("a closing script tag in a value cannot end the element", () => {
    const json = serializeJsonLd({ headline: "</script><script>alert(1)</script>" })
    assert.doesNotMatch(json, /</)
    assert.equal(JSON.parse(json).headline, "</script><script>alert(1)</script>")
  })

  test("an article without sources carries no empty citation", () => {
    const data = structuredData({
      slug: "dev/note",
      baseUrl: "dawid.dev",
      locale: "en-US",
      title: "Note",
      description: "About it.",
    }) as Node
    const article = node(data["@graph"], "TechArticle")
    assert.ok(article)
    assert.equal("citation" in article, false)
  })
})

describe("built output", { skip: missing ? "run `npx quartz build` first" : false }, () => {
  test("every page carries exactly one parseable graph with the shared entity", () => {
    const files = htmlFiles(output)
    assert.ok(files.length > 50, `only ${files.length} pages built`)

    for (const path of files) {
      const file = relative(output, path)
      const nodes = graph(file)
      const site = node(nodes, "WebSite")
      const person = node(nodes, "Person")

      assert.equal(site?.["@id"], "https://dawid.dev/#website", file)
      assert.equal(site?.publisher?.["@id"], PERSON_ID, file)
      // The same @id dawidrylko.com publishes, so both sites describe one person.
      assert.equal(person?.["@id"], "https://dawidrylko.com/#person", file)
      assert.equal(person?.name, "Dawid Ryłko", file)
      assert.equal(person?.url, "https://dawidrylko.com/", file)
      assert.deepEqual(
        person?.sameAs,
        [
          "https://dawid.dev/",
          "https://github.com/dawidrylko",
          "https://www.linkedin.com/in/dawidrylko",
        ],
        file,
      )
    }
  })

  test("notes are TechArticles by that person at their sitemap address", () => {
    const sitemap = readFileSync(join(output, "sitemap.xml"), "utf8")
    const articles = htmlFiles(output)
      .map((path) => node(graph(relative(output, path)), "TechArticle"))
      .filter((article): article is Node => article !== undefined)

    assert.ok(articles.length > 50, `only ${articles.length} articles`)
    for (const article of articles) {
      assert.equal(article.author?.["@id"], PERSON_ID, article.url)
      assert.ok(article.headline, article.url)
      assert.ok(article.description, article.url)
      assert.ok(!isNaN(Date.parse(article.datePublished)), article.url)
      assert.ok(!isNaN(Date.parse(article.dateModified)), article.url)
      assert.ok(sitemap.includes(`<loc>${article.url}</loc>`), `${article.url} is not in sitemap`)
    }
  })

  test("the Sources lists become citations, in order", () => {
    const controls = node(
      graph("dev/three-controls-before-you-trust-a-green-run.html"),
      "TechArticle",
    )
    assert.deepEqual(
      controls?.citation.map((c: Node) => [c["@type"], c.name, c.url]),
      [
        [
          "CreativeWork",
          "Node.js documentation, Test runner",
          "https://nodejs.org/docs/latest-v24.x/api/test.html",
        ],
        [
          "CreativeWork",
          "actionlint, Usage",
          "https://github.com/rhysd/actionlint/blob/main/docs/usage.md",
        ],
        [
          "CreativeWork",
          "typescript-eslint, FAQ on ESLint rules",
          "https://typescript-eslint.io/troubleshooting/faqs/eslint/",
        ],
      ],
    )

    const kit = node(graph("dev/building-a-reusable-seo-quality-kit.html"), "TechArticle")
    assert.deepEqual(
      kit?.citation.map((c: Node) => c.name),
      [
        "search-quality-kit, repository",
        "GitHub Docs, Workflow syntax for GitHub Actions",
        "GitHub Docs, Dependabot options reference",
        "GitHub, actions/upload-artifact tags",
      ],
    )
  })

  test("folders are collections, and the rest carries only the site graph", () => {
    const folder = node(graph("dev/index.html"), "CollectionPage")
    assert.equal(folder?.url, "https://dawid.dev/dev/")

    for (const file of [
      "index.html",
      "privacy.html",
      "cookies.html",
      "tags/index.html",
      "sources/Bitcoin-Improvement-Proposal-(BIP)-32.html",
    ]) {
      assert.equal(graph(file).length, 2, file)
    }
  })
})
