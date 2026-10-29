---
title: "Trojan Source Attack: CVE-2021-42574 Explained"
date: 2026-10-29
description: "Trojan Source attack explained: bidi controls (CVE-2021-42574), homoglyph identifiers (CVE-2021-42694), a safe demo, detection and language fixes."
tags:
  - sec
  - unicode
draft: true
---

> [!tldr]
> Trojan Source is an attack where source code displays one way and compiles another. CVE-2021-42574 covers the bidirectional-control variant, which reorders characters on screen, and CVE-2021-42694 covers identifiers that differ only by a homoglyph. Detection is a regex over nine control characters; the defence that actually holds is a compiler or CI check that rejects them.

A code reviewer reads the order of characters on screen. A compiler reads the order of code points in the file. The Unicode bidirectional algorithm is the layer that lets those two orders differ, and in 2021 Nicholas Boucher and Ross Anderson showed what that costs. For the broader map of Unicode carriers, see the [[sec/unicode/index|Unicode steganography techniques]] page. The second half of the attack is the same trick as the [[sec/hiding-data-with-homoglyphs-exploiting-unicode-lookalikes|unicode lookalikes]] used in phishing, applied to function names.

## The paper and the two CVEs

"Trojan Source: Invisible Vulnerabilities" appeared on arXiv on 30 October 2021 and was presented at the 32nd USENIX Security Symposium in 2023 (pages 6507 to 6524). It ships working examples for C, C++, C#, JavaScript, Java, Rust, Go, Python, SQL, Bash, Assembly and Solidity, and documents a coordinated disclosure across the industry. CVE-2021-42574 and CVE-2021-42694 were both published on 2021-11-01, and they are easy to swap:

| CVE | Technique | What differs between eye and compiler |
| --- | --- | --- |
| CVE-2021-42574 | Bidi reordering | Control characters in comments and strings change the displayed order of the characters around them. |
| CVE-2021-42694 | Homoglyph identifiers | Two function or variable names look identical but contain different code points. |

The project site names three reordering techniques. Early Returns make a function short-circuit through a `return` that visually appears to sit inside a comment. Commenting-Out makes a comment visually appear as code, so the code the reader thinks runs never does. Stretched Strings make parts of a string literal appear as code, which has the same effect and makes string comparisons fail.

## The control characters

UAX #9, the Unicode Bidirectional Algorithm, defines nine explicit formatting characters and three implicit marks. The nine are the working set of the attack, and a scanner needs all of them.

| Code point | Abbreviation | Name |
| --- | --- | --- |
| U+202A | LRE | LEFT-TO-RIGHT EMBEDDING |
| U+202B | RLE | RIGHT-TO-LEFT EMBEDDING |
| U+202C | PDF | POP DIRECTIONAL FORMATTING |
| U+202D | LRO | LEFT-TO-RIGHT OVERRIDE |
| U+202E | RLO | RIGHT-TO-LEFT OVERRIDE |
| U+2066 | LRI | LEFT-TO-RIGHT ISOLATE |
| U+2067 | RLI | RIGHT-TO-LEFT ISOLATE |
| U+2068 | FSI | FIRST STRONG ISOLATE |
| U+2069 | PDI | POP DIRECTIONAL ISOLATE |

The marks LRM (U+200E), RLM (U+200F) and ALM (U+061C) also influence direction but cannot reorder arbitrary text on their own. Legitimate right-to-left text uses these characters constantly, which is why a finding is a signal for review, not proof of an attack. The demo scanner below lists all twelve code points, the nine controls and the three marks, so a hit on a mark is a lead to review. The build-failing rule in the checklist needs only the nine. [[sec/unicode/bidirectional-unicode-text-warning|The GitHub bidirectional text warning]] is the reader-facing side of that problem.

## A harmless demonstration

