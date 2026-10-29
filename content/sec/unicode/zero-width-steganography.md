---
title: "Zero-Width Steganography: Hiding Text Invisibly"
date: 2026-10-29
description: "Zero-width steganography hides text in U+200B, U+200C and U+200D. JavaScript and Python encoder, decoder, capacity maths and detection that works."
tags:
  - sec
  - unicode
  - steganography
---

> [!tldr]
> Zero-width steganography encodes every bit of a secret as an invisible character, typically U+200B (ZWSP) for 0 and U+200C (ZWNJ) for 1, and drops the run into ordinary text. The cover text looks unchanged, a 9-byte message costs 72 extra characters, and any filter that removes format characters (`Cf`) deletes the message completely. Encoder, decoder and detector are below.

Zero-width characters are format characters: they have no glyph, no advance width, and renderers are told to show nothing for them. That makes them a clean binary channel inside plain text, and most platforms pass them through as ordinary code points. The same family of tricks, one level up and with a different alphabet, is covered in [[sec/hiding-data-in-emoji-an-introduction-to-unicode-steganography|emoji steganography]], and the full map of techniques lives in the [[sec/unicode/index|Unicode steganography hub]].

## Which characters carry the bits

Five characters get used in practice. All of them are `Cf` (General_Category Format) and all are Default_Ignorable_Code_Point (checked against `DerivedCoreProperties-18.0.0.txt`), so a conforming renderer draws nothing for them even when the font has no glyph.

| Code point | Name | Role in the channel |
| --- | --- | --- |
| `U+200B` | ZERO WIDTH SPACE | the usual 0 |
| `U+200C` | ZERO WIDTH NON-JOINER | the usual 1 |
| `U+200D` | ZERO WIDTH JOINER | third symbol, or a delimiter |
| `U+2060` | WORD JOINER | fourth symbol |
| `U+FEFF` | ZERO WIDTH NO-BREAK SPACE | avoid: JavaScript `\s` matches it and `trim()` strips it at the edges |

That last row is why most encoders skip U+FEFF. In Node 24, `/\s/.test("\u200B")` is `false` and `/\s/.test("\uFEFF")` is `true`, so a whitespace-collapsing step quietly eats a payload built from the BOM. Names and categories for the whole family are in [[sec/unicode/invisible-unicode-characters|the invisible Unicode characters list]].

## Encoder and decoder in JavaScript

One byte becomes eight characters. The secret is UTF-8 encoded first, so non-ASCII text survives the round trip.

```js
const ZERO = "\u200B"; // ZWSP encodes 0
const ONE = "\u200C"; // ZWNJ encodes 1

function hide(secret, cover) {
  const bits = [...new TextEncoder().encode(secret)]
    .map((b) => b.toString(2).padStart(8, "0"))
    .join("");
  const payload = [...bits].map((b) => (b === "0" ? ZERO : ONE)).join("");
  const [first, ...rest] = [...cover];
  return first + payload + rest.join("");
}

function reveal(text) {
  const bits = [...text]
    .filter((c) => c === ZERO || c === ONE)
    .map((c) => (c === ZERO ? "0" : "1"))
    .join("");
  const bytes = (bits.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2));
  return new TextDecoder().decode(new Uint8Array(bytes));
}

const stego = hide("meet at 9", "Quarterly report attached.");
console.log(stego.length); // 98 (26 visible + 72 hidden)
console.log(reveal(stego)); // meet at 9
console.log(stego.replace(/[\u200B-\u200D]/g, "")); // Quarterly report attached.
```

The payload sits after the first letter here. Position is a free choice: between words, at the end of a line, or spread across the text. Spreading it makes casual detection harder and survives truncation worse.

## The same thing in Python

The decoder only has to know the two symbols, so the Python twin is short.

```python
ZERO, ONE = "\u200B", "\u200C"

def hide(secret, cover):
    bits = "".join(f"{b:08b}" for b in secret.encode())
    payload = "".join(ZERO if b == "0" else ONE for b in bits)
    return cover[0] + payload + cover[1:]

def reveal(text):
    bits = "".join("0" if c == ZERO else "1" for c in text if c in (ZERO, ONE))
    return bytes(int(bits[i:i + 8], 2) for i in range(0, len(bits) - 7, 8)).decode()

s = hide("meet at 9", "Quarterly report attached.")
print(len(s), reveal(s))  # 98 meet at 9
```

## Capacity: what a message costs

Every zero-width character is 1 UTF-16 code unit and 3 UTF-8 bytes (`new TextEncoder().encode("\u200B")` gives `[226, 128, 139]`). With a binary alphabet one secret byte therefore weighs 24 bytes on disk. A wider alphabet helps, but only logarithmically:

| Alphabet | Bits per character | Characters for a 32-byte secret |
| --- | ---: | ---: |
| ZWSP, ZWNJ | 1 | 256 |
| ZWSP, ZWNJ, ZWJ | 1.58 | 162 |
| ZWSP, ZWNJ, ZWJ, WJ | 2 | 128 |

The figures are `ceil(256 / log2(n))`. A recent academic design, Ishtiaq et al. (2025), uses eight zero-width characters, which is three bits per position. The survey by Majeed et al. (2021) places all of this next to the other text carriers.

