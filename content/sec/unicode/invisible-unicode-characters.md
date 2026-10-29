---
title: "Invisible Unicode Characters: Full List and Code"
date: 2026-10-29
description: "Invisible Unicode characters list: code point, name, category, use and Default_Ignorable status, plus JavaScript and Python to produce and detect them."
tags:
  - sec
  - unicode
draft: true
---

> [!tldr]
> Invisible Unicode characters fall into five groups: zero-width and joiners, fillers and blanks, bidirectional controls, invisible math operators, and selectors plus tags. Most are Default_Ignorable_Code_Point, but not all (U+2800 BRAILLE PATTERN BLANK renders empty and is not), and category `Cf` is not the same set either. The tables below give code point, name, category and status; the snippets produce each character without pasting it, and a short detector finds them.

Pasting the characters themselves into a page defeats the purpose, since you cannot see them and a CMS may eat them. So this reference gives code points, and the sections after the tables show how to produce any of them in JavaScript or Python. The techniques that abuse them are indexed in the [[sec/unicode/index|Unicode steganography techniques and detection]] hub.

Categories come from Python 3.14's `unicodedata` (Unicode 16.0.0 data). The Default_Ignorable column is checked against `DerivedCoreProperties-18.0.0.txt`: "yes" means the code point is in the Default_Ignorable_Code_Point range list there, which is what a renderer uses to decide whether to draw anything for a character it has no glyph for.

## Zero-width characters and joiners

| Code point | Name | Category | Used for | Default_Ignorable |
| --- | --- | --- | --- | --- |
| `U+200B` | ZERO WIDTH SPACE | Cf | allows a line break, shows nothing | yes |
| `U+200C` | ZERO WIDTH NON-JOINER | Cf | prevents joining of neighbouring letters | yes |
| `U+200D` | ZERO WIDTH JOINER | Cf | forces joining; glues emoji into sequences | yes |
| `U+2060` | WORD JOINER | Cf | forbids a line break at this point | yes |
| `U+FEFF` | ZERO WIDTH NO-BREAK SPACE | Cf | byte order mark at the start of a file | yes |
| `U+00AD` | SOFT HYPHEN | Cf | visible only where a line breaks | yes |
| `U+034F` | COMBINING GRAPHEME JOINER | Mn | combining mark with no visible form | yes |

These seven carry the zero-width channel described in [[sec/unicode/zero-width-steganography|zero-width steganography]]. The bit-carrying pair is U+200B and U+200C; the others are used as extra symbols.

## Fillers and blanks that render empty

| Code point | Name | Category | Used for | Default_Ignorable |
| --- | --- | --- | --- | --- |
| `U+115F` | HANGUL CHOSEONG FILLER | Lo | placeholder in Hangul syllable composition | yes |
| `U+1160` | HANGUL JUNGSEONG FILLER | Lo | placeholder in Hangul syllable composition | yes |
| `U+3164` | HANGUL FILLER | Lo | full width filler, renders blank | yes |
| `U+FFA0` | HALFWIDTH HANGUL FILLER | Lo | half width filler, renders blank | yes |
| `U+2800` | BRAILLE PATTERN BLANK | So | Braille cell with no dots, renders blank | **no** |
| `U+17B4` | KHMER VOWEL INHERENT AQ | Mn | inherent vowel with no visible form | yes |
| `U+180E` | MONGOLIAN VOWEL SEPARATOR | Cf | Mongolian vowel separator | yes |

The surprises sit here. U+3164 and U+FFA0 are category `Lo`, letters, so `\p{L}` matches them and Python's `'a\u3164b'.isidentifier()` is `True`; they are also Default_Ignorable, which is why the broader filter in [[sec/unicode/remove-zero-width-characters|the removal how-to]] catches them and a `Cf`-only filter does not. U+2800 is the opposite: it renders as a blank cell, is category `So`, is not Default_Ignorable, and does not match `\s`, so `"\u2800".trim()` leaves it in place and every strip-the-invisibles filter misses it.

## Bidirectional controls