The Rust security advisory shows the pattern in one line: a string literal that ends in a right-to-left override, an isolate and a fake comment. Bidi-aware tools render it as a comparison followed by a comment, while the compiler sees a longer string with the comment text inside it. The script below builds the same shape from escapes, shows that the language reads logical order, and runs a scanner over a generated file. The `toy_visual` function reverses the text between an RLO and a PDF to show the display effect on plain letters. It is a deliberate simplification of the real algorithm.

```python
import re
import sys
import tempfile
import unicodedata
from pathlib import Path

BIDI = {
    0x202A: "LRE", 0x202B: "RLE", 0x202C: "PDF", 0x202D: "LRO", 0x202E: "RLO",
    0x2066: "LRI", 0x2067: "RLI", 0x2068: "FSI", 0x2069: "PDI",
    0x200E: "LRM", 0x200F: "RLM", 0x061C: "ALM",
}

role = "user\u202e \u2066// check admin\u2069 \u2066"
print(ascii(role), len(role), role == "user")


def toy_visual(s):
    return re.sub("\u202e(.*?)\u202c", lambda m: m.group(1)[::-1], s)


logical = "abc\u202edef\u202cghi"
print(ascii(logical), "->", toy_visual(logical))


def scan(path):
    for lineno, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        for col, ch in enumerate(line, 1):
            if ord(ch) in BIDI:
                yield lineno, col, ord(ch), BIDI[ord(ch)], unicodedata.name(ch, "?")


with tempfile.TemporaryDirectory() as tmp:
    trap = Path(tmp) / "trap.js"
    trap.write_text(
        'const level = "user";\nif (level !== "user\u202e \u2066// check admin\u2069 \u2066") {\n  grant();\n}\n',
        encoding="utf-8",
    )
    found = list(scan(trap))
    for lineno, col, cp, short, name in found:
        print(f"{trap.name}:{lineno}:{col} U+{cp:04X} {short} {name}")
    sys.exit(1 if found else 0)
# 'user\u202e \u2066// check admin\u2069 \u2066' 24 False
# 'abc\u202edef\u202cghi' -> abcfedghi
# trap.js:2:20 U+202E RLO RIGHT-TO-LEFT OVERRIDE
# trap.js:2:22 U+2066 LRI LEFT-TO-RIGHT ISOLATE
# trap.js:2:37 U+2069 PDI POP DIRECTIONAL ISOLATE
# trap.js:2:39 U+2066 LRI LEFT-TO-RIGHT ISOLATE
# exit status: 1
```

The string is 24 code points long and does not equal `"user"`, whatever an editor draws. The exit status is the point of the scanner: a CI step can fail on it.

The homoglyph half needs no tooling at all. These are two different variables, and the second one starts with Cyrillic `а` (U+0430):

```python
admin = 1
аdmin = 2
print(admin, аdmin, "admin" == "аdmin")
print(ascii("аdmin"))
# 1 2 False
# '\u0430dmin'
```

A reviewer sees one name used twice. The interpreter keeps two.

## Detection

Searching for the nine characters is a one-line job. With `git grep -P`, either start the pattern with the `(*UTF)` prefix or run under a UTF-8 locale (`LC_ALL=en_US.UTF-8` works without the prefix). Otherwise git stops with "character code point value in \x{} or \o{} is too large".

```bash
git grep -lP '(*UTF)[\x{202A}-\x{202E}\x{2066}-\x{2069}]'
rg -l '[\x{202A}-\x{202E}\x{2066}-\x{2069}]'
# both print matching file names; exit status 0 on a match, 1 on none
```

Use `-l` rather than printing matched lines. Echoing a line with an RLO back into your terminal hands the terminal the same trick. For a tool with a maintained character list, `anti-trojan-source` (Apache-2.0, v1.13.0 from 2026-09-08, active) is an npm CLI that scans files and exits with 1 on a finding:

```bash
npx anti-trojan-source --files='src/**/*.js'
```

