---
title: "Log-convexity of strip dimer counts on the king's graph"
date: 2026-11-11
description: "Strip dimer counts on the king's graph are log-convex in 1453 tested cases, but the property is not structural. What is proved, tested and conjectured."
tags:
  - dev
  - math
  - lattice-dimers
---

> [!tldr]
> Let $Z(k, m)$ be the number of domicule tilings of the $k \times m$ board. In all **1453 cases** I tested, $q \mapsto Z(2q, m)$ is log-convex. That finite statement is neither proved nor conjectured: it fails on the triangular lattice, under unequal diagonal weights and for larger equal weights. The conjecture is its limit, convexity of the strip growth rates, which would give $s \ge 0.565511911035$ for the entropy per site.

## The statements

$Z(k, m)$ is the number of perfect matchings of the king's graph on the $k \times m$ board, the array [OEIS A239264](https://oeis.org/A239264). The growth rate $\lambda_k$ of the free strip of width $k$ is defined by $\lambda_k^2 = \lim_{j \to \infty} Z(2j, k)^{1/j}$, and $a_k = \log\lambda_k$ for $k \ge 2$, with $a_0 = a_1 = 0$. Three statements matter.

(L), the finite form, which I do not conjecture:

$$Z(2q, m)^2 \le Z(2q-2, m)\, Z(2q+2, m) \quad \text{for all } m \ge 1,\ q \ge 1.$$

(L$_\infty$), the conjecture of the paper: $a_{2q+2} - 2a_{2q} + a_{2q-2} \ge 0$ for all $q \ge 1$.

(O), the second conjecture: $a_{k+1} - a_k \ge s$ for every odd $k$.

(L) implies (L$_\infty$). It makes $q \mapsto m^{-1}\log Z(2q, m)$ convex for every $m$, these sequences tend to $a_{2q}$ along even $m$ because $Z(2q, m) = Z(m, 2q)$, and a pointwise limit of convex sequences is convex.

The reason to care is the entropy bound. For hard squares a symmetric strip transfer matrix gives the Calkin-Wilf lower bounds from differences of strip growth rates. For the king's graph the same bounds would read $(a_{2q+p} - a_{2q})/p \le s$. Under (L$_\infty$) the increments $a_{2q+2} - a_{2q}$ increase to $2s$, so $s \ge (a_{24} - a_{22})/2$, and certified values of $\lambda_{22}$ and $\lambda_{24}$ turn that into $s \ge 0.565511911035$. Under (O), $s \le a_{24} - a_{23}$ gives $s \le 0.565511911049$. Strip bounds without these hypotheses converge only like $1/w$ ([[the-dimer-entropy-of-the-kings-graph|the entropy note]]).

## Proved, tested, conjectured

| statement | status | basis |
| --- | --- | --- |
| (L) implies (L$_\infty$) | proved | the limit argument above |
| (L$_\infty$) implies $s \ge 0.565511911035$; (O) implies $s \le 0.565511911049$ | proved as implications | certified values of $\lambda_{22}$, $\lambda_{23}$, $\lambda_{24}$ |
| (L) at unit weights on the king's graph | tested, no violation | 1453 cases |
| (L$_\infty$) and (O) | conjectured | hold wherever computed: second differences of $a_{2q}$ positive for $2q = 2, \dots, 24$ |
| (L) on free strips of the triangular lattice | false | exact counterexample from width 5 |
| (L) with unequal diagonal weights | false | every pair tried violates it at some width |
| (L) with equal diagonal weights $3/2, 2, 3$ | false on wide strips | exact finite failures |

The tests are exact or carry a rigorous rounding bound. The counts come from the row transfer reduced modulo 60-bit primes and combined by the Chinese remainder theorem, and for widths 25 and 26 from extended precision.

| lattice, boundary | widths | cases | violations |
| --- | --- | --- | --- |
| king, free | 2 to 24 | 875 | 0 |
| king, cylinder | 3 to 22 | 550 | 0 |
| king, free (extended precision, certified) | 25, 26 | 28 | 0 |
| square, free / cylinder | up to 12 | 319 / 290 | 0 / 0 |
| triangular, cylinder | up to 12 | 290 | 0 |
| triangular, free | up to 12 | 319 | **92** |

The first three rows add up: 875 + 550 + 28 = 1453. The property belongs to even row counts: for even $m$, the sequence $j \mapsto Z(2j+1, m)$ is log-concave in 217 of 220 tested cases.

## Where it fails

On free strips of the triangular lattice (one diagonal per square) (L) fails from width 5: $Z(6, 5) = 6475$, $Z(8, 5) = 210560$, $Z(10, 5) = 6842465$, and $210560^2 - 6475 \cdot 6842465 = 30552725 > 0$, confirmed by brute force. An argument for (L) has to use the king's graph itself, not only non-planarity.

Give the orthogonal edges weight 1 and the two diagonals weights $x_{\mathrm{dl}}$ and $x_{\mathrm{dr}}$. The left-right reflection $J$ exchanges the diagonals, and the row transfer $T$ is self-adjoint for the indefinite form $G = JM$, with $M$ the kernel of the edges between two rows. The weight of a simple real eigenvalue $\lambda_j$ with $r_j^{\mathsf T} G\, r_j \ne 0$ in $Z(k, m) = (T^k)_{00} = \sum_i c_i \lambda_i^k$ is

