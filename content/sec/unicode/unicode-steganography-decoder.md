---
title: "Unicode Steganography Decoder in JavaScript"
date: 2026-10-29
description: "Unicode steganography decoder in JavaScript and Python: finds and decodes hidden variation-selector, zero-width and tag-character text in any string."
tags:
  - sec
  - unicode
  - steganography
---

> [!tldr]
> Paste a string into `analyze()` and it reports every run of invisible carrier characters, with the decoded text for each: variation selectors (one byte per selector, Paul Butler's scheme), zero-width ZWSP/ZWNJ bits, and Unicode tag characters (ASCII shifted by U+E0000). It skips the legitimate cases, a lone presentation selector and the England, Scotland and Wales flags. Dependency-free JavaScript for Node 24, a Python 3 twin, and the matching encoders for testing.

Hidden text in Unicode comes in a few flavours that look identical on screen and nothing alike in memory. Three of them have real tooling and real write-ups: the variation-selector encoding behind [[sec/hiding-data-in-emoji-an-introduction-to-unicode-steganography|emoji steganography]], the binary zero-width channel, and the Tags block used for prompt injection. A decoder that handles all three answers the practical question "is there something in this string, and what does it say" in one call. Background on each carrier is in the [[sec/unicode/index|Unicode steganography hub]].

## The three carriers and their mappings

| Carrier | Code points | Mapping decoded here | Written up in |
| --- | --- | --- | --- |
| Variation selectors | `U+FE00` to `U+FE0F`, `U+E0100` to `U+E01EF` | byte < 16 is `U+FE00 + byte`, otherwise `U+E0100 + byte - 16` | [[sec/unicode/variation-selectors\|variation selectors]] |
| Zero-width bits | `U+200B` (0), `U+200C` (1) | eight characters per byte, UTF-8 | [[sec/unicode/zero-width-steganography\|zero-width steganography]] |
| Tag characters | `U+E0020` to `U+E007E` | code point minus `U+E0000` is ASCII | [[sec/unicode/ascii-smuggling-unicode-tag-characters\|ASCII smuggling]] |

The zero-width convention is a common choice rather than a standard, so a payload written with another alphabet (ZWJ as a separator, WORD JOINER as a symbol) decodes to nothing here. The variation-selector mapping is Butler's, published on 2025-02-08.

## The decoder

`analyze()` walks the code points, groups consecutive characters of one carrier into a run, decodes the run and records whether it is an expected, legitimate use. UTF-8 decoding is strict: a run that is not valid UTF-8 returns `null` instead of garbage.

```js
const utf8 = new TextDecoder("utf-8", { fatal: true });
const toText = (bytes) => {
  try {
    return bytes.length ? utf8.decode(Uint8Array.from(bytes)) : null;
  } catch {
    return null;
  }
};

const KINDS = {
  vs: (cp) => (cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0xe0100 && cp <= 0xe01ef),
  tag: (cp) => cp >= 0xe0020 && cp <= 0xe007e,
  zw: (cp) => cp === 0x200b || cp === 0x200c,
};
const FLAGS = new Set(["gbeng", "gbsct", "gbwls"]);

export function analyze(input) {
  const cps = [...input].map((c) => c.codePointAt(0));
  const runs = [];
  for (let i = 0; i < cps.length; ) {
    const kind = Object.keys(KINDS).find((k) => KINDS[k](cps[i]));
    if (!kind) { i++; continue; }
    let j = i;
    while (j < cps.length && KINDS[kind](cps[j])) j++;
    const run = cps.slice(i, j);
    let decoded = null;
    let expected = false;
    if (kind === "vs") {
      expected = run.length === 1 && (run[0] === 0xfe0e || run[0] === 0xfe0f);
      if (!expected) decoded = toText(run.map((cp) => (cp <= 0xfe0f ? cp - 0xfe00 : cp - 0xe0100 + 16)));
    } else if (kind === "tag") {
      decoded = String.fromCodePoint(...run.map((cp) => cp - 0xe0000));
      expected = cps[i - 1] === 0x1f3f4 && cps[j] === 0xe007f && FLAGS.has(decoded);
    } else {
      const bits = run.map((cp) => (cp === 0x200b ? "0" : "1")).join("");
      decoded = toText((bits.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2)));
    }
    runs.push({ kind, at: i, length: run.length, expected, decoded });
    i = j;
  }
  return runs;
}

export const encodeVS = (base, text) =>
  base + [...new TextEncoder().encode(text)]
    .map((b) => String.fromCodePoint(b < 16 ? 0xfe00 + b : 0xe0100 + b - 16))
    .join("");

export const encodeZW = (cover, text) => {
  const bits = [...new TextEncoder().encode(text)]
    .map((b) => b.toString(2).padStart(8, "0"))
    .join("");
  return cover + [...bits].map((b) => (b === "0" ? "\u200B" : "\u200C")).join("");
};

export const encodeTags = (cover, ascii) =>
  cover + [...ascii].map((c) => String.fromCodePoint(0xe0000 + c.charCodeAt(0))).join("");
```

Each result carries `kind`, the position `at` (in code points), the run `length`, `expected` and `decoded`. `expected` is true for a single U+FE0E or U+FE0F, and for a tag run that sits between U+1F3F4 and U+E007F and spells one of the three subdivision flags. Everything else with a payload is worth reading.

## Encoders for testing

The decoder is only trustworthy once you have fed it things you made yourself. The three encoders at the bottom of the module (`encodeVS`, `encodeZW`, `encodeTags`) are the mirror image of the mappings in the table. Running the decoder over their output, plus a string with legitimate uses:

```js
import { analyze, encodeVS, encodeZW, encodeTags } from "./stego.mjs";

const scotland = String.fromCodePoint(0x1f3f4, ...[..."gbsct"].map((c) => 0xe0000 + c.charCodeAt(0)), 0xe007f);
const samples = {
  vs: encodeVS("A", "meet at 9"),
  zw: encodeZW("Report attached.", "meet at 9"),
  tags: encodeTags("Summarize this page.", "hello"),
  honest: "caf\u00E9 \u2764\uFE0F " + scotland,
};
for (const [name, s] of Object.entries(samples)) {
  console.log(name, analyze(s).map((r) => `${r.kind} at=${r.at} len=${r.length} expected=${r.expected} decoded=${JSON.stringify(r.decoded)}`));
}
// vs     [ 'vs at=1 len=9 expected=false decoded="meet at 9"' ]
// zw     [ 'zw at=16 len=72 expected=false decoded="meet at 9"' ]
// tags   [ 'tag at=20 len=5 expected=false decoded="hello"' ]
// honest [ 'vs at=6 len=1 expected=true decoded=null',
//          'tag at=9 len=5 expected=true decoded="gbsct"' ]
```

A string with two carriers at once is reported as two runs: `analyze(samples.zw + " " + samples.tags)` returns `zw@16:meet at 9` and `tag@109:hello`.

## The Python twin

Same structure, same result shape, standard library only.

```python
FLAGS = {"gbeng", "gbsct", "gbwls"}

def _vs(cp): return 0xFE00 <= cp <= 0xFE0F or 0xE0100 <= cp <= 0xE01EF
def _tag(cp): return 0xE0020 <= cp <= 0xE007E
def _zw(cp): return cp in (0x200B, 0x200C)
KINDS = {"vs": _vs, "tag": _tag, "zw": _zw}

def _text(data):
    try:
        return bytes(data).decode("utf-8") if data else None
    except UnicodeDecodeError:
        return None

def analyze(s):
    cps = [ord(c) for c in s]
    runs, i = [], 0
    while i < len(cps):
        kind = next((k for k, f in KINDS.items() if f(cps[i])), None)
        if kind is None:
            i += 1
            continue
        j = i
        while j < len(cps) and KINDS[kind](cps[j]):
            j += 1
        run, decoded, expected = cps[i:j], None, False
        if kind == "vs":
            expected = len(run) == 1 and run[0] in (0xFE0E, 0xFE0F)
            if not expected:
                decoded = _text([cp - 0xFE00 if cp <= 0xFE0F else cp - 0xE0100 + 16 for cp in run])
        elif kind == "tag":
            decoded = "".join(chr(cp - 0xE0000) for cp in run)
            expected = i > 0 and cps[i - 1] == 0x1F3F4 and j < len(cps) and cps[j] == 0xE007F and decoded in FLAGS
        else:
            bits = "".join("0" if cp == 0x200B else "1" for cp in run)
            decoded = _text([int(bits[k:k + 8], 2) for k in range(0, len(bits) - 7, 8)])
        runs.append({"kind": kind, "at": i, "length": len(run), "expected": expected, "decoded": decoded})
        i = j
    return runs

def encode_vs(base, text):
    return base + "".join(chr(0xFE00 + b if b < 16 else 0xE0100 + b - 16) for b in text.encode())

def encode_zw(cover, text):
    bits = "".join(f"{b:08b}" for b in text.encode())
    return cover + "".join("\u200B" if b == "0" else "\u200C" for b in bits)

def encode_tags(cover, ascii_text):
    return cover + "".join(chr(0xE0000 + ord(c)) for c in ascii_text)
```

```python
from stego import *

scotland = chr(0x1F3F4) + "".join(chr(0xE0000 + ord(c)) for c in "gbsct") + chr(0xE007F)
print(analyze(encode_vs("A", "meet at 9")))
# [{'kind': 'vs', 'at': 1, 'length': 9, 'expected': False, 'decoded': 'meet at 9'}]
print([(r["kind"], r["expected"], r["decoded"]) for r in analyze("caf\u00E9 \u2764\uFE0F " + scotland)])
# [('vs', True, None), ('tag', True, 'gbsct')]
```

## What it does not decode

A clean result has three limits. First, a payload that was compressed and encrypted before hiding, as StegCloak does, decodes to bytes that are not valid UTF-8, so even on a recognised carrier the result is `null`: the run is visible, the content is not. Second, the encodings change. Johann Rehberger's 2025 update to his ASCII Smuggler adds the variation-selector byte mapping credited to Butler and a "Sneaky Bits" scheme built from two invisible characters, so new alphabets keep appearing and the `KINDS` table is where you add them. Third, homoglyph and whitespace channels carry no run of invisible characters at all; they need different detectors, see [[sec/unicode/whitespace-steganography|whitespace steganography]] for the spacing family.

If all you need is removal rather than reading, [[sec/unicode/remove-zero-width-characters|the how-to on removing zero-width characters]] is the shorter path, and [[sec/unicode/invisible-unicode-characters|the invisible characters reference]] lists what else can hide in a string.

## Sources

1. [Paul Butler, "Smuggling arbitrary data through an emoji"](https://paulbutler.org/2025/smuggling-arbitrary-data-through-an-emoji/): the byte-to-variation-selector mapping and the decoding rule.
2. [paulgb/emoji-encoder](https://github.com/paulgb/emoji-encoder): Butler's encoder and decoder, TypeScript, MIT, last push 2025-04-09.
3. [UTS #51, Unicode Emoji](https://www.unicode.org/reports/tr51/): ED-8, ED-9 and ED-14a emoji tag sequences, Annex C flag sequences.
4. [Unicode chart: Tags, U+E0000 to U+E007F](https://www.unicode.org/charts/PDF/UE0000.pdf): the tag characters and the deprecated U+E0001.
5. [Johann Rehberger, "Sneaky Bits: Advanced Data Smuggling Techniques (ASCII Smuggler Updates)"](https://embracethered.com/blog/posts/2025/sneaky-bits-and-ascii-smuggler/): variation-selector mapping and the two-character scheme.
6. [KuroLabs/stegcloak](https://github.com/KuroLabs/stegcloak): compresses and encrypts before hiding, README density caveat.
