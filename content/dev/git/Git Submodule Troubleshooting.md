---
date: 2025-02-17
tags:
  - dev
  - git
---

If a Git submodule is missing or not correctly linked, follow these steps to restore its functionality.

### 🧐 Verify `.gitmodules` Configuration

Ensure that the `.gitmodules` file exists and contains the correct reference:

```bash
cat .gitmodules
```

Expected output:

```
[submodule "submodule-name"]
    path = path/to/submodule
    url = https://github.com/user/repo.git
```

### 🔍 Check Submodule Status

Determine whether the submodule is recognised by Git:

```bash
git submodule status
```

If the submodule appears but is not initialized, proceed with the next steps.

### 🔄 Reinitialize Submodules

Fetch and initialize the submodule:

```bash
git submodule update --init --recursive
```

If the submodule directory is missing or broken, continue with the reset process.

### 🚫 Remove Broken Submodule Reference

If the submodule is improperly linked, remove its reference:

```bash
rm -rf path/to/submodule
git config --remove-section submodule.path/to/submodule || true
git rm --cached path/to/submodule
```

### ➕ Re-add the Submodule

Reintroduce the submodule:

```bash
git submodule add https://github.com/user/repo.git path/to/submodule
```

### 🔄 Finalise the Update

Ensure all submodules are properly initialized:

```bash
git submodule update --init --recursive
```

### 🗂 Verify `.git/modules/` Directory

If issues persist, check whether the submodule is listed in `.git/modules/`:

```bash
ls -la .git/modules
```

If a corresponding directory exists but is corrupt, remove and reinitialize it.

These steps should restore the correct submodule linkage in your Git repository.
