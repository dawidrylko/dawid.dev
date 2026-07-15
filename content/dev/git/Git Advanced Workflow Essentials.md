---
date: 2024-12-18
tags:
  - dev
  - git
---

### 🗂️ Stash Management

- **Stash current changes with a message:** Save your current changes and include a message for reference.

  ```bash
  git stash push -m "WIP: feature X"
  ```

- **List all stashes:** Display all saved stashes in your repository.

  ```bash
  git stash list
  ```

- **Apply the most recent stash:** Restore the most recent stash without removing it.

  ```bash
  git stash apply
  ```

- **Apply a specific stash:** Restore a specific stash by its identifier.

  ```bash
  git stash apply stash@{2}
  ```

- **Drop a specific stash:** Remove a specific stash by its identifier.

  ```bash
  git stash drop stash@{0}
  ```

- **Pop the most recent stash:** Restore and immediately delete the most recent stash.
  ```bash
  git stash pop
  ```

### 🔄 Rebase Workflow

- **Rebase current branch onto master:** Replay commits from your branch onto the `master` branch.

  ```bash
  git rebase master
  ```

- **Interactive rebase for the last 5 commits:** Modify commit history for the last 5 commits interactively.

  ```bash
  git rebase -i HEAD~5
  ```

- **Continue rebase after resolving conflicts:** Proceed with the rebase after resolving merge conflicts.

  ```bash
  git rebase --continue
  ```

- **Abort the rebase process:** Cancel the rebase and return to the original state.

  ```bash
  git rebase --abort
  ```

- **Skip the current commit during rebase:** Bypass the conflicting commit and continue rebasing.
  ```bash
  git rebase --skip
  ```

### 🍒 Cherry-Pick Commands

- **Apply a specific commit to the current branch:** Bring a specific commit from another branch to the current branch.

  ```bash
  git cherry-pick commit-hash
  ```

- **Cherry-pick a range of commits:** Apply multiple commits from a range to the current branch.
  ```bash
  git cherry-pick start-commit^..end-commit
  ```

### 🔀 Merge Conflict Management

- **Abort a merge in progress:** Cancel the current merge and revert to the pre-merge state.

  ```bash
  git merge --abort
  ```

- **Continue a merge after resolving conflicts:** Resolve conflicts, add changes, and complete the merge.
  ```bash
  git add conflicted-file
  git commit
  ```
