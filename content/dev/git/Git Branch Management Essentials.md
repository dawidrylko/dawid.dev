---
date: 2024-12-18
tags:
  - dev
  - git
---

### 🌿 Manage Git Branches

Efficiently handle your branches in Git with these essential commands. Use them to rename, delete, track, and review branches effectively.

### ✏️ Rename the Current Branch

Changes the name of the current branch to `new-branch-name`.

```bash
git branch -m new-branch-name
```

### ❌ Delete a Remote Branch

Deletes the remote branch named `branch-name` from the `origin` remote.

```bash
git push origin --delete branch-name
```

### 🔗 Track a Remote Branch

Creates and switches to a local branch that tracks `origin/branch-name`.

```bash
git checkout --track origin/branch-name
```

### 🔍 Show Branches Merged into the Current Branch

Displays branches fully merged into the current branch, helping identify branches that might be safe to delete.

```bash
git branch --merged
```

### 🚫 Show Branches Not Merged into the Current Branch

Lists branches that haven’t been merged into the current branch yet, useful for tracking pending work.

```bash
git branch --no-merged
```
