---
title: "Unicode Normalization Security: NFKC Pitfalls"
date: 2026-10-29
description: "Unicode normalization security: what NFC, NFD, NFKC and NFKD change, the validate-before-normalize bypass, and why NFKC leaves Cyrillic lookalikes alone."
tags:
  - sec
  - unicode
draft: true
---

> [!tldr]
> NFC and NFD only rearrange canonically equivalent sequences. NFKC and NFKD also fold compatibility variants such as fullwidth letters, ligatures and superscripts. A filter that checks the raw string and normalizes afterwards can be bypassed, so normalize first and validate second. NFKC does not map Cyrillic а (U+0430) to Latin a: cross-script lookalikes need the confusables data.

Normalization is the standard advice for Unicode input, and half of it is right. It makes `é` typed as one character and `é` typed as `e` plus a combining accent compare as equal. It does not make a lookalike from another script equal to the Latin letter, although it sometimes appears in lists of homoglyph defenses, the one in the [[sec/hiding-data-with-homoglyphs-exploiting-unicode-lookalikes|homoglyph reference note]] included. The skeleton that does catch lookalikes is built step by step in [[sec/unicode/unicode-confusables-skeleton|Unicode confusables and the UTS #39 skeleton]], and the rest of the series is indexed in [[sec/unicode/index|the Unicode security hub]].

## The four forms

UAX #15 defines them (Revision 58 for Unicode 18.0.0). NFD is canonical decomposition. NFC is canonical decomposition followed by canonical composition. NFKD is compatibility decomposition. NFKC is compatibility decomposition followed by canonical composition. The compatibility forms also fold the differences between compatibility-equivalent characters, which the standard illustrates with halfwidth and fullwidth katakana and Roman numerals. The same applies to other families:

```javascript
const samples = {
  "e + acute (U+0065 U+0301)": "e\u{0301}",
  "ligature fi (U+FB01)": "\u{FB01}",
  "superscript two (U+00B2)": "\u{00B2}",
  "fullwidth A (U+FF21)": "\u{FF21}",
  "Kelvin sign (U+212A)": "\u{212A}",
  "roman numeral four (U+2163)": "\u{2163}",
  "Cyrillic a (U+0430)": "\u{0430}",
  "Greek omicron (U+03BF)": "\u{03BF}",
};
const show = (s) => [...s].map((c) => "U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")).join(" ");
for (const [label, s] of Object.entries(samples)) {
  const row = ["NFC", "NFD", "NFKC", "NFKD"].map((f) => show(s.normalize(f)));
  console.log(label.padEnd(30), row.join(" | "));
}
// e + acute (U+0065 U+0301)      U+00E9 | U+0065 U+0301 | U+00E9 | U+0065 U+0301
// ligature fi (U+FB01)           U+FB01 | U+FB01 | U+0066 U+0069 | U+0066 U+0069
// superscript two (U+00B2)       U+00B2 | U+00B2 | U+0032 | U+0032
// fullwidth A (U+FF21)           U+FF21 | U+FF21 | U+0041 | U+0041
// Kelvin sign (U+212A)           U+004B | U+004B | U+004B | U+004B
// roman numeral four (U+2163)    U+2163 | U+2163 | U+0049 U+0056 | U+0049 U+0056
// Cyrillic a (U+0430)            U+0430 | U+0430 | U+0430 | U+0430
// Greek omicron (U+03BF)         U+03BF | U+03BF | U+03BF | U+03BF
```

NFC and NFD swap the two spellings of `é`. Only the K forms turn the ligature, the superscript, the fullwidth letter and the Roman numeral into plain ASCII. The Kelvin sign is the odd one: it is canonically equivalent to Latin `K`, so even NFC folds it. The last two rows do not move in any form.

## The bypass: validate before you normalize

If a check and a later step disagree on what a string is, the attacker chooses the string that passes the check and becomes something else afterwards. The standard shape is a blocklist applied to raw input followed by normalization on storage:

```javascript
const blocked = ["admin", "root"];
const isBlocked = (name) => blocked.some((w) => name.toLowerCase().includes(w));

function registerBroken(name) {
  if (isBlocked(name)) return "rejected";
  return "stored as " + name.normalize("NFKC");
}

function registerFixed(name) {
  const canonical = name.normalize("NFKC");
  if (isBlocked(canonical)) return "rejected";
  return "stored as " + canonical;
}

const attempt = "\u{FF41}\u{FF44}\u{FF4D}\u{FF49}\u{FF4E}";
console.log(registerBroken("admin"), "|", registerBroken(attempt));
// rejected | stored as admin
console.log(registerFixed("admin"), "|", registerFixed(attempt));
// rejected | rejected

const tag = "\u{FF1C}script\u{FF1E}";
console.log(tag.includes("<"), tag.normalize("NFKC"), tag.normalize("NFKC").includes("<"));
// false <script> true
```

`attempt` is `admin` spelled in fullwidth letters. The broken version never sees the word it blocks, and then writes it to the database. The last lines show the same mechanism with markup: a fullwidth `<` and `>` contain no angle brackets until NFKC creates them, so an HTML sanitizer that runs before a later normalization step checks a different string than the one that ends up rendered.

The fix is an ordering rule. Normalize once, at the trust boundary, then validate and store only the normalized form. The rule covers places people forget: usernames, email local parts, file names, URL paths, search queries and cache keys. Domain names get their own mapping step before Punycode, covered in [[sec/unicode/punycode|the Punycode note]], where a zero-width space simply disappears.

Programming languages do it too. Python normalizes identifiers with NFKC, which PEP 672 documents, and does not normalize strings you pass to `getattr`:

```python
import unicodedata

ns = {}
exec("\U0000FB01nalize = 1", ns)
print("finalize" in ns, "\U0000FB01nalize" in ns)
# True False
print(unicodedata.normalize("NFKC", "\U0000FB01nalize") in ns)
# True
```

The source passed to `exec` starts with the ligature U+FB01, the namespace ends up holding the key `finalize`, and a lookup by the original spelling fails. Code that resolves attribute or variable names from user input needs the same normalize-first rule.

## Does NFKC fold Cyrillic lookalikes?

The claim "NFKC maps Cyrillic а to Latin a" is false. In `UnicodeData.txt` the decomposition field of U+0430 is empty, so no normalization form has anything to do:

```python
import unicodedata

for label, ch in [("Cyrillic a", "\U00000430"), ("Greek omicron", "\U000003bf"), ("Cyrillic er", "\U00000440")]:
    print(label, repr(unicodedata.decomposition(ch)), unicodedata.normalize("NFKC", ch) == ch)
# Cyrillic a '' True
# Greek omicron '' True
# Cyrillic er '' True
```

The mapping from `а` to `a` lives in the confusables data, as the line `0430 ; 0061`, and not in the normalization data. NFKC folds compatibility variants of the same character. A lookalike from another script is a different character, and that is outside its remit. So the working pipeline has three layers, each doing one job. Normalize with NFC or NFKC at the boundary. Check the scripts of the result, as in [[sec/unicode/detect-homoglyphs-python-javascript|detecting homoglyphs in Python and JavaScript]]. Compare skeletons wherever a new identifier must not look like an existing one. Stacks of combining marks are a separate problem, covered in [[sec/unicode/zalgo-text-combining-characters|the Zalgo text note]].

## Sources

1. [Unicode Standard Annex #15, Unicode Normalization Forms](https://www.unicode.org/reports/tr15/) - definitions of the four forms (Revision 58) and what the compatibility forms fold.
2. [UnicodeData.txt](https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt) - the empty decomposition field of U+0430.
3. [confusables.txt, version 18.0.0](https://www.unicode.org/Public/security/latest/confusables.txt) - the `0430 ; 0061` mapping from Cyrillic а to Latin a.
4. [PEP 672, Unicode-related Security Considerations for Python](https://peps.python.org/pep-0672/) - NFKC normalization of Python identifiers and the `getattr` gap.
