---
title: "Building a reusable SEO quality kit"
date: 2026-10-13
---

> [!tldr]
> A package that runs inside other people's CI and also documents how to wire it needs rules beyond its checks: a line between what the kit owns and what a project decides, a pinning convention per surface chosen by who refreshes it, and an audit gate scoped by what its trigger reacts to. A green gate still says nothing about whether anyone searches for what you publish.

The same page checks keep reappearing across repositories: does the page have a canonical, does the JSON-LD parse, is the sitemap valid down to its `lastmod`, does every internal link resolve. Copied into each project, the scripts mean a fix lands in one repository and rots in the others. So I turned them into one package, [search-quality-kit](https://github.com/silesiansolutions/search-quality-kit), that runs from CI. The checks were the easy part. The decisions that took thought concern the shape of a package that runs in someone else's pipeline and teaches people how to wire it up.

## What belongs in the kit and what stays in the project

The kit owns every check whose correct answer is **the same everywhere**: the shape of a canonical, the grammar of structured data, whether a link resolves. The project owns every answer that is **a local decision**: which routes are deliberately `noindex`, which pages may be thin, what the brand suffix in a title looks like. In the kit that boundary is configuration, for example `allowNoindexOn`.

Drawn wrongly, the line costs twice. A local decision placed in the kit hands every consumer your opinion as a failure. A universal check placed in the project is the fifth copy of it.

## One command, a policy file and a baseline for existing debt

One entry point serves locally and in CI. The policy lives in a config file in the repository instead of flags spread across a workflow. Failures are configured by severity, not by count: with `failOn: ['error']` the build breaks on what is wrong and only reports the rest. A broken audit does not turn green either: config, baseline and runtime errors exit with code 2, findings that match `failOn` with 1.

A repository that starts with existing debt records a baseline from a reviewed commit and gates only on findings absent from it (`--baseline` with `--fail-on-new`). Findings are matched by identity (check, code, severity, URL, location, message), not by count, so fixing one warning and introducing another does not net out. "We will fix the warnings one day" becomes a property the pipeline defends: **new debt cannot enter unnoticed**, and the old debt stays in the report as existing.

## Two pinning conventions in one repository, and the criterion that settles which

A repository that executes actions and also documents them has two surfaces. The boundary between them follows **who owns the update**, whatever the file type.

| surface | pin | who refreshes it |
| --- | --- | --- |
| `action.yml`, `action/action.yml` | full SHA | Dependabot, automatically |
| `docs/**`, `examples/**`, README | floating major tag `@vN` | nobody, the tag moves itself |

What turns this from taste into maintenance is one line of configuration. For the `github-actions` ecosystem, `.github/dependabot.yml` reads the workflows from the root and the `action.yml` in each directory you list, and here those are `/` and `/action`. A SHA pasted into documentation therefore has no refresh mechanism at all. It ages quietly, and it hides the thing the example exists to teach, replacing one line of tool invocation with forty characters of hash.

So before you choose a pinning convention for a surface, check whether Dependabot even looks at it. If it does not, a SHA pin is a promise that somebody will refresh it by hand. Nobody will.

Two consequences followed. The stale ref a change request points at is rarely the only one: the request named one line in `docs/`, and a sweep of the repository found four, three of them in `examples/`, which nobody opens in this repository, and which ship to consumers through the `files` field in `package.json`. The split also deserves a test that guards both halves at once. Mine compares the refs in documentation with what the repository runs in its own workflows, and requires a 40-character SHA in the action metadata.

## Pinning by SHA needs proof that it changed nothing, and the runner provides it

A SHA pin has no visible effect until the effect is bad. Two things need proof: that the pinned commit is what the tag resolved to, and that nothing shifted because of it. Both are in the runner log, as long as the same run still contains one **unpinned** call to the same action:

```
Set up job  Download action repository 'actions/upload-artifact@v7' (SHA:043fb46d1a93...)
Run ./      Download action repository 'actions/upload-artifact@043fb46d1a93...' (SHA:043fb46d1a93...)
```

The first line is a workflow I did not touch, the second is the composite action after pinning. The platform resolved the floating tag to exactly the commit I pinned, and it has no stake in making my change look good. The tag has moved on since (on 2026-10-13 `v7` resolved to v7.0.2). That is what a pin is for: it moves when Dependabot says so.

One trap when copying this convention from other projects: derive the version comment from the SHA, never the SHA from someone else's comment. A published example pinned `# v7.0.0` while the floating `@v7` already pointed at v7.0.1. Copying the pair verbatim would have been a silent downgrade dressed up as hardening.

## Scope the audit gate by what the trigger reacts to

Running a dependency audit on every pull request looks like rigour and behaves like noise: an advisory published against an untouched dependency turns every open pull request red through nobody's fault. The usual reaction is to drop the audit from pull requests, and then the release pull request goes green with no audit signal at all.

The argument dissolves once you ask what the trigger reacts to.

A `paths` filter under `pull_request` reacts to the files a pull request changes, not to the passage of time and not to an advisory being published. Scoped to `package.json`, the lockfile and the workflow file itself, the audit fires on the release pull request and on Dependabot's, which move the lockfile by definition, and stays quiet on a branch that only touches code. Adding the workflow file to its own `paths` means the change tests itself on the pull request that introduces it. The same workflow also runs on every push to the default branch and once a week, and that schedule is where an advisory against an untouched dependency shows up.

One caveat before you make that check required. A workflow skipped by a `paths` filter reports no check run at all, so **a required check sits `pending` forever** on every pull request outside the filter and blocks the merge.

## What a green kit does not buy you

A site of mine runs this kit as a CI gate with severity-based failures, profile-aware checks, a generated `/llms.txt`, sitemap `lastmod` derived from content dates and JSON-LD validated on every build. The technical gate is closed and automated. Then the numbers. In the 90 days I measured in early September 2026, that site had **13 clicks** from Google Search, on 1,422 impressions.

A closed technical gate is not a commercial one, and it does not stop you from investing in content nobody is looking for. The kit says as much in its own philosophy: it verifies technical foundations and does not promise rankings or judge the business quality of copy. The kit is still worth building. Its green is a statement about the foundations and nothing more.

## Sources

1. search-quality-kit, [repository](https://github.com/silesiansolutions/search-quality-kit): `docs/ci.md` (exit codes, baseline semantics), `docs/config.md` (`allowNoindexOn`), `docs/philosophy.md`, `.github/dependabot.yml`, `.github/workflows/audit.yml`, `tests/docs-action-refs.test.ts`.
2. GitHub Docs, [Workflow syntax for GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax): path filtering and checks left in the "Pending" state.
3. GitHub Docs, [Dependabot options reference](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference): the `directories` option for GitHub Actions.
4. GitHub, [actions/upload-artifact tags](https://github.com/actions/upload-artifact/tags): `v7.0.0`, `v7.0.1` and `v7.0.2` and the commits behind them.
