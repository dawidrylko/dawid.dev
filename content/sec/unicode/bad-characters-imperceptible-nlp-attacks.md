---
title: "Bad Characters: Imperceptible NLP Attacks Explained"
date: 2026-10-29
description: "Bad Characters (IEEE S&P 2022) breaks NLP models with invisible characters, homoglyphs, reorderings and deletions. The four classes, results and defences."
tags:
  - sec
  - unicode
draft: true
---

> [!tldr]
> "Bad Characters" (Boucher, Shumailov, Anderson and Papernot, IEEE S&P 2022) shows that text models can be steered with perturbations a human cannot see: invisible characters, homoglyphs, reorderings and deletions. One injection degrades most models, three functionally break them, and the authors' conclusion is that NLP input needs sanitization like any other untrusted input.

Most adversarial text attacks change words, and a reader notices. This paper changes the encoding instead: the string a model receives differs from the string a person sees, and the model has no way to know. It is the research root of [[sec/unicode/invisible-prompt-injection|invisible prompt injection]] and a cousin of [[sec/unicode/trojan-source-attack|Trojan Source]], written by two of the same authors. The other carriers are on the [[sec/unicode/index|Unicode steganography techniques]] page.

## The paper in short

Nicholas Boucher, Ilia Shumailov, Ross Anderson and Nicolas Papernot posted "Bad Characters: Imperceptible NLP Attacks" to arXiv on 18 June 2021 (revised 11 December 2021). It appeared at the 43rd IEEE Symposium on Security and Privacy, May 2022, pages 1987 to 2004, DOI 10.1109/SP46214.2022.9833641. The attacks are black-box: they assume nothing about the model behind the system. In the abstract's words, a single imperceptible encoding injection can significantly reduce a model's performance, three injections can functionally break most of them, and the tested targets include commercial systems from Microsoft and Google plus open models from Facebook, IBM and HuggingFace.

## The four classes

| Class | Mechanism | Example (escaped) |
| --- | --- | --- |
| Invisible characters | Characters that render no glyph, such as zero-width space, inserted anywhere | `pay\u200bment` |
| Homoglyphs | A character swapped for a distinct one that draws the same glyph | `p\u0430yment` (Cyrillic а, U+0430) |
| Reorderings | Bidi controls change the render order of encoded characters | `pay` + swap of `e` and `m` + `nt` |
| Deletions | A control character such as backspace removes a neighbour when rendered | `pax\byment` |

The project site adds platform notes. Invisible characters are cross-platform and can be injected without limit. Homoglyphs can be swapped freely in most fonts. Reorderings render as intended on most modern platforms, though implementations vary, and deletions work only in some settings, with Python's `print()` named as one.

A short script builds the four examples, classifies them and applies a preprocessing step. The `swap` function reproduces the control-character sequence used in garak's `badchars.py`, which its docstring describes as forcing two adjacent code points to render in reverse order. The homoglyph check is a crude script proxy, the first word of each character name, and real confusable detection is covered in [[sec/unicode/what-is-a-homoglyph|what a homoglyph is]].

```python
import unicodedata

BIDI = set(range(0x202A, 0x202F)) | set(range(0x2066, 0x206A))
INVISIBLE = {0x200B, 0x200C, 0x200D, 0x2060, 0xFEFF, 0x00AD}


def swap(first, second):
    return "\u202d\u2066\u202e\u2066" + first + "\u2069\u2066" + second + "\u2069\u202c\u2069\u202c"


EXAMPLES = {
    "invisible": "pay\u200bment",
    "homoglyph": "p\u0430yment",
    "reordering": "pay" + swap("e", "m") + "nt",
    "deletion": "pax\byment",
}


def script_of(ch):
    return unicodedata.name(ch, "?").split()[0]


def classify(text):
    found = {}
    if any(ord(c) in INVISIBLE for c in text):
        found["invisible"] = True
    if any(ord(c) in BIDI for c in text):
        found["reordering"] = True
    if "\b" in text or "\x7f" in text:
        found["deletion"] = True
    for token in text.split():
        scripts = {script_of(c) for c in token if c.isalpha()}
        if len(scripts) > 1:
            found["homoglyph"] = sorted(scripts)
    return found


def preprocess(text):
    out = []
    for ch in text:
        if ch in "\b\x7f":
            if out:
                out.pop()
        elif ord(ch) not in BIDI | INVISIBLE:
            out.append(ch)
    return "".join(out)


for name, sample in EXAMPLES.items():
    print(f"{name:10} {ascii(sample)}")
    print(f"{'':10} classify -> {classify(sample)}  preprocess -> {ascii(preprocess(sample))}")
assert classify("plain payment") == {}
assert preprocess(EXAMPLES["invisible"]) == "payment"
assert preprocess(EXAMPLES["deletion"]) == "payment"
# invisible  'pay\u200bment'
#            classify -> {'invisible': True}  preprocess -> 'payment'
# homoglyph  'p\u0430yment'
#            classify -> {'homoglyph': ['CYRILLIC', 'LATIN']}  preprocess -> 'p\u0430yment'
# reordering 'pay\u202d\u2066\u202e\u2066e\u2069\u2066m\u2069\u202c\u2069\u202cnt'
#            classify -> {'reordering': True}  preprocess -> 'payemnt'
# deletion   'pax\x08yment'
#            classify -> {'deletion': True}  preprocess -> 'payment'
```

