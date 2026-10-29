---
title: "Punycode Explained: xn-- Domains and Decoding"
date: 2026-10-29
description: "Punycode turns Unicode domain labels into xn-- ASCII. Convert both ways in Node and Python, see where IDNA versions disagree and where lookalikes hide."
tags:
  - sec
  - unicode
---

> [!tldr]
> Punycode (RFC 3492) is the ASCII encoding behind internationalized domain names: the label `bücher` becomes `xn--bcher-kva`. In Node, `domainToASCII` and `domainToUnicode` convert both ways. Python's built-in `idna` codec implements the superseded 2003 standard and returns a different host than Node for some inputs, `faß.de` among them, so use one converter per system and compare the ASCII form.

DNS carries ASCII. To put a name like `bücher.example` into it, software encodes every non-ASCII label into an ASCII label that starts with `xn--`. That is why a spoofed domain from an [[sec/unicode/idn-homograph-attack|IDN homograph attack]] shows up in logs and DNS tools as a string of Latin letters and digits, and why `xn--80ak6aa92e.com` means nothing until you decode it. The decoded form of that one is the Cyrillic-only `аррӏе.com`. Related notes sit in [[sec/unicode/index|the Unicode security hub]].

## What is an xn-- label?

RFC 3492 specifies Punycode as a Bootstring encoding of Unicode for use with IDNA. RFC 5890 defines the surrounding vocabulary: the Unicode form of a label is a U-label, the ASCII form is an A-label, and an A-label is the `xn--` prefix plus the Punycode of the label. The encoding copies the ASCII characters first, adds a hyphen, and then appends a compact code for where the other characters go and what they are.

`bücher` becomes `bcher-kva`: `bcher` is the ASCII letters, and `kva` encodes the position and value of `ü`. A label with no ASCII characters has nothing to copy and no hyphen, which is why `аррӏе` becomes plain `80ak6aa92e`. That visible ASCII half is useful for defenders. In `xn--pple-43d.com`, the readable `pple` followed by a short suffix already says that one character of `apple` was replaced.

## Convert in Node

`node:url` exports both directions, and the URL parser applies the same conversion to every host it reads. Node 24, no dependencies:

```javascript
import { domainToASCII, domainToUnicode } from "node:url";

console.log(domainToASCII("bücher.example"));
// xn--bcher-kva.example
console.log(domainToUnicode("xn--bcher-kva.example"));
// bücher.example
console.log(domainToASCII("\u{0430}\u{0440}\u{0440}\u{04cf}\u{0435}.com"));
// xn--80ak6aa92e.com
console.log(new URL("https://m\u{00fc}nchen.example/path").hostname);
// xn--mnchen-3ya.example
console.log(domainToASCII("fa\u{00df}.de"));
// xn--fa-hia.de
console.log(domainToASCII("ex\u{200b}ample.com"), domainToASCII("\u{ff45}\u{ff58}\u{ff41}\u{ff4d}\u{ff50}\u{ff4c}\u{ff45}.com"));
// example.com example.com
```

A zero-width space inside a name and a fullwidth spelling of the same name both come out as plain `example.com`. Any check that looked at the raw string before conversion saw something different from what the resolver will use, which is the class of bug described in [[sec/unicode/unicode-normalization-security|Unicode normalization security]].

Node also ships a `punycode` module, but requiring it prints a deprecation warning (`DEP0040`, which recommends a userland alternative). If you need the raw encoder, [punycode.js](https://github.com/mathiasbynens/punycode.js) is that alternative; for domain handling, `domainToASCII` is the better entry point.

## Convert in Python

The standard library has two codecs. `punycode` is the raw RFC 3492 transform on one label, and `idna` handles whole domain names, prefix included:

```python
print("bücher".encode("punycode"))
# b'bcher-kva'
print("bücher.example".encode("idna"))
# b'xn--bcher-kva.example'
print(b"xn--80ak6aa92e.com".decode("idna"))
# аррӏе.com
print(b"bcher-kva".decode("punycode"))
# bücher
print("fa\U000000df.de".encode("idna"))
# b'fass.de'
```

The last line differs from Node's `xn--fa-hia.de`. The Python documentation states that the `idna` codec implements RFC 3490, which is IDNA 2003, and points to the third-party `idna` package for IDNA 2008 (RFC 5891). RFC 5891 obsoletes RFC 3490. So the two runtimes disagree about which host the string `faß.de` is, and a validator written in one language can approve a name that a client written in the other resolves differently. Pick one converter for the whole pipeline, convert once at the boundary, and compare A-labels, not display strings.

## Where lookalike domains hide

After URL parsing, the hostname you store is the A-label. Logs, proxy records and DNS data carry `xn--` strings, and nobody reads those as brand names. A small filter turns them back into text and reports the script of each non-ASCII label. Save it as `scan.mjs`:

```javascript
import { createInterface } from "node:readline";
import { domainToUnicode } from "node:url";

const SCRIPTS = ["Latin", "Cyrillic", "Greek", "Han", "Hiragana", "Katakana", "Hangul", "Arabic", "Hebrew"];
const scriptsOf = (s) => SCRIPTS.filter((n) => new RegExp(`\\p{Script=${n}}`, "u").test(s));

for await (const line of createInterface({ input: process.stdin })) {
  const host = line.trim().toLowerCase();
  if (!host.split(".").some((label) => label.startsWith("xn--"))) continue;
  const unicode = domainToUnicode(host);
  const labels = unicode.split(".").filter((label) => /[^\x00-\x7f]/.test(label));
  const report = labels.map((label) => `${label}=${scriptsOf(label).join("+")}`);
  console.log(`${host} -> ${unicode} [${report.join(", ")}]`);
}
```

```bash
printf 'www.example.com\nxn--80ak6aa92e.com\nxn--pple-43d.com\nxn--bcher-kva.example\nxn--s7y.co\n' | node scan.mjs
# xn--80ak6aa92e.com -> аррӏе.com [аррӏе=Cyrillic]
# xn--pple-43d.com -> аpple.com [аpple=Latin+Cyrillic]
# xn--bcher-kva.example -> bücher.example [bücher=Latin]
# xn--s7y.co -> 短.co [短=Han]
```

Ordinary hosts are skipped. Every IDN is decoded, and a label that mixes Latin with Cyrillic or Greek stands out immediately. The `аррӏе` line is the harder one: it is single-script, so only a comparison with a protected name, using the skeleton function from [[sec/unicode/unicode-confusables-skeleton|the UTS #39 skeleton implementation]], shows what it imitates.

## Sources

1. [RFC 3492, Punycode: A Bootstring encoding of Unicode for IDNA](https://www.rfc-editor.org/rfc/rfc3492.txt) - the encoding.
2. [RFC 5890, IDNA: Definitions and Document Framework](https://www.rfc-editor.org/rfc/rfc5890.txt) - A-label, U-label and the `xn--` prefix.
3. [RFC 5891, IDNA: Protocol](https://www.rfc-editor.org/rfc/rfc5891.txt) - IDNA 2008, which obsoletes RFC 3490.
4. [Python documentation, codecs and encodings.idna](https://docs.python.org/3/library/codecs.html) - the `idna` codec implements RFC 3490; the third-party `idna` package covers IDNA 2008.
5. [Xudong Zheng, "Phishing with Unicode Domains"](https://www.xudongz.com/blog/2017/idn-phishing/) - the `xn--pple-43d.com` and `xn--80ak6aa92e.com` examples.
6. [mathiasbynens/punycode.js](https://github.com/mathiasbynens/punycode.js) - userland Punycode for JavaScript, MIT, v2.3.1, active as of 2026-10-29.
