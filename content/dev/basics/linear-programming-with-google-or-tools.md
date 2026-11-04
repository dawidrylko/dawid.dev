---
title: "Solving a linear program with Google OR-Tools in Python"
date: 2026-11-04
description: "Model a crop-allocation problem as a linear program, solve it with OR-Tools GLOP and read the result: status, shadow prices and when to change the solver."
tags:
  - dev
  - basics
  - python
---

> [!tldr]
> A linear program is a linear objective under linear constraints on continuous variables. In OR-Tools you create the solver with `CreateSolver("GLOP")`, declare `NumVar`s, add constraints with `Add`, call `Maximize` and check for `OPTIMAL` before reading anything. The farm below ends at **26,000 PLN from 66.67 ha of herbs and 33.33 ha of flowers**. The dual values then show which limit pays: land is worth 220 PLN per hectare, labour 5 PLN per hour, and the capital limit is worth nothing.

A farmer has 100 hectares to plant with herbs and flowers for cosmetics, 800 hours of labour and 74,000 PLN of capital. A hectare of herbs needs 4 hours and 60 PLN and returns 240 PLN. A hectare of flowers needs 16 hours and 120 PLN and returns 300 PLN. How many hectares of each?

I solved this exact farm in 2023 on my Polish blog with the CLP solver, in [Kwiaty czy zioła?](https://dawidrylko.com/kwiaty-czy-ziola/) (in Polish).

## The model

When the payoff and every limit are linear in the quantities you choose, the problem is a linear program (LP). Let $h$ be the hectares of herbs and $f$ the hectares of flowers.

$$
\max\; 240h + 300f \quad \text{subject to} \quad
\begin{cases}
h + f \le 100 & \text{land} \\
4h + 16f \le 800 & \text{labour} \\
60h + 120f \le 74000 & \text{capital} \\
h, f \ge 0
\end{cases}
$$

A linear objective over a region cut out by linear constraints **reaches its maximum at a corner of that region**. The OR-Tools documentation says the same about simplex solvers: they always return vertices of the feasible region. Here the corner is where the land and labour lines cross, so the solver's answer can be checked by hand: $h + f = 100$ and $4h + 16f = 800$ give $12f = 400$, so $f = 33.33$ and $h = 66.67$. The profit is $16000 + 10000 = 26000$.

The capital limit does not matter at these numbers. Planting all 100 hectares with the more expensive flowers costs 12,000 PLN, far under 74,000. The solver reports it too, as a dual value of zero.

## The code

```python
from ortools.linear_solver import pywraplp


def solve_farm(solver_id="GLOP", capital=74_000):
    solver = pywraplp.Solver.CreateSolver(solver_id)
    if solver is None:
        raise RuntimeError(f"{solver_id} is not linked into this OR-Tools build")

    herbs = solver.NumVar(0, solver.infinity(), "herbs")
    flowers = solver.NumVar(0, solver.infinity(), "flowers")

    land = solver.Add(herbs + flowers <= 100, "land")
    labour = solver.Add(4 * herbs + 16 * flowers <= 800, "labour")
    money = solver.Add(60 * herbs + 120 * flowers <= capital, "capital")

    solver.Maximize(240 * herbs + 300 * flowers)

    status = solver.Solve()
    if status != pywraplp.Solver.OPTIMAL:
        print("no optimal solution, status", status)
        return

    print(f"{solver.SolverVersion()}: profit {solver.Objective().Value():.0f} PLN")
    print(f"herbs {herbs.solution_value():.2f} ha, flowers {flowers.solution_value():.2f} ha")
    usage = solver.ComputeConstraintActivities()
    for row, used in zip((land, labour, money), usage):
        print(f"{row.name():8} used {used:7.0f} of {row.ub():7.0f}  dual {row.dual_value() + 0.0:6.1f}")


solve_farm()
```

Three details carry the model. `CreateSolver` returns `None` when the requested backend is not linked into your build, so the guard is not decoration. `Add` returns the constraint object, which is the handle you need later to read its dual value. And the lower bound of 0 on each `NumVar` is the $h, f \ge 0$ line of the model; the upper bound stays at infinity because the land constraint already caps both variables.

The output, from `ortools` 9.15.6755:

```text
Glop solver v9.15.6755: profit 26000 PLN
herbs 66.67 ha, flowers 33.33 ha
land     used     100 of     100  dual  220.0
labour   used     800 of     800  dual    5.0
capital  used    8000 of   74000  dual    0.0
```

## Reading the result

**Check the status before reading any value.** `Solve()` returns an integer: `pywraplp.Solver.OPTIMAL` is 0, `INFEASIBLE` is 2 and `UNBOUNDED` is 3. Add the constraint `herbs >= 150` to the model above and the solver answers 2, because 150 hectares do not fit into 100. The variables then read back as `0.0`, which looks like a plausible plan and is not one.

The constraint rows show what limits the plan.

| Constraint | Used | Limit | Dual value | Meaning |
| --- | --- | --- | --- | --- |
| land | 100 | 100 | 220 | one more hectare adds 220 PLN |
| labour | 800 | 800 | 5 | one more hour adds 5 PLN |
| capital | 8,000 | 74,000 | 0 | extra money adds nothing |

The dual value (shadow price) is the profit gained per unit of relaxed limit. Re-solving confirms it: 101 hectares gives 26,220 PLN, 110 hectares gives 28,200, and 801 hours gives 26,005. The slope holds only while the same constraints stay binding, so for a large change you re-solve and do not extrapolate. The documentation of `Constraint.dual_value` and `Variable.reduced_cost` marks both as available only for continuous problems.

Change one number and the picture flips. With capital at 7,000 PLN the optimum is 83.33 ha of herbs and 16.67 ha of flowers for 25,000 PLN. Capital now binds together with land (dual values 1.0 and 180), so each extra PLN of capital returns exactly one PLN. Labour uses 600 of 800 hours, and its dual value drops to 0.

## Choosing the solver

`CreateSolver` takes an id, and the same model runs unchanged on any LP backend. **On this model GLOP, CLP and PDLP all return 26,000 PLN and the same split.**

| Solver | What it is | When to pick it | Measured here |
| --- | --- | --- | --- |
| `GLOP` | Google's own primal and dual simplex | the default; the OR-Tools guide says to try it first | 2 iterations |
| `CLP` | COIN-OR simplex, Clp 1.17.10 in this build | models that already use it, as the 2023 post did | 2 iterations |
| `PDLP` | first-order method | very large LPs where a fast approximate answer is enough | 192 iterations |
| `SCIP` | mixed-integer solver | integer and continuous variables together | see below |
| `CP-SAT` (`"SAT"`) | constraint solver | integer-only models with integer coefficients | see below |
| Gurobi, CPLEX, Xpress | commercial | when you hold a licence | not in the PyPI wheel |

The guide on advanced LP solving describes PDLP as designed for the largest problems, where simplex and barrier methods run out of memory or time. On a three-constraint model it only adds iterations. In the `ortools` wheel for macOS arm64, `CreateSolver` also returns `None` for GLPK, Gurobi, Xpress and CPLEX.

## Whole hectares

Real land is often planted in whole hectares. Swap `NumVar` for `IntVar` and `"GLOP"` for `"SCIP"`, and the LP becomes an integer program.

```python
solver = pywraplp.Solver.CreateSolver("SCIP")
herbs = solver.IntVar(0, solver.infinity(), "herbs")
flowers = solver.IntVar(0, solver.infinity(), "flowers")
```

The rest of the model stays the same. The result is 67 hectares of herbs and 33 of flowers for **25,980 PLN**, 20 PLN below the continuous optimum. That gap is expected: the LP optimum is an upper bound for the integer problem. Labour comes to 796 of 800 hours. CP-SAT, which the OR-Tools guide recommends for pure integer problems and SCIP for mixed ones, returns the same plan. Integer models have no dual values, so the reading step above works only on the continuous version.

## The same model in MathOpt

MathOpt is the library the OR-Tools documentation describes as separating modeling from solving, with the solver chosen by an enum. The farm in it:

```python
from ortools.math_opt.python import mathopt

model = mathopt.Model(name="farm")
herbs = model.add_variable(lb=0.0, name="herbs")
flowers = model.add_variable(lb=0.0, name="flowers")

model.add_linear_constraint(herbs + flowers <= 100, name="land")
model.add_linear_constraint(4 * herbs + 16 * flowers <= 800, name="labour")
model.add_linear_constraint(60 * herbs + 120 * flowers <= 74_000, name="capital")
model.maximize(240 * herbs + 300 * flowers)

result = mathopt.solve(model, mathopt.SolverType.GLOP)
print(result.termination.reason, result.objective_value())
print({c.name: d for c, d in result.dual_values().items()})
```

It prints `TerminationReason.OPTIMAL 26000.0` and duals of 220, 5 and 0 for land, labour and capital, give or take floating-point noise such as `220.00000000000003`. MathOpt is built for one model that has to run on several solvers. For a single LP like this one either API works, and `pywraplp` is what the documentation's own LP example uses.

## Sources

1. Google, [Solving a linear programming problem](https://developers.google.com/optimization/lp/lp_example): GLOP as the primary OR-Tools LP solver, the `CreateSolver`, `NumVar`, `Add`, `Maximize` pattern.
2. Google, [Advanced LP solving](https://developers.google.com/optimization/lp/lp_advanced): solver families, the order in which to try Glop, commercial solvers and PDLP, and vertex solutions from simplex.
3. Google, [Solving a MIP problem](https://developers.google.com/optimization/mip/mip_example): CP-SAT for pure integer problems, SCIP for mixed ones.
4. Google, [MathOpt](https://developers.google.com/optimization/math_opt): modeling separated from solving, the supported solvers.
5. OR-Tools, [ortools.linear_solver.pywraplp](https://or-tools.github.io/docs/pdoc/ortools/linear_solver/pywraplp.html): `CreateSolver` ids, `Constraint.dual_value` and `Variable.reduced_cost` for continuous problems.
6. Python Package Index, [ortools 9.15.6755](https://pypi.org/project/ortools/9.15.6755/): the release the numbers in this note come from.
