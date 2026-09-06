# Maintenance

## Repository model

This repo replaces a Quartz fork with a thin overlay: only content, owner overrides, and a version pin are committed. No upstream Quartz code and no upstream git history live in this repo.

- **`.quartz-version`** pins the upstream release with two lines: `tag=<quartz tag>` and `sha=<commit sha>`.
- **`scripts/assemble.sh`** materializes upstream Quartz at the pinned sha into the working tree:
  1. Downloads `https://github.com/jackyzha0/quartz/archive/<sha>.tar.gz`, cached under `.quartz-dist/<sha>`.
  2. Deletes files materialized by a previous run, tracked in the manifest `.quartz-dist/materialized.txt` (handles version bumps and upstream deletions cleanly).
  3. Copies every upstream file into the working tree, except `.github/`, `docs/`, `content/`, `.gitignore`, `.gitattributes`, `README.md`, `LICENSE.txt`, `CODE_OF_CONDUCT.md`, `Dockerfile`, `.dockerignore` — and except any path already tracked in this repo (**tracked files always win**).
  4. Writes every materialized path into `.git/info/exclude`, so `git status` stays clean without touching `.gitignore`.

> **Warning — never add materialized paths to `.gitignore`.** Quartz's build globs use `globby` with `gitignore: true`, so any path listed in `.gitignore` is silently **dropped from the build output**. This has bitten us before: `quartz/static/giscus/*` vanished from the built site because it was gitignored. That is exactly why `assemble.sh` manages `.git/info/exclude` instead of `.gitignore` — exclude affects `git status` only, never the build.

**Never edit a materialized file in place** — the next `assemble.sh` run deletes and recopies it from upstream, discarding local edits. To customize an upstream file, copy it to a tracked, owned path (e.g. `quartz/components/custom/`) and wire it in via `quartz.config.ts` / `quartz.layout.ts`.

## Updating Quartz

1. Pick the new release from https://github.com/jackyzha0/quartz/releases and resolve its commit sha:
   ```sh
   git ls-remote https://github.com/jackyzha0/quartz.git 'refs/tags/v4.x.y*'
   ```
   If two lines come back, use the sha from the peeled `^{}` line — that's the commit the tag points at.
2. Edit `.quartz-version`, updating both `tag=` and `sha=`.
3. Re-materialize upstream:
   ```sh
   ./scripts/assemble.sh
   ```
