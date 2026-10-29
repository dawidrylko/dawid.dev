---
title: "Homoglyph Generator in JavaScript and Python"
date: 2026-10-29
description: "Homoglyph generator code: swap Latin letters for Cyrillic or Greek lookalikes at a chosen density in JavaScript or Python, then catch the output."
tags:
  - sec
  - unicode
---

> [!tldr]
> A homoglyph generator is a lookup table and a loop: one function, in JavaScript and Python, swaps Latin letters for Cyrillic or Greek lookalikes at a chosen density. NFKC does not undo any of the swaps. A mixed-script check catches most of the output, and a UTS #39 skeleton comparison catches the rest.

The code produces test strings for username filters, domain checks and review tooling. The pairs come from the reference table in the [[sec/hiding-data-with-homoglyphs-exploiting-unicode-lookalikes|unicode lookalikes table]], and the detection side lives in [[sec/unicode/detect-homoglyphs-python-javascript|detecting homoglyphs in Python and JavaScript]]. If the term is new, [[sec/unicode/what-is-a-homoglyph|what a homoglyph is]] fixes the vocabulary. Lookalikes are one of the six data carriers compared in [[sec/unicode/index|the Unicode steganography techniques table]].

## The generator in JavaScript

Save it as `homoglyph.mjs`. It runs on Node 24 with no dependencies and works both as a module and as a command.

```javascript
import { parseArgs } from "node:util";

const SWAPS = {
  cyrillic: {
    a: 0x0430, c: 0x0441, e: 0x0435, i: 0x0456, j: 0x0458, o: 0x043e,
    p: 0x0440, s: 0x0455, x: 0x0445, y: 0x0443,
    A: 0x0410, B: 0x0412, C: 0x0421, E: 0x0415, H: 0x041d, K: 0x041a,
    M: 0x041c, O: 0x041e, P: 0x0420, T: 0x0422, X: 0x0425,
  },
  greek: {
    o: 0x03bf, p: 0x03c1, v: 0x03bd,
    A: 0x0391, B: 0x0392, E: 0x0395, H: 0x0397, I: 0x0399, K: 0x039a,
    M: 0x039c, N: 0x039d, O: 0x039f, P: 0x03a1, T: 0x03a4, X: 0x03a7,
    Y: 0x03a5, Z: 0x0396,
  },
};

export function homoglyphs(text, { script = "cyrillic", density = 0.5 } = {}) {
  const table = SWAPS[script];
  if (!table) throw new Error(`unknown script: ${script}`);
  let seen = 0;
  return Array.from(text, (ch) => {
    if (!(ch in table)) return ch;
    seen += 1;
    const swap = Math.floor(seen * density) > Math.floor((seen - 1) * density);
    return swap ? String.fromCodePoint(table[ch]) : ch;
  }).join("");
}

if (import.meta.main) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      script: { type: "string", default: "cyrillic" },
      density: { type: "string", default: "0.5" },
    },
  });
  const out = homoglyphs(positionals.join(" "), {
    script: values.script,
    density: Number(values.density),
  });
  console.log(out);
  console.log([...out].map((c) => c.codePointAt(0).toString(16)).join(" "));
}
```

```bash
node homoglyph.mjs --script cyrillic --density 1 "scope paypal"
# ѕсоре раураl
# 455 441 43e 440 435 20 440 430 443 440 430 6c

node homoglyph.mjs "payload apple"
# pаylоad аpрle
# 70 430 79 6c 43e 61 64 20 430 70 440 6c 65

node homoglyph.mjs --script greek --density 1 "Kopex TOP"
# Κορex ΤΟΡ
# 39a 3bf 3c1 65 78 20 3a4 39f 3a1
```

The second line of each result is the code point list in hex. Entries such as `430` or `3bf` are the swapped letters, and in most fonts they look like the `61` and `6f` they replaced.

## Density and script

Density is the share of swappable characters that actually get replaced. The function counts the swappable characters it meets and swaps the n-th one whenever `floor(n * density)` goes up, so `0.5` swaps every second candidate and `1` swaps all of them. There is no randomness. The same input gives the same output every time, which keeps test fixtures stable and makes the JavaScript and Python versions agree character for character.

Cyrillic has 21 entries, 10 lowercase and 11 uppercase, and covers enough lowercase letters to rewrite whole words. Greek has 17, only three of them lowercase (`ο`, `ρ`, `ν`), so a lowercase word stays mixed-script and is easier to catch. Every pair was checked against `confusables.txt` 18.0.0: the skeleton of each swapped letter equals the skeleton of the Latin one. Greek chi is missing on purpose. The data does not map `χ` (U+03C7) to `x`, so a skeleton comparison would not equate them, even though lookalike tables often list the pair.

