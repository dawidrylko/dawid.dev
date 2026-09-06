import { Latex } from "./latex"
import { QuartzTransformerPlugin } from "../types"
import { katexCopyTexPath, katexStylesheetPath } from "../emitters/katexAssets"

type LatexOptions = Parameters<typeof Latex>[0]

export const SelfHostedLatex: QuartzTransformerPlugin<LatexOptions> = (opts) => {
  const latex = Latex(opts)

  return {
    ...latex,
    name: "SelfHostedLatex",
    externalResources(ctx) {
      if ((opts?.renderEngine ?? "katex") !== "katex") {
        return latex.externalResources?.(ctx)
      }

      return {
        css: [{ content: katexStylesheetPath }],
        js: [
          {
            src: katexCopyTexPath,
            loadTime: "afterDOMReady",
            contentType: "external",
          },
        ],
      }
    },
  }
}
