---
title: "When converting an array to a Map pays off"
date: 2026-11-04
description: "Converting an array to a Map costs one O(n) pass. The measured break-even is 10 to 50 lookups at any size. What else changes besides speed."
tags:
  - dev
  - frontend
  - javascript
  - typescript
---

> [!tldr]
> Converting an array to a `Map` costs one pass over the array and turns every later lookup from a scan into a hash lookup. Both the conversion and a single `find` are linear in the array size, so the break-even is a count of lookups, not a size: **on Node 24 it landed between 10 and 50 lookups per array version, from 10 elements to 100,000**. Fewer lookups than that, keep the array. More, build the Map once and cache it. The conversion also changes behaviour for duplicate keys, key types and stale data.

[[set-and-map-essential-typescript-data-structures|Set and Map: Essential TypeScript Data Structures]] covers what the two structures are. The question here is when a `Map` built from an array beats the array you already have. The Polish post [Od tablicy do mapy](https://dawidrylko.com/od-tablicy-do-mapy-harry-potter-i-transmutacja/) (in Polish) takes the same trade-off through a Harry Potter framing and a Chrome benchmark. The decision comes down to one number you can measure on your own data: how many lookups before the conversion pays for itself.

## The cost model

Take an array of `n` objects with unique string `id`s and `k` lookups by id.

| Operation | Cost |
| --- | --- |
| `users.find((u) => u.id === id)` | scans about `n/2` elements on a hit, all `n` on a miss |
| build a `Map` from the array | one pass, `n` insertions |
| `map.get(id)` | average access time sublinear in `n`, a hash lookup in practice |

The array costs `k` scans. The Map costs one build plus `k` lookups. The last row is weaker than the usual O(1) claim. The ECMAScript specification requires hash tables "or other mechanisms" with average access times sublinear in the collection size, and the constant-time behaviour is a property of the engine. Measured, `get` grew from 0.017 to 0.051 microseconds between 10 and 100,000 entries.

Writing the break-even as build cost divided by the saving per lookup shows why size drops out. Build is proportional to `n`, and so is the cost of one `find`. The ratio stays near a constant, set by how expensive one Map insertion is compared with one element comparison.

## Measuring it

Four decisions in the harness make the numbers usable.

```js
import { performance } from "node:perf_hooks";

const makeUsers = (n) => Array.from({ length: n }, (_, i) => ({ id: `u_${i}`, name: `User ${i}` }));

const spreadIds = (n, count) => {
  const ids = Array.from({ length: count }, (_, i) => `u_${Math.floor(((i + 0.5) * n) / count) % n}`);
  let seed = 7;
  for (let i = count - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = (seed >>> 8) % (i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
};

let sink = 0;
const median = (fn, runs = 15, warmup = 5) => {
  for (let i = 0; i < warmup; i++) sink += fn();
  const ms = [];
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    sink += fn();
    ms.push(performance.now() - t0);
  }
  return ms.sort((a, b) => a - b)[runs >> 1];
};

const rows = [];
for (const n of [10, 100, 1_000, 10_000, 100_000]) {
  const users = makeUsers(n);
  const findCount = Math.min(5000, Math.max(300, Math.floor(5e6 / n)));
  const findIds = spreadIds(n, findCount);
  const getIds = spreadIds(n, 200_000);

  const findUs = (median(() => {
    let c = 0;
    for (const id of findIds) c += users.find((u) => u.id === id).name.length;
    return c;
  }) * 1000) / findCount;

  const reps = Math.max(1, Math.floor(20_000 / n));
  const buildUs = (median(() => {
    let c = 0;
    for (let r = 0; r < reps; r++) {
      const m = new Map();
      for (const u of users) m.set(u.id, u);
      c += m.size;
    }
    return c;
  }) * 1000) / reps;

  const map = new Map(users.map((u) => [u.id, u]));
  const getUs = (median(() => {
    let c = 0;
    for (const id of getIds) c += map.get(id).name.length;
    return c;
  }) * 1000) / getIds.length;

  rows.push({ n, findUs, buildUs, getUs, breakEven: buildUs / (findUs - getUs) });
}
console.table(
  rows.map((r) => ({
    n: r.n,
    "find us": +r.findUs.toFixed(3),
    "build us": +r.buildUs.toFixed(2),
    "get us": +r.getUs.toFixed(3),
    "break-even": Math.round(r.breakEven),
  })),
);
if (sink < 0) console.log(sink);
```

First, the ids to look up are built before the clock starts, so id generation and string building stay out of the timed loop. Second, they are evenly spaced across the array and then shuffled, so the mean scan is `n/2` by construction. The order did not matter: at n = 100,000, ascending ids and two different shuffles measured 265 to 272 microseconds per `find`. Third, every result feeds `sink`, which stops the engine from discarding a loop whose value nobody reads. Fourth, each measurement is a median of 15 timed runs after 5 discarded ones, and the build is repeated `reps` times inside one run, because a build of 10 elements (0.18 microseconds) is too short to time reliably in one go.

## What it showed

The table is the median of five runs of this harness on Node v24.22.1 (V8 13.6) on macOS, arm64, in microseconds.

| n | find per lookup | build | get per lookup | break-even lookups |
| --- | --- | --- | --- | --- |
| 10 | 0.027 | 0.18 | 0.017 | 18 |
| 100 | 0.145 | 2.0 | 0.020 | 16 |
| 1,000 | 1.28 | 14.5 | 0.025 | 11 |
| 10,000 | 26.9 | 312 | 0.028 | 12 |
| 100,000 | 290 | 4,212 | 0.051 | 16 |

**The break-even stayed in the low tens at every size.** Across the five runs of the table it ranged from 11 to 32 lookups. For n of 10,000 and above, `find` itself varies about twofold between separate runs of the same code: other runs and a second harness shape that built the Map with `new Map(users.map((u) => [u.id, u]))` measured it at 12 to 13 and 121 to 135 microseconds, against 26.9 and 290 in the table, which moved the break-even up to 34 to 50 lookups. I did not pin down the cause, so treat the per-lookup cost as a range. The `for` loop with `set` took 17 to 32 percent less time than the `map` form at 10,000 and 100,000 elements, because the `map` form allocates an array of pairs first. Between the two shapes the usable statement is a range: you need somewhere between 10 and 50 lookups to recover the build.

A miss is the worst case for `find`: it scans everything, about 500 microseconds at n = 100,000 against 0.05 for `get`. Workloads with many failed lookups, such as de-duplication or "is this id known" checks, cross the break-even sooner.

Memory is the other price. A `Map` of 100,000 references added 3.5 MiB to `heapUsed` after a forced collection (measured separately with `--expose-gc`), about 37 bytes per entry, on top of the objects it points to.

## When the array stays

Skip the conversion in three cases. The array is small and looked up fewer than about ten times. The array changes between lookups, so you would pay the build every time. Or the array is already sorted by the lookup key. Binary search over a sorted array of 100,000 elements took 0.12 microseconds per lookup against 0.054 for `Map.get`, with no conversion at all. Sorting an unsorted array of that size took 154 milliseconds, so this option exists only for data that arrives sorted.

For an array that is read often and replaced rarely, cache the index by array identity and the build cost is paid once per version of the data.

```ts
type User = { id: string; name: string };

const indexCache = new WeakMap<readonly User[], Map<string, User>>();

function indexById(list: readonly User[]): Map<string, User> {
  let index = indexCache.get(list);
  if (!index) {
    index = new Map(list.map((u) => [u.id, u] as const));
    indexCache.set(list, index);
  }
  return index;
}
```

This works when updates produce a new array (`[...users, next]`) and fails silently when code pushes into the existing one, because the cache key is the same object. Treat the array as immutable, or do not use this.

## What changes besides speed

The Map answers some questions differently from the array.

**Duplicate keys resolve to the last entry, not the first.** `find` returns the first match, while a Map built from the whole array keeps the last.

```ts
const users: User[] = [
  { id: "u_1", name: "Ada" },
  { id: "u_2", name: "Linus" },
  { id: "u_1", name: "Ada (duplicate)" },
];

users.find((u) => u.id === "u_1")?.name;   // "Ada"
new Map(users.map((u) => [u.id, u] as const)).get("u_1")?.name;   // "Ada (duplicate)"

const keepFirst = new Map<string, User>();
for (const u of users) if (!keepFirst.has(u.id)) keepFirst.set(u.id, u);
keepFirst.get("u_1")?.name;   // "Ada"
```

If ids are not unique by contract, decide which entry wins before you convert. `Map.groupBy(users, (u) => u.id)` keeps all of them, as arrays, and is the right shape for a one-to-many index.

Keys are compared by identity for objects and by value for primitives, and the number 1 and the string "1" are different keys. A `Map` holds both, while a plain object collapses them into one property. Ids that arrive as numbers from one source and strings from another miss silently: `map.get("1")` returns `undefined` for a map keyed by `1`. The Map also holds references, not copies, so mutating an object is visible through both the array and the index, while adding or removing array elements is not.

## Sources

1. Ecma International, [ECMA-262, 17th edition, Map objects](https://262.ecma-international.org/17.0/#sec-map-objects): the requirement of hash tables or other mechanisms with sublinear average access time.
2. MDN, [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map): key equality, insertion order, constructor from an iterable of pairs.
3. MDN, [Map.groupBy()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/groupBy): grouping with arbitrary keys.
4. Node.js, [Performance measurement APIs](https://nodejs.org/docs/latest-v24.x/api/perf_hooks.html): `performance.now()` used for the timings.
