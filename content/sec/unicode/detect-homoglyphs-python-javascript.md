---
title: "Detect Homoglyphs in Python and JavaScript"
date: 2026-10-29
description: "Detect homoglyphs in Python and JavaScript: mixed-script checks with the standard library, skeleton comparison, and the GitHub libraries compared."
tags:
  - sec
  - unicode
---

> [!tldr]
> A mixed-script check catches most homoglyph spoofs: in JavaScript with `\p{Script_Extensions=...}` regexes, in Python by reading script names from `unicodedata.name`. It misses strings written entirely in Cyrillic or Greek, which need a UTS #39 skeleton comparison. Of the GitHub libraries, the active ones are codebox/homoglyph, decancer, ICU's SpoofChecker and the Rust and Ruby libraries; the best-known Python package is archived.

Detection comes in two layers. The first asks which scripts a string uses, and it is cheap, local and good at the common case. The second asks whether two strings look alike, which is the skeleton comparison from [[sec/unicode/unicode-confusables-skeleton|the confusables skeleton note]], and it catches what the first layer cannot. The attack surface both layers defend is described in the [[sec/hiding-data-with-homoglyphs-exploiting-unicode-lookalikes|homoglyph reference note]], and the carriers that need no lookalike at all, such as zero-width characters, are compared in [[sec/unicode/index|the Unicode steganography and spoofing guide]].

## Mixed-script detection in JavaScript

The `u` flag gives regexes script properties. `Script_Extensions` is the right one to ask: it lists every script a character is used in, which matters for shared marks and punctuation. Node 24:

```javascript
const SCRIPTS = ["Latin", "Cyrillic", "Greek", "Armenian", "Hebrew", "Arabic", "Han", "Hiragana", "Katakana", "Hangul"];
const patterns = SCRIPTS.map((name) => [name, new RegExp(`^\\p{Script_Extensions=${name}}$`, "u")]);

function scriptSets(text) {
  const sets = [];
  for (const ch of text) {
    const set = new Set(patterns.filter(([, re]) => re.test(ch)).map(([name]) => name));
    if (set.size > 0) sets.push(set);
  }
  return sets;
}

export const scriptsOf = (text) => [...new Set(scriptSets(text).flatMap((set) => [...set]))];

export function isMixedScript(text) {
  const sets = scriptSets(text);
  if (sets.length === 0) return false;
  return [...sets[0]].every((name) => !sets.every((set) => set.has(name)));
}

if (import.meta.main) {
  const cases = [
    "paypal",
    "p\u{0430}yp\u{0430}l", // Cyrillic a, twice
    "\u{0391}laskaJazz", // Greek capital Alpha first
    "caf\u{00e9} \u{00fc}ber", // accents are still Latin
    "\u{0441}afe", // Cyrillic es, then Latin afe
    "\u{0455}\u{0441}\u{043e}\u{0440}\u{0435}", // all Cyrillic, looks like "scope"
    "\u{30fc}", // prolonged sound mark, shared by kana
  ];
  for (const s of cases) console.log(JSON.stringify(s), scriptsOf(s).join("+") || "(none)", isMixedScript(s));
}
// "paypal" Latin false
// "pаypаl" Latin+Cyrillic true
// "ΑlaskaJazz" Greek+Latin true
// "café über" Latin false
// "сafe" Cyrillic+Latin true
// "ѕсоре" Cyrillic false
// "ー" Hiragana+Katakana false
```

Each character contributes the set of scripts it is used in, and a string is mixed-script when those sets have no script in common, which is the resolved script set of UTS #39. That is why the seventh row is not flagged: the prolonged sound mark belongs to both kana scripts, so the intersection is not empty. Counting distinct scripts instead would call it mixed. Characters whose script extensions name none of the listed scripts, such as digits, hyphens and combining accents, say nothing about the writing system and drop out, the same way UTS #39 treats Common and Inherited. The sixth row is the gap in the method, covered below. Apply the check to identifiers such as usernames, domain labels and package names, not to free-form prose, where mixing scripts is normal.

## The same check with Python's standard library

Python's `unicodedata` has no script property. The common workaround reads the script from the first matching word in the character name, so `CYRILLIC SMALL LETTER A` gives `CYRILLIC`:

