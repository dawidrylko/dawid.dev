---
title: "Zalgo Text: How Combining Characters Stack"
date: 2026-10-29
description: "Zalgo text stacks dozens of combining marks on one letter. How it works, why it breaks filters, and how to cap or strip the gibberish."
tags:
  - sec
  - unicode
draft: true
---

> [!tldr]
> Zalgo text is ordinary letters followed by long runs of combining marks (category Mn, mostly U+0300 to U+036F) that stack above and below the base character. It breaks keyword filters, length limits and line layouts. Cap the number of marks per base character, or strip diacritics when the language allows it. The standard's own ceiling is 30 non-starters in a row.

A letter followed by a handful of accents is normal text. A letter followed by thirty accents is a smear that climbs through the line above it, and it is the same Unicode mechanism in both cases. The limit is a few lines of code, and the topic sits next to [[sec/unicode/unicode-normalization-security|Unicode normalization security]], because the question of what normalization does to marks is the same question, and the other carriers are collected on the [[sec/unicode/index|Unicode steganography techniques]] page.

## How the stacking works

A combining character has no position of its own. It attaches to the base character before it, and a renderer places it relative to that base, above or below depending on the mark. U+0300 COMBINING GRAVE ACCENT, for instance, has general category Mn and canonical combining class 230, the "above" class. Nothing in the encoding limits how many marks may follow one base, so a run of fifty is valid text.

Zalgo generators exploit that. They take each letter, append marks drawn at random from the Combining Diacritical Marks block (U+0300 to U+036F) and sometimes from the extended blocks near U+1AB0, U+1DC0, U+20D0 and U+FE20, and print the result. Three letters with six marks each come to 21 code points and 39 UTF-8 bytes, each mark costing two bytes.

## What it breaks

Four things go wrong, and each can be reproduced in a few lines:

- Keyword filters: `"b" + U+0300 + "ad"` is a different string from `"bad"`, so a substring blocklist misses it. Removing the marks restores the match.
- Word boundaries: a regex such as `\w+` stops at a mark, because marks are not word characters in Python's definition, so `he` followed by U+0300 and `llo` splits into two tokens.
- Length limits: the example further down is 21 code points and 3 graphemes. A limit counted in code points or bytes rejects it for the wrong reason, and a limit counted in graphemes lets any number of marks through.
- Layout: all marks stack on one base glyph, so a single line can grow far beyond its normal height and paint over the lines around it.

Normalization does not rescue you. NFC composes a mark into a precomposed letter where one exists (`e` plus U+0301 becomes `é`), but a mark with nothing to compose with stays as it was, and NFKC does not remove marks either. The consequences of that for comparison and security checks are in the normalization note linked above.

## The standard's limit: Stream-Safe Text Format

UAX #15, Unicode Normalization Forms, defines a Stream-Safe Text Format (UAX15-D3): a string is in it if it contains **no sequence of non-starters longer than 30 characters** when normalized to NFKD. A non-starter is a character with a nonzero canonical combining class, and the 30-character limit lets a normalizer work with a 32-character buffer. The standard says 30 was chosen to be significantly beyond any linguistic or technical usage. Its Stream-Safe Text Process (UAX15-D4) repairs long runs by inserting U+034F COMBINING GRAPHEME JOINER between marks.

Treat 30 as a safety ceiling, not as a good product limit. Real text needs far fewer; the Vietnamese letter `ệ` decomposes to two. Pick your own limit by measuring the longest run in your corpus.

## Detect, cap and strip in Python

```python
import random
import re
import unicodedata

random.seed(7)
MARKS = [chr(c) for c in range(0x0300, 0x0370)]


def zalgo(text, per_char=6):
    return "".join(c + "".join(random.choices(MARKS, k=per_char)) for c in text)


def max_mark_run(text):
    run = best = 0
    for ch in text:
        run = run + 1 if unicodedata.category(ch) in ("Mn", "Me") else 0
        best = max(best, run)
    return best


def max_non_starters(text):
    run = best = 0
    for ch in unicodedata.normalize("NFKD", text):
        run = run + 1 if unicodedata.combining(ch) != 0 else 0
        best = max(best, run)
    return best


def cap_marks(text, limit=4):
    out, run = [], 0
    for ch in text:
        if unicodedata.category(ch) in ("Mn", "Me"):
            run += 1
            if run > limit:
                continue
        else:
            run = 0
        out.append(ch)
    return "".join(out)


def strip_marks(text):
    decomposed = unicodedata.normalize("NFD", text)
    kept = "".join(c for c in decomposed if unicodedata.category(c) not in ("Mn", "Me"))
    return unicodedata.normalize("NFC", kept)


z = zalgo("bad")
print("code points   :", len(z), "| UTF-8 bytes:", len(z.encode()))
print("blocklist     :", "bad" in z, "-> after strip:", "bad" in strip_marks(z))
print("\\w+ split     :", re.findall(r"\w+", "he\u0300llo"))
print("mark run      :", max_mark_run(z), "-> after cap_marks(limit=4):", max_mark_run(cap_marks(z)))
print("stream-safe   :", max_non_starters("e" + "\u0301" * 30) <= 30, max_non_starters("e" + "\u0301" * 31) <= 30)
print("non-starters  :", max_non_starters("Việt"), "in Viet (NFKD)")
print("polish strip  :", strip_marks("Zaż\xf3łć gęślą jaźń"))
garbled = "caf\xe9".encode("utf-8").decode("latin-1")
print("mojibake      :", ascii(garbled), "->", garbled.encode("latin-1").decode("utf-8"))
assert strip_marks(z) == "bad"
assert max_mark_run(cap_marks(z)) <= 4
assert cap_marks("e\u0301") == "e\u0301"
# code points   : 21 | UTF-8 bytes: 39
# blocklist     : False -> after strip: True
# \w+ split     : ['he', 'llo']
# mark run      : 6 -> after cap_marks(limit=4): 4
# stream-safe   : True False
# non-starters  : 2 in Viet (NFKD)
# polish strip  : Zazołc gesla jazn
# mojibake      : 'caf\xc3\xa9' -> café
```

