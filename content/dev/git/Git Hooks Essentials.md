---
date: 2024-12-18
tags:
  - dev
  - git
---

### 🪝 Manage Git Hooks

Git hooks are scripts that Git executes at specific events in your workflow, allowing you to customise and enforce project standards.

### 📂 Navigate to the Hooks Directory

The `.git/hooks` directory contains all available Git hook templates. You can edit or create new scripts here.

```bash
cd .git/hooks
```

### ➕ Create and Make a Hook Executable

Make your hook script executable to ensure Git can run it when the corresponding event occurs. Replace `<hook-name>` with the name of your hook file, e.g., `pre-commit`.

```bash
chmod +x <hook-name>
```

### 🛠️ Example: Pre-Commit Hook to Run Tests

This example creates a `pre-commit` hook that runs `npm test` before allowing a commit. If the tests fail, the commit is aborted.

```bash
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
npm test
if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
EOF
```
