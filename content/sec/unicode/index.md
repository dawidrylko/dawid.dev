---
title: "Unicode Steganography: Techniques and Detection"
date: 2026-10-29
description: "Unicode steganography techniques compared: homoglyphs, zero-width, variation selectors, tags, whitespace, bidi and combining marks, plus detection."
tags:
  - sec
  - unicode
  - steganography
---

> [!tldr]
> Unicode steganography hides data in characters a reader does not notice. Six carriers hold data: lookalike letters, zero-width characters, variation selectors, tag characters, trailing whitespace and combining marks. A seventh family, bidirectional controls, changes only what is displayed. NFKC normalization removes none of the invisible ones. Detection is a character-class scan, plus a mixed-script check for lookalikes.

Two pillar notes started this collection. [[sec/hiding-data-with-homoglyphs-exploiting-unicode-lookalikes|Unicode lookalikes]] covers data hidden by swapping letters for identical-looking ones, and [[sec/hiding-data-in-emoji-an-introduction-to-unicode-steganography|emoji steganography]] covers bytes carried by variation selectors on a single emoji.

## The techniques compared

| Technique | Carrier | Capacity | Survives copy-paste | Survives NFKC | How to detect | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Homoglyphs | Letters swapped for identical-looking letters from another script | About one bit per substitutable letter where a letter has one lookalike | Yes, they are ordinary characters | Cross-script lookalikes survive, fullwidth and other compatibility forms fold to ASCII | Mixed-script check, UTS #39 skeleton | [[sec/unicode/what-is-a-homoglyph\|what is a homoglyph]], [[sec/unicode/unicode-confusables-skeleton\|confusables skeleton]] |
| Zero-width characters | U+200B, U+200C, U+200D and similar, inserted between visible letters | One bit per character with two symbols; a set of eight carries three bits each | Usually, depends on the destination | Yes | Category Cf scan, regex | [[sec/unicode/zero-width-steganography\|zero-width steganography]], [[sec/unicode/remove-zero-width-characters\|removing zero-width characters]] |
| Variation selectors | VS1 to VS256 after a base character, usually an emoji | One byte per selector | Most copy-paste operations, per Paul Butler | Yes | Scan U+FE00 to U+FE0F and U+E0100 to U+E01EF | [[sec/unicode/variation-selectors\|variation selectors]], [[sec/unicode/unicode-steganography-decoder\|Unicode steganography decoder]] |
| Tag characters | U+E0020 to U+E007E, ASCII at an offset of U+E0000 | One printable ASCII character per tag | Usually, depends on the destination | Yes | Filter U+E0000 to U+E007F | [[sec/unicode/ascii-smuggling-unicode-tag-characters\|ASCII smuggling]], [[sec/unicode/invisible-prompt-injection\|prompt injection]] |
| Whitespace | Spaces and tabs appended to line ends | Low, bound by the number of lines | Only where trailing whitespace is kept | ASCII space and tab yes; Unicode spaces fold to a plain space | Search for trailing whitespace | [[sec/unicode/whitespace-steganography\|whitespace steganography]] |
| Bidi controls | U+202A to U+202E, U+2066 to U+2069 | Not a data channel: changes what is displayed | Usually, they are characters | Yes | Regex over the nine controls | [[sec/unicode/trojan-source-attack\|Trojan Source]], [[sec/unicode/right-to-left-override-u202e\|file names]] |
| Combining marks | Marks after base letters | Depends on the alphabet of marks and the run length | Yes | Marks that compose with a base are merged, the rest stay | Mark-run length, Stream-Safe check | [[sec/unicode/zalgo-text-combining-characters\|zalgo text]] |

Copy-paste behaviour depends on the destination. Web forms, chat applications and editors each strip different characters, so test your own path before you rely on a column that says "usually". The NFKC column is checkable on any machine, and the script below does it.

```python
import unicodedata

CARRIERS = {
    "homoglyph, Cyrillic a": "\u0430",
    "homoglyph, fullwidth A": "\uff21",
    "zero-width space": "\u200b",
    "variation selector VS16": "\ufe0f",
    "variation selector VS17": "\U000E0100",
    "tag letter A": "\U000E0041",
    "trailing tab": "\t",
    "no-break space": "\u00a0",
    "em space": "\u2003",
    "bidi RLO": "\u202e",
    "combining grave": "\u0300",
}

for name, ch in CARRIERS.items():
    out = unicodedata.normalize("NFKC", ch)
    verdict = "kept" if out == ch else "changed to " + " ".join(f"U+{ord(c):04X}" for c in out)
    print(f"{name:24} U+{ord(ch):04X}  {verdict}")

pair = unicodedata.normalize("NFKC", "e\u0301")
print("e + U+0301               ->", " ".join(f"U+{ord(c):04X}" for c in pair))
# homoglyph, Cyrillic a    U+0430  kept
# homoglyph, fullwidth A   U+FF21  changed to U+0041
# zero-width space         U+200B  kept
# variation selector VS16  U+FE0F  kept
# variation selector VS17  U+E0100  kept
# tag letter A             U+E0041  kept
# trailing tab             U+0009  kept
# no-break space           U+00A0  changed to U+0020
# em space                 U+2003  changed to U+0020
# bidi RLO                 U+202E  kept
# combining grave          U+0300  kept
# e + U+0301               -> U+00E9
```

