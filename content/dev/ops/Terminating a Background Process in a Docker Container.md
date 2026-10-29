---
date: 2025-02-25
description: "Kill a background process inside a running Docker container: exec into the shell, find it with ps aux, then stop it by PID and know when SIGTERM is enough."
tags:
  - dev
  - ops
  - Linux
---

> [!tldr]
> | Action | Command |
> |---|---|
> | Access container shell | `docker exec -it <CONTAINER_ID> /bin/sh` |
> | List processes | `ps aux` |
> | List only Node.js | `pgrep -af node` |
> | Stop a process | `kill <PID>` |
> | Force stop a process | `kill -9 <PID>` |

## 📌 Problem Statement

Managing background processes within a Docker container can be challenging, especially when it comes to terminating them properly. This guide provides a comprehensive approach to safely identify and stop such processes.

## 🔍 1️⃣ Access the Running Container

To interact with the container's shell, execute:

```sh
docker exec -it <CONTAINER_ID> /bin/sh
```

or, if Bash is available:

```sh
docker exec -it <CONTAINER_ID> /bin/bash
```

This command opens an interactive session within the container, allowing you to manage processes directly.

## 📌 2️⃣ Identify the Background Process

Once inside the container, list all running processes:

```sh
ps aux
```

To list only Node.js processes with their command lines, use `pgrep` (part of `procps`, which slim images may lack):

```sh
pgrep -af node
```

This command will return a list of processes related to Node.js, including their **Process ID (PID)**.

## 🛑 3️⃣ Terminate the Process

To stop the identified process gracefully, use:

```sh
kill <PID>
```

Avoid one-liners such as `kill $(ps aux | grep node | awk '{print $2}')`. They also match the `grep` itself, they hit the main process if it is Node, and on BusyBox images the second column of `ps` is the user, not the PID.

If the process does not terminate, you can forcefully stop it with:

```sh
kill -9 <PID>
```

🚨 **Warning**: Using `kill -9` should be a last resort, as it forcefully terminates the process without allowing it to perform any cleanup operations.

## ⚠️ Important Considerations

### 📌 **Main Process (PID 1)**

In Docker containers, the primary process runs with **PID 1**. When it exits, the container stops. A signal sent to it from inside the container, for example from a `docker exec` shell, is ignored unless the process installs a handler for that signal, and this includes `kill -9`. To stop the main process, use `docker stop` or `docker kill` from the host. Ensure you are not inadvertently targeting the main process unless you intend to stop the container.

### 📌 **Graceful Shutdown**

For Node.js applications, implement signal handling to manage graceful shutdowns:

```javascript
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  // Perform cleanup operations here
  process.exit(0);
});
```

This approach allows the application to handle termination signals properly, ensuring resources are released, and operations are concluded safely.

### 📌 **Single Process per Container**

Adhering to Docker best practices, each container should run a single main process. If multiple processes are necessary, consider:

- **Orchestration Tools**: Utilize tools like Docker Compose or Kubernetes to manage multiple containers.
- **Supervisors**: Implement process managers like `supervisord` to handle multiple processes within a single container.

Managing processes within a Docker container requires careful attention to avoid unintended disruptions. Always ensure proper identification and termination of processes to maintain application stability. 🚀
