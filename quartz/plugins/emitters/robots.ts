import { FilePath, joinSegments } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import fs from "fs"
import { styleText } from "util"

export function prepareContent(baseUrl: string) {
  return `User-agent: *
Allow: /

Sitemap: https://${baseUrl}/sitemap.xml`
}

export const Robots: QuartzEmitterPlugin = () => ({
  name: "Robots",
  getQuartzComponents() {
    return []
  },
  async emit({ argv, cfg }, _content, _resources): Promise<FilePath[]> {
    if (!cfg.configuration.baseUrl) {
      console.warn(
        styleText("yellow", "No baseUrl found in configuration. Skipping robots.txt generation."),
      )
      return []
    }
    const filePath = joinSegments(argv.output, "robots.txt")
    const content = prepareContent(cfg.configuration.baseUrl)
    if (!content) {
      return []
    }

    fs.mkdirSync(argv.output, { recursive: true })

    fs.writeFileSync(filePath, content)
    return [filePath] as FilePath[]
  },
  async *partialEmit() {},
})
