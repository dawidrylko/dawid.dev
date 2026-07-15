---
date: 2024-12-18
title: Git
tags:
  - dev
  - git
---

## 🚀 Git Helpers

### 📚 Basics

```bash
git add -p # Add changes interactively
git branch -avv # Show all branches
git clean -fd # Remove untracked files
git diff branch1..branch2 # Show the difference between two branches
git log --author="author" # Show commits by author
git log --follow -- path/to/file # Show commits for a file
git reset --soft HEAD~1 # Uncommit the last commit
```

### 🔄 Creating aliases

```bash
git config --global alias.co checkout # git co
git config --global alias.st 'status -s' # git st
git config --global alias.fm "!git fetch && git merge" # git fm

# Add all changes and commit with a message
# Usage: git ac "message"
git config --global alias.ac '!git add -A && git commit -m'

# Amend the last commit without changing the commit message
# Usage: git amend
git config --global alias.amend 'commit --amend --no-edit'
```

### ❌ Global gitignore

```bash
# Global gitignore for all repositories
git config --global core.excludesfile ~/.gitignore_global

# Example entries for .gitignore_global
echo ".DS_Store" >> ~/.gitignore_global
echo "node_modules/" >> ~/.gitignore_global
echo "env/" >> ~/.gitignore_global
```

### 📅 Set the date of the last commit to the current date

```bash
git commit --amend --date="$(LC_TIME=C date +"%a %b %d %H:%M:%S %Y %z")" --no-edit
```

### 📊 Show the commit history in a graph

```bash
git log --graph --oneline --all --decorate
```

### 📂 Show the 10 largest files in the repository

```bash
git rev-list --objects --all | \
git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
grep '^blob' | \
sort -k3 -n -r | \
head -n 10
```

### 🛠️ Format patches

```bash
git format-patch -5 # Create patches for the last 5 commits
git format-patch -n HEAD~5..HEAD -o /path/to/output # Create patches for the last 5 commits and save them to a specific directory
git format-patch -n <commit_hash> # Create a patch for a specific commit
git am *.patch # Apply patches
git send-email *.patch # Send patches via email
```
