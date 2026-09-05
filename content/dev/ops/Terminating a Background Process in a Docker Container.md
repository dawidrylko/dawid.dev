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
> | List only Node.js | `ps aux \| grep node` |
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

To filter only Node.js processes, use:

```sh
ps aux | grep node
```

This command will return a list of processes related to Node.js, including their **Process ID (PID)**.

## 🛑 3️⃣ Terminate the Process

To stop the identified process gracefully, use:

```sh
kill <PID>
```

For Node.js processes specifically:

```sh
kill $(ps aux | grep node | awk '{print $2}')
```

If the process does not terminate, you can forcefully stop it with:

```sh
kill -9 <PID>
```

or for Node.js:

```sh
kill -9 $(ps aux | grep node | awk '{print $2}')
```

🚨 **Warning**: Using `kill -9` should be a last resort, as it forcefully terminates the process without allowing it to perform any cleanup operations.

## ⚠️ Important Considerations

### 📌 **Main Process (PID 1)**

In Docker containers, the primary process runs with **PID 1**. Terminating this process will stop the entire container. Ensure you are not inadvertently targeting the main process unless you intend to stop the container.

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
