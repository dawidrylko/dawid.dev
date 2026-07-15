---
title: "Mobile App Tracking Ecosystem: The Hidden Privacy Crisis"
date: 2025-02-27
tags:
  - sec
---

> [!tldr]
> Mobile apps routinely leak highly personal identifiers to multiple ad networks, creating detailed profiles that can be used to track individuals with frightening accuracy. Even with privacy protections enabled, researchers demonstrated how to trace a device back to a specific individual using just their public activities. Understanding these mechanisms is crucial for developers building privacy-respecting applications.

## 🔗 Quick Links

- [Original Article: Tracking Myself Down Through In-App Ads](https://timsh.org/tracking-myself-down-through-in-app-ads/)

## 🌐 Overview

The mobile app ecosystem has created a vast surveillance infrastructure that most users—and even many developers—don't fully comprehend. Based on detailed research by Tim Libert, this note explores the technical mechanisms of in-app tracking, how identifiers flow between systems, and what developers should consider when building privacy-conscious applications.

## 📱 The Mobile Tracking Architecture

### 1️⃣ Identity Leakage Points

Modern mobile apps typically leak several types of identifiers:

1. Device Identifiers:
   - IDFA/GAID (Advertising ID)
   - IDFV (ID for Vendor)
   - Device fingerprints (device model, screen resolution, etc.)
2. User Identifiers:
   - IP addresses
   - Network operator information
   - Timezone data
3. Contextual Data:
   - Location coordinates
   - System information (battery level, screen brightness)
   - Memory and storage details

The researcher found these identifiers flowing to multiple third parties even with tracking permissions disabled.

### 2️⃣ The Location Tracking Reality

Despite Apple's App Tracking Transparency framework, many apps bypass location restrictions. The research demonstrated that:

- Apps send precise location data (latitude/longitude) even with Location Services disabled
- IP geolocation provides approximate location data
- Mobile network operator information adds to the location profile
- Device-specific parameters create a unique fingerprint

A typical data payload sent to ad networks contained:

```json
{
  "ts": "2025-01-18T23:27:39Z", // Timestamp
  "cip": "181.41.[REDACTED]", // User's IP address
  "lon": 2.1734, // Longitude
  "lat": 41.3851, // Latitude
  "car": "Yoigo", // Mobile carrier
  "battery_status": 3, // Battery level
  "screen_brightness": 0.35, // Screen brightness
  "free_memory": 507888 // Available memory
}
```

The research found this data enabled behavioral predictions - such as battery level correlating with higher acceptance of surge pricing in ride-hailing apps.

### 3️⃣ The Data Supply Chain

The ad ecosystem operates as a complex network of data sharing:

App → SSP (Supply Side Platform) → Ad Exchange → DSP (Demand Side Platform) → Data Broker

In the researcher's experiment with just one simple game app, data flowed to:

- Unity Ads (acting as an SSP)
- Moloco Ads (a DSP)
- Facebook (without any app or account linking)
- Various other analytics services

Each step in this chain involves bidding and data sharing, with personal information being passed along multiple entities.

## 🔍 Technical Methods Used for Tracking

### 1️⃣ The ID Chaining Problem

Mobile tracking relies on persistent identifiers through:

1. **IDFV (Identifier for Vendor)**: Per-developer tracking that remains consistent across all apps from the same developer
2. **IDFA (Advertising ID)**: Cross-app tracking (when permitted)
3. **Fingerprint Creation**: Combining:
   - Device model information
   - Network details
   - System parameters
   - Behavioral patterns

The research demonstrated that "Ask App Not to Track" only prevented sharing the IDFA, but all other identifiers continued to flow to tracking networks.

### 2️⃣ The Cross-Platform Connection

Ad networks coordinate to match identifiers across platforms through:

- IP address correlation
- Timestamp matching
- Device parameters
- Location data

This creates a unified profile even when direct identifiers like IDFA are blocked.

## 🔧 Data Broker Marketplace

The research uncovered alarming details about the data broker industry:

- Data sets containing billions of location points for sale (RedMob MAID data)
- Services that link MAIDs (Mobile Ad IDs) to personal identifiable information (PII)
- Data offers including names, addresses, phone numbers connected to device IDs
- Pricing from $85k-120k per year for enterprise access

This marketplace enables anyone with sufficient resources to:

1. Purchase location data containing MAIDs and IP addresses
2. Match these identifiers to PII datasets
3. Track specific individuals by filtering the location data

## 🧑‍💻 Implications for Developers

### 1️⃣ Understanding Data Flow

Before implementing any third-party SDK, developers should:

- Research what data the SDK collects and shares
- Understand how the data might be combined with other sources
- Consider the privacy implications beyond just the immediate use case

### 2️⃣ Implementing Privacy by Design

- Minimize collected identifiers
- Implement local processing when possible
- Use privacy-enhancing technologies
- Be transparent about data collection and sharing
- Consider whether third-party SDKs are truly necessary

## 💁🏼‍♀️ Summary

As developers, we're at the frontline of defining how technology interacts with privacy. The research shows that even seemingly innocuous implementation decisions can have profound privacy implications. By adopting privacy-focused engineering approaches, we can build applications that respect user autonomy while still achieving business objectives.

The most concerning aspect of this ecosystem is how each individual data point might seem harmless, but when combined and correlated across platforms, they create a comprehensive surveillance system that few users truly understand or consent to.
