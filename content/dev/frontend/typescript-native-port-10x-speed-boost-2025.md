---
title: "TypeScript Native Port: A 10x Speed Boost Coming in 2025"
date: 2025-03-12
tags:
  - dev
  - frontend
  - TypeScript
---

> [!tldr]
> Microsoft is developing a native port of TypeScript compiler and tools that will deliver a staggering 10x performance improvement. Command-line typechecking preview is expected by mid-2025, with full project builds and language service support by late 2025. The native implementation drastically reduces startup time, build times, and memory usage while maintaining compatibility with existing TypeScript code.

## 🔗 Quick Links

- [TypeScript Native Port Announcement](https://devblogs.microsoft.com/typescript/typescript-native-port/)
- [TypeScript-Go GitHub Repository](https://github.com/microsoft/typescript-go)
- [TypeScript Community Discord](https://discord.gg/typescript)

## 🎬 Announcement Video

> ![youtube](https://www.youtube.com/watch?v=pNlq-EVld70)

## 🌐 Overview

The core value proposition of TypeScript has always been an excellent developer experience, but as codebases grow, TypeScript has struggled to scale efficiently. Developers working with large projects often face long load and check times, forcing them to choose between reasonable editor startup or a complete view of their source code.

To address these challenges, Microsoft has begun work on a native port of the TypeScript compiler and tools. This implementation promises to **drastically improve editor startup, reduce most build times by 10x, and substantially reduce memory usage**. By porting the current codebase, Microsoft expects to preview a native implementation of `tsc` capable of command-line typechecking by mid-2025, with a feature-complete solution for project builds and language service by the end of 2025.

## ⚡ Performance Improvements

The native implementation is already showing impressive results with popular TypeScript projects, including the TypeScript compiler itself. Here are the benchmarks for various codebases:

| Codebase               | Size (LOC) | Current | Native | Speedup |
| ---------------------- | ---------- | ------- | ------ | ------- |
| VS Code                | 1,505,000  | 77.8s   | 7.5s   | 10.4x   |
| Playwright             | 356,000    | 11.1s   | 1.1s   | 10.1x   |
| TypeORM                | 270,000    | 17.5s   | 1.3s   | 13.5x   |
| date-fns               | 104,000    | 6.5s    | 0.7s   | 9.5x    |
| tRPC (server + client) | 18,000     | 5.5s    | 0.6s   | 9.1x    |
| rxjs (observable)      | 2,100      | 1.1s    | 0.1s   | 11.0x   |

While the implementation isn't yet feature-complete, these numbers represent the order of magnitude improvement you can expect when checking most codebases.

## 🖥️ Editor Experience Benefits

The native port will significantly enhance the editor experience, which is where most developers spend their time. Using the VS Code codebase as a benchmark:

- **Current load time:** 9.6 seconds
- **Native load time:** 1.2 seconds
- **Improvement:** 8x faster project load time

This translates to a faster working experience from the moment you open your editor to your first keystroke in any TypeScript codebase. All projects should see similar load time improvements.

Additional benefits include:

- **Memory usage reduction** of approximately 50% (with further optimizations expected)
- **Improved responsiveness** for all language service operations:
  - Completion lists
  - Quick info
  - Go to definition
  - Find all references
- **Migration to Language Server Protocol (LSP)** for better alignment with other languages

## 📅 Versioning Roadmap

Microsoft has outlined a clear versioning strategy for this transition:

- **TypeScript 5.8:** Current release
- **TypeScript 5.9:** Coming soon
- **TypeScript 6.x:** Continued development of the JavaScript-based codebase with deprecations and breaking changes to align with the upcoming native version
- **TypeScript 7.0:** First release of the native implementation (when sufficient parity is reached)

For clarity, the versions will be referred to as TypeScript 6 (JS) and TypeScript 7 (native). Internally, you might also see references to "Strada" (original TypeScript codename) and "Corsa" (codename for the native port effort).

Microsoft plans to maintain the JavaScript codebase (6.x line) until TypeScript 7+ reaches sufficient maturity and adoption, recognizing that some projects may not be able to switch immediately due to API dependencies, legacy configurations, or other constraints.

## 🚀 What This Means for Developers

This massive performance boost opens up possibilities that were previously out of reach. The native port will enable:

1. **Instant, comprehensive error listings** across entire projects
2. **More advanced refactorings** that were previously too expensive to compute
3. **Deeper code insights** with minimal performance impact
4. **Better AI-powered tools** that can leverage the speed improvements to provide more contextual assistance

## 💁🏼‍♀️ Summary

The TypeScript native port represents a significant advancement in the JavaScript and TypeScript development ecosystem. With a projected 10x performance improvement, it aims to address long-standing issues with large-scale TypeScript projects while maintaining compatibility with existing code.

This initiative reinforces Microsoft's commitment to TypeScript as a cornerstone of modern web development. While the full release is still about a year away, the initial benchmarks are promising and suggest that the wait will be well worth it for developers dealing with TypeScript at scale.

The transition will be gradual, with both JavaScript and native implementations maintained in parallel until the ecosystem has had sufficient time to adapt. For now, developers can track progress, try out early builds, and prepare for what promises to be a transformative upgrade to the TypeScript experience.