## The same generator in Python

Save it as `homoglyph.py`. Standard library only.

```python
import argparse

SWAPS = {
    "cyrillic": {
        "a": 0x0430, "c": 0x0441, "e": 0x0435, "i": 0x0456, "j": 0x0458, "o": 0x043E,
        "p": 0x0440, "s": 0x0455, "x": 0x0445, "y": 0x0443,
        "A": 0x0410, "B": 0x0412, "C": 0x0421, "E": 0x0415, "H": 0x041D, "K": 0x041A,
        "M": 0x041C, "O": 0x041E, "P": 0x0420, "T": 0x0422, "X": 0x0425,
    },
    "greek": {
        "o": 0x03BF, "p": 0x03C1, "v": 0x03BD,
        "A": 0x0391, "B": 0x0392, "E": 0x0395, "H": 0x0397, "I": 0x0399, "K": 0x039A,
        "M": 0x039C, "N": 0x039D, "O": 0x039F, "P": 0x03A1, "T": 0x03A4, "X": 0x03A7,
        "Y": 0x03A5, "Z": 0x0396,
    },
}


def homoglyphs(text, script="cyrillic", density=0.5):
    table = SWAPS[script]
    out, seen = [], 0
    for ch in text:
        if ch not in table:
            out.append(ch)
            continue
        seen += 1
        swap = int(seen * density) > int((seen - 1) * density)
        out.append(chr(table[ch]) if swap else ch)
    return "".join(out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("text", nargs="+")
    ap.add_argument("--script", choices=SWAPS, default="cyrillic")
    ap.add_argument("--density", type=float, default=0.5)
    args = ap.parse_args()
    out = homoglyphs(" ".join(args.text), args.script, args.density)
    print(out)
    print(" ".join(f"{ord(c):x}" for c in out))
```

```bash
python3 homoglyph.py --script cyrillic --density 1 "scope paypal"
# ѕсоре раураl
# 455 441 43e 440 435 20 440 430 443 440 430 6c
```

## Normalization does not undo the swaps

Normalizing input with NFKC is the first defense people reach for, and it does nothing here. NFKC folds compatibility variants such as fullwidth letters and ligatures. A Cyrillic `а` is its own character with no decomposition, so NFKC leaves it exactly as it is. This check runs over every entry in the table:

```python
import unicodedata
from homoglyph import SWAPS

print(all(
    unicodedata.normalize("NFKC", chr(cp)) == chr(cp)
    for table in SWAPS.values()
    for cp in table.values()
))
# True
```

The mechanics, and the cases where NFKC does fold something dangerous, are in [[sec/unicode/unicode-normalization-security|Unicode normalization security]].

## Catching the output

Most generator output is mixed-script. A regex per script finds it in one line:

```javascript
import { homoglyphs } from "./homoglyph.mjs";

const scriptsOf = (s) =>
  ["Latin", "Cyrillic", "Greek"].filter((n) => new RegExp(`\\p{Script=${n}}`, "u").test(s));

console.log(scriptsOf(homoglyphs("payload apple", { density: 0.5 })));
// [ 'Latin', 'Cyrillic' ]
console.log(scriptsOf(homoglyphs("scope", { density: 1 })));
// [ 'Cyrillic' ]
```

The second call is the gap. When every letter of a word has a Cyrillic twin, the result is single-script and a mixed-script check passes it. UTS #39 calls this a whole-script confusable. The check that catches it compares skeletons, as built in [[sec/unicode/unicode-confusables-skeleton|the confusables skeleton note]]. Save that code as `skeleton.py`, download `confusables.txt` and `DerivedCoreProperties.txt` next to it, and run:

```python
from homoglyph import homoglyphs
from skeleton import load_confusables, load_ignorable, skeleton

_, table = load_confusables()
ignorable = load_ignorable()

spoof = homoglyphs("scope", "cyrillic", 1)
print(spoof, skeleton(spoof, table, ignorable) == skeleton("scope", table, ignorable))
# ѕсоре True
```

Feed the generator's output into your signup form, your allow-list comparison and your code-review tooling. If any of them accepts it, that component compares bytes, and the lookalike is a working impersonation.

## Sources

1. [Unicode Technical Standard #39, Unicode Security Mechanisms](https://www.unicode.org/reports/tr39/) - skeleton definition, mixed-script and whole-script confusables.
2. [confusables.txt, version 18.0.0](https://www.unicode.org/Public/security/latest/confusables.txt) - the data each swap was checked against.
3. [Unicode Standard Annex #15, Normalization Forms](https://www.unicode.org/reports/tr15/) - what NFKC folds.
