---
date: 2025-02-18
description: "The Busy Beaver problem: the score Σ(n) and step count S(n) of halting Turing machines, the known values, BB(5) settled in 2024, and why they are uncomputable."
tags:
  - dev
  - basics
---

The **Busy Beaver** problem, introduced by Tibor Radó in 1962, asks how much a halting Turing machine with a given number of states can do before it stops. It is one of the cleanest ways to see where computation ends.

## 🦫 What is the Busy Beaver problem?

Take every Turing machine with **n** states and two symbols, start each one on a blank tape, and keep only those that eventually halt. Two functions measure the winners. The score **Σ(n)** is the largest number of 1s any of them leaves on the tape, and **S(n)** is the largest number of steps any of them takes before halting. A machine that reaches the maximum is called a busy beaver for that number of states.

## 🚀 Why is it significant

Both functions grow faster than any computable function. If S(n) were computable, you could decide the halting problem: run a machine with n states for S(n) steps, and if it has not halted by then, it never will. Since the halting problem is undecidable, no algorithm can compute S(n) for every n.

## 🔍 Known values

| n   | Σ(n) | S(n)       |
| --- | ---- | ---------- |
| 1   | 1    | 1          |
| 2   | 4    | 6          |
| 3   | 6    | 21         |
| 4   | 13   | 107        |
| 5   | 4098 | 47,176,870 |

The value for five states was open for decades. In 2024 the bbchallenge collaboration settled it with a proof checked in Coq, confirming the machine Heiner Marxen and Jürgen Buntrock found in 1989. For six states only lower bounds are known, and they are already far too large to write out in decimal.

## 🛠️ Implications for computability

The problem turns undecidability into a number. For each n, Σ(n) and S(n) are well-defined integers, yet no single algorithm produces all of them. Beyond a few hundred states, even the exact values cannot be proved within ZFC, the usual axioms of mathematics.

## 📚 Further reading

- [Busy Beaver on Wikipedia](https://en.wikipedia.org/wiki/Busy_beaver)
- [Scott Aaronson, "The Busy Beaver Frontier"](https://www.scottaaronson.com/papers/bb.pdf)
