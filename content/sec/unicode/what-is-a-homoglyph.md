---
title: "What Is a Homoglyph? Definition and Examples"
date: 2026-10-29
description: "What is a homoglyph? A character that looks like another but has a different code point, with Latin, Cyrillic and Greek examples and the UTS #39 term."
tags:
  - sec
  - unicode
draft: true
---

> [!tldr]
> A homoglyph is a character that looks like another character but has a different code point, such as Cyrillic а (U+0430) and Latin a (U+0061). A homograph is a whole string that looks like another string. The Unicode Consortium's own term, defined in UTS #39, is confusable: two strings whose skeletons are equal.

To a human reader the Cyrillic letter `а` and the Latin letter `a` are one shape. To a program they are two unrelated numbers, U+0430 and U+0061. They compare as unequal, sort in different places and take a different number of bytes. That gap between what is drawn and what is stored is the whole subject. The pairs themselves are tabulated in the [[sec/hiding-data-with-homoglyphs-exploiting-unicode-lookalikes|homoglyph reference table]]. Homoglyphs are one of the six data carriers compared in [[sec/unicode/index|the Unicode steganography techniques table]].

## Homoglyph, homograph, confusable

Three words circulate, and they overlap. Each points at a different thing.

| Term | Refers to | Where you meet it |
| --- | --- | --- |
| Homoglyph | One character (or glyph) that looks like another | Security write-ups, library names such as `confusable_homoglyphs` |
| Homograph | A whole string that looks like another string | "IDN homograph attack", the name of the 2002 paper "The homograph attack" |
| Confusable | A pair of strings that a visual-similarity algorithm treats as the same | UTS #39, the Unicode standard for security mechanisms |

In linguistics a homograph is a word spelled like another word with a different meaning. The security term keeps the idea of identical spelling and applies it to what the eye sees. UTS #39 uses neither word. It defines **two strings X and Y as confusable if and only if their skeletons are equal**, where the skeleton is a normalized form computed from a data file of visual mappings. Skeletons are built step by step in [[sec/unicode/unicode-confusables-skeleton|the confusables skeleton note]]. The attack that targets domain names is covered in [[sec/unicode/idn-homograph-attack|IDN homograph attacks]].

## Examples across scripts

A short Python check prints the code point, the official name and whether the pair is equal:

```python
import unicodedata

pairs = [("a", "\U00000430"), ("o", "\U000003bf"), ("p", "\U00000440"), ("l", "I"), ("O", "0")]
for left, right in pairs:
    print(
        f"U+{ord(left):04X} {unicodedata.name(left):<28}"
        f"U+{ord(right):04X} {unicodedata.name(right):<34}"
        f"equal={left == right}"
    )
# U+0061 LATIN SMALL LETTER A        U+0430 CYRILLIC SMALL LETTER A           equal=False
# U+006F LATIN SMALL LETTER O        U+03BF GREEK SMALL LETTER OMICRON        equal=False
# U+0070 LATIN SMALL LETTER P        U+0440 CYRILLIC SMALL LETTER ER          equal=False
# U+006C LATIN SMALL LETTER L        U+0049 LATIN CAPITAL LETTER I            equal=False
# U+004F LATIN CAPITAL LETTER O      U+0030 DIGIT ZERO                        equal=False
```

Cyrillic supplies many Latin lookalikes (`а`, `е`, `о`, `р`, `с`, `х`, `у`), Greek adds `ο` (omicron), `ν` (nu) and capitals such as `Α` (Alpha), and the last two rows show that no second script is needed. In many sans-serif fonts a capital `I` and a lowercase `l` are the same vertical stroke, and a zero and a capital `O` differ by a few pixels. Whether a pair counts depends on the font. UTS #39 says so itself: some characters are confusable only in some fonts. Digits are the weakest link, and the [[sec/hiding-data-with-homoglyphs-exploiting-unicode-lookalikes#Digits and other scripts|digit lookalikes]] in the pillar table cover the zero and one pairs, including the CJK ones.

## Homoglyphs are not always one-to-one

The data file behind UTS #39 records mappings that go beyond single letters. Three real lines from `confusables.txt` 18.0.0 show the range:

```text
0049 ;	006C ;	MA	# ( I → l ) LATIN CAPITAL LETTER I → LATIN SMALL LETTER L	# 
0030 ;	004F ;	MA	# ( 0 → O ) DIGIT ZERO → LATIN CAPITAL LETTER O	# 
006D ;	0072 006E ;	MA	# ( m → rn ) LATIN SMALL LETTER M → LATIN SMALL LETTER R, LATIN SMALL LETTER N	# 
```

A capital I looks like a small l, a zero looks like a capital O, and a single `m` looks like the two-letter sequence `rn`. A homoglyph in the broad sense is therefore a relation between character sequences. Swapping one letter for a foreign one is only its most common case.

## Why one different code point matters

Any string operation that does not know about lookalikes treats the swap as a different word:

```python
word, spoof = "apple", "\U00000430pple"
print(word == spoof)
# False
print(word.encode(), spoof.encode())
# b'apple' b'\xd0\xb0pple'
print(sorted([word, spoof, "banana"]))
# ['apple', 'banana', 'аpple']
```

The equality test fails, the encoded bytes differ, and the spoof sorts after `banana`. For a person reading a username list, a login form or a URL bar, none of that is visible. The same property makes homoglyphs usable for impersonation and, read as a bit per swappable letter, for hiding data in text. Producing such strings is the job of the [[sec/unicode/homoglyph-generator|homoglyph generator]]. Catching them takes a script check or a skeleton comparison.

## Sources

1. [Unicode Technical Standard #39, Unicode Security Mechanisms](https://www.unicode.org/reports/tr39/) - definition of confusable, skeleton, and the note on font-dependent confusability.
2. [confusables.txt, version 18.0.0](https://www.unicode.org/Public/security/latest/confusables.txt) - the three quoted mapping lines.
3. [Gabrilovich and Gontmakher, "The homograph attack", Communications of the ACM 45(2), 2002](https://doi.org/10.1145/503124.503156) - the 2002 paper itself, by DOI.
