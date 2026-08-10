import {
  defineConfig,
  presets,
  profiles,
} from "@silesiansolutions/search-quality-kit"

const preset = presets.genericStatic()

export default defineConfig({
  ...preset,
  ...profiles.personalSite(),
  site: {
    baseUrl: "https://dawid.dev",
  },
  build: {
    distDir: "public",
  },
  crawl: {
    ...preset.crawl,
    entrypoints: ["/"],
    maxPages: 200,
  },
  profiles: {
    default: "personal",
  },
  ci: {
    failOn: ["error"],
  },
})
