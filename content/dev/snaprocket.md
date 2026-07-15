---
title: "Snaprocket: Headless Screenshot CLI"
date: 2025-06-25
tags:
  - dev
---

> [!tldr]
> Fast CLI tool for capturing responsive screenshots of web pages using Puppeteer. Supports multiple viewports and custom configurations to streamline visual testing and automation workflows.

## 🔗 Quick Links

- [Snaprocket GitHub Repository](https://github.com/dawidrylko/snaprocket)
- [Snaprocket NPM Package](https://www.npmjs.com/package/snaprocket)

## 🌐 Overview

**Snaprocket** is a fast CLI tool for capturing screenshots of web pages using Puppeteer with multiple viewports and custom configurations. It is designed to be simple, flexible, and highly configurable, making it perfect for developers and testers who need quick visual feedback of websites.

Ideal for frontend regression checks, visual debugging, creating documentation snapshots across screen sizes, and validating responsive designs.

## ✨ Features

- **Fast Screenshot Capture**: Leverages Puppeteer to quickly capture screenshots of web pages
- **Multiple Viewports**: Supports default viewports (`s`, `m`, `l`, `xl`) and user-defined custom resolutions
- **Custom Configurations**: Easily configure timeouts, height limits, and output directories
- **Flexible Usage**: Capture full-page or constrained screenshots based on your needs

## 📥 Installation

You can install Snaprocket using your favorite package manager: npm, Yarn, or pnpm.

### Global Installation

- **Using npm:**

  ```bash
  npm install -g snaprocket
  ```

- **Using Yarn:**

  ```bash
  yarn global add snaprocket
  ```

- **Using pnpm:**
  ```bash
  pnpm install -g snaprocket
  ```

### Local Installation (Development Dependency)

- **Using npm:**

  ```bash
  npm install --save-dev snaprocket
  ```

- **Using Yarn:**

  ```bash
  yarn add --dev snaprocket
  ```

- **Using pnpm:**
  ```bash
  pnpm add -D snaprocket
  ```

## 💻 Usage

Run snaprocket from the command line with the following syntax:

```bash
snaprocket -h <baseURL> -p <paths> [-t <timeout>] [-o <output_directory>] [-H <height>] [-c <width>x<height>]... [-v <viewports>...]
```

### Command-line Arguments

- `-h`: **Base URL** (required) – The starting URL for capturing screenshots
- `-p`: **Paths** (required) – One or more URL paths to capture. Provide each path as a space-separated list
- `-t`: **Timeout** – Delay (in milliseconds) after the page loads before capturing a screenshot (default: `1000`)
- `-o`: **Output Directory** – Directory where screenshots will be saved. Defaults to the current working directory. Screenshots are organized into sub-folders by domain and viewport
- `-H`: **Height Limit** – If provided, only captures up to the specified height (in pixels). If omitted, the entire page is captured
- `-c` or `--custom`: **Custom Resolution(s)** – Specify custom resolution(s) in the format `WIDTHxHEIGHT`. This flag can be repeated to add multiple resolutions
- `-v`: **Viewports** – Define which viewports to generate. Acceptable values are `s`, `m`, `l`, `xl`, and `custom` (to include all custom resolutions defined with `-c`). If omitted, screenshots are generated for all default viewports and any custom resolutions

### Examples

#### 1️⃣ Full-page Screenshots for Default Viewports

Capture screenshots for the homepage, blog, bio, and contact pages:

```bash
snaprocket -h https://dawidrylko.com -p / /blog /bio /contact
```

#### 2️⃣ Screenshots with Height Limit for Selected Viewports

Capture screenshots with a height limit of 800 pixels for the "s" (small) and "xl" (extra-large) viewports:

```bash
snaprocket -h https://dawidrylko.com -p / /blog -H 800 -v s xl
```

#### 3️⃣ Screenshots with Custom Resolutions

Generate screenshots using two custom resolutions (800x600 and 1200x800). The `-v custom` flag ensures that only the specified custom viewports are processed:

```bash
snaprocket -h https://dawidrylko.com -p / -v custom -c 800x600 -c 1200x800
```

## 🗂️ Directory Structure

After execution, screenshots will be organized in the output directory as shown below:

```
📁 output_directory/
  └── dawidrylko.com/
      ├── s/
      ├── m/
      ├── l/
      └── xl/
```

**Note**: If custom viewports are used, an additional folder (e.g. `custom/`) will be created containing screenshots for each custom resolution.

## 📜 License

This project is licensed under the MIT License – see the [LICENSE](https://github.com/dawidrylko/snaprocket/blob/master/LICENSE) file for details.

## 👨‍💻 Author

Developed and maintained by [Dawid Ryłko](https://dawidrylko.com/).
