---
title: "Remove Zero-Width Characters: Regex, CLI, Editors"
date: 2026-10-29
description: "Remove zero-width characters with a JavaScript or Python regex, perl and ripgrep one-liners, and VS Code. Why the Default_Ignorable filter is safer."
tags:
  - sec
  - unicode
---

> [!tldr]
> The quick fix is `/[\u200B-\u200D\u2060\uFEFF]/gu`, which removes ZWSP, ZWNJ, ZWJ, WORD JOINER and the BOM. It misses the other invisible carriers, so the safer rule is the Unicode property `Default_Ignorable_Code_Point`, with an exception list for the places where ZWJ, ZWNJ and variation selectors do real work: emoji, Persian and similar scripts.

Zero-width characters get into text by accident (copy-paste from a CMS, a BOM in a file) or on purpose, as a [[sec/unicode/zero-width-steganography|steganographic channel]]. Either way the cleanup is a few lines, and the interesting part is choosing what to remove. The other techniques are mapped in the [[sec/unicode/index|Unicode steganography techniques and detection]] overview.

## The narrow filter: five characters

```js
const dirty = "ab\u200Bc\u200C\u200D\u2060\uFEFFd";
const narrow = /[\u200B-\u200D\u2060\uFEFF]/gu;
console.log(JSON.stringify(dirty.replace(narrow, ""))); // "abcd"
```

```python
import re

dirty = "ab\u200Bc\u200C\u200D\u2060\uFEFFd"
print(repr(re.sub("[\u200B-\u200D\u2060\uFEFF]", "", dirty)))  # 'abcd'
```

This is what most snippets on the web do, and for "my CMS leaves ZWSP in titles" it is enough. It fails against anyone who knows it is there, because Unicode has many more invisible code points than these five.

## Why the broader filter is safer

Two properties come to mind, and only one of them is right.

- `General_Category=Cf` (Format). In Node 24 (Unicode 17.0 data), `\p{Cf}` matches 170 code points. It misses U+3164 HANGUL FILLER, U+FFA0 HALFWIDTH HANGUL FILLER and U+115F/U+1160 (all `Lo`, letters), U+034F COMBINING GRAPHEME JOINER and every variation selector (`Mn`).
- `Default_Ignorable_Code_Point` (DICP). The property renderers use to decide what to hide. In `DerivedCoreProperties-18.0.0.txt` it is built from `Other_Default_Ignorable_Code_Point`, plus `Cf`, plus `Variation_Selector`, minus White_Space and a few ranges that should stay visible, for a total of 4174 code points. Node 24 reports the same 4174. Names and categories for the members that matter are tabulated in [[sec/unicode/invisible-unicode-characters|the invisible Unicode characters reference]].

The difference is concrete:

```js
const broad = /\p{Default_Ignorable_Code_Point}/gu;
const sneaky = "pay\u3164ment\u034Fs\uFE0F";
console.log(JSON.stringify(sneaky.replace(narrow, "")));
// "pay\u3164ment\u034Fs\uFE0F"   (the filler, the CGJ and the VS16 all survive)
console.log(JSON.stringify(sneaky.replace(broad, "")));
// "payments"
```

The narrow filter also leaves the Tags block (U+E0000 to U+E007F) and the 240 supplementary variation selectors alone, so `"x\u{E0041}\u{E0042}y\u{E0100}"` comes through intact, while the broad one returns `"xy"`. Those are the carriers behind [[sec/unicode/ascii-smuggling-unicode-tag-characters|ASCII smuggling with tag characters]] and [[sec/unicode/variation-selectors|variation-selector payloads]]. UTS #39 makes the same choice for its confusable skeleton: step two removes every Default_Ignorable_Code_Point.

One caveat: DICP means "invisible by default", not "harmless". U+3164 is category `Lo`, a letter, so Python accepts it in identifiers (`'a\u3164b'.isidentifier()` is `True`) and `/\p{L}/u.test("\u3164")` is true. Stripping by DICP is what makes such names collapse back to their visible form.

Python has no DICP property in the standard library. The ranges are short enough to inline; this is the 18.0.0 data and it sums to 4174:

```python
import re

DICP = [
    (0x00AD, 0x00AD), (0x034F, 0x034F), (0x061C, 0x061C), (0x115F, 0x1160),
    (0x17B4, 0x17B5), (0x180B, 0x180F), (0x200B, 0x200F), (0x202A, 0x202E),
    (0x2060, 0x206F), (0x3164, 0x3164), (0xFE00, 0xFE0F), (0xFEFF, 0xFEFF),
    (0xFFA0, 0xFFA0), (0xFFF0, 0xFFF8), (0x1BCA0, 0x1BCA3), (0x1D173, 0x1D17A),
    (0xE0000, 0xE0FFF),
]
IGNORABLE = re.compile("[" + "".join(f"\\U{a:08x}-\\U{b:08x}" for a, b in DICP) + "]")

print(repr(IGNORABLE.sub("", "pay\u3164ment\u034Fs\uFE0F")))  # 'payments'
print(sum(b - a + 1 for a, b in DICP))                         # 4174
```

The data file states that "there are currently no stability guarantees for DICP", so regenerate the list when you move to a new Unicode version.

## What the broad filter breaks, and a version that spares emoji

Stripping every DICP character is wrong for text that uses these characters legitimately.

