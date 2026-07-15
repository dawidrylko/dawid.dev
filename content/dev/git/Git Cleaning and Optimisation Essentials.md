---
date: 2024-12-18
tags:
  - dev
  - git
---

### 🧹 Repository Cleaning and Optimisation

Maintain a tidy and efficient Git repository by using these powerful commands to clean up and optimise your repository.

### 🚀 Optimise Repository by Repacking

Runs garbage collection with aggressive optimisations and removes objects that are no longer reachable immediately.

```bash
git gc --aggressive --prune=now
```

### 🔍 Find Large Objects in the Repository

Lists the 20 largest objects (e.g., blobs) in your repository, sorted by size in descending order. Useful for diagnosing repository bloat.

```bash
git rev-list --objects --all | \
git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
grep '^blob' | \
sort -k3 -n -r | \
head -n 20
```

### 🧽 Remove Ignored Files

Removes all files ignored by `.gitignore`. Be cautious, as this action cannot be undone.

```bash
git clean -Xdf
```

### 🗑️ Remove Untracked Files and Directories

Deletes all untracked files and directories. Useful for resetting your working directory.

```bash
git clean -fd
```

### 📂 Remove Only Untracked Directories

Removes all untracked directories, excluding files matching the specified pattern (e.g., `*.txt`).

```bash
git clean -fd --exclude="*.txt"
```
