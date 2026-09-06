import { FilePath, joinSegments } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import fs from "fs"
import path from "path"
import { createRequire } from "module"

const resolveFrom = createRequire(import.meta.url)

export const katexAssetDir = "static/katex"
export const katexStylesheetPath = `/${katexAssetDir}/katex.min.css`
export const katexCopyTexPath = `/${katexAssetDir}/copy-tex.min.js`

function katexDist(): string {
  return path.join(path.dirname(resolveFrom.resolve("katex/package.json")), "dist")
}

function katexFiles(dist: string): [string, string][] {
  const fonts = fs.readdirSync(path.join(dist, "fonts"))

  return [
    ["katex.min.css", "katex.min.css"],
    ["contrib/copy-tex.min.js", "copy-tex.min.js"],
    ...fonts.map((font): [string, string] => [`fonts/${font}`, `fonts/${font}`]),
  ]
}

export const KatexAssets: QuartzEmitterPlugin = () => ({
  name: "KatexAssets",
  getQuartzComponents() {
    return []
  },
  async *emit({ argv }) {
    const dist = katexDist()
    const outputDir = joinSegments(argv.output, katexAssetDir)

    for (const [source, target] of katexFiles(dist)) {
      const destination = joinSegments(outputDir, target) as FilePath

      await fs.promises.mkdir(path.dirname(destination), { recursive: true })
      await fs.promises.copyFile(path.join(dist, source), destination)

      yield destination
    }
  },
  async *partialEmit() {},
})
