---
title: "Unicode Confusables and the UTS #39 Skeleton"
date: 2026-10-29
description: "Unicode confusables explained: the confusables.txt format, the UTS #39 skeleton algorithm in a short Python implementation, and where it stops working."
tags:
  - sec
  - unicode
draft: true
---

> [!tldr]
> `confusables.txt` (version 18.0.0) maps 6,712 characters to the characters they resemble. The UTS #39 skeleton of a string is NFD, drop default-ignorable characters, map each character through that file, NFD again, and two strings are confusable when their skeletons are equal. The Python below implements it in about 30 lines. A skeleton is a hash, not a verdict: it only tells you something when you have a second string to compare it with.

Every homoglyph defense that goes beyond "reject mixed scripts" ends up here. The data file is published by the Unicode Consortium, and the algorithm that uses it is Section 4 of UTS #39, the standard behind the Unicode confusables tool that the [[sec/hiding-data-with-homoglyphs-exploiting-unicode-lookalikes|homoglyph table]] names as its authoritative source. ICU's spoof checker, the IDN checks in Chromium and the libraries compared in [[sec/unicode/detect-homoglyphs-python-javascript|homoglyph detection in Python and JavaScript]] all build on this data. Other notes in the series are listed in [[sec/unicode/index|the Unicode security hub]].

## What confusables.txt contains

The file header reads `# Date: 2026-08-06, 01:05:35 GMT` and `# Version: 18.0.0`. After the header come 6,712 data lines, one per source character. Four of them:

```text
0430 ;	0061 ;	MA	# ( а → a ) CYRILLIC SMALL LETTER A → LATIN SMALL LETTER A	# 
03BF ;	006F ;	MA	# ( ο → o ) GREEK SMALL LETTER OMICRON → LATIN SMALL LETTER O	# 
0049 ;	006C ;	MA	# ( I → l ) LATIN CAPITAL LETTER I → LATIN SMALL LETTER L	# 
006D ;	0072 006E ;	MA	# ( m → rn ) LATIN SMALL LETTER M → LATIN SMALL LETTER R, LATIN SMALL LETTER N	# 
```

Field one is the source code point. Field two is the **prototype**: one or more code points the source maps to. Field three is obsolete and always `MA`, kept for backwards compatibility. Everything after the first `#` is a comment with the characters and their names. Prototypes are not "the Latin letter" a person would pick: capital `I` maps to lowercase `l`, and `m` maps to the two characters `rn`. The target is the representative the Consortium chose for the class.

## The algorithm

UTS #39 defines `internalSkeleton(X)` in four steps:

1. Convert X to NFD.
2. Remove every character with the property `Default_Ignorable_Code_Point`.
3. Replace each remaining character with its prototype from the data file.
4. Apply NFD again.

The current revision (Revision 34, Unicode 18.0.0) wraps this in `bidiSkeleton`, which first reorders the code points the way the bidirectional algorithm would display them, and defines the plain `skeleton(X)` as `bidiSkeleton` with left-to-right direction. For strings with no right-to-left characters or bidi controls the two reduce to the four steps above, and that is what the code implements.

## A minimal implementation in Python

Download the two data files next to the script. `confusables.txt` holds the mappings, and `DerivedCoreProperties.txt` holds the `Default_Ignorable_Code_Point` ranges, which the standard library does not expose.

```bash
curl -O https://www.unicode.org/Public/security/latest/confusables.txt
curl -O https://www.unicode.org/Public/UCD/latest/ucd/DerivedCoreProperties.txt
```

Save this as `skeleton.py`:

```python
import unicodedata


def load_confusables(path="confusables.txt"):
    table, version = {}, None
    with open(path, encoding="utf-8") as f:
        for line in f:
            if line.startswith("# Version:"):
                version = line.split(":", 1)[1].strip()
            data = line.split("#", 1)[0].strip()
            if not data:
                continue
            source, target, _ = (field.strip() for field in data.split(";"))
            table[chr(int(source, 16))] = "".join(chr(int(cp, 16)) for cp in target.split())
    return version, table


def load_ignorable(path="DerivedCoreProperties.txt"):
    ranges = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            data = line.split("#", 1)[0].strip()
            if data.endswith("; Default_Ignorable_Code_Point"):
                span = data.split(";")[0].strip()
                low, _, high = span.partition("..")
                ranges.append((int(low, 16), int(high or low, 16)))
    return ranges


def skeleton(text, table, ignorable):
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if not any(lo <= ord(c) <= hi for lo, hi in ignorable))
    text = "".join(table.get(c, c) for c in text)
    return unicodedata.normalize("NFD", text)
```

