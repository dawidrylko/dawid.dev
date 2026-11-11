---
title: "Counting tilings with a row transfer matrix"
date: 2026-11-11
description: "How lattice-dimers counts domino and domicule tilings of rectangles, cylinders and tori with one cell-by-cell scan, and why exact counts need big integers."
tags:
  - dev
  - math
  - lattice-dimers
---

> [!tldr]
> The domicule solvers and every modular solver in [[dev/lattice-dimers/index|Lattice Dimers]] scan the board one cell at a time and keep, for each pattern of covered cells ahead of the scan, the number of ways to reach it. The BigInt domino and cylinder solvers step a row at a time with the same transfer matrix, and the domino formula solver evaluates a closed form. Gluing the left and right edges turns a rectangle into a cylinder, gluing the top and bottom as well makes it a torus, and only the boundary rule changes. The counts outgrow machine integers early, so the arithmetic is either exact big integers or residues modulo primes.

A domino covers two cells that share a side. A tiling lays dominoes on a board so that every cell is covered exactly once, which makes it a perfect matching of the grid graph. A **domicule** covers two cells that share a side or only a corner, so a domicule tiling is a perfect matching of the king's graph, where every cell is joined to its eight neighbours. The $2 \times 2$ board has 3 domicule tilings: two use straight pieces and the third uses two diagonal pieces that cross. The $8 \times 8$ board has 12,988,816 domino tilings and 3,263,262,629,905 domicule tilings.

## The scan

Cells are processed in row-major order. A cell is either covered already or it is matched to a later neighbour: the right one or the one below for a domino, and also the down-left and down-right ones for a domicule. The state records which of the cells ahead are covered. A domicule can reach a cell $w + 1$ places ahead, so its state has $w + 2$ bits, four times as many states as the domino scan with $2^w$. After the last cell the count is the weight of the empty state.

```python
from collections import defaultdict

DOMINO = [(0, 1), (1, 0)]
DOMICULE = [(0, 1), (1, -1), (1, 0), (1, 1)]

def count(h, w, moves):
    states = {0: 1}
    for r in range(h):
        for c in range(w):
            nxt = defaultdict(int)
            for mask, n in states.items():
                if mask & 1:
                    nxt[mask >> 1] += n
                    continue
                for dr, dc in moves:
                    r2, c2 = r + dr, c + dc
                    if not (0 <= r2 < h and 0 <= c2 < w):
                        continue
                    k = dr * w + dc
                    if not (mask >> k) & 1:
                        nxt[(mask | 1 << k) >> 1] += n
            states = nxt
    return states.get(0, 0)
```

This sketch is not the repository's code. It reproduces the numbers the solvers give: `count(2, 2, DOMICULE)` gives 3, `count(8, 8, DOMINO)` gives 12988816 and `count(8, 8, DOMICULE)` gives 3263262629905.

A row is $w$ cell steps. Chained, they form the row transfer matrix $T = T_{w-1} \cdots T_0$, which acts on the $2^w$ sets $A$ of cells of the next row that the current row already covers. A strip of $K$ rows has $Z(K, w) = e_0^{\top} T^K e_0$ tilings, with $e_0$ the empty state. The cost grows with the shorter side, so the domino solver turns the board until the shorter side is the row width.

## Rectangle, cylinder, torus

The surface decides what happens at the edges of a row and after the last row.

| surface | glued edges | how the count is read |
| --- | --- | --- |
| rectangle | none | the weight of the empty state after the last cell |
| cylinder | left and right | the same entry of $T^h$, with neighbours taken modulo $w$ |
| torus | left and right, top and bottom | the trace of $T^h$ in the row form; in the cell form a sum over the first-row sets $S$ |

On a cylinder a piece can cross the seam between the last and the first column. A domicule from the first column to the last column of the next row lies $2w - 1$ cells ahead, outside the $w + 2$ window, so for $w \ge 3$ the state carries one extra bit until the scan gets there.

On a torus the cell scan runs once per set $S$ of first-row cells covered from the last row, starts from $S$ and has to end with $S$. Rotating the columns maps the runs of $S$ onto those of its rotations, so one run per rotation class is enough. Small circumferences have two quirks. On a ring of two cells a cell meets its right and its left neighbour in the same cell, each such edge counts as a separate piece, and one row of two cells has 2 tilings. A row of odd circumference has an odd number of cells, so the counts vanish at odd heights.

## Naming the solvers

Every solver id has the form `<pieces>-<surface>-<method>`.

