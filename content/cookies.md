---
title: Cookie policy
date: 2026-09-09
description: Which cookies dawid.dev stores, what each one is for, how long it lasts, and how to change or withdraw your consent at any time.
---

This document lists the cookies and similar technologies used on dawid.dev, what each one is for and how long it lasts. How personal data is processed is covered by the [Privacy policy](privacy).

## The basic rule

Until you consent, the site stores nothing on your device beyond the record of your own decision. The Google Analytics script is not loaded at that point, so your browser sends Google no request at all.

Consent is required by art. 399(1) of the Polish Prawo komunikacji elektronicznej of 12 July 2024. Polish law grants analytics no exemption. Nothing is pre-selected: accepting and refusing both sit on the first layer of the banner, carry the same visual weight and cost the same single click.

## Browser storage needed to run the site

| Name                  | Type           | Purpose                                                               | Retention                   |
| --------------------- | -------------- | --------------------------------------------------------------------- | --------------------------- |
| `cookie-consent`      | localStorage   | Remembers your consent decision                                       | 13 months from the decision |
| `theme`               | localStorage   | Remembers whether you picked the light or the dark theme              | Until you clear site data   |
| `fileTree`            | localStorage   | Remembers which folders you expanded in the sidebar                   | Until you clear site data   |
| `graph-visited`       | localStorage   | Marks the notes you have already opened, so the graph can colour them | Until you clear site data   |
| `<note>-checkbox-<n>` | localStorage   | Remembers boxes you ticked in a note's task list                      | Until you clear site data   |
| `explorerScrollTop`   | sessionStorage | Keeps the sidebar scroll position while you browse                    | Until you close the tab     |

The consent entry is written whether you accept or refuse. Without it the site would have to ask on every visit. It contains nothing that identifies you, and neither does any other entry above: they never leave your browser, carry no identifier, and cannot be used to recognise you on another site or on another device.

## Analytics cookies

Written only after you consent. They serve traffic measurement in Google Analytics 4, property `G-D2GF97WSHZ`.

| Name             | Purpose                             | Retention |
| ---------------- | ----------------------------------- | --------- |
| `_ga`            | Distinguishes unique visitors       | 13 months |
| `_ga_D2GF97WSHZ` | Keeps the measurement session state | 13 months |

The service is provided by Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland. Data may be transferred to Google LLC in the United States on the terms described in the [Privacy policy](privacy).

Measurement is configured to keep the data narrow. Google Signals and ad personalisation are off, advertising data is redacted, and the cookies are written with the `SameSite=Lax` and `Secure` flags, scoped to dawid.dev alone.

## Marketing cookies

The site uses none and loads no advertising scripts. The banner has no marketing category, because there is no consent that could switch such tools on. Google Consent Mode holds a permanent refusal for advertising storage, meaning the `ad_storage`, `ad_user_data` and `ad_personalization` signals.

If such tools ever appear, the category returns to the banner along with a description of the specific files in this document, before they are used for the first time.

## What the site does not do

Fonts, libraries and diagrams are served from the site's own domain, so opening a page contacts no external CDN. There are no embedded maps or social media widgets. Site search runs entirely in your browser against an index downloaded with the page, so what you type is never sent anywhere.

Two notes carry a video. They are the one exception, and they load nothing until you ask them to.

## Embedded video

The two notes are [TypeScript native port](dev/frontend/typescript-native-port-10x-speed-boost-2025) and [Badger 2040](dev/iot/Badger-2040). Opening either page loads nothing from YouTube. In place of the player you get a button, and the player is fetched only when you press it.

Pressing it loads the player from `youtube-nocookie.com`, which receives your IP address and may store its own entries on your device under YouTube's terms. The provider is Google Ireland Limited. Nothing on this site presses that button for you, and no other page embeds anything.

## Managing your consent

You can change or withdraw consent at any time with the Cookie settings button in the footer of every page. Withdrawing is as easy as giving consent and does not affect the lawfulness of processing carried out beforehand.

Withdrawal stops measurement immediately and deletes the `_ga` and `_ga_D2GF97WSHZ` files already on your device. They do not wait out their thirteen month period.

Thirteen months after your decision the site asks again. The analytics files expire at the same moment. Their lifetime runs from the moment you consented and later visits do not push it forward. Should a `_ga` file survive on your device anyway, it is deleted on your next visit. That also covers files written by an earlier version of this site, which did not ask.

Regardless of the settings here, cookies can be controlled from your browser:

- [Google Chrome](https://support.google.com/chrome/answer/95647)
- [Mozilla Firefox](https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer)
- [Safari](https://support.apple.com/guide/safari/sfri11471/mac)
- [Microsoft Edge](https://support.microsoft.com/help/4468242)

Blocking local storage in your browser means the site will ask for consent on every visit.
