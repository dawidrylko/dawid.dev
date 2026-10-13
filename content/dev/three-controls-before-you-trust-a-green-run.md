---
title: "Three controls before you trust a green run"
date: 2026-10-13
description: "Three checks before trusting a passing CI run: can the measurement see a failure, can the tool produce one, and did the negative case actually happen."
tags:
  - dev
---

> [!tldr]
> After every "it passed", ask whether the same run could have shown "it failed". That splits into three controls, in this order: can my measurement see a failure, can the tool produce one, did the negative case I built actually happen. Tools do not agree on what "nothing to check" looks like, and one of them exits 0 on it, so the answer has to come from a symbol in the output and not from the exit code.

A green check is a claim about the world, not about your code. Most of the ways a check can be wrong are silent, so the absence of red tells you very little on its own. After every "it passed", ask one question: **could this same run have shown "it failed"?**

That question decomposes into three controls. They have to happen in this order, because each one can pass while the next still fails.

## Control 1: can my measurement see a failure at all

Read the exit code without a pipe. `cmd | tail; echo $?` gives you the status of `tail`, not of `cmd`, so it is almost always zero. Any verification built that way **cannot detect failure**.

```
sh -c "exit 7"            # read directly: 7
sh -c "exit 7" | tail -1  # read through the pipe: 0
```

I shipped this once. I checked workflows with `docker run ... | tail -5; echo $?`, read "exit 0" and put it in a pull request description as evidence. Repeated without the pipe it really was 0, so the conclusion held. The check that produced it, though, could not have returned anything else.

Use `${PIPESTATUS[0]}` in bash, redirect to a file and read `$?` without a pipe, or turn on `set -o pipefail`.

## Control 2: can the tool produce a failure

Control 1 passes comfortably even when the tool checked nothing: a wrong mount, an empty glob, a flag that matches nothing. A clean result then measures your own harness, not the thing you wanted to measure.

So hand the tool something you know is bad and check that it shouts. `actionlint` in a container was returning 0 with empty output. On a copy of the workflow with `github.no_such_context_field` injected it returned 1 with the offending line named, and 0 again once the injection was removed. That is the proof that the first zero meant something.

The same rule applies to mutation-testing a linter config, and there it has a sharp edge: **the mutant has to violate a rule the config actually enforces**. I once planted an undefined symbol expecting `no-undef` to fire. Lint stayed green, and the tempting conclusion was that the directory was excluded. It was not. `no-undef` is off for TypeScript files in that setup, because the compiler does that job, and typescript-eslint advises against the rule on TypeScript projects for that reason. A mutant aimed at a rule set to `error` in the config, `@typescript-eslint/no-unused-vars`, made the experiment work in both directions: the same file passed under the excluded path and failed in `src/`.

## Control 3: did the negative case actually happen

Nothing encourages this one, which is why it costs the most. A control that quietly failed to create its own condition looks identical to a successful measurement, and it argues with confidence.

Building the negative case for a test-count assertion, I "removed" the test files with `mv test test-away`. The TAP report still said `# tests 1`. The obvious reading was that the assertion does not discriminate. It was wrong. `node --test` matches `*.test.js` at any depth, so the moved file still qualified, and the condition I meant to create never existed. Deleting the directory instead and printing both numbers (`test files now: 0` and `# tests 0`) made the control real.

After building a negative case, **count the thing you supposedly removed** before you draw any conclusion from it.

## Control 2 is not optional: tools disagree about emptiness

No rule says a tool must signal that it has nothing to do. These are exit codes read without a pipe, with Node v24.21.0 and ava 8.0.1. The `actionlint` row comes from a run of the `rhysd/actionlint` image in early September 2026.

| tool | "nothing to do" condition | exit | message |
| --- | --- | --- | --- |
| `node --test` | no test files at all | **0** | `# tests 0` (TAP reporter) |
| `ava` | no file matches the configured glob | 1 | Couldn't find any files to test |
| `ava` | file found, no `test()` call | 1 | No tests found in ... |
| `ava` | file argument matches none of the found files | 1 | N test files were found, but did not match the filters |
| `ava` | `--match` selects nothing | 1 | Couldn't find any matching tests |
| `actionlint` | directory is not a git repository | 3 | no project was found |

One of those passes silently, and nothing except running it tells you which. The transferable rule is therefore not "assert on a count". For every tool in your gate, issue the one command that asks what it does when there is nothing to check.

## Where the exit code cannot carry the answer, assert on a symbol

`node --test` with zero test files exits 0 and prints `# tests 0`. A CI step that trusts the exit code waves through a commit that deletes the tests, having run nothing. The fix is to stop trusting the status and assert on a symbol you can check:

```sh
set -o pipefail
pnpm test --test-reporter=tap | tee report.tap
grep -qE '^# tests [1-9][0-9]*$' report.tap
```

The `pipefail` line is Control 1 applied to the fix itself. Without it, `tee` would hide a failing suite behind its own zero, and the step would go green on red tests as long as at least one test ran.

I checked the step in both directions. With the real suite the report says `# tests 10` and the step passes. After `rm -rf test` the runner still exits 0 and the step goes red. The exit code is identical in both cases, so **the difference lives only in the symbol**.

The same requirement applies to a security claim. "The tests passed" with no test count is as unfalsifiable as "the input is validated" with no file and no line.

## One positive control licenses one case

A last trap, cheap to fall into once the three controls feel done. Proving that a gate fires on one bad input licenses that input, not the gate.

I had a build check with three invariants. I broke one, it went red, and I took it for verified. A review in a fresh context found two inputs that left it green. An existing but empty file was read as "missing", because `if (html)` is falsy for an empty string, so every check was skipped and the script printed OK with exit 0. And a global counter hid a regression of one kind behind a healthy count of another: all twelve cards of one type could disappear while the single card of a second type kept the total positive. A gate that declares N invariants needs **N inputs that break them, one each**. If you cannot write the input for an invariant, the gate mentions it without checking it.

There is a cheaper variant: count the margin. A guard I added with a contrast fix measured white text on a bar at 14.5:1 against a threshold of 4.5:1. To make it fire I would have had to change something nobody would change, while the thing that actually carried the fix, an edge colour taken from a shared design token, was not measured at all. When a relation clears its threshold several times over, you are measuring the wrong relation.

## Sources

1. Node.js documentation, [Test runner](https://nodejs.org/docs/latest-v24.x/api/test.html): the default file patterns of `node --test` (`**/*.test.{cjs,mjs,js}` and others).
2. actionlint, [Usage](https://github.com/rhysd/actionlint/blob/main/docs/usage.md): exit statuses (3 means a fatal error).
3. typescript-eslint, [FAQ on ESLint rules](https://typescript-eslint.io/troubleshooting/faqs/eslint/): why `no-undef` is not recommended on TypeScript projects.
