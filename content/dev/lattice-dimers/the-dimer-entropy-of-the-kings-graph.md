---
title: "The dimer entropy of the king's graph"
date: 2026-11-11
description: "Entropy per site of dimers on the king's graph: the estimate 0.5655119110413253 ± 6·10⁻¹⁶ and proved bounds from computer-assisted certificates."
tags:
  - dev
  - math
  - lattice-dimers
---

> [!tldr]
> The king's graph has no Pfaffian orientation once both sides of the board reach 3, so Kasteleyn's method cannot count its perfect matchings. Row transfer matrices on cylinders up to circumference 25 give the entropy per site **s = 0.5655119110413253 ± 6·10⁻¹⁶**, a non-rigorous estimate, and Collatz-Wielandt certificates prove **0.545343749727 ≤ s ≤ 0.582767477484**. The full argument is in the paper, [doi:10.5281/zenodo.23686056](https://doi.org/10.5281/zenodo.23686056).

## The quantity and why Kasteleyn's method stops

The entropy per site of the perfect matchings of the king's graph is

$$s = \lim_{m, n \to \infty} \frac{\log Z(m, n)}{mn},$$

where $Z(m, n)$ is the number of perfect matchings of the $m \times n$ board, that is the number of domicule tilings ([[counting-tilings-with-a-row-transfer-matrix|the scan that counts them]]). For dominoes $s = G/\pi$ with Catalan's constant $G$, by the Pfaffian method of Kasteleyn and of Temperley and Fisher. The triangular lattice is planar, so a Pfaffian orientation exists there too. The king's graph is not planar: the $5 \times 5$ board has 72 edges, more than $3 \cdot 25 - 6 = 69$.

Planarity is only sufficient for a Pfaffian orientation. The paper proves the stronger statement: a king board $B(K, L)$ with $KL$ even has a Pfaffian orientation if and only if $\min(K, L) \le 2$. The core is the corner $B(3, 4)$ with 29 edges and 43 perfect matchings: the linear system over $\mathrm{GF}(2)$ that a Pfaffian orientation would have to solve is inconsistent (exact Gaussian elimination, which finds the contradiction after 23 of the equations), and the corner or its transpose $B(4, 3)$ is a conformal subgraph of every board with both sides at least 3. No determinantal formula for $Z$ is known. As far as I know, no numerical value of $s$ had been published.

## Cylinders and parity sectors

On a cylinder of circumference $w$ the row transfer matrix $T$ acts on $2^w$ states, and $Z(K, w) = e_0^{\top} T^K e_0$. Let $A_r$ be the set of cells of row $r$ covered from the row above and $h_r$ the number of dimers inside row $r$. Counting cells gives $w = |A_r| + 2h_r + |A_{r+1}|$, so $|A_{r+1}| \equiv w - |A_r| \pmod 2$. The parity of $|A|$, the number of dimers crossing a loop around the axis, is conserved by $T^2$, and by $T$ for even $w$. That splits the matrix into two sectors, and for even $w$ their leading eigenvalues bracket $s$ in all the data. For odd $w$ one sector is enough.

With $\lambda_w$ the leading eigenvalue, $f_w = \log\lambda_w / w$ climbs to $s$ and the differences $d_w = f_w - f_{w-2}$ shrink by a ratio that drifts from 13.4 at $w = 9$ to 10.0 at $w = 25$. Each width doubles the state vector. At $w = 25$ it takes 8.4 GiB.

| $w$ | $f_w$ | $d_w$ | extrapolated $s_w$ |
| --- | --- | --- | --- |
| 13 | 0.5655119032044848 | $7.943 \cdot 10^{-8}$ | 0.5655119106414456 |
| 17 | 0.5655119109720268 | $6.582 \cdot 10^{-10}$ | 0.5655119110391899 |
| 21 | 0.5655119110406597 | $6.071 \cdot 10^{-12}$ | 0.5655119110413121 |
| 25 | 0.5655119110413186 | $5.994 \cdot 10^{-14}$ | 0.5655119110413253 |

## From a table to an error bar

The corrections follow the gap inside a sector: at $w = 20$ the sparse eigensolver ARPACK gives $m = \log(\lambda_1 / |\lambda_3|) = 1.082727$ per row, and the power iterations give the same value at every width from 20 to 25. By analogy with Lüscher's finite-size shifts in massive field theory I fit $d_w = C e^{-mw} w^{-3/2} (1 + c_1/w)$. The power $w^{-3/2}$ and the factor $1 + c_1/w$ are an ansatz, not a derived form.

Ten extrapolation models run on two sequences: the odd widths up to 25 and the midpoints of the even-width brackets up to 24, both recomputed in extended precision (64-bit mantissa). A model is kept when removing the last width moves its estimate by less than 1% of the last correction. All but the geometric one pass, and the 18 kept estimates lie in $[0.56551191104132527,\ 0.56551191104132534]$. The error bar has four terms:

| term | size | what it covers |
| --- | --- | --- |
| model form | $9.0 \cdot 10^{-17}$ | half-spread of the kept estimates plus the largest predicted remaining error |
| hidden slow mode | $3.4 \cdot 10^{-17}$ | an extra decaying term at the slowest rate seen in the data |
| gap | $6 \cdot 10^{-20}$ | the change of the main model over the measured gaps |
| rounding | $1.5 \cdot 10^{-16}$ | the change between float64 and extended-precision inputs |
| total | $2.7 \cdot 10^{-16}$ | quoted as $6 \cdot 10^{-16}$, a little more than twice |

This is an estimate and not a bound: the budget assumes that no correction slower than those in the data appears beyond $w = 25$. A transfer-matrix code written from scratch reproduces the cylinder values per site to $7.8 \cdot 10^{-20}$. It also reaches widths 26 and 27, where the new differences agree with the predictions of the main model to $1.9 \cdot 10^{-4}$ and $1.5 \cdot 10^{-4}$ relative. Those widths stay out of the estimate. The 14 digits shared by both ends of the error bar are what I submitted to the OEIS as a proposed draft.

## Rigorous bounds

The bounds come from strips of width 24 with free sides. The lower bound uses superadditivity: for even $K$, placing $k$ strips of width $w$ side by side and filling the last $r$ columns with vertical dominoes gives $Z(K, kw + r) \ge Z(K, w)^k$, so the growth rate per site of any strip is a lower bound for $s$. A Collatz-Wielandt vector $v \ge 0$ with $Av \ge cv$ for the free-strip transfer $A = T^2$ certifies $\lambda_w^2 \ge c$.

The upper bound cuts the board into strips of width $w$. The number of matchings across a cut is at most a Fibonacci number in the number of crossing cells, and a finer bound uses the runs of consecutive crossing cells. Giving each cell that is covered from outside a weight yields $Z(K, kw) \le W(K, w)^k$ for the weighted strip count $W$, and a vector with $Av \le Cv$ bounds $W$.

| $w$ | lower bound | upper, uniform weight | upper, run weights |
| --- | --- | --- | --- |
| 4 | 0.445893077494 | 0.689765394232 | 0.669090528409 |
| 8 | 0.505014525148 | 0.627626147026 | 0.617278850986 |
| 12 | 0.525175645897 | 0.606921301094 | 0.600023045982 |
| 16 | 0.535259669620 | 0.596568952598 | 0.591395260725 |
| 20 | 0.541310117470 | 0.590357544276 | 0.586218590772 |
| 24 | **0.545343749727** | 0.586216605404 | **0.582767477484** |

The Kahn-Lovász bound gives only $s \le \log(8!)/16 = 0.662787681422$. The proof is computer-assisted. The certificates are evaluated in IEEE binary64 arithmetic with round to nearest, and a rounding analysis bounds the error at $3.2 \cdot 10^{-14}$ at $w = 24$ against a margin of $10^{-12}$ built into $c$ and $C$. The proof also assumes that the transfer matrix is the right matrix. It is validated against brute-force enumeration on 90 small boards. It is not formally verified.

## What else the paper estimates

| quantity | value | status |
| --- | --- | --- |
| surface free energy $\sigma$ of a free edge | $0.242017935766251 \pm 9 \cdot 10^{-15}$ | estimate |
| corner free energy $\kappa$ | $0.36319625605 \pm 3 \cdot 10^{-10}$ | estimate |
| decay length $\xi$ of the parity splitting | $1.236091 \pm 10^{-6}$ | numerical estimate |

The free energies give the growth of A239273, $a(n) \sim C\, d^{\,n^2} f^{-n}$ with $C = e^{\kappa} = 1.437918032$, $d = e^{4s} = 9.60273202731337$ and $f = e^{8\sigma} = 6.931966132248$. The relative error is $-2.0 \cdot 10^{-9}$ at $n = 12$ and shrinks by a factor of about 5.6 per step. Two sign properties of the strip growth rates would give ten digits, $0.565511911035 \le s \le 0.565511911049$; they hold wherever I can compute and are the subject of [[log-convexity-of-strip-dimer-counts-on-the-kings-graph|the companion note]].

Every number of the paper is mapped to the file and the script that wrote it in `paper/NUMBERS.md`, at the tag `king-entropy-v1.0.0`. The paper is CC BY 4.0, the code is MIT.

## Sources

1. Dawid Ryłko, [The dimer entropy of the king's graph](https://doi.org/10.5281/zenodo.23686056), Zenodo (PDF: [king-entropy.pdf](https://dawidrylko.github.io/lattice-dimers/papers/king-entropy.pdf)): all results of this note.
2. Dawid Ryłko, [The dimer entropy of the king's graph: transfer-matrix scripts, data and outputs](https://doi.org/10.5281/zenodo.23686293), Zenodo: code and data of the tag `king-entropy-v1.0.0`.
3. Dawid Ryłko, [paper/NUMBERS.md](https://github.com/dawidrylko/lattice-dimers/blob/master/research/king-entropy/paper/NUMBERS.md): the map from every number to its file and script.
4. Dawid Ryłko, [king-entropy.tex](https://github.com/dawidrylko/lattice-dimers/blob/master/research/king-entropy/paper/king-entropy.tex): the LaTeX source, theorem and table numbers.
5. Dawid Ryłko, [Research: the dimer entropy of the king's graph](https://github.com/dawidrylko/lattice-dimers/blob/master/notes/00-research.md): the results table and the asymptotics of A239273.
6. P. W. Kasteleyn, [The statistics of dimers on a lattice](https://doi.org/10.1016/0031-8914(61)90063-5), Physica 27, 1961.
7. N. Alon and S. Friedland, [The maximum number of perfect matchings in graphs with a given degree sequence](https://doi.org/10.37236/888), Electronic Journal of Combinatorics 15, 2008: the Kahn-Lovász bound.
8. H. N. V. Temperley and M. E. Fisher, [Dimer problem in statistical mechanics: an exact result](https://doi.org/10.1080/14786436108243366), Philosophical Magazine 6, 1961.
9. M. Lüscher, [Volume dependence of the energy spectrum in massive quantum field theories. I. Stable particle states](https://doi.org/10.1007/BF01211589), Communications in Mathematical Physics 104, 1986: the finite-size form behind the fit.