| Code point | Name | Category | Used for | Default_Ignorable |
| --- | --- | --- | --- | --- |
| `U+200E` | LEFT-TO-RIGHT MARK | Cf | direction mark | yes |
| `U+200F` | RIGHT-TO-LEFT MARK | Cf | direction mark | yes |
| `U+061C` | ARABIC LETTER MARK | Cf | direction mark for Arabic text | yes |
| `U+202A` | LEFT-TO-RIGHT EMBEDDING | Cf | explicit embedding | yes |
| `U+202B` | RIGHT-TO-LEFT EMBEDDING | Cf | explicit embedding | yes |
| `U+202C` | POP DIRECTIONAL FORMATTING | Cf | ends an embedding or override | yes |
| `U+202D` | LEFT-TO-RIGHT OVERRIDE | Cf | explicit override | yes |
| `U+202E` | RIGHT-TO-LEFT OVERRIDE | Cf | explicit override; used in file name spoofing | yes |
| `U+2066` | LEFT-TO-RIGHT ISOLATE | Cf | explicit isolate | yes |
| `U+2067` | RIGHT-TO-LEFT ISOLATE | Cf | explicit isolate | yes |
| `U+2068` | FIRST STRONG ISOLATE | Cf | isolate, direction taken from content | yes |
| `U+2069` | POP DIRECTIONAL ISOLATE | Cf | ends an isolate | yes |

UAX #9 defines the nine explicit formatting characters (U+202A to U+202E and U+2066 to U+2069) and the three marks (U+200E, U+200F, U+061C). They change how text is laid out without adding a glyph, which is the basis of the reordering attacks in the [[sec/unicode/right-to-left-override-u202e|right-to-left override (U+202E)]] note.

## Invisible math operators

| Code point | Name | Category | Used for | Default_Ignorable |
| --- | --- | --- | --- | --- |
| `U+2061` | FUNCTION APPLICATION | Cf | math markup, no glyph | yes |
| `U+2062` | INVISIBLE TIMES | Cf | math markup, no glyph | yes |
| `U+2063` | INVISIBLE SEPARATOR | Cf | math markup, no glyph | yes |
| `U+2064` | INVISIBLE PLUS | Cf | math markup, no glyph | yes |

## Selectors and tags

| Code point | Name | Category | Used for | Default_Ignorable |
| --- | --- | --- | --- | --- |
| `U+180B` | MONGOLIAN FREE VARIATION SELECTOR ONE | Mn | glyph variant of the preceding Mongolian letter | yes |
| `U+FE00` | VARIATION SELECTOR-1 | Mn | glyph variant of the preceding character | yes |
| `U+FE0E` | VARIATION SELECTOR-15 | Mn | requests text presentation | yes |
| `U+FE0F` | VARIATION SELECTOR-16 | Mn | requests emoji presentation | yes |
| `U+E0100` | VARIATION SELECTOR-17 | Mn | first of 240 ideographic selectors | yes |
| `U+E0001` | LANGUAGE TAG | Cf | deprecated | yes |
| `U+E0020` | TAG SPACE | Cf | first of the tag characters that mirror ASCII | yes |
| `U+E0041` | TAG LATIN CAPITAL LETTER A | Cf | tag twin of ASCII `A` | yes |
| `U+E007F` | CANCEL TAG | Cf | ends an emoji tag sequence | yes |

All 256 variation selectors and the whole Tags block share these rows' status. Their abuse is covered in [[sec/unicode/variation-selectors|variation selectors]] and [[sec/unicode/ascii-smuggling-unicode-tag-characters|ASCII smuggling]].

The Default_Ignorable range list is wider than the tables. It also covers U+17B5, U+180C to U+180D, U+180F, U+2065, U+206A to U+206F, U+FFF0 to U+FFF8, U+1BCA0 to U+1BCA3, U+1D173 to U+1D17A and several reserved, unassigned ranges inside the Tags block area (U+E0000, U+E0002 to U+E001F, U+E0080 to U+E00FF, U+E01F0 to U+E0FFF), 4174 code points in total.

## Category Cf is not the same set

A shortcut that comes up often is "invisible means `Cf`". Counting in Node 24 (Unicode 17.0 data), `\p{Cf}` matches 170 code points and `\p{Default_Ignorable_Code_Point}` matches 4174. Only 138 code points are in both. The rest of the `Cf` characters, such as U+0600 ARABIC NUMBER SIGN, are format characters that are meant to be visible, which is what the Prepended_Concatenation_Mark exception in the derivation is for. And most of the DICP set is not `Cf` at all: the Hangul fillers are `Lo`, the combining grapheme joiner and every variation selector are `Mn`, and the reserved ranges are unassigned (`Cn`).

## Produce any of them without pasting

JavaScript: `String.fromCodePoint` or a `\u{...}` escape.

