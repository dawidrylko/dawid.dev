---
title: "Lattice Dimers"
date: 2026-11-11
description: "My open project on domino and domicule tilings: exact solvers in Rust, Python and JavaScript, a paper and a companion note on the king's graph, OEIS entries and a site."
tags:
  - dev
  - math
  - lattice-dimers
---

> [!tldr]
> Lattice Dimers is my open project on dimer coverings of two lattices: the square lattice, whose perfect matchings are domino tilings, and the king's graph, the square lattice with both diagonals, whose perfect matchings are domicule tilings. It holds exact solvers in Rust, Python and JavaScript, a paper and a companion note on the entropy of the king's graph, contributions to five OEIS entries, two of them new, and a site with notebooks, a gallery and benchmarks.

## What it is

A domino covers two cells that share a side. A domicule covers two cells that share a side or only a corner. Counting their tilings of rectangles, cylinders and tori exactly is the engineering half of the project. For dominoes the count has a closed form. For the king's graph, Kasteleyn's method does not apply, so the counts come from transfer matrices and the research half is the entropy per site of those tilings.

The project began as two blog posts in Polish, [Domino Tiling](https://dawidrylko.com/domino-tiling/) (in Polish) and [Domino tiling library](https://dawidrylko.com/domino-tiling-library/) (in Polish), which describe the first domino solvers and their test and benchmark runners. The domicule solvers, the research on the king's graph and the OEIS entries grew from that code.

## What it holds

- Solvers: 13 algorithms for rectangles, cylinders and tori, each in Rust, Python and JavaScript.
- Research: the paper *The dimer entropy of the king's graph* and the companion note *Log-convexity of strip dimer counts on the king's graph*, with scripts, data and proofs.
- OEIS: entry texts, b-files and PARI/GP programs for five sequences.
- The site: a gallery that draws and numbers tilings, benchmark tables and notebooks whose code cells run when the site is built.

## Notes

- [[counting-tilings-with-a-row-transfer-matrix|Counting tilings with a row transfer matrix]]: the cell-by-cell scan behind the solvers, the three surfaces and the solver names.
- [[modular-counting-with-the-chinese-remainder-theorem|The modular solver and the Chinese remainder theorem]]: counting modulo primes and rebuilding the exact number.
- [[the-dimer-entropy-of-the-kings-graph|The dimer entropy of the king's graph]]: the estimate, the proved bounds and what each rests on.
- [[log-convexity-of-strip-dimer-counts-on-the-kings-graph|Log-convexity of strip dimer counts on the king's graph]]: what is tested, what fails and what is conjectured.
- [[contributing-to-the-oeis-from-a-code-repository|Contributing to the OEIS from a code repository]]: entry texts, b-files and programs kept next to the code.

## Links

| what | where |
| --- | --- |
| Site with notebooks, gallery and benchmarks | [dawidrylko.github.io/lattice-dimers](https://dawidrylko.github.io/lattice-dimers/) |
| Repository | [github.com/dawidrylko/lattice-dimers](https://github.com/dawidrylko/lattice-dimers) |
| Code and data, tag `king-entropy-v1.0.0` | [doi:10.5281/zenodo.23686293](https://doi.org/10.5281/zenodo.23686293) |
| Paper, *The dimer entropy of the king's graph* | [doi:10.5281/zenodo.23686056](https://doi.org/10.5281/zenodo.23686056), [PDF](https://dawidrylko.github.io/lattice-dimers/papers/king-entropy.pdf) |
| Note, *Log-convexity of strip dimer counts on the king's graph* | [doi:10.5281/zenodo.23686087](https://doi.org/10.5281/zenodo.23686087), [PDF](https://dawidrylko.github.io/lattice-dimers/papers/king-entropy-log-convexity.pdf) |
| [A004003](https://oeis.org/A004003) | domino tilings of the $2n \times 2n$ square |
| [A239264](https://oeis.org/A239264) | domicule tilings of the $h \times w$ rectangle |
| [A239273](https://oeis.org/A239273) | domicule tilings of the $2n \times 2n$ square |
| [A401670](https://oeis.org/A401670) | domicule tilings of the $2n \times 2n$ torus |
| [A401673](https://oeis.org/A401673) | domicule tilings of the $2n \times 2n$ square by the number of diagonal domicules |

The code is MIT. The papers, notes and data are CC BY 4.0. Author: Dawid Ryłko, ORCID [0009-0008-6307-9015](https://orcid.org/0009-0008-6307-9015).
