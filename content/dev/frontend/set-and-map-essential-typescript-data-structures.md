---
title: "Set and Map: Essential TypeScript Data Structures"
date: 2025-02-27
description: "Set stores unique values, Map stores key-value pairs with keys of any type. When to reach for each in TypeScript, and how both beat plain objects and arrays."
tags:
  - dev
  - typescript
  - javascript
---

> [!tldr]
> Sets store unique values of any type with no keys, while Maps store key-value pairs where keys can be any data type (unlike objects). Both maintain insertion order and provide efficient lookups. Use Sets for unique collections (like filtering duplicates) and Maps when you need to associate values with keys that aren't just strings or symbols.

## 🌐 Overview

JavaScript (and by extension TypeScript) provides two powerful built-in data structures beyond traditional arrays and objects: `Set` and `Map`. These structures solve specific problems efficiently while offering better semantics and capabilities than regular objects for certain use cases.

## 💡 Key Concepts

### 1️⃣ Set: Collection of Unique Values

The `Set` object stores **unique values** of any type, whether primitive values or object references. It represents a mathematical set and provides efficient methods for working with unique collections.

```typescript
const uniqueNumbers = new Set<number>();

// Adding values (duplicates are ignored)
uniqueNumbers.add(5);
uniqueNumbers.add(10);
uniqueNumbers.add(5); // Ignored - already exists

console.log(uniqueNumbers.size); // 2
console.log(uniqueNumbers.has(10)); // true

// Removing values
uniqueNumbers.delete(5);
console.log(uniqueNumbers.has(5)); // false

// Iterating over values
uniqueNumbers.clear(); // Empty the set
uniqueNumbers.add(1).add(2).add(3); // Method chaining works

for (const num of uniqueNumbers) {
  console.log(num); // 1, 2, 3 (insertion order preserved)
}

// Converting arrays to Sets and back
const array = [1, 2, 3, 3, 4, 4, 5];
const uniqueSet = new Set(array);
const uniqueArray = [...uniqueSet]; // [1, 2, 3, 4, 5]
```

### 2️⃣ Map: Key-Value Pairs

The `Map` object holds **key-value pairs** where keys can be any value (including functions, objects, or primitives). It remembers the original insertion order of the keys and offers better performance for frequent additions and removals.

```typescript
const userScores = new Map<string, number>();

// Setting values
userScores.set("Alice", 95);
userScores.set("Bob", 82);
userScores.set("Alice", 97); // Updates existing value

console.log(userScores.size); // 2
console.log(userScores.get("Alice")); // 97
console.log(userScores.has("Charlie")); // false

// Removing entries
userScores.delete("Bob");

// Iterating over a Map
userScores.set("Bob", 88).set("Charlie", 91); // Method chaining

// Entries (key-value pairs)
for (const [user, score] of userScores.entries()) {
  console.log(`${user}: ${score}`);
}

// Keys only
for (const user of userScores.keys()) {
  console.log(user);
}

// Values only
for (const score of userScores.values()) {
  console.log(score);
}

// Map initialization with nested arrays
const initialData = new Map([
  ["Alice", 97],
  ["Bob", 88],
  ["Charlie", 91],
]);
```

### 3️⃣ Using Objects as Keys

One powerful feature of `Map` is the ability to use objects as keys, which isn't practical with regular objects:

```typescript
const userMap = new Map<object, string>();

const user1 = { id: 1, name: "Alice" };
const user2 = { id: 2, name: "Bob" };

userMap.set(user1, "admin");
userMap.set(user2, "editor");

console.log(userMap.get(user1)); // 'admin'

// The object reference must be the same
const sameAsUser1 = { id: 1, name: "Alice" };
console.log(userMap.get(sameAsUser1)); // undefined (different object reference)
```

## 📊 Comparison: Set vs Map vs Object