```python
import unicodedata

SCRIPT_WORDS = {
    "LATIN", "CYRILLIC", "GREEK", "ARMENIAN", "HEBREW", "ARABIC",
    "CJK", "HIRAGANA", "KATAKANA", "HANGUL",
}


def scripts_of(text):
    found = set()
    for ch in text:
        if not unicodedata.category(ch).startswith(("L", "M")):
            continue
        for word in unicodedata.name(ch, "").split():
            if word in SCRIPT_WORDS:
                found.add(word)
                break
    return found


def is_mixed_script(text):
    return len(scripts_of(text)) > 1


if __name__ == "__main__":
    cases = [
        "paypal",
        "p\U00000430yp\U00000430l",  # Cyrillic a, twice
        "\U00000391laskaJazz",  # Greek capital Alpha first
        "caf\U000000e9 \U000000fcber",  # accents are still Latin
        "\U00000441afe",  # Cyrillic es, then Latin afe
        "\U00000455\U00000441\U0000043e\U00000440\U00000435",  # all Cyrillic, looks like "scope"
        "\U000030fc",  # prolonged sound mark, shared by kana
    ]
    for s in cases:
        print(repr(s), "+".join(sorted(scripts_of(s))) or "(none)", is_mixed_script(s))
# 'paypal' LATIN False
# 'pаypаl' CYRILLIC+LATIN True
# 'ΑlaskaJazz' GREEK+LATIN True
# 'café über' LATIN False
# 'сafe' CYRILLIC+LATIN True
# 'ѕсоре' CYRILLIC False
# 'ー' (none) False
```

This approximates `Script`, not `Script_Extensions`, and counts distinct scripts instead of intersecting sets. The last row shows the cost: the name of U+30FC is `KATAKANA-HIRAGANA PROLONGED SOUND MARK`, which matches no word in the set, so the character is ignored. Scripts missing from `SCRIPT_WORDS`, such as Thai, are ignored as well. The approximation is enough for a Latin, Cyrillic and Greek spoof filter and not for a general script classifier.

## What mixed-script detection misses

The sixth row of both outputs is a word that reads `scope` and consists only of Cyrillic letters. UTS #39 calls it a whole-script confusable, and its own table of mixed-script examples makes the same point: an all-Cyrillic string that reads as "Circle" (`СігсӀе`) is classified as single-script. A script check answers "does this string mix writing systems", and an attacker who stays inside one script gets a pass. The only reliable answer is to compare against the strings you want to protect, using the skeleton. The [[sec/unicode/homoglyph-generator|homoglyph generator]] produces such strings on demand for testing both layers. Seed the tests with the [[sec/hiding-data-with-homoglyphs-exploiting-unicode-lookalikes#Digits and other scripts|digit lookalikes]] too: one swapped digit breaks an exact match and leaves the string readable.

Restriction levels turn script checks into a policy. UTS #39 Section 5.2 defines six:

| Level | Name | Rule |
| ---: | --- | --- |
| 1 | ASCII-Only | All characters are ASCII |
| 2 | Single Script | ASCII-only, or a single script |
| 3 | Highly Restrictive | Single script, or Latin with Han plus Hiragana and Katakana, Bopomofo or Hangul |
| 4 | Moderately Restrictive | Highly Restrictive, or Latin plus any one other recommended script except Cyrillic and Greek |
| 5 | Minimally Restrictive | No script restriction, characters must still be in the identifier profile |
| 6 | Unrestricted | Characters may be outside the identifier profile; meant for detection APIs |

Latin mixed with Cyrillic or Greek fails levels 1 to 4, so `pаypal` is accepted only at level 5 or 6. Browsers apply the same idea per domain label, as described in [[sec/unicode/idn-homograph-attack|the IDN homograph note]]. Choose the level by what the identifier is for: level 2 or 3 for usernames in a Latin-script product, level 4 when names may combine Latin with one other recommended script.

## confusable_homoglyphs

`confusable_homoglyphs` (PyPI name `confusable_homoglyphs`) is the best-known Python package for this job. Its GitHub repository is archived. The README says maintenance moved in January 2024 to `sr.ht/~valhalla/confusable_homoglyphs`, so check that location before you adopt it. Its data is built from Unicode `Scripts.txt` and `confusables.txt`. The API documentation shows these calls with their results:

```python
from confusable_homoglyphs import confusables

confusables.is_mixed_script('Alloτ')
# True
bool(confusables.is_dangerous('Alloρ'))
# True
bool(confusables.is_dangerous('AlloΓ', preferred_aliases=['latin']))
# False
confusables.is_confusable('paρa', preferred_aliases=['latin'])[0]['character']
# 'ρ'
```

`is_mixed_script` is the script check from above. `is_dangerous` is narrower: it flags a mixed-script string only when a foreign character is confusable with one from the scripts you prefer. In the example, `ρ` can pass for `p`, while `Γ` has no Latin lookalike, so `AlloΓ` is allowed. That reduces false positives on legitimate multilingual text.

## ICU SpoofChecker

ICU ships a `SpoofChecker` for C, C++ and Java that implements confusability checks and the restriction levels above. If your stack already links ICU, that is the supported route, and it is current: ICU `release-79.1` was published on 2026-10-22.

## Libraries on GitHub compared

Status as of 2026-10-29, read from the GitHub API. Stars measure attention, not quality. "No release" means the repository publishes none on GitHub, though it may publish to a package registry.

