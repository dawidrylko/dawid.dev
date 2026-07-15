---
date: 2025-04-14
tags:
  - dev
  - ops
---

> [!tldr]
> Serving a local site over HTTPS on macOS is straightforward if you (1) add and trust your certificate in Keychain Access, (2) set it to “Always Trust,” and (3) point your local web server to the correct `.key` and `.crt` files. Tools like `mkcert` make this even simpler by generating certificates your system automatically trusts.

## 🌐 Introduction

Sometimes you need a local development site to run securely over HTTPS—whether for OAuth callbacks, PWA testing, or newer browser features that demand HTTPS. If your certificate isn’t trusted by macOS, browsers will display security warnings. Let’s fix that by importing and trusting a certificate in Keychain Access, then configuring your local server.

## 🔧 Step 1: Add the Certificate to Your Keychain

1. **Open Keychain Access**  
   Navigate to **Applications > Utilities > Keychain Access.app**.

2. **Select a Keychain**  
   In the sidebar, pick **System** (for all users on this Mac) or **Login** (for your user only).

3. **Import the Certificate**  
   Drag and drop your certificate (`.crt`, `.pem`, etc.) into the main window, or choose **File > Import Items...**.

4. **Authorize**  
   You may be prompted for your admin password; enter it to proceed.

> **💡 Pro Tip**: Need a certificate? Tools like `mkcert`, `openssl`, or `minica` can generate local certs. For example, `mkcert` automatically creates certificates trusted by your system.

## ✅ Step 2: Mark the Certificate as Trusted

1. **Locate the Certificate**  
   In Keychain Access, find the newly added certificate.

2. **Double-Click the Certificate**  
   This opens a detail pane.

3. **Set “Always Trust”**  
   Expand the **Trust** dropdown. Under **When using this certificate**, choose **Always Trust**.

4. **Confirm**  
   Close the window and enter your admin password if asked.

Once it’s set to “Always Trust,” macOS will treat this certificate as valid for secure connections.

## 🚨 Common Gotchas

- **Browser Caching**  
  If your browser still complains, try restarting it or clearing cache/cookies.
- **Domain Mismatch**  
  Make sure the certificate’s domain (`localhost`, `app.test`, etc.) exactly matches your dev URL.
- **Missing Intermediate Certs**  
  If you use a private CA with multiple certificates in the chain, you may also need to trust the intermediate certificates.

## 🧪 Bonus: Use mkcert

`mkcert` is a handy tool for generating certificates. Once installed via Homebrew:

```bash
brew install mkcert
mkcert -install
mkcert local.dev
```

It will produce `.pem` files for your chosen domain, automatically trusted by macOS. Then you simply point your local web server to the `.pem` files for the certificate and key.

## 🙌 Final Thoughts

Enabling HTTPS locally spares you production headaches. Many security features—like secure cookies, service workers, or certain OAuth flows—require HTTPS. By configuring it now, you’ll ensure your local dev environment behaves closer to real-world conditions.

## 💁🏼‍♀️ Summary

- **Keychain**: Import your `.crt` (or similar) and set it to “Always Trust.”
- **Local Domain**: The certificate domain must match your local site URL.
- **mkcert**: A quick, automated route to generating trusted certificates.
- **Production Parity**: Local HTTPS mirrors real deployments, saving time down the road.

With these steps, you can confidently develop and test sites over HTTPS on macOS—no more browser warnings or blocked features!
