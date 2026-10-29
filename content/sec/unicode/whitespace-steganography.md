---
title: "Whitespace Steganography: Hiding Data in Spaces"
date: 2026-10-29
description: "Whitespace steganography hides data in trailing spaces and tabs (SNOW) or in Unicode space characters. Encoder code plus how to detect and remove it."
tags:
  - sec
  - unicode
  - steganography
draft: true
---

> [!tldr]
> Whitespace steganography stores bits in characters nobody reads: spaces and tabs appended to the ends of lines (the SNOW program does this), or Unicode space characters such as U+2009 THIN SPACE swapped in for the ordinary U+0020. Both survive casual viewing, both are easy to find with a trailing-whitespace check or a scan for non-ASCII spaces, and NFKC normalization wipes the Unicode variant.

Zero-width characters are the famous invisible channel, covered in [[sec/unicode/zero-width-steganography|zero-width steganography]]. Whitespace is the older and humbler one. In its classic form it needs no special code points at all, and the Unicode variant uses characters that are not "ignorable" in the technical sense, because they are white space. The wider family is mapped in the [[sec/unicode/index|Unicode steganography and spoofing techniques]] overview.

## Trailing spaces and tabs: SNOW

SNOW, by Matthew Kwan, conceals messages in ASCII text by appending whitespace to the end of lines. The name stands for "Steganographic Nature Of Whitespace". It optionally encrypts the message with the ICE algorithm, and it has been released under Apache 2.0 since 16 June 2013. The idea rests on one observation, that spaces and tabs at line ends are generally not visible in text viewers.

The same idea fits in a dozen lines. Each cover line carries one byte as eight trailing characters, a space for 0 and a tab for 1:

```js
const hideInLines = (secret, lines) => {
  const bytes = [...new TextEncoder().encode(secret)];
  if (bytes.length > lines.length) throw new RangeError("not enough cover lines");
  return lines.map((line, i) =>
    i < bytes.length
      ? line + [...bytes[i].toString(2).padStart(8, "0")].map((b) => (b === "0" ? " " : "\t")).join("")
      : line);
};

const readLines = (lines) => {
  const bytes = [];
  for (const line of lines) {
    const tail = /[ \t]{8}$/.exec(line)?.[0];
    if (!tail) break;
    bytes.push(parseInt([...tail].map((c) => (c === " " ? "0" : "1")).join(""), 2));
  }
  return new TextDecoder().decode(Uint8Array.from(bytes));
};

const cover = ["const a = 1;", "const b = 2;", "const c = 3;", "export { a, b, c };"];
const out = hideInLines("hi", cover);
console.log(JSON.stringify(out[0])); // "const a = 1; \t\t \t   "
console.log(readLines(out));         // hi
console.log(out.map((l, i) => /[ \t]+$/.test(l) ? i + 1 : null).filter(Boolean)); // [ 1, 2 ]
```

The last line is the detector: the lines that end in whitespace are the ones that carry data. Capacity is one byte per line, no more. It suits source code and plain text, where nobody reads line ends, and fails anywhere an editor trims on save.

## Unicode spaces as carriers

Unicode has plenty of characters that look like a space and are not U+0020. The category `Zs` (space separator) holds U+0020, U+00A0, U+1680, U+2000 to U+200A, U+202F, U+205F and U+3000. Choosing between U+0020 and U+2009 THIN SPACE at every word gap gives one bit per gap:

```js
const THIN = "\u2009"; // THIN SPACE, category Zs

function hideInSpaces(secret, words) {
  const bits = [...new TextEncoder().encode(secret)].flatMap((b) => [...b.toString(2).padStart(8, "0")]);
  if (bits.length > words.length - 1) throw new RangeError("cover too short");
  return words.reduce((out, w, i) => {
    if (i === 0) return w;
    return out + (bits[i - 1] === "1" ? THIN : " ") + w;
  }, "");
}

function readSpaces(text) {
  const bits = [...text].filter((c) => c === " " || c === THIN).map((c) => (c === THIN ? "1" : "0")).join("");
  const bytes = (bits.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2));
  return new TextDecoder().decode(Uint8Array.from(bytes)).replace(/\0+$/, "");
}

const cover = "the quarterly figures are attached for your review and comments before the board meets again next week on schedule".split(" ");
const stego = hideInSpaces("Hi", cover);
console.log(readSpaces(stego));                                  // Hi
console.log([...stego.matchAll(/[\p{Zs}--[ ]]/gv)].length);       // 6
console.log(stego.normalize("NFKC") === cover.join(" "));        // true
console.log(readSpaces(stego.normalize("NFKC")) === "");         // true
```

