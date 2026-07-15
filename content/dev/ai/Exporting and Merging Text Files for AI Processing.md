---
date: 2025-02-19
tags:
  - dev
  - ai
---

## 📌 Purpose

This script recursively scans all files in a specified directory and saves their contents to an output file. Binary files are skipped, and a note `[SKIP] Binary file: <path>` is added instead. This allows for easy merging of multiple text files into a single document that can be uploaded to AI tools like ChatGPT, Claude, DeepSeek, etc.

_Additionally, you can achieve similar functionality using the [[dev/mergerocket|mergerocket]] npm package—a fast CLI tool that recursively merges text files (while skipping binaries), adds customizable start/end markers, and even supports `.gitignore`, summaries, and hidden-file options._

## 🖥️ Example Script

```bash
#!/bin/bash

echo "Exporting text file contents..."
output_file="merged_output.txt"
find . -type f -print0 | while IFS= read -r -d '' file; do
    echo -e "\n========== START: $file ==========" >> "$output_file"
    if file "$file" | grep -q text; then
        cat "$file" >> "$output_file"
    else
        echo "[SKIP] Binary file: $file" >> "$output_file"
    fi
    echo -e "\n========== END: $file ==========" >> "$output_file"
done

echo "Export completed: $output_file"
```

## 📜 Script Functionality

1. **Recursive Directory Search**

   - The `find` command locates all files and outputs a null-separated list (`-print0` ensures compatibility with filenames containing special characters).

2. **File Type Check**

   - Each file is analyzed with `file "$file"` to determine whether it is a text file.

3. **Saving Content to Output File**

   - If a file is text-based, its content is appended to the output file.
   - If a file is binary, a placeholder note is added instead.

4. **Formatting the Output**

   - Each file is wrapped between `========== START: <file path> ==========` and `========== END: <file path> ==========`, ensuring clear sectioning.

5. **Alternative via `mergerocket`**

   - Instead of custom scripting, you can install and run `mergerocket`:

     ```bash
     npm install -g mergerocket
     mergerocket --dir . --out merged_output.txt --attach-summary
     ```

   - It handles recursive scanning, binary skipping, dynamic start/end markers, `.gitignore` compliance, hidden files, and an optional summary report—all out of the box.

## 📂 Example Output Format

```plaintext
========== START: path/to/file1.txt ==========
Sample text file content.
========== END: path/to/file1.txt ==========

========== START: path/to/file2.log ==========
Log file content here.
========== END: path/to/file2.log ==========

========== START: path/to/image.png ==========
[SKIP] Binary file: path/to/image.png
========== END: path/to/image.png ==========
```

## 📊 Use Cases

- **Merging Files for AI Processing** – Preparing large text datasets to be uploaded into AI tools such as ChatGPT, Claude, DeepSeek, and others.
- **Project Archiving** – Capturing the full content of text files in a single file.
- **Source Code Analysis** – Reviewing and searching through all files at once.
- **Identifying Binary Files** – Detecting non-text files for alternative processing methods.

## 🔗 Quick Links

- [Mergerocket GitHub Repository](https://github.com/dawidrylko/mergerocket)
- [Mergerocket NPM Package](https://www.npmjs.com/package/mergerocket)
