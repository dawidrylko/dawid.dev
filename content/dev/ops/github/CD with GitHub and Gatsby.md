---
date: 2024-04-22
tags:
  - dev
  - ops
  - GitHub
---

> [!tldr]
> Continuous Deployment (CD) pipeline for a Gatsby project using GitHub Actions.

## 🌐 Overview

In this guide, we will set up a continuous deployment (CD) pipeline for a #Gatsby project using #GitHub Actions.

## 📝 Configuration

```yaml title=".github/workflows/cd.yml"
name: Continuous Deployment

on:
  push:
    branches: ["master"]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "cd"
  cancel-in-progress: true

defaults:
  run:
    shell: bash

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"

      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v4
        with:
          static_site_generator: gatsby

      - name: Restore cache
        uses: actions/cache@v4
        with:
          path: |
            public
            .cache
          key: ${{ runner.os }}-gatsby-build-${{ hashFiles('public') }}
          restore-keys: |
            ${{ runner.os }}-gatsby-build-

      - name: Install dependencies
        run: npm ci

      - name: Build
        env:
          PREFIX_PATHS: "true"
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public

  deploy:
    name: Deploy
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4

  notify:
    name: Notify
    runs-on: ubuntu-latest
    needs: deploy
    if: "contains(github.event.head_commit.message, '[notify]')"
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Notify Google via Indexing API
        env:
          GOOGLE_JSON_KEY_FILE: ${{ secrets.GOOGLE_JSON_KEY_FILE }}
        working-directory: ".github/scripts"
        shell: bash
        run: ./google.sh

      - name: Notify Bing via URL Submission API
        env:
          BING_API_KEY: ${{ secrets.BING_API_KEY }}
        working-directory: ".github/scripts"
        shell: bash
        run: ./bing.sh
```

## 👀 Node version

The `setup-node` action is used to set up the Node.js environment for the workflow. It reads the `.nvmrc` file in the repository to determine the Node.js version to use.

> [!caution]
> The `node-version-file` is available since `v4` of the `setup-node` action.

> [!info]
> File containing the version Spec of the version to use. Examples: `package.json`, `.nvmrc`, `.node-version`, `.tool-versions`.
>
> If `node-version` and `node-version-file` are both provided the action will use version from node-version.

## 🔔 Notifications

The `notify` job in the workflow file is responsible for sending notifications to the [[Google Indexing API]] and [[Bing URL Submission API]].