```js
const INVISIBLES = {
  ZWSP: 0x200b, ZWNJ: 0x200c, ZWJ: 0x200d, WJ: 0x2060, BOM: 0xfeff,
  SHY: 0x00ad, CGJ: 0x034f, HANGUL_CHOSEONG_FILLER: 0x115f, HANGUL_JUNGSEONG_FILLER: 0x1160,
  HANGUL_FILLER: 0x3164, HALFWIDTH_HANGUL_FILLER: 0xffa0, BRAILLE_BLANK: 0x2800,
  MONGOLIAN_VOWEL_SEPARATOR: 0x180e, LRM: 0x200e, RLM: 0x200f, ALM: 0x061c,
  LRE: 0x202a, RLE: 0x202b, PDF: 0x202c, LRO: 0x202d, RLO: 0x202e,
  LRI: 0x2066, RLI: 0x2067, FSI: 0x2068, PDI: 0x2069,
  VS1: 0xfe00, VS15: 0xfe0e, VS16: 0xfe0f, VS17: 0xe0100, TAG_A: 0xe0041, CANCEL_TAG: 0xe007f,
};
const make = (name) => String.fromCodePoint(INVISIBLES[name]);
console.log(make("ZWSP").length, make("TAG_A").length, `a${make("ZWSP")}b`.length); // 1 2 3
```

Python: `chr(0x200B)` or a named escape, which reads better in review.

```python
print(ascii("\N{ZERO WIDTH SPACE}\N{BRAILLE PATTERN BLANK}\N{HANGUL FILLER}\N{TAG LATIN CAPITAL LETTER A}"))
# '\u200B\u2800\u3164\U000e0041'
```

## A one-screen detector

The JavaScript version flags Default_Ignorable characters, format characters, every space separator except U+0020, line and paragraph separators, and U+2800, with line and column. The Python version prints names as well.

```js
const SUSPECT = /[[\p{Default_Ignorable_Code_Point}\p{Cf}\p{Zs}\p{Zl}\p{Zp}\u2800]--[ ]]/gv;

function scan(text) {
  const hits = [];
  text.split("\n").forEach((line, i) => {
    let col = 0;
    for (const ch of line) {
      col++;
      if (ch.match(SUSPECT)) hits.push(`${i + 1}:${col} U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`);
    }
  });
  return hits;
}

const sample = `ok\nstop${make("ZWSP")}ped\n${make("BRAILLE_BLANK")}x\tnbsp\u00A0here ${make("HANGUL_FILLER")}`;
console.log(scan(sample)); // [ '2:5 U+200B', '3:1 U+2800', '3:8 U+00A0', '3:14 U+3164' ]
```

```python
import unicodedata

EXTRA = {0x2800, 0x3164, 0xFFA0, 0x115F, 0x1160, 0x034F}

def suspect(c):
    cp, cat = ord(c), unicodedata.category(c)
    return (
        cat in {"Cf", "Zl", "Zp"}
        or (cat == "Zs" and c != " ")
        or cp in EXTRA
        or 0xFE00 <= cp <= 0xFE0F
        or 0xE0100 <= cp <= 0xE01EF
    )

def scan(text):
    for n, line in enumerate(text.splitlines(), 1):
        for col, c in enumerate(line, 1):
            if suspect(c):
                yield f"{n}:{col} U+{ord(c):04X} {unicodedata.name(c, '<unnamed>')}"

sample = "ok\nstop\u200Bped\n\u2800x\tnbsp\u00A0here \u3164\n\U000e0041"
print(*scan(sample), sep="\n")
# 2:5 U+200B ZERO WIDTH SPACE
# 3:1 U+2800 BRAILLE PATTERN BLANK
# 3:8 U+00A0 NO-BREAK SPACE
# 3:14 U+3164 HANGUL FILLER
# 4:1 U+E0041 TAG LATIN CAPITAL LETTER A
```

U+00A0 shows up because it is a space separator; that is noise in prose and a lead in source code. Legitimate ZWJ in emoji and ZWNJ in Persian will trigger as well, so a hit is a place to look, not a verdict. Removal rules with the emoji exceptions are in [[sec/unicode/remove-zero-width-characters|the guide to removing zero-width characters]].

## Sources

1. [Unicode DerivedCoreProperties-18.0.0.txt](https://www.unicode.org/Public/UCD/latest/ucd/DerivedCoreProperties.txt): the Default_Ignorable_Code_Point derivation, ranges and the total of 4174.
2. [UAX #9, Unicode Bidirectional Algorithm](https://www.unicode.org/reports/tr9/): the explicit formatting characters and implicit marks.
3. [UTS #51, Unicode Emoji](https://www.unicode.org/reports/tr51/): U+FE0E and U+FE0F, emoji tag sequences, ZWJ sequences.
4. [Unicode chart: Tags, U+E0000 to U+E007F](https://www.unicode.org/charts/PDF/UE0000.pdf): the Tags block and the deprecation of U+E0001.
5. [Unicode PropList.txt](https://www.unicode.org/Public/UCD/latest/ucd/PropList.txt): the Variation_Selector property.