The ranges parsed from `DerivedCoreProperties.txt` add up to 4,174 code points, the total the file itself states for that property. Now compare some strings:

```python
import unicodedata
from skeleton import load_confusables, load_ignorable, skeleton

version, table = load_confusables()
ignorable = load_ignorable()
print(version, len(table), "mappings, Python unicodedata", unicodedata.unidata_version)
# 18.0.0 6712 mappings, Python unicodedata 16.0.0

pairs = [
    ("Cyrillic a, twice", "paypal", "p\U00000430yp\U00000430l"),
    ("capital I for l", "paypal", "paypaI"),
    ("all-Cyrillic scope", "scope", "\U00000455\U00000441\U0000043e\U00000440\U00000435"),
    ("zero-width space", "example", "exa\U0000200bmple"),
    ("m versus rn", "rn", "m"),
    ("zero for O", "google", "G00gle"),
]
for label, a, b in pairs:
    same = skeleton(a, table, ignorable) == skeleton(b, table, ignorable)
    print(f"{label:<20} equal={same}")
# Cyrillic a, twice    equal=True
# capital I for l      equal=True
# all-Cyrillic scope   equal=True
# zero-width space     equal=True
# m versus rn          equal=True
# zero for O           equal=False

print(skeleton("G00gle", table, ignorable))
# GOOgle
print(skeleton("G00gle", table, ignorable).casefold() == skeleton("google", table, ignorable).casefold())
# True
```

The third row is the case a mixed-script check cannot see: both strings are single-script, and the skeletons still match. The fourth shows step two at work, because the zero-width space is a default-ignorable character and disappears. The last row is the case sensitivity discussed below.

## Where the skeleton stops being enough

**It needs something to compare against.** A skeleton says two strings look alike, not that one is a spoof. For usernames, store the skeleton in a unique column and reject registrations whose skeleton already exists. For domains, compute the skeleton of a protected list once and test candidate hosts against it, as done in [[sec/unicode/idn-homograph-attack|the IDN homograph note]].

It is case-sensitive, and the mappings are not symmetric. The zero in `G00gle` maps to a capital `O`, so the skeleton `GOOgle` differs from `google` until case is folded. Fold both sides after the mapping, as above, and test the policy you choose in both directions.

**It is not stable and not for display.** UTS #39 states that skeletons are not intended for display and are not stable across Unicode versions. A stored skeleton has to be recomputed whenever the data version changes, and a database index built on one is no exception. The standard library lags too: Python 3.14 ships Unicode 16.0.0 tables, so steps one and four run on older normalization data than the 18.0.0 mappings.

It only knows what the data file knows. The standard itself notes that some pairs are confusable only in certain fonts, and that the current data covers one source code point mapping to another code point or to a sequence. Cases where two different sequences look alike, such as the Tamil word shri, are not handled. The [[sec/hiding-data-with-homoglyphs-exploiting-unicode-lookalikes#Digits and other scripts|digit lookalikes]] show a second gap: the file maps Greek `Ι` to `l` and Cyrillic `О` to `O`, but maps Katakana `ロ` only to the ideograph `口` and has no entry for Hiragana `ろ`, so none of them reduces to the skeleton of `0` or `3`.

It does not cover edits. `exmaple` and `examle` are typos of `example`, not lookalikes, and the skeleton does not relate them. Permutation tools such as dnstwist generate those variants, and the monitoring side is covered in the IDN note.

Normalization is a different tool. NFKC folds fullwidth letters and ligatures. It does not map Cyrillic `а` to Latin `a`; only the confusables data does. The consequences are worked through in [[sec/unicode/unicode-normalization-security|Unicode normalization security]]. For the vocabulary around all of this, see [[sec/unicode/what-is-a-homoglyph|what a homoglyph is]].

## Sources

1. [Unicode Technical Standard #39, Unicode Security Mechanisms, Revision 34](https://www.unicode.org/reports/tr39/) - the skeleton algorithm, the data file format and the stability note.
2. [confusables.txt, version 18.0.0](https://www.unicode.org/Public/security/latest/confusables.txt) - the data file and the quoted lines.
3. [DerivedCoreProperties.txt, Unicode 18.0.0](https://www.unicode.org/Public/UCD/latest/ucd/DerivedCoreProperties.txt) - the `Default_Ignorable_Code_Point` ranges and their 4,174-code-point total.
4. [Unicode Standard Annex #15, Normalization Forms](https://www.unicode.org/reports/tr15/) - NFD and what NFKC does and does not fold.
