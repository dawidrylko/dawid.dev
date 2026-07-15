---
date: 2024-12-18
tags:
  - dev
  - git
---

### 🕵️‍♂️ Debugging with Git Bisect

Git bisect helps identify the commit that introduced a bug by using a binary search algorithm. It minimises the number of commits you need to check manually.

### 🟢 Start a Bisect Session

Initiates the bisect process, preparing Git to search for the offending commit.

```bash
git bisect start
```

### 🔴 Mark the Current Commit as Bad

Marks the current commit as faulty, setting the starting point for the search.

```bash
git bisect bad
```

### 🟡 Mark a Known Good Commit

Designates the commit identified by `commit-hash` as a known good state.

```bash
git bisect good commit-hash
```

### 📝 Test and Mark Commits as Good or Bad

Use these commands to refine the search. Mark the current commit as either good or bad after testing.

```bash
git bisect good
```

```bash
git bisect bad
```

### 🔄 Reset Bisect State

Ends the bisect session and restores the repository to its original state.

```bash
git bisect reset
```