The sentence has 17 gaps and the secret needs 16, so the capacity is one byte per eight word gaps. A thin space is narrower than an ordinary space, as its name says, which makes it a demo choice; an encoder that wants to hide would pick a pair that renders identically in the target font.

Two properties set this channel apart. The carriers are not Default_Ignorable_Code_Point (the derivation subtracts White_Space), so tools that strip "invisible" characters, like the filters in [[sec/unicode/remove-zero-width-characters|the zero-width removal how-to]], leave them in place. On the other side, NFKC folds nearly all of them to U+0020: in Node 24 every `Zs` code point except U+1680 OGHAM SPACE MARK normalizes to a plain space, as the last two lines of the example show. Normalizing with NFKC destroys the payload without anyone noticing.

This is the same "swap, don't add" principle as the substitution tables in [[sec/hiding-data-with-homoglyphs-exploiting-unicode-lookalikes|unicode lookalikes]], applied to the character least likely to be inspected.

## Detecting whitespace channels

Trailing whitespace is the easier case, because tooling already treats it as a defect:

```sh
git diff --check                       # trailing whitespace in changed lines
git grep -nIE '[[:blank:]]+$'          # the same, across tracked files
rg -n '[ \t]+$' .                      # ripgrep equivalent
```

`git diff --check` flagged both trailing lines of a scratch file in my test (`ws.txt:1: trailing whitespace.`). A repository that runs it in CI, or any formatter that trims on save, removes a SNOW payload before it spreads. For the Unicode spaces, list every `Zs` character that is not a plain space, with its name:

```python
import re, sys, unicodedata

def audit(path):
    with open(path, encoding="utf-8") as fh:
        for n, line in enumerate(fh, 1):
            body = line.rstrip("\n")
            if re.search(r"[ \t]+$", body):
                print(f"{path}:{n}: trailing whitespace ({len(body) - len(body.rstrip(' \t'))} chars)")
            odd = {c for c in body if unicodedata.category(c) == "Zs" and c != " "}
            for c in sorted(odd):
                print(f"{path}:{n}: U+{ord(c):04X} {unicodedata.name(c)}")

# on a file with the first line from the SNOW demo and a second line with U+2009 and U+00A0:
# sample.txt:1: trailing whitespace (8 chars)
# sample.txt:2: U+00A0 NO-BREAK SPACE
# sample.txt:2: U+2009 THIN SPACE
```

For a one-line shell check, `perl -CSD -ne 'print "$ARGV:$.\n" if /(?! )\p{Zs}/' file` lists lines that contain a space separator other than U+0020. Non-breaking spaces from word processors will hit it as well. That is expected noise, and for prose you intend to publish, normalizing with NFKC before comparing or storing is the simplest fix. Any real defence depends on the context: for code, trim and lint; for prose, normalize; for documents that must stay byte-exact, alert on any new `Zs` or trailing whitespace in a diff.

None of these channels survives retyping, which is the weakness that [[sec/unicode/zero-width-watermark-canary-trap|canary traps]] have to design around, and the characters themselves are catalogued in [[sec/unicode/invisible-unicode-characters|the invisible characters list]].

## Sources

1. [Matthew Kwan, "The SNOW Home Page"](https://www.darkside.com.au/snow/): appending whitespace to line ends, the name, ICE encryption, Apache 2.0 since 2013-06-16.
2. [Unicode DerivedCoreProperties.txt](https://www.unicode.org/Public/UCD/latest/ucd/DerivedCoreProperties.txt): Default_Ignorable_Code_Point is derived minus White_Space.
3. [UAX #15, Unicode Normalization Forms](https://www.unicode.org/reports/tr15/): NFKC folds compatibility-equivalent characters.
4. [Majeed et al., "A Review on Text Steganography Techniques"](https://doi.org/10.3390/math9212829): Mathematics 9(21), 2021, survey of text carriers.
