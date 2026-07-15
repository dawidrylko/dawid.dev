---
date: 2024-05-16
tags:
  - dev
  - basics
---

De Morgan's Laws are fundamental rules in mathematical logic that describe the relationships between the logical operators AND ($\land$) and OR ($\lor$). These laws are named after the British mathematician [Augustus De Morgan](https://en.wikipedia.org/wiki/Augustus_De_Morgan).

## 🌐 De Morgan's Laws

There are two main De Morgan's Laws:

1. **The negation of a conjunction is equivalent to the disjunction of the negations**:
   $$\neg (A \land B) \equiv (\neg A) \lor (\neg B)$$
   This means that "not (A and B)" is equivalent to "(not A) or (not B)".

2. **The negation of a disjunction is equivalent to the conjunction of the negations**:
   $$\neg (A \lor B) \equiv (\neg A) \land (\neg B)$$
   This means that "not (A or B)" is equivalent to "(not A) and (not B)".

## 🚀 Examples in JavaScript

Let's see how these laws can be applied in #JavaScript.

### 1️⃣ Example 1: Negation of a Conjunction

De Morgan's Law:
$$\neg (A \land B) \equiv (\neg A) \lor (\neg B)$$

```javascript
function example1(a, b) {
  // Applying De Morgan's Law directly
  const original = !(a && b);
  const deMorgan = !a || !b;

  console.log(`Original: ${original}, DeMorgan: ${deMorgan}`);
  return original === deMorgan;
}

// Sample calls
console.log(example1(true, true)); // Output: Original: false, DeMorgan: false -> true
console.log(example1(true, false)); // Output: Original: true, DeMorgan: true -> true
console.log(example1(false, true)); // Output: Original: true, DeMorgan: true -> true
console.log(example1(false, false)); // Output: Original: true, DeMorgan: true -> true
```

### 2️⃣ Example 2: Negation of a Disjunction

De Morgan's Law:
$$\neg (A \lor B) \equiv (\neg A) \land (\neg B)$$

```javascript
function example2(a, b) {
  // Applying De Morgan's Law directly
  const original = !(a || b);
  const deMorgan = !a && !b;

  console.log(`Original: ${original}, DeMorgan: ${deMorgan}`);
  return original === deMorgan;
}

// Sample calls
console.log(example2(true, true)); // Output: Original: false, DeMorgan: false -> true
console.log(example2(true, false)); // Output: Original: false, DeMorgan: false -> true
console.log(example2(false, true)); // Output: Original: false, DeMorgan: false -> true
console.log(example2(false, false)); // Output: Original: true, DeMorgan: true -> true
```

## 🧐 Explanation

1. **Negation of a Conjunction**:

   - In the `example1` function, we check if the negation of the conjunction of two boolean values is equivalent to the disjunction of their negations.
   - `(a && b)` returns `true` only if both `a` and `b` are `true`. The negation of this expression will be `true` only if at least one of the values is `false`.
   - `(!a || !b)` is `true` if at least one of `a` or `b` is `false`.

2. **Negation of a Disjunction**:
   - In the `example2` function, we check if the negation of the disjunction of two boolean values is equivalent to the conjunction of their negations.
   - `(a || b)` returns `true` if at least one of `a` or `b` is `true`. The negation of this expression will be `true` only if both `a` and `b` are `false`.
   - `(!a && !b)` is `true

`true` if both `a` and `b` are `false`.

In both cases, the functions return `true` if De Morgan's Laws hold, demonstrating the equivalence of the expressions as described by the laws.

## ℹ️ Conclusion

De Morgan's Laws are powerful tools in logic and computer science, simplifying complex logical expressions and helping to understand the relationships between logical operations. By applying these laws, we can transform and simplify expressions, making our code more readable and efficient.

Understanding and using De Morgan's Laws is essential for anyone working with logic, whether in mathematics, computer science, or everyday problem-solving.