If you would rather not write the 20 lines yourself, there are libraries. [KuroLabs/stegcloak](https://github.com/KuroLabs/stegcloak) (JavaScript, 3930 stars as of 2026-10-29, last push 2024-10-01, latest release v1.1.1 from 2020) compresses and encrypts the secret before hiding it, which shrinks the payload and hides its structure. Its README says MIT, although GitHub could not classify the license file, so check it before depending on it. The README also states the limit of the whole approach: it is not safe against someone who actively analyses the Unicode characters, because the unusual density of invisible code points gives the message away. [offdev/zwsp-steg-js](https://github.com/offdev/zwsp-steg-js) (Apache-2.0, last push 2025-02-13, no GitHub release) documents `MODE_ZWSP` with U+200B, U+200C and U+200D, and `MODE_FULL`, which adds U+200E and U+200F. Its Python port, [enodari/zwsp-steg-py](https://github.com/enodari/zwsp-steg-py), has been stale since 2019, so read it as reference code.

## What breaks the channel

The channel is only as durable as the least friendly hop between sender and reader. I ran the stego string through the usual suspects in Node 24:

```js
reveal(stego.trim());                    // meet at 9   (trim ignores U+200B and U+200C)
reveal(stego.normalize("NFKC"));         // meet at 9   (NFKC leaves them alone)
reveal(stego.replace(/\s+/g, " "));      // meet at 9   (\s matches neither U+200B nor U+200C)
reveal(stego.replace(/[\u200B-\u200D\u2060\uFEFF]/gu, "")); // "" (any strip kills it)
```

Ordinary text hygiene does not remove the payload, only a filter aimed at these code points does. Such filters are simple to write, and the confusable-detection algorithm in UTS #39 builds one in: its skeleton step removes every Default_Ignorable_Code_Point before comparing strings. More on the stripping side in [[sec/unicode/remove-zero-width-characters|how to remove zero-width characters]]. Whether a particular platform preserves the characters is a per-hop question that changes over time. The StegCloak README claims its output works on Tweets, Gmail and WhatsApp, which is the author's claim, so test your own path with a round trip before relying on any of it.

A second fragility is retyping. Anyone who copies the visible text by hand, or runs it through OCR or a screenshot, drops the payload without knowing it was there. That weakness, seen from the other side, is the subject of [[sec/unicode/zero-width-watermark-canary-trap|zero-width watermarks and canary traps]].

## Detecting it

Detection is easy because the alphabet is tiny. Count the characters, then look for runs.

```js
const ZW = /[\u200B-\u200D\u2060\uFEFF]/gu;
console.log(stego.match(ZW).length); // 72
const run = /[\u200B-\u200D\u2060\uFEFF]{8,}/u.exec(stego);
console.log(run.index, run[0].length); // 1 72
```

In Python, `unicodedata.category(c) == "Cf"` lists the format characters with their names:

```python
import unicodedata

for i, c in enumerate(s[:4]):
    if unicodedata.category(c) == "Cf":
        print(f"{i:3d}  U+{ord(c):04X}  {unicodedata.name(c)}")
#   1  U+200B  ZERO WIDTH SPACE
#   2  U+200C  ZERO WIDTH NON-JOINER
#   3  U+200C  ZERO WIDTH NON-JOINER
```

For a repository, `rg -n '[\x{200B}-\x{200D}\x{2060}\x{FEFF}]' .` prints every line containing one. A legitimate ZWNJ in Persian text or a ZWJ inside an emoji sequence shows up too, so treat a hit as a lead and read the characters around it. A run of eight or more with nothing else between them is almost never an accident. The decoder in [[sec/unicode/unicode-steganography-decoder|the Unicode steganography decoder]] recognises this pattern together with two other carriers.

## Sources

1. [Unicode DerivedCoreProperties-18.0.0.txt](https://www.unicode.org/Public/UCD/latest/ucd/DerivedCoreProperties.txt): Default_Ignorable_Code_Point membership of U+200B, U+200C, U+200D, U+2060 and U+FEFF.
2. [UTS #39, Unicode Security Mechanisms](https://www.unicode.org/reports/tr39/): the skeleton algorithm removes Default_Ignorable_Code_Point characters.
3. [KuroLabs/stegcloak](https://github.com/KuroLabs/stegcloak): compression, encryption, the density caveat and the platform claims quoted from its README.
4. [offdev/zwsp-steg-js](https://github.com/offdev/zwsp-steg-js): `MODE_ZWSP` and `MODE_FULL` character sets.
5. [enodari/zwsp-steg-py](https://github.com/enodari/zwsp-steg-py): the Python port and its stale status.
6. [Ishtiaq et al., "Enhancing Imperceptibility: Zero-width Character-based Text Steganography for Preserving Message Privacy"](https://doi.org/10.18267/j.aip.271): Acta Informatica Pragensia 14(3), 2025, eight zero-width characters.
7. [Majeed et al., "A Review on Text Steganography Techniques"](https://doi.org/10.3390/math9212829): Mathematics 9(21), 2021, survey of text carriers.
