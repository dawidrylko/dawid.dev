---
date: 2024-12-18
tags:
  - dev
  - git
---

### 🔗 Manage Remotes

Enhance your workflow by effectively managing remote repositories with these essential Git commands.

### ➕ Add a New Remote

Adds a new remote named `upstream` pointing to the specified repository URL. This is useful for tracking the original repository when you've forked it.

```bash
git remote add upstream https://github.com/username/repo.git
```

### 🔄 Fetch All Remotes

Fetches updates from all configured remotes. This command retrieves the latest changes from each remote repository without merging them into your local branches.

```bash
git fetch --all
```

### 🧹 Prune Stale Remote References

Removes references to remote branches that no longer exist on the `origin` remote. This helps keep your list of remote branches clean and up-to-date.

```bash
git remote prune origin
```

### 👀 View All Remotes

Displays all configured remotes along with their URLs. This is useful for verifying the remote repositories your local repository is connected to.

```bash
git remote -v
```