4. Reinstall dependencies (the lockfile is upstream's, and is itself materialized):
   ```sh
   npm ci
   ```
5. Typecheck and build:
   ```sh
   npx tsc --noEmit && npx quartz build
   ```
   Compile errors in the owned files are the new "merge conflicts" — this is the entire conflict surface, so fix them consciously rather than papering over them.
6. Review the result locally:
   ```sh
   npx quartz build --serve
   ```
7. Branch as `d/*` and open a PR to `master`. Never merge from upstream Quartz directly — the pin bump plus reassembly is the only update path.

## Overlay registry

| File(s) | Role | Bump guidance |
| --- | --- | --- |
| `quartz.config.ts`, `quartz.layout.ts` | Site configuration and page layout | Re-check plugin/component names and options against upstream after every bump; imports from `./quartz/...` only resolve after assembly |
| `quartz/components/custom/Footer.tsx` | Own footer component, derived from upstream's `Footer.tsx` | Diff against the freshly materialized `quartz/components/Footer.tsx` after a bump and port any upstream improvements worth keeping |
| `quartz/components/custom/ContentMeta.tsx` | Own content-meta component, derived from upstream's `ContentMeta.tsx` | Same as above — diff against `quartz/components/ContentMeta.tsx` post-bump |
| `quartz/components/custom/Head.tsx` | Own head component, derived from upstream's `Head.tsx`, with the unconditional `cdnjs.cloudflare.com` preconnect removed | Diff against `quartz/components/Head.tsx` post-bump and port upstream changes; keep the preconnect out |
| `quartz/components/custom/CookieConsent.tsx`, `consentModel.ts`, `consentBrowser.ts`, `consentDefault.inline.ts`, `cookieConsent.inline.ts`, `quartz/components/styles/cookieConsent.scss` | The consent layer: pure model, browser effects, head-time Consent Mode default, banner markup and behaviour | Own code, not derived from upstream. See the consent section below before touching it |
| `quartz/plugins/emitters/robots.ts` | Own `robots.txt` emitter, wired directly in `quartz.config.ts` | Check upstream still has no equivalent emitter before assuming this is still needed |
| `quartz/plugins/emitters/katexAssets.ts`, `quartz/plugins/transformers/selfHostedLatex.ts` | Serve KaTeX from this domain instead of `cdn.jsdelivr.net`; the transformer wraps upstream's `Latex` and only swaps the resource URLs | After a bump, check upstream's `latex.ts` still exposes `externalResources` the same way, and that `katex` is still a resolvable dependency |
| `quartz/plugins/transformers/youtubeFacade.ts`, `quartz/components/custom/youtubeFacade.inline.ts` | Replace the YouTube `iframe` that Obsidian-flavored markdown emits with a click-to-load facade | After a bump, re-check the shape upstream's `ofm.ts` gives the embed (`iframe.external-embed.youtube` with an absolute `youtube.com` src); the transformer must keep running after `ObsidianFlavoredMarkdown` in `quartz.config.ts` |
| `quartz/styles/custom.scss` | Quartz's official user-CSS extension point | Rarely affected by bumps; verify it's still imported the same way |
| `quartz/static/icon.png`, `quartz/static/og-image.png` | Site branding, wins over upstream defaults | No action needed on bump beyond confirming the paths still exist upstream |
| `.github/workflows/cd.yaml`, `.github/workflows/pr-build.yaml`, `.github/scripts/bing.sh` | Own CI/CD: deploy pipeline, PR build check, search-engine notification script | Independent of Quartz version; revisit only if the build/deploy steps change |
| `scripts/assemble.sh`, `.quartz-version` | The overlay mechanism itself and the version pin | `.quartz-version` changes every bump; `assemble.sh` only if the materialization logic needs to change |
| `content/**` | All site content (Obsidian notes and assets) | Not Quartz-version-sensitive |
| `README.md`, `MAINTENANCE.md`, `LICENSE.txt` | Repo documentation and license | Update `LICENSE.txt` copyright year/authors only if that changes upstream |

## Consent and third-party requests

The site must reach no third party before the visitor allows it. That property is easy to break by accident, so it is worth stating what holds it up.

- **Analytics is off in `quartz.config.ts`** (`analytics: null`). Upstream's built-in Google provider injects `gtag.js` unconditionally, which is exactly the behaviour being avoided. Turning that key back on reintroduces tracking without consent.
- **The measurement ID lives in `quartz.layout.ts`** and is handed to `CookieConsent`. Without it the component renders nothing and no analytics can load.
- **`consentDefault.inline.ts` runs in the head** (`beforeDOMLoaded`, bundled into `prescript.js`) and declares Consent Mode defaults with every purpose denied. Every purpose named there must also be answered in `consentSignals()`, otherwise `gtag.js` queues hits forever and measurement silently stops. `consentModel.test.ts` asserts the two sets match.
- **`gtag.js` is injected by `consentBrowser.ts` only after a grant.** Before that the browser makes no request to Google at all.
- **Fonts are self-hosted** through `cdnCaching: false`, which makes Quartz download the Google Fonts files at build time and emit them under `static/fonts`. Setting it back to `true` restores runtime requests to `fonts.googleapis.com` and `fonts.gstatic.com`.
- **KaTeX is self-hosted** by `KatexAssets` plus `SelfHostedLatex`. Upstream's `Latex` transformer points at `cdn.jsdelivr.net` and pins a version that may differ from the installed `katex`.
- **YouTube embeds ship as a click-to-load facade.** `YouTubeFacade` rewrites the `iframe` that upstream emits into a button; the player is fetched from `youtube-nocookie.com` only after the reader presses it. Remove the transformer and the two notes with a video go back to contacting Google on load.
- **Mermaid is the one remaining latent third-party fetch.** Upstream's script imports `mermaid.esm.min.mjs` from `cdnjs.cloudflare.com` the first time a page contains a mermaid block. No note uses one today, so nothing is requested, and `consentMarkup.test.ts` fails the build the moment a note renders one. Before publishing a mermaid diagram, either self-host the module or set `ObsidianFlavoredMarkdown({ mermaid: false })`.
- **Both policy documents describe facts, not intentions.** `content/cookies.md` lists the storage keys and cookie names that the code actually writes, and `content/privacy.md` states the retention configured on the GA4 property. Changing the code without changing them makes the documents false.

`consentMarkup.test.ts` asserts these properties against the built `public/` directory, so it runs after `npx quartz build` rather than before it. It catches a tag loader that moved into the head bundle, a banner that stopped rendering hidden, a dialog that lost its focus target, a mermaid block, a raw YouTube iframe, and any page that gained a third-party resource.

Verification after any change to this layer is still a browser run in three states, on the built output rather than the dev server: before any decision, after a refusal, and after acceptance. Add a fourth state whenever the storage layer changes: a grant that disappears mid-session, checked across an in-page navigation rather than a reload, because the SPA router keeps module state alive. Cookie names and lifetimes go into the documents from `document.cookie` and `cookieStore.getAll()`, never from the configuration.

## Content conventions

- Every note carries `date:` frontmatter, including folder `index.md` files. Quartz maps `date:` to `created`, and — absent an explicit `modified` key — `modified` also falls back to `created`.
- Assets live co-located next to the notes that reference them.
- Wikilinks, embeds, and callouts are Quartz-native Obsidian-flavored markdown; no custom syntax layer.
- Drafts go in `content/private/`: ignored by git via the `private/` rule in `.gitignore`, and excluded from the build via `ignorePatterns` in `quartz.config.ts`.
- `.obsidian/` is gitignored — vault-local Obsidian settings never get committed.

## Deployment notes

- Push to `master` runs `.github/workflows/cd.yaml`: assemble → `npm ci` → `npx quartz build` → deploy to GitHub Pages (custom domain via Quartz's CNAME emitter) → notify job pings the Bing URL Submission API.
- Add `[skip notify]` to a commit message to skip the notify job.
- `workflow_dispatch` allows triggering the deploy workflow manually from the Actions tab.
- Every pull request runs `.github/workflows/pr-build.yaml`: assemble + build only, no deploy — a fast correctness check before merge.
