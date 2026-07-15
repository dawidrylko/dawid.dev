---
date: 2024-04-22
tags:
  - dev
  - ops
  - GitHub
---

> [!tldr]
> Continuous Integration (CI) pipeline for a Gatsby project using GitHub Actions.

## 🌐 Overview

In this guide, we will set up a continuous integration (CI) pipeline for a #Gatsby project using #GitHub Actions.

## 📝 Configuration

```yaml title=".github/workflows/ci.yml"
name: Continuous Integration

on:
  push:
    branches: ["master"]

concurrency:
  group: "ci"
  cancel-in-progress: true

defaults:
  run:
    shell: bash

jobs:
  check:
    name: Check
    runs-on: ubuntu-latest
    strategy:
      matrix:
        check: ["type:check", "format:check"]
        node: ["18", "20"]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}

      - name: Install dependencies
        run: npm ci

      - name: Run Check
        run: npm run ${{ matrix.check }}
```

## ⊹ Matrix Strategy

The matrix strategy in GitHub Actions allows you to define a set of variables and their possible values. It creates a matrix of jobs, where each combination of the defined variables will result in a separate job being executed.

In the given code, the matrix strategy is used to define two variables: `check` and `node`. The `check` variable has two possible values: `'type:check'` and `'format:check'`. The `node` variable has two possible values: `'18'` and `'20'`. This means that a total of four jobs will be created, representing all possible combinations of the `check` and `node` variables.

This matrix strategy is useful when you want to run a set of jobs with different configurations or test against multiple versions of a dependency. It helps to reduce duplication in your workflow file and allows for efficient parallel execution of jobs.
