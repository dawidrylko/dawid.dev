# dawid.dev

Source for [dawid.dev](https://dawid.dev), Dawid Ryłko's digital garden, authored in [Obsidian](https://obsidian.md) and published with [Quartz](https://quartz.jzhao.xyz).

## How this repo works

This repo is a **thin overlay** on top of Quartz, not a fork. It contains only content, the owner's overrides (config, layout, a couple of custom components, branding, CI/CD), and a pin file (`.quartz-version`) that records the exact upstream Quartz tag and commit. No upstream Quartz code and no upstream git history is committed here. `scripts/assemble.sh` downloads the pinned Quartz release and materializes it into the working tree at build time, skipping any path already tracked in this repo so overrides always win.

## Local development

Requires Node >= 22.

```sh
./scripts/assemble.sh
npm ci
npx quartz build --serve
```

The site serves at http://localhost:8080. A fresh clone won't typecheck in an editor until `scripts/assemble.sh` has run at least once, since `quartz.config.ts` and `quartz.layout.ts` import from `./quartz/...` paths that only exist after assembly.

## Publishing

Pushing to `master` triggers `.github/workflows/cd.yaml`: assemble, install, build, and deploy to GitHub Pages, followed by a notify job that pings the Bing URL Submission API. Add `[skip notify]` to a commit message to skip the ping. Pull requests get a build check via `.github/workflows/pr-build.yaml` (assemble + build, no deploy) followed by a technical search-quality audit of the built output.

## Search quality

`search-quality.config.ts` configures [search-quality-kit](https://github.com/SilesianSolutions/search-quality-kit), which audits the built `public/` directory for crawlability, metadata, canonicals, structured data, links, accessibility and hreflang. It runs on every pull request and fails the build on error-severity findings; warnings and info are reported without blocking. The report is uploaded as a workflow artifact and summarised in the job summary.

The tool is fetched at run time rather than pinned as a dependency, because this repo tracks no `package.json` — see the overlay model above. For the same reason the config imports nothing: the kit never lands in `node_modules`, so its `defineConfig` and `presets` helpers would not resolve. They are identity functions and plain data, so their values are inlined and the kit validates the result against its schema on load.

## Drafts

Notes under `content/private/` are excluded from git (via `.gitignore`) and from the Quartz build (via `ignorePatterns` in `quartz.config.ts`).

## Updating Quartz

See [MAINTENANCE.md](./MAINTENANCE.md) for the version-bump procedure.

## License

MIT. The published site is generated with [Quartz](https://github.com/jackyzha0/quartz) and embeds its code, hence the shared copyright attribution in `LICENSE.txt`.