Its README describes an explicit list of 285 confusable scalars plus every Cf code point and every Cc code point except TAB, LF and CR, and it leaves full homoglyph databases and byte-level tricks out of scope. For the lookalike half use confusable detection, covered in [[sec/unicode/unicode-confusables-skeleton|Unicode confusables and the UTS #39 skeleton]]. The README also points to `eslint-plugin-security`, which has a `detect-bidi-characters` rule.

## How the languages responded

| Ecosystem | Response |
| --- | --- |
| Rust | 1.56.1 added two deny-by-default lints, `text_direction_codepoint_in_literal` and `text_direction_codepoint_in_comment`. Homoglyph mitigations were already present from 1.53.0, the first version with non-ASCII identifiers: `mixed_script_confusables`, `confusable_idents` and `uncommon_codepoints` warn by default. |
| Python | PEP 672, "Unicode-related Security Considerations for Python" (Informational), documents the confusing features and cites Trojan Source. It is documentation, not a code change. |
| Go | No official Trojan Source document. The closest artifact is golang/go issue #20209, "disallow LTR/RTL characters in string literals?", opened in 2017 and open as of 2026-10-29. |
| GitHub | Warns on files with bidirectional text since 2021-10-31, see the linked note. |

The Rust team also scanned crates.io as of 2021-10-17 and found only five crates with the affected code points in their source, none of them malicious. On the standards side, UTS #55 is Unicode's document on source code handling. Rust's approach is the useful template: reject at compile time, with an escape hatch for the rare legitimate case.

## Practical checklist

**Fail the build on the nine characters unless a path is allow-listed.** Pin the allow-list to files that contain real right-to-left text, such as translation catalogues, and review the allow-list itself, because that is where a malicious change would go. The sibling attack that uses the same character in file names is covered in [[sec/unicode/right-to-left-override-u202e|right-to-left override in file names]], and the neural-network version in [[sec/unicode/bad-characters-imperceptible-nlp-attacks|Bad Characters]].

## Sources

1. [Boucher and Anderson, Trojan Source: Invisible Vulnerabilities (arXiv 2111.00169)](https://arxiv.org/abs/2111.00169): the paper, its dates and the language list.
2. [USENIX Security 23 presentation page](https://www.usenix.org/conference/usenixsecurity23/presentation/boucher): venue and page numbers.
3. [trojansource.codes](https://trojansource.codes/): the CVE mapping and the three technique names.
4. [CVE-2021-42574 record](https://cveawg.mitre.org/api/cve/CVE-2021-42574): the bidirectional reordering CVE and its publication date.
5. [CVE-2021-42694 record](https://cveawg.mitre.org/api/cve/CVE-2021-42694): the homoglyph identifier CVE.
6. [UAX #9, Unicode Bidirectional Algorithm](https://www.unicode.org/reports/tr9/): the explicit formatting characters and marks.
7. [Rust blog, Security advisory for rustc (CVE-2021-42574)](https://blog.rust-lang.org/2021/11/01/cve-2021-42574/): the example, the 1.56.1 lints and the crates.io scan.
8. [Rust lints, deny-by-default](https://doc.rust-lang.org/rustc/lints/listing/deny-by-default.html): the two text direction lints.
9. [Rust lints, warn-by-default](https://doc.rust-lang.org/rustc/lints/listing/warn-by-default.html): the three identifier lints.
10. [PEP 672, Unicode-related Security Considerations for Python](https://peps.python.org/pep-0672/): the Python response.
11. [golang/go issue #20209](https://github.com/golang/go/issues/20209): the open Go proposal.
12. [lirantal/anti-trojan-source](https://github.com/lirantal/anti-trojan-source): the CLI, its release and its documented scope.
13. [UTS #55, Unicode Source Code Handling](https://www.unicode.org/reports/tr55/): the standards-side document on source code.
14. [GitHub changelog, Warning about bidirectional Unicode text](https://github.blog/changelog/2021-10-31-warning-about-bidirectional-unicode-text/): the 2021-10-31 warning.
