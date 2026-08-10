/**
 * Config for search-quality-kit.
 *
 * Deliberately imports nothing. This repo tracks no package.json, so the kit is
 * fetched at run time and never lands in node_modules — a config that imported
 * `defineConfig` or `presets` could not be resolved. Those helpers are plain
 * identity functions and data, so their values are inlined here instead. The
 * kit validates this object against its schema on load, which is the real gate.
 *
 * The `exclude` list mirrors the kit's own generic-static preset.
 */
export default {
  site: {
    baseUrl: "https://dawid.dev",
  },
  build: {
    distDir: "public",
  },
  crawl: {
    mode: "static",
    entrypoints: ["/"],
    exclude: ["/admin", "/preview", "/api", "/404", "/404.html"],
    maxPages: 200,
  },
  profiles: {
    default: "personal",
  },
  ci: {
    failOn: ["error"],
  },
}
