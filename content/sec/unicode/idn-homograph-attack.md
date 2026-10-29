---
title: "IDN Homograph Attack: How It Works and Defenses"
date: 2026-10-29
description: "IDN homograph attack explained: how Cyrillic lookalike domains work, what Chrome and Firefox show, and the script and skeleton checks that catch them."
tags:
  - sec
  - unicode
---

> [!tldr]
> An IDN homograph attack registers a domain whose Unicode label looks like a trusted one. The all-Cyrillic аррӏе.com, which encodes to xn--80ak6aa92e.com, is the standard demonstration. Browsers decide per label whether to show Unicode or Punycode, and a label made only of Cyrillic lookalikes got past the 2017 mixed-script rule. Defend with a script check, a skeleton comparison against a protected list, and active monitoring with dnstwist.

Domain names were ASCII-only until internationalized domain names (IDNs) let a label contain any script. Each Unicode label travels through DNS as an ASCII form starting with `xn--`, the encoding explained in [[sec/unicode/punycode|the Punycode note]]. The weak point is the display side: if a registry accepts a label of Cyrillic letters, a person reading the address bar sees Latin-looking text. The character pairs behind it are listed in the [[sec/hiding-data-with-homoglyphs-exploiting-unicode-lookalikes|homoglyph reference table]], and the same pairs hide data in ordinary text, as [[sec/unicode/index|the Unicode steganography and spoofing guide]] shows.

## How does an IDN homograph attack work?

IDNA (RFC 5890) calls the Unicode form of a label a U-label and its ASCII form an A-label, marked by the `xn--` prefix. The A-label is produced by Punycode (RFC 3492). Two examples show the two kinds of lookalike:

- `аpple.com` with a Cyrillic `а` (U+0430) and Latin `pple` is **mixed-script**. Its A-label is `xn--pple-43d.com`.
- `аррӏе.com` is **whole-script**: Cyrillic `а`, `р`, `р`, `ӏ` (palochka) and `е`, no Latin letter at all. Its A-label is `xn--80ak6aa92e.com`.

Mixed-script labels are easy to refuse, because ordinary words rarely mix Latin and Cyrillic. Whole-script labels are the hard case. Every letter belongs to one script, so nothing mixes, and the label only happens to be drawn like a word in another.

## From 2002 to the 2017 demo

Gabrilovich and Gontmakher published "The homograph attack" in Communications of the ACM in February 2002 (volume 45, issue 2, page 128). Fifteen years later, on April 14, 2017, Xudong Zheng posted "Phishing with Unicode Domains". He had bought `xn--80ak6aa92e.com`, which renders as `аррӏе.com`, and showed that Chrome, Firefox and Opera displayed it in Unicode, because their filters looked for mixed scripts and found only Cyrillic. Safari was not affected. He reported the problem to Chrome and Firefox on January 20, 2017, and the Chrome fix landed in trunk on March 24.

His post gives two versions for that fix. The introduction says it was fixed as of Chrome 59, and the body says the fix is included in Chrome 58, which was rolling out at the time. Date the fix by the trunk commit, not by a version number. Firefox did not treat it as a browser bug. Mozilla's position, as quoted in the post, is that whole-script lookalikes are for domain registries to prevent. Zheng's interim advice for Firefox users was to set `network.IDN_show_punycode` to `true` in `about:config`.

## Chromium and Firefox display policy

Chromium documents its policy in `docs/idn.md` in the source tree. It decides per label, and since Chrome 51 it ignores the browser's language settings. A label is shown as Unicode only if it passes a chain of checks, among them:

- UTS #46 conversion without errors, and every character allowed in identifiers per UTS #39.
- A script-mixing rule based on UTS #39 "Highly Restrictive", with an extra restriction: Latin, Cyrillic and Greek can never be mixed with each other.
- A mixed-script confusable check and a whole-script confusable check. The documented example is `аррӏе.com`: a label made only of Cyrillic letters that look Latin, under a TLD that is not Cyrillic, is shown as Punycode.
- A skeleton comparison of the registrable domain against a list of top domains.

