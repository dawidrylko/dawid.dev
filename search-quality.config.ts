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
  // The two legal pages carry "noindex, follow" on purpose and are left out of
  // the sitemap. The indexability check cannot tell a deliberate exclusion from
  // an accidental one, so the decision is recorded here rather than silenced:
  // an accidental noindex anywhere else still fails. Both halves are asserted
  // by quartz/components/custom/noindexRoutes.test.ts.
  suppressions: [
    {
      code: "indexability.noindex",
      urlPattern: "/privacy",
      reason:
        "Privacy policy is intentionally noindexed; it stays reachable for users but is not a search landing page.",
      owner: "dawidrylko",
    },
    {
      code: "indexability.noindex",
      urlPattern: "/cookies",
      reason:
        "Cookie policy is intentionally noindexed; it stays reachable for users but is not a search landing page.",
      owner: "dawidrylko",
    },
  ],
  ci: {
    failOn: ["error"],
  },
}
