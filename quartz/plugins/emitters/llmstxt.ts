import { FilePath, joinSegments } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import fs from "fs"
import { styleText } from "util"

export function prepareContent(baseUrl: string) {
  const base = `https://${baseUrl}`
  return `# dawid.dev

> The digital garden of Dawid Ryłko — a curated, evolving collection of software
> engineering, architecture, DevOps, IoT, and security notes.

Dawid Ryłko is a software engineer and IT architect. This site is a personal
knowledge base of practical notes, solutions, and concepts across his areas of
expertise. Each section below links to a hub page listing the notes it contains.

## Sections

- [Development](${base}/dev/): Software development principles and practices
- [AI](${base}/dev/ai/): Artificial intelligence concepts and implementations
- [Basics](${base}/dev/basics/): Fundamental computer science concepts
- [Cryptography](${base}/dev/crypto/): Cryptographic methods and applications
- [Frontend](${base}/dev/frontend/): Web frontend technologies and patterns
- [Git](${base}/dev/git/): Version control and collaborative development
- [IoT](${base}/dev/iot/): Internet of Things solutions and implementations
- [Operations](${base}/dev/ops/): DevOps, deployment, and system operations
- [Security](${base}/sec/): Cybersecurity practices and research

## Selected notes

- [TypeORM migrations in NestJS with SQLite](${base}/dev/backend/typeorm-migrations-nestjs-sqlite-a-complete-guide): A complete migration guide
- [Set and Map: essential TypeScript data structures](${base}/dev/frontend/set-and-map-essential-typescript-data-structures)
- [Boost Angular performance](${base}/dev/frontend/Boost-Angular-Performance)
- [Google search operators and ranking signals, 1998–2025](${base}/dev/basics/google-search-operators-and-ranking-signals-evolution-1998-2025)
- [CVE-2024-4367: arbitrary JavaScript execution in PDF.js](${base}/sec/cve-2024-4367-arbitrary-javascript-execution-in-pdf-js)
- [The mobile app tracking ecosystem: a hidden privacy crisis](${base}/sec/mobile-app-tracking-ecosystem-hidden-privacy-crisis)

## About

- [Home](${base}/): Overview and full knowledge catalog
`
}

export const LlmsTxt: QuartzEmitterPlugin = () => ({
  name: "LlmsTxt",
  getQuartzComponents() {
    return []
  },
  async emit({ argv, cfg }, _content, _resources): Promise<FilePath[]> {
    if (!cfg.configuration.baseUrl) {
      console.warn(
        styleText("yellow", "No baseUrl found in configuration. Skipping llms.txt generation."),
      )
      return []
    }
    const filePath = joinSegments(argv.output, "llms.txt")
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