| Repository | Stars | License | Latest release | Last push | Status | What it does |
| --- | ---: | --- | --- | --- | --- | --- |
| [codebox/homoglyph](https://github.com/codebox/homoglyph) | 640 | MIT | 1.2.0 (2020-01-26) | 2026-08-29 | active | Hand-curated homoglyph sets plus JS, Java and Python search code |
| [null8626/decancer](https://github.com/null8626/decancer) | 132 | MIT | v4.0.0 (2026-09-16) | 2026-10-24 | active | Rust core with bindings: detect and cure confusables and zalgo |
| [janlelis/unicode-confusable](https://github.com/janlelis/unicode-confusable) | 79 | MIT | no release | 2026-09-22 | active | Ruby: `confusable?` and skeleton |
| [unicode-rs/unicode-security](https://github.com/unicode-rs/unicode-security) | 19 | NOASSERTION | no release | 2025-12-27 | active | Rust: UTS #39 mixed-script and restriction-level checks |
| [unicode-org/icu](https://github.com/unicode-org/icu) | 3633 | NOASSERTION (Unicode license) | release-79.1 (2026-10-22) | 2026-10-23 | active | `SpoofChecker` for C, C++ and Java |
| [rspeer/python-ftfy](https://github.com/rspeer/python-ftfy) | 4067 | NOASSERTION | v6.3.1 (2024-10-26) | 2024-10-30 | active | Fixes mojibake and normalizes text; not a security tool |
| [vhf/confusable_homoglyphs](https://github.com/vhf/confusable_homoglyphs) | 166 | MIT | no release | 2024-01-02 | archived | Python: `is_dangerous`, `is_mixed_script`, `is_confusable` |
| [life4/homoglyphs](https://github.com/life4/homoglyphs) | 84 | MIT | v.2.0.0 (2020-03-30) | 2021-01-11 | archived | Python: similar letters, convert to ASCII |
| [nodeca/unhomoglyph](https://github.com/nodeca/unhomoglyph) | 44 | MIT | no release | 2020-05-18 | stale | JS: replace homoglyphs with base characters |
| [gc/confusables](https://github.com/gc/confusables) | 69 | MIT | no release | 2023-03-04 | stale | Node: remove confusable characters from strings |
| [mtibben/confusables](https://github.com/mtibben/confusables) | 36 | BSD-3-Clause | no release | 2021-02-01 | stale | Go: UTS #39 skeleton |
| [endgameinc/homoglyph](https://github.com/endgameinc/homoglyph) | 30 | AGPL-3.0 | no release | 2018-07-11 | stale | Python research code |

**Adopt as dependencies:** the five active detection projects, codebox/homoglyph, decancer, janlelis/unicode-confusable, unicode-rs/unicode-security and ICU, chosen by language. GitHub reports `NOASSERTION` for the licenses of unicode-security and ICU, so read the license file before depending on them. ftfy is useful for cleaning text before you compare it and does no spoof detection.

**Cite, don't depend:** the archived and stale projects are good as reference data and algorithms. Python is the awkward case. The best-known Python package is archived, and no active project in the table is a dedicated Python package for this, although codebox/homoglyph includes Python search code. In Python, the standard-library script check above plus the 30-line skeleton in [[sec/unicode/unicode-confusables-skeleton|the UTS #39 skeleton implementation]], fed directly from the Unicode data files, is a smaller dependency surface than an unmaintained package. Normalize first, as explained in [[sec/unicode/unicode-normalization-security|Unicode normalization security]], so that fullwidth and ligature forms do not slip past either layer. A string padded with [[sec/unicode/zalgo-text-combining-characters|stacked combining marks]] survives normalization intact, so cap mark runs before either layer runs.

## Sources

1. [Unicode Technical Standard #39, Unicode Security Mechanisms](https://www.unicode.org/reports/tr39/) - mixed-script detection (5.1), restriction levels (5.2), skeleton and the "Circle" example.
2. [confusables.txt, version 18.0.0](https://www.unicode.org/Public/security/latest/confusables.txt) - the data behind skeleton comparison.
3. [vhf/confusable_homoglyphs README](https://github.com/vhf/confusable_homoglyphs) - archival notice, move to sr.ht, data sources.
4. [confusable_homoglyphs API documentation](https://confusable-homoglyphs.readthedocs.io/en/latest/apidocumentation.html) - the quoted calls and results.
5. [codebox/homoglyph](https://github.com/codebox/homoglyph), [null8626/decancer](https://github.com/null8626/decancer), [janlelis/unicode-confusable](https://github.com/janlelis/unicode-confusable), [unicode-rs/unicode-security](https://github.com/unicode-rs/unicode-security) - active projects in the table, with stars, license and release data from the GitHub API on 2026-10-29.
6. [unicode-org/icu](https://github.com/unicode-org/icu) - `SpoofChecker` and release-79.1.
7. [rspeer/python-ftfy](https://github.com/rspeer/python-ftfy), [life4/homoglyphs](https://github.com/life4/homoglyphs), [nodeca/unhomoglyph](https://github.com/nodeca/unhomoglyph), [gc/confusables](https://github.com/gc/confusables), [mtibben/confusables](https://github.com/mtibben/confusables), [endgameinc/homoglyph](https://github.com/endgameinc/homoglyph) - the remaining table rows.