$$c_j = \frac{r_j(0)^2}{r_j^{\mathsf T} G\, r_j},$$

so its sign is the Krein signature of the eigenvector $r_j$. When the visible level of next largest modulus is real, positive and dominant, (L) fails for large $q$ exactly when its weight $c_2$ is negative. The weights $(1, \tfrac{9}{10})$ violate (L) at width 4 from $2q = 56$ and at width 8 from $2q = 86$, where the prediction is exact, and at width 12 from $2q = 112$, outside the range of the prediction.

With equal weights $x$ on both diagonals $J$ stays a symmetry, and (L) still fails. Exactly, $Z(8, m)^2 > Z(6, m)\,Z(10, m)$ for every $m$ with $35 \le m \le 60$ at $x = \tfrac32$, $21 \le m \le 60$ at $x = 2$ and $19 \le m \le 60$ at $x = 3$, while $x = 1$ and $x = \tfrac54$ show no violation at $2q = 8$ for $m \le 60$.

## Two modes

At unit weights the data read $a_k - sk \approx -2\sigma + C(-\rho)^k$ with $\rho = e^{-1.083}$, the gap inside a sector, and $C = 0.2882$. A second, faster mode comes from the splitting of the two parity sectors of the free strip. It alternates with period 4 and shrinks by a factor $-13.84$ per two columns. In the second differences of $a_{2q}$ the modes appear as $0.1147^q$ and $(-0.072)^q$, and at $2q = 24$ the second is $0.007$ of the first. For large $k$, (L$_\infty$) and (O) come down to the sign $C > 0$ and to the alternating mode decaying faster than the bulk one.

Both modes are levels of the cylinder transfer, and the identification is numerical: I have no bound on the remainder and no proof that the weights per unit length converge. Along equal diagonal weights the rates of the two modes cross at $x^* \in (1.9823, 1.9830)$, if the circumferences $L \equiv 0$ and $2 \pmod 4$ keep bracketing it. The unit weight $x = 1$ lies below that crossing, which rules out proofs that are uniform in the weight. At $x = \tfrac32$ the levels predict that $q \mapsto a_{2q}$ is convex from $2q = 22$, and at $x = 2$ and $x = 3$ they predict that the second differences change sign infinitely often.

## Why the standard proofs stop

The form that glues two half-boards across a cut is the number $M(A, B)$ of matchings across it, and it is indefinite: for columns of length 3 its smallest eigenvalue is $1 - \sqrt2$. Reflection positivity therefore fails. The sequence $q \mapsto Z(2q, m)$ is not a Stieltjes moment sequence either, since the Hankel matrices have negative minors for every free width $m \ge 3$ and every circumference $m \ge 7$.

One exact reformulation is a count of paths. Superpose a matching of rows $[0, 2q)$ with one of rows $[2, 2q+2)$, or a matching of $[0, 2q+2)$ with one of $[2, 2q)$. The union $H$ consists of paths and even cycles, with $c(H)$ cycles of length at least four and $t(H)$ paths from top to bottom, and

$$Z(2q-2)Z(2q+2) - Z(2q)^2 = \sum_{H:\ t(H) \ge 1} 2^{c(H)} \bigl([\text{all top-bottom paths odd}] - [\text{all top-bottom paths even}]\bigr).$$

(L) asks for a sign-reversing injection that flips the parity of all top-bottom paths, and by the counterexamples it would have to depend on the lattice and on the size of the diagonal weight. Proving (L$_\infty$) at unit weights remains open.

## Sources

1. Dawid Ryłko, [Log-convexity of strip dimer counts on the king's graph](https://doi.org/10.5281/zenodo.23686087), Zenodo (PDF: [king-entropy-log-convexity.pdf](https://dawidrylko.github.io/lattice-dimers/papers/king-entropy-log-convexity.pdf)): statements, tests, counterexamples, modes and obstructions.
2. Dawid Ryłko, [The dimer entropy of the king's graph](https://doi.org/10.5281/zenodo.23686056), Zenodo (PDF: [king-entropy.pdf](https://dawidrylko.github.io/lattice-dimers/papers/king-entropy.pdf)): the conjectures (L$_\infty$) and (O) and the conditional bounds.
3. Dawid Ryłko, [king-entropy-log-convexity.tex](https://github.com/dawidrylko/lattice-dimers/blob/master/research/king-entropy/paper/king-entropy-log-convexity.tex): the LaTeX source.
4. Dawid Ryłko, [paper/NUMBERS.md](https://github.com/dawidrylko/lattice-dimers/blob/master/research/king-entropy/paper/NUMBERS.md): the map from the 1453 cases to their output files.
5. Dawid Ryłko, [The dimer entropy of the king's graph: transfer-matrix scripts, data and outputs](https://doi.org/10.5281/zenodo.23686293), Zenodo: code and data of the tag `king-entropy-v1.0.0`.
6. OEIS Foundation, [A239264](https://oeis.org/A239264): domicule tilings of the h × w rectangle.
7. N. J. Calkin and H. S. Wilf, [The number of independent sets in a grid graph](https://doi.org/10.1137/S089548019528993X), SIAM Journal on Discrete Mathematics 11, 1998: the hard-square lower bounds.
8. R. Pavlov, [Approximating the hard square entropy constant with probabilistic methods](https://doi.org/10.1214/11-AOP681), Annals of Probability 40, 2012.
