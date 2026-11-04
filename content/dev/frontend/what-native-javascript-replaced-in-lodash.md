---
title: "What native JavaScript replaced in Lodash, and what remains"
date: 2026-11-04
description: "Object.groupBy, structuredClone, toSorted and the Set methods cover many Lodash helpers. Where each behaves differently, and what still earns the dependency."
tags:
  - dev
  - frontend
  - javascript
  - typescript
---

> [!tldr]
> **Grouping, non-mutating sort, last-element access, flattening, set algebra and cloning plain data are native now**, and Node 24 ships all of them. `_.merge`, `_.isEqual`, `_.debounce`, `_.memoize` and string-path `_.get` and `_.set` have no counterpart in the platform. Several native replacements differ from their Lodash original in one detail (default sort order, result order, what happens to class instances), so the swap is a rewrite and not a find-and-replace.

A dependency earns its place by covering what the platform lacks. In 2016 the platform lacked a lot, and Lodash filled the gap. The post [Nie pisz w kółko tych samych funkcji](https://dawidrylko.com/nie-pisz-w-kolko-tych-funkcji-wykorzystaj-moc-lodasha/) (in Polish) from that year picks five helpers: `_.random`, `_.sample`, `_.times`, `_.difference` and `_.merge`. Ten years on, two of the five have a native counterpart and three still do not. For the collection types themselves see [[set-and-map-essential-typescript-data-structures|Set and Map]], and for the cost of building a lookup see [[when-converting-an-array-to-a-map-pays-off|when converting an array to a Map pays off]].

## The five helpers from 2016, revisited

| Lodash | Native in 2026 | Verdict |
| --- | --- | --- |
| `_.random(31, 49)` | none, only `Math.random()` | still a hand-written helper |
| `_.sample(names)` | none | `names[Math.floor(Math.random() * names.length)]` |
| `_.times(5, fn)` | `Array.from({ length: 5 }, (_v, i) => fn(i))` | native, noisier |
| `_.difference(a, b)` | `new Set(a).difference(new Set(b))` | native |
| `_.merge(a, b)` | none, spread is shallow | stays |

**Two of the five go native.** `_.times` and `_.difference` no longer need the import, while `_.random`, `_.sample` and `_.merge` stay either as imports or as small helpers you write and test yourself.

## What the platform covers now

| Lodash | Native | Since | Catch |
| --- | --- | --- | --- |
| `_.groupBy` | `Object.groupBy`, `Map.groupBy` | ES2024 | null-prototype result, callback only, no `"prop"` shorthand |
| `_.sortBy`, `_.orderBy` | `arr.toSorted(cmp)` | ES2023 | default order compares strings, one comparator instead of a key list |
| `_.last`, `_.nth` | `arr.at(-1)` | ES2022 | none |
| `_.findLast` | `findLast`, `findLastIndex` | ES2023 | none |
| `_.uniq` | `[...new Set(arr)]` | ES2015 | none |
| `_.union`, `_.intersection`, `_.difference` | `Set.prototype.union`, `intersection`, `difference` | ES2025 | sets in, sets out, order follows the smaller set |
| `_.flattenDeep` | `arr.flat(Infinity)` | ES2019 | none |
| `_.cloneDeep` | `structuredClone(value)` | Web API | drops prototypes, throws on functions |
| `_.fromPairs`, `_.toPairs` | `Object.fromEntries`, `Object.entries` | ES2019, ES2017 | none |
| `_.has` | `Object.hasOwn(obj, key)` | ES2022 | one key, no path |
| `_.get` | `obj?.a?.[0]?.b` | ES2020 | static paths only |

The editions come from the TC39 list of finished proposals and the ECMAScript 2026 specification. `structuredClone` is a Web API and not part of ECMAScript, and Node implements it as well (MDN: widely available since March 2022). On MDN, `Object.groupBy` and `toSorted` are marked widely available (March 2024 and July 2023). The Set methods are marked newly available since June 2024, so a codebase with an older browser matrix needs a fallback or a polyfill for them.

For TypeScript the matching `lib` entries are `ES2024` for `Object.groupBy` and `Map.groupBy`, `ES2025` for the Set methods and `ES2023` for `toSorted` and `findLast`. In TypeScript 6.x (6.0.3) they live in `lib.es2024.object.d.ts`, `lib.es2025.collection.d.ts` and `lib.es2023.array.d.ts`.

## Where the replacement is not the same function

### Sorting

**Without a comparator, `toSorted` compares elements as strings.** Lodash sorts numbers as numbers.

```js
[10, 9, 1].toSorted();                 // [1, 10, 9]
_.sortBy([10, 9, 1]);                  // [1, 9, 10]
[10, 9, 1].toSorted((a, b) => a - b);  // [1, 9, 10]

_.orderBy(people, ["age", "name"], ["desc", "asc"]);
people.toSorted((a, b) => b.age - a.age || a.name.localeCompare(b.name));
```

Both `orderBy` forms returned the same order on my test data. The native one is longer, and the chained comparator is where mistakes creep in once a third key arrives.

### Set algebra

The Set methods accept any set-like object (something with `size`, `has` and `keys`), not an array, and they return a `Set`. **The intersection also changes the order.** The specification iterates whichever of the two sets is smaller, so the result follows that one.

```js
const a = [3, 1, 2, 4];
const b = [4, 3, 9];

_.intersection(a, b);                       // [3, 4]
[...new Set(a).intersection(new Set(b))];   // [4, 3]

new Set(a).union(b);  // TypeError: The .size property is NaN
```

Code that relies on the order of `_.intersection` (a list shown to the user, a snapshot test) breaks silently when you swap it. `isSubsetOf`, `isSupersetOf` and `isDisjointFrom` have no Lodash twin, so those are pure gain.

### Grouping

`Object.groupBy` returns an object with a `null` prototype, which is safer for keys like `__proto__` and awkward for old habits.

```js
const byStatus = Object.groupBy(orders, (o) => o.status);

byStatus.hasOwnProperty("paid");  // TypeError: byStatus.hasOwnProperty is not a function
Object.hasOwn(byStatus, "paid");  // true
```

When the key is not a string, `Map.groupBy` keeps it as it is instead of turning it into one.

### Deep cloning

`structuredClone` copies plain data, `Date`, `Map`, `Set`, `RegExp` and circular references. **It copies data and not behaviour.**

| Value | `_.cloneDeep` | `structuredClone` |
| --- | --- | --- |
| class instance | prototype kept, methods work | plain object, methods gone |
| function property | kept by reference | throws `DataCloneError` |
| symbol-keyed property | copied | dropped |
| circular reference | preserved | preserved |

MDN lists the same limits: functions cannot be cloned, and the prototype chain is neither walked nor duplicated. For JSON-shaped state, such as a store snapshot or a form model, `structuredClone` is the right default. For a domain object with methods it is a trap, and `_.cloneDeep` or an explicit copy constructor does the job.

## What still earns the dependency

**Deep merge has no native form.** Spread merges one level and replaces everything below it.

```js
_.merge({ a: { x: 1, y: 2 } }, { a: { y: 3, z: 4 } });
// { a: { x: 1, y: 3, z: 4 } }

({ ...{ a: { x: 1, y: 2 } }, ...{ a: { y: 3, z: 4 } } });
// { a: { y: 3, z: 4 } }
```

The same goes for `_.isEqual` (browsers have nothing, Node has `util.isDeepStrictEqual`), for `_.debounce`, `_.throttle` and `_.memoize`, and for `_.get`, `_.set` and `_.update` when the path arrives as a string from configuration. Optional chaining only covers paths you can write in source. `_.chunk`, `_.zip` and `_.range` have no native form either. Iterator chunking and joint iteration reached Stage 4 and are expected in ES2027, but `Iterator.zip` is `undefined` in Node 24.22.1, so they are not usable yet.

Keeping Lodash also means keeping it current. Release 4.18.0 (31 March 2026) fixed prototype pollution through path traversal in `_.unset` and `_.omit` and a code injection through the `imports` option of `_.template`, tracked as CVE-2026-4800. Version 4.18.1 followed a day later with a build fix. Both fixes sit in helpers that build property names or code from strings. Require 4.18.1 or later, and import only the helpers you use: the full `lodash.min.js` is 73,234 bytes, 25,841 gzipped at `gzip -9`.

## A decision rule

**Replace a helper when three things hold.** The native form exists in every runtime you support. The differences above do not touch your data. The call site gets shorter or stays the same length. Where one of them fails, leave the helper, and write the test with the input where the two implementations disagree: an unsorted number list, two sets in the wrong size order, a class instance.

## Sources

1. Ecma International, [ECMA-262, 17th edition (ECMAScript 2026)](https://262.ecma-international.org/17.0/): the `Set.prototype.intersection` steps and the edition each feature entered.
2. TC39, [Finished proposals](https://github.com/tc39/proposals/blob/main/finished-proposals.md): expected publication year of each proposal.
3. MDN, [Object.groupBy()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy): availability and null-prototype result.
4. MDN, [Set.prototype.union()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/union): availability and set-like arguments.
5. MDN, [The structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm): unsupported values and the prototype chain.
6. Lodash, [Release 4.18.0](https://github.com/lodash/lodash/releases/tag/4.18.0): the `_.unset`, `_.omit` and `_.template` security fixes.
7. npm, [typescript 6.0.3](https://www.npmjs.com/package/typescript/v/6.0.3): the `lib.es2023.array.d.ts`, `lib.es2024.object.d.ts` and `lib.es2025.collection.d.ts` declaration files.
