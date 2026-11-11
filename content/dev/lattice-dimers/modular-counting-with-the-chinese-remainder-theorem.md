---
title: "The modular solver and the Chinese remainder theorem"
date: 2026-11-11
description: "Counting tilings modulo primes below 2^31, rebuilding the exact count with the Chinese remainder theorem and checking it against a spare prime."
tags:
  - dev
  - math
  - lattice-dimers
---

> [!tldr]
> The cell scan only adds, so it can run on residues modulo a prime $p < 2^{31}$ and stay in 32-bit cells. The modular solver counts modulo enough primes for their product to exceed a bound on the number of perfect matchings, rebuilds the exact count with the Chinese remainder theorem, and stops when one extra prime disagrees with the result.

## Why residues

The scan from [[counting-tilings-with-a-row-transfer-matrix|the previous note]] only adds counts. Modulo a prime $p < 2^{31}$ the sum of two residues stays below $2^{32}$ and fits a `Uint32Array` cell, so the table holds 32-bit words however large the true count is. The JavaScript solver counts modulo several primes in parallel worker threads. The Rust and Python implementations do the same. Arbitrary-precision arithmetic is paid once, in the reconstruction at the end, and not at every cell step. The gallery on the project site relies on the same idea: a few primes per browser worker number a sampled tiling.

## How many primes

The product of the primes has to exceed the count. The bound comes from the Kahn-Lovász theorem, proved by Alon and Friedland, which limits the number of perfect matchings of a graph with vertex degrees $d(v)$:

$$\#\text{perfect matchings} \le \prod_{v} \bigl(d(v)!\bigr)^{1/(2d(v))}$$

Every prime the solver takes from the top of the range below $2^{31}$ is above $2^{30}$ and contributes at least 30 bits, so $\lceil (\log_2 B + 1)/30 \rceil$ primes suffice for a bound $B$. One more prime is the check: the rebuilt count must agree with the residue modulo that prime, and a mismatch stops the solver.

The research scripts use the same scheme with 60-bit primes. The exact counts of the boards up to $24 \times 24$ were computed modulo ten primes, and the companion note on [[log-convexity-of-strip-dimer-counts-on-the-kings-graph|log-convexity]] chooses the number of primes so that their product exceeds the Kahn-Lovász bound.

## The reconstruction on an example

The domicule count of the $8 \times 8$ board, 3,263,262,629,905, is larger than any prime below $2^{31} = 2{,}147{,}483{,}648$, so one residue cannot hold it. Take the two largest primes below $2^{31}$, $p_1 = 2147483647$ and $p_2 = 2147483629$. The count leaves the residues $r_1 = 1234970112$ and $r_2 = 1234997454$. The Chinese remainder theorem gives a unique value modulo $p_1 p_2 = 4611685975477714963$, which already exceeds the count:

```python
p1, p2 = 2147483647, 2147483629
r1, r2 = 1234970112, 1234997454
t = (r2 - r1) * pow(p1, -1, p2) % p2
print(r1 + p1 * t)
```

This prints 3263262629905. The snippet is a two-modulus Garner step written for this note, not the repository's code. The third prime, $p_3 = 2147483587$, is the check: the count leaves the residue 1235061252 modulo $p_3$, and so does the rebuilt number. The repository runs this combination in a notebook cell on every site build and fails the build when the rebuilt count differs.

## Where the solver is checked

| check | what it compares |
| --- | --- |
| spare prime | the rebuilt count against its residue modulo one extra prime, on every run |
| `BigInt` solver | in every language it is the reference of the modular solver, and a test fails when the twin algorithms disagree on a board |
| OEIS | both domicule solvers against A239273 and the data section of A239264; `BigInt` counts boards up to $16 \times 16$, the modular solver $18 \times 18$ and $20 \times 20$, and $a(10)$ matches the A239273 b-file |
| cylinders | the modular count against the `BigInt` count at height 8 for circumferences 2 to 8; the full test run sends the king's graph cylinders of the test data through both |
| tori | both solvers agree up to $8 \times 8$; the modular solver alone counts $10 \times 10$ and $12 \times 12$ |

The torus boards beyond $12 \times 12$ come from the modular solver alone, written once into the test data. For those the spare prime is the check that runs with the count.

## Sources

1. Dawid Ryłko, [Domicules: tilings of the 2n × 2n board](https://github.com/dawidrylko/lattice-dimers/blob/master/notes/domicules/01-rectangles.md): the modular solver, the prime count, the CRT cell and the verification list.
2. Dawid Ryłko, [Domicules: tilings of cylinders](https://github.com/dawidrylko/lattice-dimers/blob/master/notes/domicules/02-cylinders.md): the modular and `BigInt` comparison at height 8.
3. Dawid Ryłko, [Domicules: tilings of the 2n × 2n torus](https://github.com/dawidrylko/lattice-dimers/blob/master/notes/domicules/03-tori.md): the boards counted by both solvers and by the modular solver alone.
4. Dawid Ryłko, [Dominoes: tilings of the 2n × 2n board](https://github.com/dawidrylko/lattice-dimers/blob/master/notes/dominoes/01-rectangles.md): the browser workers and the primes below 2^31.
5. Dawid Ryłko, [lattice-dimers, glossary](https://github.com/dawidrylko/lattice-dimers/blob/master/docs/glossary.md): twin algorithms and the `BigInt` reference.
6. Dawid Ryłko, [The dimer entropy of the king's graph](https://doi.org/10.5281/zenodo.23686056), Zenodo: exact counts up to 24 × 24 modulo ten primes.
7. Dawid Ryłko, [Log-convexity of strip dimer counts on the king's graph](https://doi.org/10.5281/zenodo.23686087), Zenodo: 60-bit primes and the Kahn-Lovász bound.
8. N. Alon and S. Friedland, [The maximum number of perfect matchings in graphs with a given degree sequence](https://doi.org/10.37236/888), Electronic Journal of Combinatorics 15, 2008.
