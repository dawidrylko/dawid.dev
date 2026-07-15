---
date: 2024-07-20
tags:
  - dev
  - ops
  - homelab
---

> [!tldr]
> Step-by-step guide to installing #Proxmox on a #RaspberryPi, including updating packages, adding Proxmox repository, and installing necessary components.

## 🔗 Quick links

- [Proxmox VE Documentation](https://pve.proxmox.com/wiki/Main_Page)

## 🔧 Manual

### 1️⃣ Update and Upgrade the System

First, ensure your system is up to date with the latest packages.

```sh
sudo apt update
sudo apt upgrade
```

### 2️⃣ Install Curl

Install Curl, which is required to download the Proxmox GPG key.

```sh
sudo apt install curl
```

### 3️⃣ Edit the Hosts File

Edit the `/etc/hosts` file to ensure proper hostname resolution.

```sh
sudo nano /etc/hosts
```

> [!note]
> Add the hostname and the IP address of your Raspberry Pi to this file.

### 4️⃣ Set the Root Password

Set a password for the root user, as Proxmox requires root access.

```sh
sudo passwd root
```

### 5️⃣ Add the Proxmox GPG Key

Add the Proxmox GPG key to your system to verify the Proxmox packages.

```sh
curl -L https://mirrors.apqa.cn/proxmox/debian/pveport.gpg | sudo tee /usr/share/keyrings/pveport.gpg >/dev/null
```

### 6️⃣ Add the Proxmox Repository

Add the Proxmox repository to your sources list.

```sh
echo "deb [arch=arm64 signed-by=/usr/share/keyrings/pveport.gpg] https://mirrors.apqa.cn/proxmox/debian/pve bookworm port" | sudo tee /etc/apt/sources.list.d/pveport.list
```

### 7️⃣ Update Package Lists

Update the package lists to include the Proxmox repository.

```sh
sudo apt update
```

### 8️⃣ Install ifupdown2

Install `ifupdown2`, which is required for network configuration.

```sh
sudo apt install ifupdown2
```

### 9️⃣ Install Proxmox VE and Additional Packages

Install Proxmox VE along with necessary packages like Postfix, open-iscsi, and the firmware.

```sh
sudo apt install proxmox-ve postfix open-iscsi pve-edk2-firmware-aarch64
```

### 🔟 Verify Installation

Check the IP address of your Raspberry Pi to ensure network connectivity.

```sh
hostname -I
```

## 💁🏼‍♀️ Summary

By following these steps, you will have successfully installed Proxmox on your Raspberry Pi. Ensure to configure your network settings and other preferences as needed after installation. For further configuration and management, refer to the [Proxmox VE Documentation](https://pve.proxmox.com/wiki/Main_Page).
