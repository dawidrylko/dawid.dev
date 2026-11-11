---
title: "Contributing to the OEIS from a code repository"
date: 2026-11-11
description: "How lattice-dimers keeps OEIS entry texts, b-files rebuilt from committed exact counts and PARI/GP programs next to the code, with the OEIS as master copy."
tags:
  - dev
  - math
  - lattice-dimers
---

> [!tldr]
> Each OEIS entry that [[dev/lattice-dimers/index|Lattice Dimers]] touches has a directory with the entry text, the b-file, the PARI/GP program and a README. The b-files are rebuilt by a script from exact counts committed in the repository, and for A004003 from the resultant solver, so no number is typed in by hand. **The OEIS holds the authoritative copy**, and editors may still change a proposed draft before they approve it.

## One directory per entry

The `oeis/` directory has a subdirectory for each entry. It holds the entry text `A*.txt`, the b-file `b*.txt` where there is one, the PARI/GP program `A*.gp` and a README with the contribution and its status.

The entry texts are in the OEIS internal format. Published lines come from `https://oeis.org/search?q=id:<A-number>&fmt=text`. A proposed draft exists only as the HTML of its draft page, so its text is reconstructed from that page. A new entry is stored in full, with the data on one `%S` line. For an existing entry the file holds only the lines this repository contributed: a `%F` formula line, a `%H` link to the b-file, `%o` program lines.

| entry | what the repository contributed | status |
| --- | --- | --- |
| [A004003](https://oeis.org/A004003) | the formula $a(n) = (-1)^n \operatorname{Res}(P(x), P(-x))$ and its PARI program | approved |
| [A239264](https://oeis.org/A239264) | the PARI program and the b-file extended to antidiagonal 46 | approved |
| [A239273](https://oeis.org/A239273) | the b-file for $n = 0, \dots, 12$ and a one-line PARI program | approved |
| [A401670](https://oeis.org/A401670) | new entry: domicule tilings of the $2n \times 2n$ torus | approved |
| [A401673](https://oeis.org/A401673) | new entry: triangle of the $2n \times 2n$ domicule tilings by the number of diagonal domicules, with the b-file | approved |

## b-files from committed counts

`node oeis/buildBFiles.js` rebuilds the b-files from the exact counts committed in the repository, and for A004003 from the resultant solver, and the README of each entry names the source.

| b-file | terms | source of the numbers |
| --- | --- | --- |
| A004003 | $n = 0, \dots, 44$ | the resultant solver `domino-rectangle-formula.js` |
| A239264 | antidiagonals 0 to 46, 1128 terms | the strip counts in `research/king-entropy/data/zex` |
| A239273 | $n = 0, \dots, 12$ | the same strip counts |
| A401670 | $n = 0, \dots, 8$ | `spec/cases/all-lattices-cylinder-torus-modular.json` |
| A401673 | rows 0 to 10, 396 terms | `spec/cases/domicule-rectangle-polynomial-modular.json` |

The script stops when two strip files disagree on a count or when a board has no count, so a missing number never turns into a guessed one. Where a b-file is already published, the rebuilt file is compared with it, and the files for A004003, A239264, A239273 and A401673 are identical to the published ones. The A004003 b-file is therefore not a contribution: it reproduces the published file from the formula and checks the formula against it. The A401670 b-file holds the terms of the data line and is not submitted. A second, independent program, `kd.c` in the replication directory, recomputes every strip file with 0 mismatches.

Each b-file ends where the data ends. $a(45)$ of A004003 has 1015 digits, more than a b-file line may hold. $a(13)$ of A239273 needs the $26 \times 26$ board. Antidiagonal 47 of A239264 needs strips of widths 21, 22 and 23 up to lengths 26, 25 and 24, and the data reach 24, 24 and 20.

## PARI/GP programs

The `%o` lines of an entry are condensed, so the repository keeps the readable version in `A*.gp`. The A004003 program is the resultant formula from [[counting-tilings-with-a-row-transfer-matrix|the first note]]:

```gp
a(n) = my(P = substpol(polchebyshev(2*n, 2, x/2), x^2, x)); (-1)^n * polresultant(P, subst(P, x, -x));
```

`A239264.gp` defines `T(h, w)` as the same cell-by-cell scan, a broken-profile dynamic programme over $2^{w+2}$ states. `A239273.gp` reads it and sets `a(n) = T(2*n, 2*n);`. `A401670.gp` defines `T(h, w)` for the torus, and `A401673.gp` a polynomial in the weight of a diagonal piece. CI runs the programs against the same data as the solvers: the A004003 program up to $20 \times 20$, and the domicule programs against A239273 up to $12 \times 12$ and the rectangles of the test data of A239264.

## Which copy wins

The OEIS is the authoritative copy of an entry. The files in the repository are a working copy next to the code that produces the numbers. A new entry first appears as a proposed draft, and editors review it and may change it before they approve it. The entry with the entropy constant of the king's graph went to the OEIS this way, as a draft.

## Sources

1. Dawid Ryłko, [lattice-dimers, oeis/README.md](https://github.com/dawidrylko/lattice-dimers/blob/master/oeis/README.md): directory layout, entry text format, b-files, authority of the OEIS.
2. Dawid Ryłko, [lattice-dimers, oeis/buildBFiles.js](https://github.com/dawidrylko/lattice-dimers/blob/master/oeis/buildBFiles.js): the b-file builder and its sources.
3. Dawid Ryłko, [A004003 entry notes](https://github.com/dawidrylko/lattice-dimers/blob/master/oeis/A004003/README.md): contribution, b-file limit.
4. Dawid Ryłko, [A239264 entry notes](https://github.com/dawidrylko/lattice-dimers/blob/master/oeis/A239264/README.md): b-file extension, independent recomputation, limit.
5. Dawid Ryłko, [A239273 entry notes](https://github.com/dawidrylko/lattice-dimers/blob/master/oeis/A239273/README.md): b-file and its limit.
6. Dawid Ryłko, [A401670 entry notes](https://github.com/dawidrylko/lattice-dimers/blob/master/oeis/A401670/README.md) and [A401673 entry notes](https://github.com/dawidrylko/lattice-dimers/blob/master/oeis/A401673/README.md): the new entries and their b-files.
7. Dawid Ryłko, [A004003.gp](https://github.com/dawidrylko/lattice-dimers/blob/master/oeis/A004003/A004003.gp) and [A239264.gp](https://github.com/dawidrylko/lattice-dimers/blob/master/oeis/A239264/A239264.gp): the PARI/GP programs.
8. Dawid Ryłko, [Domicules: tilings of the 2n × 2n board](https://github.com/dawidrylko/lattice-dimers/blob/master/notes/domicules/01-rectangles.md): the CI checks of the PARI/GP programs.
9. OEIS Foundation, [The On-Line Encyclopedia of Integer Sequences](https://oeis.org): the entries A004003, A239264, A239273, A401670 and A401673.