NFKC leaves the Cyrillic letter `а` (U+0430) alone, because the mapping from it to Latin `a` exists only in Unicode's confusables data, not in the normalization tables. And the invisible carriers pass through untouched, so **normalizing input is not a defence against them**. The security consequences are in [[sec/unicode/unicode-normalization-security|Unicode normalization security]].

## Homoglyphs and confusables

Characters that look the same and are not, used for hidden data and for spoofing names.

- [[sec/hiding-data-with-homoglyphs-exploiting-unicode-lookalikes|Unicode lookalikes: homoglyph table and hidden data]] is the reference table and the original pillar.
- The [[sec/unicode/homoglyph-generator|homoglyph generator]] swaps letters for lookalikes.
- [[sec/unicode/what-is-a-homoglyph|What is a homoglyph]] gives the definition and examples.
- [[sec/unicode/unicode-confusables-skeleton|Unicode confusables and the UTS #39 skeleton]] explains the data behind detection.
- [[sec/unicode/detect-homoglyphs-python-javascript|Detecting homoglyphs in Python and JavaScript]] is the code.
- The [[sec/unicode/idn-homograph-attack|IDN homograph attack]] applies lookalikes to domain names.
- [[sec/unicode/punycode|Punycode and xn-- domains]] shows how those names are encoded and decoded.
- [[sec/unicode/unicode-normalization-security|Unicode normalization security]] covers what NFC and NFKC do and do not fix.

## Invisible characters

Characters that draw nothing and carry a message anyway.

- [[sec/unicode/zero-width-steganography|Zero-width steganography]] hides text in zero-width characters.
- [[sec/unicode/remove-zero-width-characters|Removing zero-width characters]] covers regex, command line and editors.
- [[sec/unicode/invisible-unicode-characters|Invisible Unicode characters]] is the reference list.
- [[sec/unicode/variation-selectors|Unicode variation selectors]] explains U+FE0F and the other 255.
- [[sec/unicode/ascii-smuggling-unicode-tag-characters|ASCII smuggling with tag characters]] covers the Tags block.
- [[sec/unicode/whitespace-steganography|Whitespace steganography]] hides data in spaces and tabs.

## Bidirectional text

Controls that change the order in which characters are drawn.

- [[sec/unicode/trojan-source-attack|Trojan Source and CVE-2021-42574]] shows source code that displays one way and compiles another.
- [[sec/unicode/right-to-left-override-u202e|Right-to-left override in file names]] shows the same character spoofing an extension.
- [[sec/unicode/bidirectional-unicode-text-warning|The bidirectional Unicode text warning]] explains what to do when GitHub flags a file.

## LLM and NLP

Hidden characters aimed at models.

- [[sec/unicode/invisible-prompt-injection|Invisible prompt injection]] covers hidden instructions and a sanitizer.
- [[sec/unicode/bad-characters-imperceptible-nlp-attacks|Bad Characters: imperceptible NLP attacks]] reads the research paper on the four perturbation classes.

## Applications and tools

- [[sec/hiding-data-in-emoji-an-introduction-to-unicode-steganography|Emoji steganography: how to hide text in emoji]] is the second pillar.
- The [[sec/unicode/unicode-steganography-decoder|Unicode steganography decoder in JavaScript]] reads hidden payloads back.
- [[sec/unicode/zero-width-watermark-canary-trap|Zero-width watermarks and canary traps]] covers tracing a leaked text to its recipient.

## Combining marks

[[sec/unicode/zalgo-text-combining-characters|Zalgo text and combining characters]] shows how stacked marks break filters and layouts, and how to cap them.

## Sources

1. [Paul Butler, Smuggling arbitrary data through an emoji](https://paulbutler.org/2025/smuggling-arbitrary-data-through-an-emoji/): one byte per variation selector and the copy-paste claim.
2. [Ishtiaq et al., Zero-width Character-based Text Steganography, Acta Informatica Pragensia 14(3), 2025](https://doi.org/10.18267/j.aip.271): the eight zero-width characters used to embed messages.
3. [Majeed et al., A Review on Text Steganography Techniques, Mathematics 9(21), 2021](https://doi.org/10.3390/math9212829): the survey of text steganography.
4. [The SNOW Home Page](https://www.darkside.com.au/snow/): whitespace steganography by appending whitespace to line ends.
5. [UAX #15, Unicode Normalization Forms](https://www.unicode.org/reports/tr15/): the definitions of NFC and NFKC.
6. [UTS #39, Unicode Security Mechanisms](https://www.unicode.org/reports/tr39/): confusable detection, the skeleton and `confusables.txt`.
7. [UAX #9, Unicode Bidirectional Algorithm](https://www.unicode.org/reports/tr9/): the bidirectional control characters.
8. [UTS #51, Unicode Emoji](https://www.unicode.org/reports/tr51/): the emoji presentation selectors and tag sequences.
9. [Unicode Tags block chart](https://www.unicode.org/charts/PDF/UE0000.pdf): the layout of U+E0000 to U+E007F.
