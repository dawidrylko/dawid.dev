---
title: "Unicode Variation Selectors: U+FE0F and Beyond"
date: 2026-10-29
description: "Unicode variation selectors VS1 to VS256, U+FE0E text vs U+FE0F emoji, why they can carry bytes, and JavaScript and Python code to find and strip abuse."
tags:
  - sec
  - unicode
  - steganography
draft: true
---

> [!tldr]
> A variation selector is an invisible combining character that asks the renderer for a specific variant of the character before it. There are 256 of them (VS1 to VS16 at U+FE00 to U+FE0F, VS17 to VS256 at U+E0100 to U+E01EF), U+FE0E and U+FE0F pick text or emoji presentation, and because 256 equals the number of byte values they can smuggle data. Legitimate use is one selector after a suitable base character, so anything else is worth flagging.

Almost everyone has met U+FE0F without knowing it: it is the invisible character that turns a black-and-white heart into a red one. The same mechanism is the carrier behind the encoding in [[sec/hiding-data-in-emoji-an-introduction-to-unicode-steganography|emoji steganography]]. Detecting and removing abuse is a short regex, provided it leaves U+FE0F inside real emoji alone. The surrounding techniques are indexed in the [[sec/unicode/index|Unicode steganography hub]].

## What does a variation selector do?

The Unicode chart for the block describes them as combining characters that, in conjunction with the preceding character, indicate a predetermined choice of variant glyph. On their own they render nothing. Two of them have a job everybody uses. In UTS #51 (Unicode Emoji, version 18.0), U+FE0E VARIATION SELECTOR-15 is the text presentation selector (ED-8) and U+FE0F VARIATION SELECTOR-16 is the emoji presentation selector (ED-9). Only sequences listed in `emoji-variation-sequences.txt` are valid; a selector after anything else is not a valid emoji variation sequence.

```js
const heart = "\u2764";
const text = heart + "\uFE0E";   // asks for the text style
const emoji = heart + "\uFE0F";  // asks for the emoji style
console.log(text.length, emoji.length, [...emoji].length); // 2 2 2
```

Both strings have two code points and the same visible base. That is the first thing to remember about this class: the selector is a real character, it counts in `length`, it survives `JSON.stringify`, and a string comparison tells the two hearts apart.

## The ranges, and why 256 is not 260

