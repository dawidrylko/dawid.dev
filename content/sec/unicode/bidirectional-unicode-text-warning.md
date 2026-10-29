---
title: "This File Contains Bidirectional Unicode Text"
date: 2026-10-29
description: "GitHub says this file contains bidirectional Unicode text. Is it dangerous? How to find the characters, remove them and block them in CI."
tags:
  - sec
  - unicode
---

> [!tldr]
> The warning means the file contains Unicode bidirectional control characters, and since May 2025 GitHub shows a similar one for other hidden Unicode. Often it is harmless: right-to-left languages need those characters. It is a problem when the controls sit in source code, comments or strings with no right-to-left text around them. Find them with `git grep` or a short script, remove the ones nobody needs, and fail CI on new ones.

You opened a file on GitHub, a banner appeared above the code, and you want to know whether to worry. In plain terms the banner says the file contains bidirectional Unicode text, which may be interpreted or compiled differently than it appears. The reason is the attack described in [[sec/unicode/trojan-source-attack|Trojan Source]]. Many files that trigger it hold legitimate right-to-left text, and a short scan tells the two apart. More carriers of the same kind are mapped in the [[sec/unicode/index|Unicode steganography hub]].

## What GitHub announced and when

GitHub's changelog entry "Warning about bidirectional Unicode text" is dated 31 October 2021. It says a warning appears when a file's contents include bidirectional Unicode text, that such text can be interpreted or compiled differently than it appears in a user interface, and that it ties the issue to CVE-2021-42574. It also says that if your use of the characters is intentional and not malformed, you can ignore the warning. To review a flagged file it recommends opening it in an editor that shows hidden characters, with Visual Studio Code as the example because it displays them by default.

A second entry, dated 1 May 2025, extends the warning to hidden Unicode text. It adds that hidden characters can make code appear one way and be interpreted another way, "especially by AI". That widening matters if you keep prompts, agent instructions or rules files in a repository, because the same banner now covers the characters described in [[sec/unicode/invisible-prompt-injection|invisible prompt injection]].

## Is the file dangerous?

Usually not. Arabic and Hebrew text needs directional controls, and a translation file or a documentation page in those languages will trigger the banner for good reasons. **The risk lies in where the controls are, not in their presence.**

| Signal | Likely legitimate | Likely hostile |
| --- | --- | --- |
| File type | Markdown, translation catalogue, data file | Source code, build script, CI config |
| Text around the control | Right-to-left letters on the same line | ASCII only |
| Pairing | Each opener has its closing character | An override or isolate with no pop, or the reverse |
| Position | Inside a sentence of human text | Inside a string literal or comment of code |

None of this is a proof. It is the order in which I would read the hits, and the script below turns the pairing and surrounding-text rows into flags.

## Find the characters

The fastest check is a search over tracked files. With `git grep` the `(*UTF)` prefix is required, otherwise git stops with a "code point value is too large" error. Print file names only, because echoing a line that contains an override back into your terminal repeats the trick on the terminal.

```bash
git grep -lP '(*UTF)[\x{202A}-\x{202E}\x{2066}-\x{2069}]'
# prints matching file names; exit status 0 on a match, 1 on none
```

To get `file:line:column`, the code point and a hint whether the hit looks legitimate, use a script. It reports the nine explicit controls plus the three direction marks, and flags a line when its openers and closers do not match or when it has no right-to-left letter in it:

```python
import sys
import unicodedata
from pathlib import Path

OPEN = {0x202A, 0x202B, 0x202D, 0x202E}
ISOLATE = {0x2066, 0x2067, 0x2068}
CONTROLS = OPEN | ISOLATE | {0x202C, 0x2069}
MARKS = {0x200E, 0x200F, 0x061C}


def line_flags(line):
    flags = []
    if sum(ord(c) in OPEN for c in line) != line.count("\u202c"):
        flags.append("unbalanced-embedding")
    if sum(ord(c) in ISOLATE for c in line) != line.count("\u2069"):
        flags.append("unbalanced-isolate")
    if not any(unicodedata.bidirectional(c) in ("R", "AL") for c in line):
        flags.append("no-rtl-text")
    return flags


def report(path):
    count = 0
    text = Path(path).read_text(encoding="utf-8", errors="replace")
    for lineno, line in enumerate(text.splitlines(), 1):
        hits = [(col, c) for col, c in enumerate(line, 1) if ord(c) in CONTROLS | MARKS]
        if not hits:
            continue
        flags = line_flags(line)
        for col, c in hits:
            note = ("  <- " + ",".join(flags)) if flags else ""
            print(f"{path}:{lineno}:{col} U+{ord(c):04X} {unicodedata.name(c)}{note}")
            count += 1
    return count


if __name__ == "__main__":
    total = sum(report(p) for p in sys.argv[1:])
    sys.exit(1 if total else 0)
```

