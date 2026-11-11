import { ObsidianFlavoredMarkdown } from "./ofm"
import { QuartzTransformerPlugin } from "../types"

type OfmOptions = Parameters<typeof ObsidianFlavoredMarkdown>[0]

export const mermaidModulePath = "/static/mermaid/mermaid.esm.min.mjs"

const cdnMermaid =
  /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/mermaid\/[^"'`]+\/mermaid\.esm\.min\.mjs/g

export const SelfHostedObsidianMarkdown: QuartzTransformerPlugin<OfmOptions> = (opts) => {
  const ofm = ObsidianFlavoredMarkdown(opts)

  return {
    ...ofm,
    name: "SelfHostedObsidianMarkdown",
    externalResources(ctx) {
      const resources = ofm.externalResources?.(ctx) ?? {}
      let rewritten = 0
      const js = (resources.js ?? []).map((resource) => {
        if (resource.contentType !== "inline") return resource
        const script = resource.script.replace(cdnMermaid, () => {
          rewritten++
          return mermaidModulePath
        })
        return script === resource.script ? resource : { ...resource, script }
      })

      if ((opts?.mermaid ?? true) && rewritten === 0) {
        throw new Error(
          "SelfHostedObsidianMarkdown: upstream's mermaid script no longer imports from cdnjs in the expected form; re-point it at the self-hosted module",
        )
      }

      return { ...resources, js }
    },
  }
}
