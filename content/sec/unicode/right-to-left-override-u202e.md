---
title: "Right-to-Left Override (U+202E) File Name Spoofing"
date: 2026-10-29
description: "Right-to-left override (U+202E) makes a file named ...exe display as ...txt. How the spoof works, with detection code for Python, JS and find."
tags:
  - sec
  - unicode
---

> [!tldr]
> U+202E RIGHT-TO-LEFT OVERRIDE tells a renderer to draw the text after it from right to left. A file stored as `annual-report`, U+202E, `txt.exe` shows up as `annual-reportexe.txt` while its real extension stays `.exe`. Detect it by scanning file names for the bidi control characters, and view names through a tool that escapes them.

The name you see in a folder or an attachment list is a rendering of the stored name, and rendering follows the Unicode bidirectional algorithm. That is the same gap [[sec/unicode/trojan-source-attack|Trojan Source]] exploits in source code. In a file name it is older and simpler. One character does the whole job, and an operating system that opens the file by its stored name does not care what the list drew. The wider map of such carriers is in the [[sec/unicode/index|Unicode steganography techniques]] overview.

## What the name looks like and what it is

MITRE ATT&CK tracks the technique as T1036.002, Masquerading: Right-to-Left Override. Its own examples show the pattern: a screensaver named `March 25 \u202Excod.scr` displays as `March 25 rcs.docx`, and a JavaScript file named `photo_high_re\u202Egnp.js` displays as `photo_high_resj.png`. The attacker types the harmless extension backwards, the override flips it on screen, and the dangerous extension ends up in the middle of the name.

| Stored name (escaped) | Displayed as | Real extension |
| --- | --- | --- |
| `annual-report\u202etxt.exe` | `annual-reportexe.txt` | `.exe` |
| `photo_high_re\u202Egnp.js` | `photo_high_resj.png` | `.js` |

The displayed column for the first row is what the toy reversal in the script below produces; the second row is MITRE's.

## Why it works in file managers and mail clients

A file manager draws the stored name with its normal text engine, which applies the bidirectional algorithm, so U+202E reverses everything after it. Opening the file goes by the stored string and its true suffix, and nothing in that path asks whether the displayed name matches the stored one. MITRE says the technique can trick both end users and defenders who do not know how their tools render the character, lists BlackTech's use of it to obfuscate the names of malicious e-mail attachments, and notes that regedit.exe displays reversed registry text while reg.exe does not by default. The last detail is the useful one. **A tool that does not apply the bidi algorithm shows the real name.**

U+202E is the common choice, but the other eight controls from UAX #9 (U+202A to U+202D and U+2066 to U+2069) can hide a suffix too, so a detector should cover all nine.

## Detection in Python

```python
import os
import re
import sys
import tempfile
from pathlib import Path

BIDI = set(range(0x202A, 0x202F)) | set(range(0x2066, 0x206A)) | {0x200E, 0x200F, 0x061C}


def suspicious(root):
    for dirpath, dirnames, filenames in os.walk(root):
        for name in dirnames + filenames:
            hits = [f"U+{ord(c):04X}" for c in name if ord(c) in BIDI]
            if hits:
                yield os.path.join(dirpath, name), hits


def display_guess(name):
    return re.sub("\u202e(.*)$", lambda m: m.group(1)[::-1], name)


with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    (root / "annual-report\u202etxt.exe").write_text("x")
    (root / "notes.txt").write_text("x")
    found = 0
    for path, hits in suspicious(root):
        name = os.path.basename(path)
        print(ascii(name), hits)
        print("  real extension  :", os.path.splitext(name)[1])
        print("  may display as  :", display_guess(name).replace("\u202e", ""))
        found += 1
    sys.exit(1 if found else 0)
# 'annual-report\u202etxt.exe' ['U+202E']
#   real extension  : .exe
#   may display as  : annual-reportexe.txt
# exit status: 1
```

`display_guess` handles only the plain RLO case and is a toy, but it makes the report readable. Always print names through `ascii()` or `repr()`, never raw.

## Detection in JavaScript

```js
import { mkdtempSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BIDI = /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/u;

function suspicious(root) {
  return readdirSync(root, { recursive: true }).filter((name) => BIDI.test(name));
}

const root = mkdtempSync(join(tmpdir(), "rlo-"));
writeFileSync(join(root, "annual-report\u202etxt.exe"), "x");
writeFileSync(join(root, "notes.txt"), "x");
for (const name of suspicious(root)) {
  const cps = [...name]
    .filter((c) => BIDI.test(c))
    .map((c) => "U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"));
  console.log(JSON.stringify(name).replace(/[^\x20-\x7e]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")), cps);
}
// "annual-report\u202etxt.exe" [ 'U+202E' ]
```

## A shell one-liner

BSD `grep` on macOS has no `-P`, and `ls` prints the raw character. A portable pair is `find` with the three UTF-8 bytes of U+202E (E2 80 AE), and Perl over the byte ranges of all nine controls (E2 80 AA to AE, E2 81 A6 to A9). `ls -b` prints the bytes as octal escapes, so the terminal draws nothing deceptive:

```bash
find . -type f -name "*$(printf '\342\200\256')*" -print0 | xargs -0 -r ls -b
# ./annual-report\342\200\256txt.exe

find . -print0 | perl -0ne 'chomp; print "$_\n" if /\xe2\x80[\xaa-\xae]|\xe2\x81[\xa6-\xa9]/' |
  while IFS= read -r f; do ls -b -d -- "$f"; done
# ./annual-report\342\200\256txt.exe
```

Both exit with status 0 on a clean tree too, so test whether the output is empty, not the exit code. These look at names only. For what is inside the files, use the content search from the Trojan Source note.

## What to do with a hit

Do not open it. Rename the file, and treat the attachment or archive it came from as suspect. The legitimate case exists, for example a file named in Arabic or Hebrew that carries a directional mark, but a control that flips an extension is almost never that. A mail gateway or upload form can reject any name containing the nine controls, and the cost is a handful of unusual but valid names. The same family of marks shows up as a warning on repositories, covered in [[sec/unicode/bidirectional-unicode-text-warning|the bidirectional Unicode text warning]], and the full list of characters that render as nothing is in [[sec/unicode/invisible-unicode-characters|invisible Unicode characters]].

## Sources

1. [MITRE ATT&CK T1036.002, Masquerading: Right-to-Left Override](https://attack.mitre.org/techniques/T1036/002/): the technique, the file name examples, the registry note and the threat groups that used it.
2. [UAX #9, Unicode Bidirectional Algorithm](https://www.unicode.org/reports/tr9/): the explicit formatting characters including U+202E.
3. [Boucher and Anderson, Trojan Source: Invisible Vulnerabilities](https://arxiv.org/abs/2111.00169): the source-code counterpart of the same rendering gap.
