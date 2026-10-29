---
title: "Zero-Width Watermarks and Canary Traps in Text"
date: 2026-10-29
description: "Zero-width watermarks and canary traps in text: per-recipient invisible IDs to trace leaks, why stripping beats them, and what holds up instead."
tags:
  - sec
  - unicode
  - steganography
draft: true
---

> [!tldr]
> A canary trap gives every recipient a slightly different copy of a text, so a leaked copy points to its source. A zero-width watermark does that with an invisible per-recipient ID, and it only survives naive copy-paste: one regex, a retype or a screenshot removes it. A trap that holds up varies the content itself (wording, spelling, detail) per recipient, which no character filter can remove.

The mechanics are the ones from [[sec/unicode/zero-width-steganography|zero-width steganography]], pointed at a different goal. There the point is to hide a message; here the message is a short recipient ID, and the interesting question is how long it lasts once somebody wants it gone. The techniques around it are indexed in the [[sec/unicode/index|Unicode steganography hub]].

## A per-recipient zero-width mark

Sixteen zero-width characters encode a recipient number from 0 to 65535. The mark goes after the first word, and `trace()` reads it back from whatever text turns up.

```js
const ZERO = "\u200B";
const ONE = "\u200C";
const MARK = /[\u200B\u200C]{16}/u;

function stamp(text, recipientId) {
  const bits = recipientId.toString(2).padStart(16, "0");
  const mark = [...bits].map((b) => (b === "0" ? ZERO : ONE)).join("");
  const at = text.indexOf(" ") + 1 || text.length;
  return text.slice(0, at) + mark + text.slice(at);
}

function trace(text) {
  const m = MARK.exec(text);
  return m ? parseInt([...m[0]].map((c) => (c === ZERO ? "0" : "1")).join(""), 2) : null;
}

const memo = "Draft budget for Q3 is attached. Do not forward.";
const copy = stamp(memo, 4207);
console.log(copy.length - memo.length, trace(copy), trace(memo)); // 16 4207 null
```

It survives what a casual copy does to text. The same copy through normalization and whitespace cleanup:

```js
console.log(trace(copy.normalize("NFKC")));                 // 4207
console.log(trace(copy.trim().replace(/\s+/g, " ")));       // 4207
console.log(trace(copy.replace(/\p{Cf}/gu, "")));           // null
```

NFKC leaves U+200B and U+200C alone, and `\s` does not match them, so the mark outlives both. The third line is the whole weakness: one character-class filter and the ID is gone.

## Why it is trivially stripped

A watermark has to survive an adversary who knows it exists, and this one does not.

- **Stripping.** Removing format characters, or the Default_Ignorable set, deletes it without touching a visible character. The filters are in [[sec/unicode/remove-zero-width-characters|the how-to on removing zero-width characters]], and UTS #39's confusable skeleton includes the same removal as a step.
- **Retyping, OCR, screenshots.** Anything that goes through the visible form of the text drops invisible characters.
- **Collusion.** Two recipients who compare their copies see that they differ in characters nobody can read, which tells them where the mark is.
- **Detection by density.** The StegCloak README says plainly that unusual character density betrays hidden communication when someone analyses the Unicode, and a 16-character run in a 48-character sentence stands out.

The counterpart already exists as a tool. [DavidJacobson/SafeText](https://github.com/DavidJacobson/SafeText) is a Python script (135 stars, MIT, last push 2019-07-04) meant for people who leak documents: you run `python safetext.py inputfile`, it writes a cleaned `inputfile.safe` and reports every issue with a line number. It looks for homoglyphs, zero-width characters, other near-invisible changes such as stray spaces, and spelling variants that could identify a country. It is stale, so treat it as reference code. What it shows is that the stripping side is public knowledge and takes a handful of lines.

## What holds up: content variation

The alternative is a mark that is part of the content. Each recipient gets a copy that differs in wording, spelling or detail, in places a recipient would not think to normalize. SafeText's own checks show the idea from the other side: it flags regional spellings that could reveal a writer, which is exactly the kind of variation a trap can introduce on purpose.

```js
const SLOTS = [
  ["begin", "start"],
  ["attached", "enclosed"],
  ["review", "check"],
  ["by Friday", "before Friday"],
];
const TEMPLATE = "Please {0} the {1} budget {2} {3}.";

const vary = (id) => TEMPLATE.replace(/\{(\d)\}/g, (_, i) => SLOTS[i][(id >> i) & 1]);

function identify(text) {
  return SLOTS.reduce((id, [a, b], i) => {
    const hasB = text.includes(b) && !text.includes(a);
    return id | (hasB ? 1 << i : 0);
  }, 0);
}

console.log(vary(5));                        // Please start the attached budget check by Friday.
console.log(identify(vary(5)), identify(vary(12))); // 5 12
const rewritten = vary(5).normalize("NFKC").replace(/\p{Cf}/gu, "");
console.log(identify(rewritten));            // 5
```

Four binary slots identify 16 recipients; `n` slots identify `2^n`. Normalization and stripping change nothing, because there is nothing invisible to remove. This is also where the effort goes: the variants have to read naturally, differences must not change meaning, and for large distribution lists the number of slots grows with the logarithm of the list. Collusion is still possible, since recipients can diff their copies, so a larger scheme mixes several slot types and keeps the mapping of variant to recipient.

## An ethical and legal note

Both sides of this are legitimate uses. Organisations trace leaks of confidential drafts, and sources protect themselves from being traced, which is the case SafeText was written for. A per-recipient mark is, in effect, a way of identifying a person from a document, so decide who is told, what is logged and how long the mapping is kept before you deploy it, and ask whoever handles legal for you; the answers depend on jurisdiction and context. This note is engineering, not legal advice. The cheapest way to stay on the right side is to say in the distribution policy that copies are individually marked.

Two sibling notes cover the neighbouring carriers: [[sec/unicode/whitespace-steganography|whitespace steganography]] for marks hidden in spacing, and the character list in [[sec/unicode/invisible-unicode-characters|invisible Unicode characters]] if you need other alphabets than ZWSP and ZWNJ.

## Sources

1. [DavidJacobson/SafeText](https://github.com/DavidJacobson/SafeText): what it strips and flags, CLI usage, MIT, stale since 2019.
2. [KuroLabs/stegcloak](https://github.com/KuroLabs/stegcloak): README caveat that unusual character density reveals hidden communication.
3. [UTS #39, Unicode Security Mechanisms](https://www.unicode.org/reports/tr39/): the skeleton algorithm removes Default_Ignorable_Code_Point characters.
4. [UAX #15, Unicode Normalization Forms](https://www.unicode.org/reports/tr15/): what NFKC folds.
