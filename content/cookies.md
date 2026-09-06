---
title: Cookie policy
date: 2026-09-06
description: What dawid.dev stores in your browser, why, for how long, and how to change or withdraw your consent at any time.
---

This document describes what [dawid.dev](https://dawid.dev) stores on your device, for what purpose and for how long. How personal data is handled is described in the [Privacy policy](privacy).

## The basic rule

Until you answer the consent question, this site stores nothing on your device except the record of that answer, and it fetches nothing from anyone but dawid.dev. That holds on every page, including the two notes with a video.

Consent is required by article 399 of the Polish Electronic Communications Law of 12 July 2024, which has no exemption for analytics. Nothing is pre-ticked: the analytics category starts switched off, and refusing takes the same single click as accepting.

## Storage needed to run the site

| Name | Kind | Purpose | Retention |
|---|---|---|---|
| `cookie-consent` | localStorage | Remembers your answer to the consent question | 13 months from the decision |
| `theme` | localStorage | Remembers whether you picked the light or the dark theme | Until you clear site data |
| `fileTree` | localStorage | Remembers which folders you expanded in the sidebar | Until you clear site data |
| `graph-visited` | localStorage | Marks the notes you have already opened, so the graph can colour them | Until you clear site data |
| `<note>-checkbox-<n>` | localStorage | Remembers boxes you ticked in a note's task list | Until you clear site data |
| `explorerScrollTop` | sessionStorage | Keeps the sidebar scroll position while you browse | Until you close the tab |

These entries never leave your browser. They are not sent to me or to anyone else, they carry no identifier, and they cannot be used to recognise you on another site or on another device. The `cookie-consent` entry is written whatever you answer, including a refusal, so that you are not asked again on every page.

Site search runs entirely in your browser against an index downloaded with the page. What you type is never sent anywhere.

## Analytics cookies

Written **only after you allow the analytics category**. They serve traffic measurement in Google Analytics 4, property `G-D2GF97WSHZ`.

| Name | Purpose | Retention |
|---|---|---|
| `_ga` | Tells one browser apart from another | 13 months (395 days) |
| `_ga_D2GF97WSHZ` | Keeps the state of a measurement session | 13 months (395 days) |

The service is provided by Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland. Data may be transferred to Google LLC in the United States on the terms set out in the [Privacy policy](privacy).

Measurement is configured to keep the scope narrow. Google Signals and ad personalisation signals stay off, advertising data is redacted, and the cookies are limited to this exact hostname rather than to the whole domain.

Without your consent the Google Analytics script is **not loaded at all**. Google Consent Mode holds every purpose at denied, and the advertising purposes stay denied even after you accept analytics.

## Advertising cookies

This site uses none, and loads no advertising script. The consent banner has no marketing category, because there is no marketing tool to switch on.

## Server logs

The site is hosted on GitHub Pages. Serving a page leaves an entry in GitHub's server logs, which includes your IP address. This happens before any consent, because it is how the connection works rather than something written to your device. It is covered in the [Privacy policy](privacy).

No fonts, stylesheets or scripts are loaded from a third party content delivery network. Everything the page needs is served from dawid.dev.

## Embedded video

Two notes carry a video: [TypeScript native port](dev/frontend/typescript-native-port-10x-speed-boost-2025) and [Badger 2040](dev/iot/Badger-2040). Opening either page loads **nothing** from YouTube. In place of the player you get a button, and the player is fetched only when you press it.

Pressing it loads the player from `youtube-nocookie.com`, which receives your IP address and may store its own entries on your device under YouTube's terms. The provider is Google Ireland Limited. Nothing on this site presses that button for you, and no other page embeds anything.

## Managing your consent

You can change or withdraw your answer at any time through the **Cookie settings** link in the footer. Withdrawal does not affect the lawfulness of processing carried out before it.

Withdrawing consent for analytics stops the measurement immediately and **deletes the `_ga` and `_ga_D2GF97WSHZ` files already on your device**. They do not wait out their thirteen month term.

Thirteen months after your decision the site asks again. The record of your consent lives at least as long as the cookies it authorises, so a cookie is never left behind without a valid consent record: if the record is gone, the analytics cookies are cleared on your next visit.

Independently of the settings here, cookies can be controlled from the browser:

- [Google Chrome](https://support.google.com/chrome/answer/95647)
- [Mozilla Firefox](https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer)
- [Safari](https://support.apple.com/guide/safari/sfri11471/mac)
- [Microsoft Edge](https://support.microsoft.com/help/4468242/microsoft-edge-browsing-data-and-privacy)

Blocking local storage in the browser means the site asks for consent on every visit.

## Changes to this document

The document is updated whenever the tools in use change. The date of the last update is shown at the top of the page.
