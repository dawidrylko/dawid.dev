---
date: 2024-04-23
tags:
  - dev
  - crypto
---

> [!tldr]
> The hierarchical deterministic (HD) wallet is a standard defined by the #Bitcoin Improvement Proposal (BIP) 32. It allows for the creation of a tree-like structure of keys from a single seed. This structure is useful for creating a wallet that can generate a large number of addresses and keys without needing to store them all.

> [!cite]
>
> - Hierarchical Deterministic (HD) wallets allow you to manage a near infinite number of accounts with just one secret recovery phrase
> - HD wallets were introduced with the BIP-39 standard, and today they are the most popular type of wallet due to their convenience.
> - HD wallets let you back up your entire wallet in ease, plus, they also allow you to recover your original wallet on whichever HD wallet interface you choose.

## 🔗 Quick Links

- [Bitcoin Improvement Proposal (BIP) 32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [Bitcoin Improvement Proposal (BIP) 39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP-32: Understanding Hierarchical Deterministic Wallets](https://www.ledger.com/academy/crypto/what-are-hierarchical-deterministic-hd-wallets)

## 🌐 Overview

Hierarchical Deterministic (HD) wallets are a type of cryptocurrency wallets that allow for the generation of multiple private and public keys from a single master key (seed). They are based on the BIP-32 (Bitcoin Improvement Proposal 32) standard, which introduces a hierarchical structure of keys.

The functioning principle of Hierarchical Deterministic wallets relies on using deterministic algorithms to generate keys based on the master key. The master key, typically generated as a sequence of random words (e.g., 12 or 24 words), is used to generate a tree-like structure of keys.

The hierarchical structure of keys allows for organizing keys in a hierarchical manner, which is useful for creating structures such as multi-user wallets, multi-device wallets, and creating backups. Keys are generated at different levels in the tree, allowing for easy management.

The advantages of Hierarchical Deterministic wallets include:

1. Easy creation and management of multiple addresses.
2. Ability to create backups using a single master key.
3. Reduced risk of fund loss since only the master key needs to be remembered or securely stored.

Hierarchical Deterministic wallets are often open source, meaning their code is publicly available for inspection, auditing, and modification by the community. Examples of such wallets include popular cryptocurrency wallet software like #Electrum, #Ledger Live, and #Trezor Suite.

## 📈 Visualization

![[BIP 32 - Hierarchical Deterministic (HD) Wallets.png]]
Source: [Harsha Goli](https://arshbot.medium.com/hd-wallets-explained-from-high-level-to-nuts-and-bolts-9a41545f5b0)

## ℹ️ Bitcoin Improvement Proposal (BIP) 32

> [!info]+
> ![[Bitcoin Improvement Proposal (BIP) 32]]

## ℹ️ Bitcoin Improvement Proposal (BIP) 39

> [!info]+
> ![[Bitcoin Improvement Proposal (BIP) 39]]