| Feature     | Set                                        | Map                                        | Object                                                    |
| ----------- | ------------------------------------------ | ------------------------------------------ | --------------------------------------------------------- |
| Purpose     | Collection of unique values                | Collection of key-value pairs              | Collection of key-value pairs                             |
| Keys        | N/A                                        | Any value (object, function, primitive)    | Strings, Symbols, or convertible to strings               |
| Key Order   | Insertion order                            | Insertion order                            | Not guaranteed (except for string keys in recent engines) |
| Size        | Available via `size` property              | Available via `size` property              | Requires `Object.keys(obj).length`                        |
| Iteration   | Directly iterable                          | Directly iterable                          | Requires `Object.keys/values/entries`                     |
| Performance | Optimized for frequent additions/deletions | Optimized for frequent additions/deletions | Generally slower for frequent mutations                   |
| Type Safety | Generic type support in TS                 | Generic type support in TS                 | Limited without utility types                             |

## 🚀 Advanced Patterns and Use Cases

### 1️⃣ Eliminating Duplicates with Set

```typescript
// Efficient way to remove duplicates from an array
function removeDuplicates<T>(array: T[]): T[] {
  return [...new Set(array)];
}

const numbers = [1, 2, 3, 3, 4, 4, 5, 5, 5];
console.log(removeDuplicates(numbers)); // [1, 2, 3, 4, 5]
```

### 2️⃣ Creating a Cache with Map

```typescript
// Simple LRU (Least Recently Used) cache implementation
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Get the value
    const value = this.cache.get(key)!;

    // "Refresh" the entry by removing and adding it again
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  put(key: K, value: V): void {
    // Delete existing entry (to refresh its position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // If we're at capacity, remove the oldest entry (first item)
    else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    // Add the new entry (at the end)
    this.cache.set(key, value);
  }
}

const cache = new LRUCache<string, number>(3);
cache.put("a", 1);
cache.put("b", 2);
cache.put("c", 3);
console.log(cache.get("a")); // 1 (refreshes "a")
cache.put("d", 4); // Evicts "b" since "a" was recently used
console.log(cache.get("b")); // undefined
```

### 3️⃣ Set Operations

```typescript
// Set operations in TypeScript
class SetUtils {
  // Union: A ∪ B (elements in either set)
  static union<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    return new Set([...setA, ...setB]);
  }

  // Intersection: A ∩ B (elements in both sets)
  static intersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    return new Set([...setA].filter((x) => setB.has(x)));
  }

  // Difference: A - B (elements in A but not in B)
  static difference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    return new Set([...setA].filter((x) => !setB.has(x)));
  }

  // Symmetric Difference: (A ∪ B) - (A ∩ B)
  static symmetricDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    const union = this.union(setA, setB);
    const intersection = this.intersection(setA, setB);
    return this.difference(union, intersection);
  }

  // Is Subset: A ⊆ B (every element in A is in B)
  static isSubset<T>(setA: Set<T>, setB: Set<T>): boolean {
    return [...setA].every((x) => setB.has(x));
  }
}

const fruitsA = new Set(["apple", "banana", "cherry"]);
const fruitsB = new Set(["banana", "cherry", "date"]);

console.log(SetUtils.union(fruitsA, fruitsB));
// Set(4) { 'apple', 'banana', 'cherry', 'date' }

console.log(SetUtils.intersection(fruitsA, fruitsB));
// Set(2) { 'banana', 'cherry' }

console.log(SetUtils.difference(fruitsA, fruitsB));
// Set(1) { 'apple' }
```

## 🧠 Performance Considerations

Both `Set` and `Map` are optimized data structures with faster performance than equivalent operations on regular objects for many operations:

1. Lookups via `has()` for `Set` and `has()/get()` for `Map` operate in constant time O(1) on average
2. Insertions and deletions are also O(1) on average, much faster than array operations
3. Iteration order is predictable (insertion order), unlike object properties

For large datasets, these performance differences become significant.

## 💁🏼‍♀️ Summary

`Set` and `Map` provide powerful abstractions for modern JavaScript and TypeScript applications:

- Use `Set` when you need to store unique values or perform set operations
- Use `Map` when you need a dictionary with arbitrary key types or need to maintain key order
- Both outperform regular objects and arrays for their specific use cases
- TypeScript provides strong typing support for both structures via generics

The key to choosing between them is understanding your data's nature: if you only care about uniqueness and membership, choose `Set`; if you need to associate values with keys, choose `Map`.