- Emoji sequences. `"\u{1F468}\u200D\u{1F4BB}"` (man technologist) is a ZWJ sequence. After the broad filter it is two separate emoji.
- Flag tag sequences. The Scotland flag is U+1F3F4 followed by tag characters and U+E007F. The filter leaves a plain black flag: 7 code points become 1.
- Persian and other scripts that use ZWNJ. `"\u0645\u06CC\u200C\u062E\u0648\u0627\u0647\u0645"` loses its non-joiner and the two parts of the word join up (8 code points become 7).
- Presentation selectors. A U+FE0F after a heart is what asks for the emoji look.

For prose that may contain emoji, keep a ZWJ only between two pictographs and a presentation selector only after something that has an emoji form, and remove the rest:

```js
const KEEP =
  String.raw`(?<=\p{Extended_Pictographic}\uFE0F?)\u200D(?=\p{Extended_Pictographic})` +
  String.raw`|(?<=\p{Emoji})[\uFE0E\uFE0F]`;
const SCRUB = new RegExp(`(${KEEP})|\\p{Default_Ignorable_Code_Point}`, "gu");
const clean = (s) => s.replace(SCRUB, (m, keep) => keep ?? "");

clean("\u{1F468}\u200D\u{1F4BB}") === "\u{1F468}\u200D\u{1F4BB}"; // true
clean("\u2764\uFE0F ok\u200B") === "\u2764\uFE0F ok";              // true
JSON.stringify(clean("a\uFE0F\uFE0Fb"));                           // "ab"
JSON.stringify(clean("hi\u200D\u200Bthere"));                      // "hithere"
```

This version still removes the tag characters, so flags built from them degrade, which is the right trade for text headed into an LLM prompt or a database. Digits count as `\p{Emoji}` (keycap sequences need that), so a lone `1\uFE0F` survives; that is one bit of capacity at most. My rule: strip with the broad filter for identifiers, usernames and file names, and with the emoji-aware one for free text. For languages that rely on ZWNJ, apply neither blindly.

## Command line: find and strip in a repo

Searching comes first, because an unexpected hit deserves a look before it is deleted.

```sh
# ripgrep: every line containing one of the five
rg -n '[\x{200B}-\x{200D}\x{2060}\x{FEFF}]' .

# ripgrep with the broad property
rg -n '\p{Default_Ignorable_Code_Point}' .

# perl, with a CI-friendly exit code (1 when something was found)
git ls-files -z | xargs -0 perl -CSD -ne '
  if (/[\x{200B}-\x{200D}\x{2060}\x{FEFF}]/) { print "$ARGV:$.: zero-width\n"; $bad = 1 }
  close ARGV if eof; END { exit($bad // 0) }'

# perl, strip in place
perl -CSD -i -pe 's/[\x{200B}-\x{200D}\x{2060}\x{FEFF}]//g' file.txt
perl -CSD -i -pe 's/\p{Default_Ignorable_Code_Point}//g' file.txt
```

The macOS pitfalls, all observed on the stock tools:

- `/usr/bin/grep` is BSD grep 2.6.0 and fails with `invalid option -- P`. Use `rg`, `perl`, or `git grep -P`.
- `git grep -nP '[\x{200B}]'` errors with `character code point value in \x{} or \o{} is too large`, because PCRE runs in byte mode. Prefix the pattern with `(*UTF)`: `git grep -nP '(*UTF)[\x{200B}-\x{200D}\x{2060}\x{FEFF}]'`.
- Stock `sed` accepts `\x` byte escapes in the pattern (`sed 's/\xe2\x80\x8b//g'` worked), but a bracket expression of bytes does not behave like a Unicode range: `sed 's/[\xe2\x80\x8b]//g'` left the ZWSP in place. Use an alternation of full UTF-8 sequences: `sed -E 's/\xe2\x80\x8b|\xe2\x80\x8c|\xe2\x80\x8d|\xe2\x81\xa0|\xef\xbb\xbf//g'`. In-place editing needs an empty suffix: `sed -i '' -E '...' file`.
- `sed` knows nothing about code points, so it cannot express DICP. For anything wider than the five characters, use `perl`.

## VS Code and editors

VS Code has highlighting built in. The 1.63 release notes introduced it: `editor.unicodeHighlight.invisibleCharacters` highlights uncommon invisible characters in source code, and it is on by default. `editor.unicodeHighlight.ambiguousCharacters` does the same for [[sec/hiding-data-with-homoglyphs-exploiting-unicode-lookalikes|unicode lookalikes]], `editor.unicodeHighlight.allowedCharacters` whitelists specific characters, and `editor.unicodeHighlight.includeComments` extends the check to comments and text. The same release notes say Markdown documents are not highlighted by default, which matters when your content lives in `.md` files, so for a writing repo a CI check like the ripgrep one above is the better guard. Highlighting only shows you the problem; removal still needs one of the commands above. A related case is a bidi control in source code, which triggers the warning discussed in [[sec/unicode/bidirectional-unicode-text-warning|this file contains bidirectional unicode text]].

## Sources

1. [Unicode DerivedCoreProperties-18.0.0.txt](https://www.unicode.org/Public/UCD/latest/ucd/DerivedCoreProperties.txt): the Default_Ignorable_Code_Point derivation, its ranges, the total of 4174 and the stability note.
2. [UTS #39, Unicode Security Mechanisms](https://www.unicode.org/reports/tr39/): the skeleton algorithm removes Default_Ignorable_Code_Point characters.
3. [Visual Studio Code 1.63 release notes, Unicode highlighting](https://code.visualstudio.com/updates/v1_63): the `editor.unicodeHighlight.*` settings, default state and the Markdown exception.
