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
| `quartz/plugins/emitters/robots.ts` | Own `robots.txt` emitter, wired directly in `quartz.config.ts` | Check upstream still has no equivalent emitter before assuming this is still needed |
| `quartz/styles/custom.scss` | Quartz's official user-CSS extension point | Rarely affected by bumps; verify it's still imported the same way |
| `quartz/static/icon.png`, `quartz/static/og-image.png` | Site branding, wins over upstream defaults | No action needed on bump beyond confirming the paths still exist upstream |
| `.github/workflows/cd.yaml`, `.github/workflows/pr-build.yaml`, `.github/scripts/google.sh`, `.github/scripts/bing.sh` | Own CI/CD: deploy pipeline, PR build check, search-engine notification scripts | Independent of Quartz version; revisit only if the build/deploy steps change |
| `scripts/assemble.sh`, `.quartz-version` | The overlay mechanism itself and the version pin | `.quartz-version` changes every bump; `assemble.sh` only if the materialization logic needs to change |
| `content/**` | All site content (Obsidian notes and assets) | Not Quartz-version-sensitive |
| `README.md`, `MAINTENANCE.md`, `LICENSE.txt` | Repo documentation and license | Update `LICENSE.txt` copyright year/authors only if that changes upstream |

## Content conventions

- Every note carries `date:` frontmatter, including folder `index.md` files. Quartz maps `date:` to `created`, and — absent an explicit `modified` key — `modified` also falls back to `created`.
- Assets live co-located next to the notes that reference them.
- Wikilinks, embeds, and callouts are Quartz-native Obsidian-flavored markdown; no custom syntax layer.
- Drafts go in `content/private/`: ignored by git via the `private/` rule in `.gitignore`, and excluded from the build via `ignorePatterns` in `quartz.config.ts`.
- `.obsidian/` is gitignored — vault-local Obsidian settings never get committed.

## Deployment notes

- Push to `master` runs `.github/workflows/cd.yaml`: assemble → `npm ci` → `npx quartz build` → deploy to GitHub Pages (custom domain via Quartz's CNAME emitter) → notify job pings the Google Indexing API and the Bing URL Submission API.
- Add `[skip notify]` to a commit message to skip the notify job.
- `workflow_dispatch` allows triggering the deploy workflow manually from the Actions tab.
- Every pull request runs `.github/workflows/pr-build.yaml`: assemble + build only, no deploy — a fast correctness check before merge.
