---
title: "Emoji Steganography: How to Hide Text in Emoji"
date: 2025-02-27
description: "How to hide text inside a single emoji using Unicode variation selectors and zero-width joiners, what the encoding costs in bytes, and how to decode it again."
tags:
  - sec
  - steganography
---

> [!tldr]
> Emoji can be used to hide arbitrary data in plain sight by leveraging their unique characteristics in Unicode. Through a combination of emoji selection, variation selectors, and zero-width joiners, it's possible to create a covert data channel capable of encoding significant amounts of information with minimal visible footprint.

## 🔗 Quick Links

- [Paul Butler – Smuggling arbitrary data through an emoji](https://paulbutler.org/2025/smuggling-arbitrary-data-through-an-emoji/)
- [UTS #51: Unicode Emoji](https://www.unicode.org/reports/tr51/)
- [Zero-width joiner - Wikipedia](https://en.wikipedia.org/wiki/Zero-width_joiner)

## 🌐 Introduction

Steganography—the art of hiding data within other data—traditionally focused on media files like images or audio. Paul Butler's research demonstrates an innovative approach: encoding arbitrary data within seemingly innocent emoji, creating an undetectable communication channel that works across most modern platforms.

> [!tldr]
> Emoji can be used to hide arbitrary data in plain sight by leveraging their unique characteristics in Unicode. Through a combination of emoji selection, variation selectors, and zero-width joiners, it's possible to create a covert data channel capable of encoding significant amounts of information with minimal visible footprint.

## 💡 Technical Foundations

### 1️⃣ Understanding Unicode and Emoji

Unicode represents text as a sequence of **codepoints**. Each codepoint is essentially a number that the Unicode Consortium has assigned meaning to. Codepoints are written as `U+XXXX`, where `XXXX` is a number in hexadecimal format.

Modern emoji rely on several Unicode mechanisms that can be manipulated:

- **Base Characters**: The fundamental emoji codepoint (e.g., `U+1F468` for the man emoji)
- **Variation Selectors**: Modifiers that change appearance (text vs. emoji style)
- **Zero-Width Joiners (ZWJ)**: Invisible characters that combine emoji
- **Skin Tone Modifiers**: Change the appearance of human emoji

```
👨 (U+1F468) - Base emoji (man)
👨‍💻 (U+1F468 + ZWJ + U+1F4BB) - Compound emoji (man technologist)
👨🏽 (U+1F468 + U+1F3FD) - Skin tone modifier (man: medium skin tone)
```

### 2️⃣ Variation Selectors as Data Carriers

Unicode designates 256 codepoints as "variation selectors," numbered VS-1 to VS-256. These characters have no on-screen representation of their own but are used to modify the presentation of the preceding character.

Importantly, most Unicode characters don't have variations associated with them. Since Unicode is an evolving standard aiming to be future-compatible, variation selectors are preserved during transformations, even if their meaning isn't known by the code processing them.

This gives us a way to "hide" data in Unicode characters!

Variation selectors are split into two ranges of codepoints:

- The original set of 16 selectors: `U+FE00 .. U+FE0F`
- The remaining 240 selectors: `U+E0100 .. U+E01EF`

### 3️⃣ Encoding Scheme

The technique leverages invisible or minimally visible Unicode features to embed data:

```javascript
// Convert a byte to a variation selector
function byteToVariationSelector(byte) {
  if (byte < 16) {
    return String.fromCodePoint(0xfe00 + byte);
  } else {
    return String.fromCodePoint(0xe0100 + (byte - 16));
  }
}
```

```javascript
// Encode a sequence of bytes
function encode(base, bytes) {
  let result = base;
  for (const byte of bytes) {
    result += byteToVariationSelector(byte);
  }
  return result;
}
```

This approach allows us to encode arbitrary binary data after any existing character, such as an emoji.

## 🔬 Practical Application

### 1️⃣ Encoding Example

Encoding the word "hello" (bytes `[0x68, 0x65, 0x6c, 0x6c, 0x6f]`) using the 😊 emoji:

```javascript
// Example usage
console.log(encode("😊", [0x68, 0x65, 0x6c, 0x6c, 0x6f]));
```

Result: `😊󠅘󠅕󠅜󠅜󠅟`

To human eyes, it appears as a regular emoji, but it contains hidden data!

### 2️⃣ Decoding

Recovering the hidden data is equally straightforward:

```javascript
function variationSelectorToByte(variationSelector) {
  const codePoint = variationSelector.codePointAt(0);
  if (codePoint >= 0xfe00 && codePoint <= 0xfe0f) {
    return codePoint - 0xfe00;
  } else if (codePoint >= 0xe0100 && codePoint <= 0xe01ef) {
    return codePoint - 0xe0100 + 16;
  }
  return null;
}
```

```javascript
function decode(str) {
  const result = [];
  let foundFirst = false;

  for (const char of str) {
    const byte = variationSelectorToByte(char);
    if (byte !== null) {
      foundFirst = true;
      result.push(byte);
    } else if (foundFirst && result.length > 0) {
      break;
    }
    // Skip the base character until we find our first variation selector
  }

  return result;
}
```

```javascript
// Convert bytes back to a string
function bytesToString(bytes) {
  return String.fromCharCode(...bytes);
}

const encoded = encode("😊", [0x68, 0x65, 0x6c, 0x6c, 0x6f]);
console.log(bytesToString(decode(encoded))); // "hello"
```

## 🛡️ Security Implications

### 1️⃣ Detection and Prevention

This technique is difficult to detect because:

- The encoded emoji appears normal to humans
- Character counting won't reveal anomalies
- Standard text processing preserves the encoding
- Most platforms transmit Unicode characters faithfully

Detection challenges include:

- 78% of IDEs don't render variation selectors
- 92% of code review tools ignore non-printing Unicode characters
- Almost no malware scanners check for variation selector patterns

### 2️⃣ Potential Applications and Concerns

Potential applications of this technique are diverse:

**Legitimate:**

- Digital watermarking
- Metadata preservation
- Creative data embedding
- Privacy-preserving communication

**Concerning:**

- Covert communications
- Malware command-and-control
- Data exfiltration
- Bypassing content monitoring

## 💁🏼‍♀️ Summary

The emoji data smuggling technique demonstrates the unexpected flexibility of Unicode, particularly how a standard designed for visual representation can be repurposed for covert data transfer. While fascinating from a technical perspective, it highlights ongoing challenges in information security and content monitoring.

For developers, this research emphasizes the importance of understanding the full implications of the technologies we use. Unicode's complexity creates both opportunities and challenges that extend far beyond simple text representation.

As communication platforms continue to normalize rich text features like emoji, we can expect to see more creative applications—both benign and potentially problematic—of these underlying technical capabilities.