| segment | values | meaning |
| --- | --- | --- |
| pieces | `domino`, `domicule`, `all-lattices` | the piece, or one solver for the square lattice, the triangular lattice and the king's graph, picked with `--lattice` |
| surface | `rectangle`, `cylinder-torus` | the glued edges; one solver covers cylinders and tori |
| method | `formula`, `bigint`, `number`, `modular`, `polynomial-modular`, `polynomial-bigint` | closed form; scan with `BigInt` counts; scan with JavaScript numbers; scan modulo primes; the last two count by the number of diagonal pieces |

The README lists 13 algorithms, each implemented in Rust, Python and JavaScript. Algorithms whose ids differ only in the method count the same boards, and a test fails when such twins disagree on a count.

## Why the counts need big integers

Dominoes have a closed form. Kasteleyn and Fisher found in 1961 that the $2n \times 2n$ board has

$$a(n) = \prod_{j=1}^{n} \prod_{k=1}^{n} \left( 4\cos^2\frac{j\pi}{2n+1} + 4\cos^2\frac{k\pi}{2n+1} \right)$$

tilings. Evaluated with floating-point cosines the product keeps a relative error near $10^{-16}$ and loses its last digits from $12 \times 12$ on, because the count has more than 16 digits by then. The solver evaluates it exactly instead. The numbers $4\cos^2(j\pi/(2n+1))$ are the roots of a monic integer polynomial $P$ of degree $n$, and the double product is, up to sign, the resultant of $P(x)$ and $P(-x)$:

$$a(n) = (-1)^n \operatorname{Res}\bigl(P(x), P(-x)\bigr), \qquad P(x^2) = U_{2n}(x/2)$$

The resultant is the determinant of an integer matrix, and fraction-free Bareiss elimination keeps every intermediate value an integer. That is also the one-line PARI/GP program of [OEIS A004003](https://oeis.org/A004003).

For the king's graph no determinantal formula is known ([[the-dimer-entropy-of-the-kings-graph|why]]), so the scan is the method. The `Number` solver is exact only while the count stays below $2^{53}$, which for dominoes means up to $10 \times 10$. A004003(45), the $90 \times 90$ board, has 1015 digits, and the domicule count of the $20 \times 20$ board has 90. Two exact routes remain: `BigInt` counts inside the scan, or the scan modulo primes with one reconstruction at the end ([[modular-counting-with-the-chinese-remainder-theorem|the modular solver]]).

## Sources

1. Dawid Ryłko, [lattice-dimers, README](https://github.com/dawidrylko/lattice-dimers/blob/master/README.md): the solver table, 13 algorithms in three languages.
2. Dawid Ryłko, [lattice-dimers, glossary](https://github.com/dawidrylko/lattice-dimers/blob/master/docs/glossary.md): the solver id grammar and twin algorithms.
3. Dawid Ryłko, [Dominoes: tilings of the 2n × 2n board](https://github.com/dawidrylko/lattice-dimers/blob/master/notes/dominoes/01-rectangles.md): the closed form, the resultant, the `Number` limit and the row-width rule.
4. Dawid Ryłko, [Domicules: tilings of the 2n × 2n board](https://github.com/dawidrylko/lattice-dimers/blob/master/notes/domicules/01-rectangles.md): the domicule scan, its state size and the 20 × 20 count.
5. Dawid Ryłko, [Domicules: tilings of cylinders](https://github.com/dawidrylko/lattice-dimers/blob/master/notes/domicules/02-cylinders.md): the seam bit and the small circumferences.
6. Dawid Ryłko, [Domicules: tilings of the 2n × 2n torus](https://github.com/dawidrylko/lattice-dimers/blob/master/notes/domicules/03-tori.md): the sum over first-row sets and the rotation classes.
7. Dawid Ryłko, [The dimer entropy of the king's graph](https://doi.org/10.5281/zenodo.23686056), Zenodo: the row transfer matrix and its state space.
8. Dawid Ryłko, [lattice-dimers, A004003 entry notes](https://github.com/dawidrylko/lattice-dimers/blob/master/oeis/A004003/README.md): the digit count of the 90 × 90 board.
9. OEIS Foundation, [A004003](https://oeis.org/A004003): domino tilings of the 2n × 2n square.
10. P. W. Kasteleyn, [The statistics of dimers on a lattice](https://doi.org/10.1016/0031-8914(61)90063-5), Physica 27, 1961.
11. M. E. Fisher, [Statistical mechanics of dimers on a plane lattice](https://doi.org/10.1103/PhysRev.124.1664), Physical Review 124, 1961.
12. E. H. Bareiss, [Sylvester's identity and multistep integer-preserving Gaussian elimination](https://doi.org/10.1090/S0025-5718-1968-0226829-0), Mathematics of Computation 22, 1968.