Firefox's documented algorithm, on a page last edited in April 2017, keeps a whitelist of TLDs and otherwise applies a UTS #39 "Moderately Restrictive" profile with extra rules for mixed numbering systems and repeated marks. The page lists whole-script confusables as a known downside, left to registries. It records the reasoning of 2017 and may not match current Firefox behavior. Chromium's documentation adds that password managers help, because they refuse to fill a password into a domain that is not exactly the one saved.

## Defensive checks for your own code

Browsers protect their address bar, not your admin panel, your mail gateway or the log viewer in which an analyst reads a domain. Two checks cover the gap. The first converts to the ASCII form, splits the labels and looks at scripts. Save it as `inspect.mjs`; the `import.meta.main` check needs Node 24.2 or newer:

```javascript
import { domainToASCII, domainToUnicode } from "node:url";

const SCRIPTS = ["Latin", "Cyrillic", "Greek", "Han", "Hiragana", "Katakana", "Hangul", "Arabic", "Hebrew"];
const scriptsOf = (s) => SCRIPTS.filter((n) => new RegExp(`\\p{Script=${n}}`, "u").test(s));
// Cyrillic letters that look Latin: а с е і ј о р ѕ х у and palochka
const LATIN_LOOKING_CYRILLIC = new Set("\u{0430}\u{0441}\u{0435}\u{0456}\u{0458}\u{043e}\u{0440}\u{0455}\u{0445}\u{0443}\u{04cf}");

export function inspectHost(host) {
  const ascii = domainToASCII(host);
  if (!ascii) return { host, error: "not a valid domain" };
  const labels = domainToUnicode(ascii).split(".");
  const tldScripts = scriptsOf(labels.at(-1));
  const flags = [];
  for (const label of labels) {
    const scripts = scriptsOf(label);
    if (scripts.length > 1) flags.push(`mixed-script label ${label} (${scripts.join("+")})`);
    if (scripts.join() === "Cyrillic" && !tldScripts.includes("Cyrillic") && [...label].every((c) => LATIN_LOOKING_CYRILLIC.has(c))) {
      flags.push(`all-Cyrillic label ${label} made of Latin lookalikes under a non-Cyrillic TLD`);
    }
  }
  return { ascii, unicode: labels.join("."), flags };
}

if (import.meta.main) {
  const hosts = ["xn--80ak6aa92e.com", "xn--pple-43d.com", "xn--bcher-kva.example", "xn--80a1acny.ru", "example.com"];
  for (const host of hosts) {
    const { unicode, flags } = inspectHost(host);
    console.log(host, "->", unicode, "|", flags.join("; ") || "ok");
  }
}
// xn--80ak6aa92e.com -> аррӏе.com | all-Cyrillic label аррӏе made of Latin lookalikes under a non-Cyrillic TLD
// xn--pple-43d.com -> аpple.com | mixed-script label аpple (Latin+Cyrillic)
// xn--bcher-kva.example -> bücher.example | ok
// xn--80a1acny.ru -> почта.ru | ok
// example.com -> example.com | ok
```

This is a simplified version of the whole-script rule from the Chromium list. It leaves legitimate Russian-language `.com` domains alone, because the label must consist only of Latin-looking letters.

The second check answers the question the first one cannot: which brand does the label imitate? Compute the skeleton of each protected domain once, and compare every candidate with them. It uses `skeleton.py` from [[sec/unicode/unicode-confusables-skeleton|the confusables skeleton note]]:

```python
from skeleton import load_confusables, load_ignorable, skeleton

_, table = load_confusables()
ignorable = load_ignorable()
PROTECTED = ["apple.com", "example.com", "paypal.com"]
protected = {skeleton(d, table, ignorable).casefold(): d for d in PROTECTED}


def lookalike_of(ace_host):
    unicode_host = ace_host.rstrip(".").encode("ascii").decode("idna")
    folded = unicode_host.casefold()
    for candidate in (unicode_host, folded):
        hit = protected.get(skeleton(candidate, table, ignorable).casefold())
        if hit:
            return None if hit == folded else hit
    return None


hosts = [
    "xn--80ak6aa92e.com", "xn--pple-43d.com", "xn--bcher-kva.example", "example.com",
    "paypaI.com", "PayPaI.com", "PAYPAL.COM", "XN--80AK6AA92E.COM", "paypaI.com.",
]
for host in hosts:
    print(host, "->", lookalike_of(host))
# xn--80ak6aa92e.com -> apple.com
# xn--pple-43d.com -> apple.com
# xn--bcher-kva.example -> None
# example.com -> None
# paypaI.com -> paypal.com
# PayPaI.com -> paypal.com
# PAYPAL.COM -> None
# XN--80AK6AA92E.COM -> apple.com
# paypaI.com. -> paypal.com
```

`paypaI.com` is pure ASCII: a capital `I` standing in for the `l`. A script check never sees it, and the skeleton does. The skeleton is case-sensitive both ways, capital `I` maps to `l` and lowercase `m` maps to `rn`, so the function tries the host as written and lowercased, and the lookup key is case-folded. The trailing dot of a fully qualified name is stripped before decoding. The built-in `idna` codec implements IDNA 2003 (RFC 3490), so names with characters such as `ß` need the third-party `idna` package for IDNA 2008, and [[sec/unicode/punycode|the Punycode note]] shows where Node and Python disagree. That is why [[sec/unicode/detect-homoglyphs-python-javascript|script checks and skeleton comparison belong together]]. Test strings of this kind come from the [[sec/unicode/homoglyph-generator|homoglyph generator]].

## Active monitoring with dnstwist

Checking a domain you already know about is reactive. [dnstwist](https://github.com/elceef/dnstwist) works the other way round: it takes your domain, generates permutations including homoglyph and IDN variants, and resolves them to see which are registered. As of 2026-10-29 the repository is under Apache-2.0 with 5,768 stars; the last release is 20250130 (2025-01-30) and the last push 2025-04-15. Its README gives the commands that matter here:

```bash
pip install dnstwist[full]
dnstwist --registered example.com
dnstwist --fuzzers "homoglyph,hyphenation" example.com
```

The README notes that the homoglyph fuzzer is built on a researched range of characters so that generated domains can actually be registered, because many TLD authorities reject script mixing or restrict the allowed set. Run it on a schedule against your own domains, keep the registered results, and diff them from run to run. A new registered entry is the signal; the checks above then say what kind of lookalike it is.

## Sources

1. [Gabrilovich and Gontmakher, "The homograph attack", Communications of the ACM 45(2), p. 128, 2002](https://doi.org/10.1145/503124.503156) - the 2002 paper itself, by DOI.
2. [Xudong Zheng, "Phishing with Unicode Domains", 2017-04-14](https://www.xudongz.com/blog/2017/idn-phishing/) - the whole-script Cyrillic demo, the disclosure dates, both Chrome version statements and the Firefox position.
3. [Chromium: IDN in Google Chrome](https://chromium.googlesource.com/chromium/src/+/main/docs/idn.md) - the per-label display algorithm.
4. [Mozilla Wiki: IDN Display Algorithm](https://wiki.mozilla.org/IDN_Display_Algorithm) - Firefox's TLD whitelist and Moderately Restrictive profile, last edited April 2017.
5. [RFC 5890, IDNA: Definitions and Document Framework](https://www.rfc-editor.org/rfc/rfc5890.txt) - A-label, U-label and the `xn--` prefix.
6. [RFC 3492, Punycode](https://www.rfc-editor.org/rfc/rfc3492.txt) - the encoding behind A-labels.
7. [Unicode Technical Standard #39](https://www.unicode.org/reports/tr39/) - mixed-script and whole-script confusables, skeleton, restriction levels.
8. [elceef/dnstwist](https://github.com/elceef/dnstwist) - domain permutation engine and its README.
9. [Python documentation, codecs and encodings.idna](https://docs.python.org/3/library/codecs.html) - the `idna` codec implements RFC 3490, and the third-party `idna` module covers IDNA 2008.
