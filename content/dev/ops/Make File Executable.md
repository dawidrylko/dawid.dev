---
date: 2025-02-13
tags:
  - dev
  - ops
  - Linux
---

> [!tldr]
> Step-by-step guide to making a file executable in Linux, including setting permissions, verifying execution rights, and troubleshooting common issues.

## 🔗 Quick links

- [Linux File Permissions Documentation](https://linux.die.net/man/1/chmod)

## 🔧 Manual

### 1️⃣ Check File Permissions

First, verify the current permissions of the file using:

```sh
ls -l filename.sh
```

> [!note]
> If the file lacks executable permissions, you will need to modify them in the next step.

### 2️⃣ Grant Execute Permissions

Use the `chmod` command to make the file executable:

```sh
chmod +x filename.sh
```

For a more restrictive approach (only for the owner):

```sh
chmod u+x filename.sh
```

### 3️⃣ Verify Permissions

Check if the execute flag (`x`) is set:

```sh
ls -l filename.sh
```

Expected output should resemble:

```sh
-rwxr-xr-x 1 user user 1234 Feb 12 12:34 filename.sh
```

### 4️⃣ Run the Executable File

Execute the file using:

```sh
./filename.sh
```

> [!note]
> If the file is not in a directory listed in `$PATH`, you need to use `./` before the filename.

### 5️⃣ Move to a System Path (Optional)

If you want to run the script from anywhere, move it to a system directory:

```sh
sudo mv filename.sh /usr/local/bin/
```

Now, you can run it simply with:

```sh
filename.sh
```

### 6️⃣ Troubleshooting Execution Issues

If execution is blocked, try the following:

- **Remove macOS quarantine flag (if applicable):**
  ```sh
  xattr -d com.apple.quarantine filename.sh
  ```
- **Ensure the file is on an executable file system:**
  ```sh
  mount | grep noexec
  ```
- **Run with the appropriate shell manually:**
  ```sh
  bash filename.sh
  ```

## 💁🏼‍♀️ Summary

By following these steps, you can ensure your script is executable and accessible as needed. For further details, refer to the [Linux File Permissions Documentation](https://linux.die.net/man/1/chmod).