Run against two sample files, one built like a Trojan Source line and one with an ordinary Hebrew heading (both written from escapes):

```python
from pathlib import Path

Path("bidi.js").write_text('const role = "user\u202e \u2066// check admin\u2069 \u2066";\n', encoding="utf-8")
Path("hebrew.md").write_text("Title: \u202b\u05e9\u05dc\u05d5\u05dd\u202c is hello\n", encoding="utf-8")
```

```bash
python3 bidi_report.py bidi.js hebrew.md
# bidi.js:1:19 U+202E RIGHT-TO-LEFT OVERRIDE  <- unbalanced-embedding,unbalanced-isolate,no-rtl-text
# bidi.js:1:21 U+2066 LEFT-TO-RIGHT ISOLATE  <- unbalanced-embedding,unbalanced-isolate,no-rtl-text
# bidi.js:1:36 U+2069 POP DIRECTIONAL ISOLATE  <- unbalanced-embedding,unbalanced-isolate,no-rtl-text
# bidi.js:1:38 U+2066 LEFT-TO-RIGHT ISOLATE  <- unbalanced-embedding,unbalanced-isolate,no-rtl-text
# hebrew.md:1:8 U+202B RIGHT-TO-LEFT EMBEDDING
# hebrew.md:1:13 U+202C POP DIRECTIONAL FORMATTING
# exit status: 1
```

The JavaScript line collects three flags per hit, the Hebrew heading none. That difference is the signal. The flags are heuristics: an attacker can add a right-to-left word to the line to silence `no-rtl-text`, so an unbalanced control in a code file still deserves a human look.

## Remove them

Read the diff before you strip anything, and limit the removal to files where right-to-left text is not expected. Removing the embedding controls from a real Arabic or Hebrew paragraph changes how it displays.

```bash
perl -CSD -i -pe 's/[\x{202A}-\x{202E}\x{2066}-\x{2069}]//g' bidi.js
git grep -lP '(*UTF)[\x{202A}-\x{202E}\x{2066}-\x{2069}]'
# hebrew.md
```

After the first command the JavaScript line contains only the visible text, with the spaces that sat between the controls left in place. The search then lists only the Hebrew file, which is the one you decided to keep. Run it on a clean working tree and review the result with `git diff`.

## Gate it in CI

Fail the build when a new control appears, with an allow-list for paths that carry real right-to-left content. This workflow uses `actions/checkout`, whose latest release at the time of writing is v7.0.1:

```yaml
name: unicode-gate
on: [pull_request]
jobs:
  bidi:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - name: Fail on bidirectional control characters
        run: |
          if git grep -lP '(*UTF)[\x{202A}-\x{202E}\x{2066}-\x{2069}]' -- . ':!docs/i18n/**'; then
            echo "bidirectional control characters found" >&2
            exit 1
          fi
```

The shell body was tested locally with a path exclusion: it prints the offending file, writes the message and exits with status 1, and it stays silent on a clean path. If you prefer a maintained tool, `npx anti-trojan-source --files='src/**/*.js'` scans for the same family plus every Cf and Cc code point, so it also catches the hidden Unicode that the 2025 warning added. The right-to-left override in file names is a separate check, see [[sec/unicode/right-to-left-override-u202e|right-to-left override (U+202E)]], and the complete catalogue of characters that draw nothing is in [[sec/unicode/invisible-unicode-characters|invisible Unicode characters]].

## Sources

1. [GitHub changelog, Warning about bidirectional Unicode text (2021-10-31)](https://github.blog/changelog/2021-10-31-warning-about-bidirectional-unicode-text/): the original warning, its CVE reference and the advice to review in an editor that shows hidden characters.
2. [GitHub changelog, GitHub now provides a warning about hidden Unicode text (2025-05-01)](https://github.blog/changelog/2025-05-01-github-now-provides-a-warning-about-hidden-unicode-text/): the extension to hidden Unicode.
3. [Boucher and Anderson, Trojan Source: Invisible Vulnerabilities](https://arxiv.org/abs/2111.00169): the attack behind the warning.
4. [UAX #9, Unicode Bidirectional Algorithm](https://www.unicode.org/reports/tr9/): the list of explicit formatting characters and marks.
5. [lirantal/anti-trojan-source](https://github.com/lirantal/anti-trojan-source): the CLI, its usage and its detection scope.
6. [actions/checkout releases](https://github.com/actions/checkout/releases): the current major version used in the workflow.