| Range | Names | Code points | Purpose |
| --- | --- | ---: | --- |
| `U+FE00` to `U+FE0F` | VS1 to VS16 | 16 | standardized variants; VS15 and VS16 select text or emoji presentation |
| `U+E0100` to `U+E01EF` | VS17 to VS256 | 240 | ideographic variation sequences, registered in the Ideographic Variation Database (UTS #37) |
| `U+180B` to `U+180D`, `U+180F` | Mongolian FVS1 to FVS4 | 4 | Mongolian free variation selectors |

"The 256 variation selectors" means VS1 to VS256, the first two rows. The Unicode `Variation_Selector` property is wider: it also covers the four Mongolian free variation selectors, so it has 260 members. A loop in Node 24 confirms it:

```js
let count = 0;
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (/\p{Variation_Selector}/u.test(String.fromCodePoint(cp))) count++;
}
console.log(count); // 260
```

U+180E MONGOLIAN VOWEL SEPARATOR sits between them but is not a selector (it is `Cf`, see [[sec/unicode/invisible-unicode-characters|the list of invisible characters]]). All selectors are Default_Ignorable_Code_Point; VS1 to VS16 and VS17 to VS256 are category `Mn` with bidi class NSM.

## Why they can carry bytes

The set is exactly 256 characters wide, which is one byte per selector. Paul Butler published the scheme on 2025-02-08: bytes 0 to 15 map to U+FE00 to U+FE0F, bytes 16 to 255 map to U+E0100 to U+E01EF, and the selectors are appended to a base character. The base does not have to be an emoji, any character works. He notes that variation selectors are supposed to be preserved during transformations, which is why the payload survives most copy-paste operations, and that the specification does not really address several selectors in a row, so renderers simply ignore them.

```js
const byteToVS = (b) => String.fromCodePoint(b < 16 ? 0xfe00 + b : 0xe0100 + (b - 16));
const vsToByte = (c) => {
  const cp = c.codePointAt(0);
  if (cp >= 0xfe00 && cp <= 0xfe0f) return cp - 0xfe00;
  if (cp >= 0xe0100 && cp <= 0xe01ef) return cp - 0xe0100 + 16;
  return -1;
};

const carried = "A" + [...new TextEncoder().encode("hi")].map(byteToVS).join("");
console.log(carried.length); // 5
console.log([...carried].map((c) => c.codePointAt(0).toString(16)).join(" ")); // 41 e0158 e0159
console.log(new TextDecoder().decode(Uint8Array.from([...carried].map(vsToByte).filter((b) => b >= 0)))); // hi
```

The walkthrough, with the emoji base and a full decoder, is in the pillar. A complete analyser that also recognises zero-width and tag payloads is in [[sec/unicode/unicode-steganography-decoder|the Unicode steganography decoder]]. The same family is read by language models too: Butler's addendum observes that tokenizers do seem to preserve the selectors as tokens, and Gao et al. (2025, arXiv 2510.05025) show that appending invisible variation selectors changes how a prompt is tokenized and can be used to jailbreak aligned models. The sibling Unicode block with the same invisibility and a different mapping is covered in [[sec/unicode/ascii-smuggling-unicode-tag-characters|ASCII smuggling with tag characters]].

## Finding abuse and keeping the legitimate selectors

A rule that does not break real text has to model what legitimate use looks like. A normal selector is alone, never repeated, and it follows a base that can take it: VS15 or VS16 after something with an emoji form, VS17 and up after an ideograph. Everything else is suspicious.

```js
const VS_RUN = /[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]+/gu;

function isLegit(run, before) {
  const [cp, ...rest] = [...run].map((c) => c.codePointAt(0));
  const prev = [...before].at(-1) ?? "";
  if (rest.length > 0) return false;
  if (cp === 0xfe0e || cp === 0xfe0f) return /\p{Emoji}/u.test(prev);
  if (cp >= 0xe0100) return /\p{Ideographic}/u.test(prev);
  return false;
}

const findVS = (s) =>
  [...s.matchAll(VS_RUN)].map((m) => ({
    index: m.index,
    length: [...m[0]].length,
    legit: isLegit(m[0], s.slice(0, m.index)),
  }));

const stripVS = (s) =>
  s.replace(VS_RUN, (run, off) => (isLegit(run, s.slice(0, off)) ? run : ""));

const honest = "I \u2764\uFE0F JS \u2764\uFE0E";
const smuggled = "\u{1F600}" + [...new TextEncoder().encode("hi")].map(byteToVS).join("");

findVS(honest);   // [ { index: 3, length: 1, legit: true }, { index: 9, length: 1, legit: true } ]
findVS(smuggled); // [ { index: 2, length: 2, legit: false } ]
stripVS(honest) === honest;     // true
[...stripVS(smuggled)].length;  // 1
```

`index` is in UTF-16 units, as usual in JavaScript. The Python twin counts code points and only flags the structural signals, because the standard library has no `Emoji` property:

```python
import re

VS_RUN = re.compile("[\uFE00-\uFE0F\U000e0100-\U000e01ef]+")

def find_vs(s):
    for m in VS_RUN.finditer(s):
        cps = [ord(c) for c in m.group()]
        yield m.start(), len(cps), len(cps) > 1 or cps[0] >= 0xE0100  # suspicious?

smuggled = "\U0001F600" + "".join(chr(0xE0100 + b - 16) for b in b"hi")
print(list(find_vs("I \u2764\uFE0F JS")))  # [(3, 1, False)]
print(list(find_vs(smuggled)))             # [(1, 2, True)]
```

Two things about the heuristic. A lone smuggled byte of value 14 or 15 after an emoji is U+FE0E or U+FE0F and indistinguishable from a presentation selector, so tiny payloads can hide in plausible text; the rule catches carriers, not every bit. And a blunt Default_Ignorable filter, like the one in [[sec/unicode/remove-zero-width-characters|the zero-width removal how-to]], removes U+FE0F as well, so every heart becomes the text-style glyph. Strip by context when emoji must survive.

## Sources

1. [Unicode chart: Variation Selectors, U+FE00 to U+FE0F](https://www.unicode.org/charts/PDF/UFE00.pdf): combining characters selecting a variant glyph, FE0E and FE0F names.
2. [Unicode chart: Variation Selectors Supplement, U+E0100 to U+E01EF](https://www.unicode.org/charts/PDF/UE0100.pdf): VS17 onwards and the reference to UTS #37.
3. [UTS #51, Unicode Emoji](https://www.unicode.org/reports/tr51/): ED-8 text presentation selector, ED-9 emoji presentation selector, valid sequences.
4. [Unicode PropList.txt](https://www.unicode.org/Public/UCD/latest/ucd/PropList.txt): the 260 code points of the Variation_Selector property.
5. [Paul Butler, "Smuggling arbitrary data through an emoji"](https://paulbutler.org/2025/smuggling-arbitrary-data-through-an-emoji/): byte-to-selector mapping, preservation in copy-paste, tokenizer observations.
6. [Gao et al., "Imperceptible Jailbreaking against Large Language Models"](https://arxiv.org/abs/2510.05025): invisible variation selectors change tokenization.
