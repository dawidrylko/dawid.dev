---
title: "Cloudflare Email Routing with Gmail: Send As over SMTP"
date: 2025-03-19
description: "Route a custom domain into Gmail with Cloudflare Email Routing, then send as that address over Gmail SMTP. App password, SPF and DMARC, and the outbound limit."
tags:
  - dev
  - ops
  - email
---

> [!tldr]
> Configure Gmail to send emails through your custom domain using Cloudflare Email Routing. This guide covers enabling 2FA, creating an App Password, configuring Gmail's SMTP settings, and setting up proper SPF and DMARC records for authentication.

## 🔗 Quick Links

- [Google 2-Factor Authentication](https://safety.google/authentication/)
- [Create App Password in Google](https://security.google.com/settings/security/apppasswords)
- [Cloudflare Email Routing Documentation](https://developers.cloudflare.com/email-routing/)
- [SPF Record Configuration](https://gist.github.com/irazasyed/a5ca450f1b1b8a01e092b74866e9b2f1)

## 🌐 Overview

Cloudflare Email Routing allows you to receive emails at your custom domain without running a mail server, but it doesn't provide sending capabilities. This guide demonstrates how to combine Cloudflare's routing with Gmail's SMTP server, enabling you to both send and receive emails through your professional domain address.

## 🔒 Preparing Your Google Account

### 1️⃣ Enable Two-Factor Authentication

Google requires 2FA to be enabled before you can create app passwords:

1. Visit [Google Account Security](https://myaccount.google.com/signinoptions/two-step-verification)
2. Follow the prompts to set up authentication using your preferred method
3. Complete the verification process

### 2️⃣ Generate an App Password

Create a dedicated password for your email client:

1. Navigate to [App Passwords](https://security.google.com/settings/security/apppasswords)
2. Select "Mail" as the app and your device type
3. Click "Generate"
4. **Important:** Copy the 16-character password that appears (you won't be able to see it again)

## 📧 Configuring Gmail

### 1️⃣ Add Your Custom Email Address

1. Open Gmail and navigate to:

   - Settings (gear icon) → See all settings → Accounts tab
   - Find the "Send mail as" section
   - Click "Add another email address"

2. In the dialog that appears:
   - Enter your name
   - Enter your Cloudflare-routed email address (e.g., `you@yourdomain.com`)
   - **Uncheck** "Treat as an alias" (important for proper headers)
   - Click "Next Step"

### 2️⃣ Configure SMTP Settings

Enter the following details:

| Setting             | Value                                            |
| ------------------- | ------------------------------------------------ |
| SMTP Server         | `smtp.gmail.com`                                 |
| Port                | `587`                                            |
| Username            | Your full Gmail address (including `@gmail.com`) |
| Password            | The app password generated earlier               |
| Connection Security | TLS                                              |

Click "Add Account" to proceed.

### 3️⃣ Verify Ownership

Gmail will send a verification message to your custom email address:

1. Check your inbox for the confirmation email
2. Either:
   - Enter the verification code in the prompt, or
   - Click the confirmation link in the email

## 🔧 DNS Configuration

### 1️⃣ Add SPF Record

Add a TXT record to your domain's DNS settings in Cloudflare:

| Type | Name | Content                                                              | TTL  |
| ---- | ---- | -------------------------------------------------------------------- | ---- |
| TXT  | @    | `v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all` | Auto |

This SPF record combines both Cloudflare and Google as authorized senders for your domain.

### 2️⃣ Configure DMARC Policy (Recommended)

Add a DMARC record to monitor email authentication:

| Type | Name    | Content                                                          | TTL  |
| ---- | ------- | ---------------------------------------------------------------- | ---- |
| TXT  | \_dmarc | `v=DMARC1; p=none; rua=mailto:your-monitoring-email@example.com` | Auto |

Set the policy to `p=none` initially to monitor without affecting delivery, allowing you to collect data before implementing stricter policies.

## 📝 Testing Your Configuration

After completing setup:

1. Compose a new email in Gmail
2. Click the "From" dropdown and select your custom email address
3. Send a test message to yourself or another account
4. Verify the message appears to come from your custom domain
5. Check the email headers to confirm proper authentication

## 💁🏼‍♀️ Summary

This configuration leverages Gmail's reliable SMTP infrastructure while maintaining your professional domain identity. The setup provides several advantages:

- Professional appearance with your custom domain
- Gmail's powerful composition features and spam filtering
- No need to run your own mail server
- Proper email authentication to improve deliverability

Remember that Gmail's SMTP has sending limits (typically 500 emails per day for regular accounts). For higher volume needs, consider upgrading to Google Workspace or exploring dedicated email service providers.