The reordering sample is built to display as `payment` but is `payemnt` in logical order, and logical order is what a text model receives. The homoglyph sample survives `preprocess` untouched, because removing characters cannot repair a swapped one; that case needs a mapping to base characters.

## What it meant for translation, toxicity and search

In machine translation, the authors attacked a Fairseq English-French transformer trained on WMT14 data, using 500 sentences and perturbation budgets from 0 to 5, and ran case studies against Google Translate and Microsoft Azure. They also built availability attacks, "sponge examples" crafted to maximize inference time, where reorderings were the most effective class.

For toxic content detection, they attacked IBM's open Toxic Content Classifier with 250 toxic sentences from the Wikipedia Detox dataset, perturbed with budgets from 0 to 5. Homoglyphs, reorderings and deletions cut performance by up to 75 percent, while invisible characters had no effect on that model. The paper suggests that the model's tokenizer most likely disregards the invisible characters they used. The experiment was repeated against Google's Perspective API with 50 sentences. For a moderation pipeline the lesson is uncomfortable: a post the classifier would flag can be rewritten to display identically and still score differently.

Search systems get two kinds of attack in the paper. Perturbed queries degrade the quality or quantity of results, and perturbed documents are crawled but indexed under altered terms, so they do not appear for the unperturbed search. The paper's example is a dishonest company masking negative information in financial filings so that specialist search engines used by analysts miss it.

The authors list the attack potential as altering translations, evading toxicity detection, invisibly poisoning training sets, hiding documents from indexing, degrading search and denial-of-service. For textual entailment, performance drops significantly even with a budget of 1.

## Code and tools

The reference implementation is [nickboucher/imperceptible](https://github.com/nickboucher/imperceptible) (MIT, 36 stars as of 2026-10-29, last push April 2024, no releases). It holds a Python command-line utility for the experiments, notebooks that walk through the results, serialized results and the website source. The companion site, imperceptible.soc.srcf.net, offers an Attack Detector and a Perturbation Generator in the browser. Treat the repository as reference code, not a dependency.

For testing your own system, NVIDIA's garak ships the probe `badchars.BadCharacters` (Apache-2.0, v0.17.1, active). It generates prompt variants in the four categories: invisible characters from U+200B, U+200C and U+200D, homoglyphs from Unicode's `intentional.txt`, bidi swaps built from LRO, LRI, RLO and PDI/PDF, and a character followed by a backspace for deletions. The default perturbation budget is 1. The command line is in [[sec/unicode/invisible-prompt-injection|the prompt injection note]].

## Defensive preprocessing

The paper's own recommendations map onto the four classes:

- Invisible characters: remove a standard set from inference inputs. If the application cannot discard them, make the tokenizer treat them as known tokens instead of unknowns.
- Homoglyphs, the hardest class: map uncommon lookalikes to their common counterparts before inference. The authors call building that mapping daunting, given the size of Unicode, and suggest automated techniques to help.
- Reorderings: strip bidi controls where a user interface displays the text, warn on them elsewhere, or run the bidi algorithm and coerce the logical order to match the visual one.
- Deletions: resolve them before inference or warn when they appear.

The list of default-ignorable characters to strip is in [[sec/unicode/invisible-unicode-characters|invisible Unicode characters]]. The project site closes with the point I would underline: it compares the situation to SQL injection and argues that text-based systems need input sanitization as a conscious design decision, made for the whole pipeline.

## Sources

1. [Boucher, Shumailov, Anderson and Papernot, Bad Characters: Imperceptible NLP Attacks (arXiv 2106.09898)](https://arxiv.org/abs/2106.09898): the paper, its four classes, experiments and defences.
2. [IEEE S&P 2022 proceedings entry, DOI 10.1109/SP46214.2022.9833641](https://doi.org/10.1109/SP46214.2022.9833641): publication venue and pages.
3. [nickboucher/imperceptible](https://github.com/nickboucher/imperceptible): the reference code, notebooks, results and website.
4. [Imperceptible Perturbations project site](https://imperceptible.soc.srcf.net): the summary, the platform notes and the detector and generator tools.
5. [NVIDIA garak, probes/badchars.py](https://github.com/NVIDIA/garak/blob/main/garak/probes/badchars.py): the `BadCharacters` probe and its swap sequence.
6. [Boucher and Anderson, Trojan Source: Invisible Vulnerabilities](https://arxiv.org/abs/2111.00169): the earlier paper on reordering and homoglyphs in source code.
