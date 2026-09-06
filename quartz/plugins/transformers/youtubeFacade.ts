import { Root as HtmlRoot } from "hast"
import { visit } from "unist-util-visit"
import { QuartzTransformerPlugin } from "../types"
// @ts-ignore
import youtubeFacadeScript from "../../components/custom/youtubeFacade.inline"

const embedHost = "https://www.youtube.com"
const privacyHost = "https://www.youtube-nocookie.com"

const label = "Play this video"
const note =
  "Loads the player from YouTube, which receives your IP address and may store its own entries on your device."

export const YouTubeFacade: QuartzTransformerPlugin = () => ({
  name: "YouTubeFacade",
  htmlPlugins() {
    return [
      () => (tree: HtmlRoot) => {
        visit(tree, "element", (node) => {
          if (node.tagName !== "iframe") return

          const className = node.properties?.class
          const src = node.properties?.src
          if (typeof className !== "string" || !className.split(/\s+/).includes("youtube")) return
          if (typeof src !== "string" || !src.startsWith(embedHost)) return

          node.tagName = "div"
          node.properties = {
            class: "youtube-facade",
            "data-embed-src": privacyHost + src.slice(embedHost.length),
          }
          node.children = [
            {
              type: "element",
              tagName: "button",
              properties: { type: "button", class: "youtube-facade-button" },
              children: [
                {
                  type: "element",
                  tagName: "span",
                  properties: { class: "youtube-facade-play", "aria-hidden": "true" },
                  children: [],
                },
                {
                  type: "element",
                  tagName: "span",
                  properties: { class: "youtube-facade-label" },
                  children: [{ type: "text", value: label }],
                },
                {
                  type: "element",
                  tagName: "span",
                  properties: { class: "youtube-facade-note" },
                  children: [{ type: "text", value: note }],
                },
              ],
            },
          ]
        })
      },
    ]
  },
  externalResources() {
    return {
      js: [
        {
          script: youtubeFacadeScript,
          loadTime: "afterDOMReady",
          contentType: "inline",
        },
      ],
    }
  },
})