Capping and stripping are different tools. `cap_marks` keeps legitimate diacritics and trims only the excess, which is what a comment box or a username field wants. `strip_marks` removes every diacritic, and the Polish line shows the cost: `ł` has no decomposition, so it survives while the other accents vanish and the text becomes wrong in a different way. Use stripping for matching and search keys, not for text you display.

## Detect, cap and strip in JavaScript

`\p{M}` is the whole mark category, so the regular expressions need no range lists, and `Intl.Segmenter` counts what a reader would count.

```js
const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
const graphemes = (s) => [...seg.segment(s)].length;

const hasMarkRun = (s, limit = 4) => new RegExp(`\\p{M}{${limit + 1},}`, "u").test(s);

function capMarks(text, limit = 4) {
  return text
    .normalize("NFC")
    .replace(new RegExp(`\\p{M}{${limit + 1},}`, "gu"), (run) => [...run].slice(0, limit).join(""));
}

const stripMarks = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC");

const marks = Array.from({ length: 0x70 }, (_, i) => String.fromCodePoint(0x300 + i));
let seed = 7;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const zalgo = (s, n = 6) =>
  [...s].map((c) => c + Array.from({ length: n }, () => marks[Math.floor(rnd() * marks.length)]).join("")).join("");

const z = zalgo("bad");
console.log("code points :", [...z].length, "graphemes:", graphemes(z));
console.log("flagged     :", hasMarkRun(z), "| clean text flagged:", hasMarkRun("Zaż\xf3łć"));
console.log("capped      :", hasMarkRun(capMarks(z)), [...capMarks(z)].length, "code points");
console.log("stripped    :", stripMarks(z), stripMarks(z) === "bad");
console.log("viet kept   :", capMarks("Việt Nam") === "Việt Nam".normalize("NFC"));
// code points : 21 graphemes: 3
// flagged     : true | clean text flagged: false
// capped      : false 15 code points
// stripped    : bad true
// viet kept   : true
```

## "Unicode gibberish" is not always Zalgo

Searchers who type "unicode gibberish" may mean something else. Zalgo is deliberate and made of valid marks. Mojibake is an encoding accident: UTF-8 bytes decoded as Latin-1, which the last Python line reverses for the simple case (`cafÃ©` back to `café`). For messy real-world mojibake, `ftfy` (v6.3.1, active) fixes mojibake and normalizes text. It is not a security tool, and GitHub reports its license as NOASSERTION, so read the license file before you depend on it.

## A maintained library

If you would rather not own the rules, decancer (v4.0.0, released 2026-09-16, MIT, active) is a Rust library with bindings, including JavaScript on npm. Its README says it detects and filters common confusables and homoglyphs, and that by default it removes all diacritics, which also eliminates all forms of Zalgo text. The same default set covers whitespace characters and most leetspeak, so it is far more aggressive than `strip_marks`. Use it on matching keys and moderation input, not on text you display. The detection of lookalike letters is a separate job, treated in [[sec/unicode/detect-homoglyphs-python-javascript|detecting homoglyphs in Python and JavaScript]], and the list of characters that draw nothing at all is in [[sec/unicode/invisible-unicode-characters|invisible Unicode characters]].

## Sources

1. [UAX #15, Unicode Normalization Forms](https://www.unicode.org/reports/tr15/): the Stream-Safe Text Format (UAX15-D3), the Stream-Safe Text Process (UAX15-D4) and the definitions of the normalization forms.
2. [null8626/decancer](https://github.com/null8626/decancer): the library, its release, license and the README statement about Zalgo.
3. [rspeer/python-ftfy](https://github.com/rspeer/python-ftfy): the mojibake fixer and its status.
