---
date: 2024-04-24
description: "Mirror a repository between GitLab and GitHub over SSH so pushes stay in sync automatically: deploy keys on both sides, the remote setup and a status check."
tags:
  - dev
  - ops
---

> [!tldr]
> Set up automatic synchronization between your project and another repository using #SSH for #GitLab and #GitHub, enabling seamless pushing and pulling of changes.

## 🔗 Quick links

- [GitLab Repository mirroring](https://docs.gitlab.com/ee/user/project/repository/mirror/index.html)

## 🔧 Manual

### 1️⃣ GitLab

![[Repository mirror - GitLab.png]]

> [!caution] Prerequisites
> You must have at least the Maintainer role for the project.

**Steps**

1. On the left sidebar, select **Search or go to** and find your project.
2. Select **Settings > Repository**.
3. Expand **Mirroring repositories**.
4. Select **Add new**.
5. Enter a **Git repository URL**. For security reasons, the URL to the original repository is only displayed to users with the Maintainer role or the Owner role for the mirrored project.

   > [!warning] Don't forget
   > Don't forget to replace `:` with `/` in the URL.
   >
   > The proper format for the URL is:

   ```
   ssh://github.com/_OWNER_/_REPOSITORY_.git
   ```

6. Select a **Mirror direction**.
7. Choose either:

   - **Detect host keys**: GitLab fetches the host keys from the server and displays the fingerprints.
   - **Input host keys manually**, and enter the host key into **SSH host key**.

   When mirroring the repository, GitLab confirms at least one of the stored host keys matches before connecting. This check can protect your mirror from malicious code injections, or your password from being stolen.

8. Select an `SSH public key` in **Authentication method**.
9. Optionally: provide a username and select options for **Mirror triggers**.
10. Submit by clicking on **Mirror repository**.
11. Copy the **SSH public key** and add it to the repository you want to mirror. This key is used to authenticate the connection between the two repositories. ^1

### 2️⃣ GitHub

![[Repository mirror - GitHub.png]]

> [!caution] Prerequisites
> You must have admin access to the repository you want to mirror.

**Steps**

1. Find your repository on GitHub.
2. Select **Settings**.
3. Under **Security**, select **Deploy keys**.
4. Select **Add deploy key**.
5. Enter a **Title** for the key and paste the **SSH public key** you copied from GitLab.
6. Check **Allow write access** if you want to push changes from GitLab to GitHub.
7. Submit by clicking on **Add key**.

### 3️⃣ Check the status

1. Go back to GitLab.
2. Click `Update now` to check the status of the mirroring process. ^2
