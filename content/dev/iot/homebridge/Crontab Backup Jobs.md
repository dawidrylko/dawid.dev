---
date: 2024-07-05
tags:
  - dev
  - iot
  - ops
  - homelab
---

## 🌐 Overview

This configuration defines scheduled tasks using #CRON for automating the backup processes of both #Homebridge and #Zigbee2MQTT data. CRON is a time-based job scheduler in Unix-like operating systems. The configuration ensures that backup scripts are executed at specific times daily and that the output is logged for monitoring and troubleshooting.

Additionally, this setup includes an **automated script** that updates the backup scripts, sets the correct permissions, and dynamically ensures that the CRON jobs are added only if they are not already present. This prevents duplicate entries and maintains a clean scheduling environment.

> [!note] Scheduled Tasks
>
> - The **Zigbee2MQTT Git Backup Sync** script runs at **11 a.m.** every day.
> - The **Homebridge Git Backup Sync** script runs at **12 p.m.** every day.
> - The **Cleanup Zigbee2MQTT Backups** script runs at **1 p.m.** every day.
> - All tasks log their execution details, including errors, for monitoring.

## 🚀 Configuration

```plaintext title="crontab"
# To define the time you can provide concrete values for
# minute (m), hour (h), day of month (dom), month (mon),
# and day of week (dow) or use '*' in these fields (for 'any').
#
# Notice that tasks will be started based on the cron's system
# daemon's notion of time and timezones.
#
# Output of the crontab jobs (including errors) is sent through
# email to the user the crontab file belongs to (unless redirected).
#
# For example, you can run a backup of all your user accounts
# at 5 a.m every week with:
# 0 5 * * 1 tar -zcf /var/backups/home.tgz /home/
#
# For more information see the manual pages of crontab(5) and cron(8)
#
# m h  dom mon dow   command

0 11 * * * /var/www/scripts/backup_zigbee2mqtt.sh >> /var/log/backup.log 2>&1
0 12 * * * /var/www/scripts/backup.sh >> /var/log/backup.log 2>&1
0 13 * * * /var/www/scripts/cleanup_zigbee2mqtt_backups.sh >> /var/log/backup.log 2>&1
```

## 🛠 Configuration File

```bash title="src/config.sh"
#!/bin/bash

# Define base directories
base_dir="/var/www/"
homebridge_dir="${base_dir}homebridge/"
repo_dir="${base_dir}backup/"
scripts_dir="${base_dir}scripts/"

# Define subdirectories
src_dir="${repo_dir}src/"
backup_dir="${repo_dir}backup/"

# Define service names
homebridge_service="homebridge"
zigbee2mqtt_service="zigbee2mqtt"

# Define script and config filenames
config_sh="config.sh"
backup_sh="backup.sh"
backup_zigbee2mqtt_sh="backup_zigbee2mqtt.sh"
cleanup_zigbee2mqtt_backups_sh="cleanup_zigbee2mqtt_backups.sh"

# Define log files
log_dir="/var/log/"
backup_log="${log_dir}backup.log"
```

## 🚀 Script

```bash title="setup.sh"
#!/bin/bash

# Define script directory and source configuration
SCRIPT_DIR=$(dirname "$(realpath "$0")")
source "${SCRIPT_DIR}/src/config.sh"

# Define an array of script names for updates and permissions
declare -A scripts=(
    ["config_sh"]="${config_sh}"
    ["backup_zigbee2mqtt_sh"]="${backup_zigbee2mqtt_sh}"
    ["backup_sh"]="${backup_sh}"
    ["cleanup_zigbee2mqtt_backups_sh"]="${cleanup_zigbee2mqtt_backups_sh}"
)

# Update scripts and set correct permissions
for script_key in "${!scripts[@]}"; do
    script_name="${scripts[$script_key]}"
    cp "${src_dir}${script_name}" "${scripts_dir}${script_name}"
    chown admin:admin "${scripts_dir}${script_name}"
    chmod +x "${scripts_dir}${script_name}"
done

echo "$(date) - Scripts updated" >> "$backup_log"

# Define cron jobs
cron_jobs=(
    "0 11 * * * ${scripts_dir}${backup_zigbee2mqtt_sh} >> ${backup_log} 2>&1"
    "0 12 * * * ${scripts_dir}${backup_sh} >> ${backup_log} 2>&1"
    "0 13 * * * ${scripts_dir}${cleanup_zigbee2mqtt_backups_sh} >> ${backup_log} 2>&1"
)

# Add cron jobs if they do not exist
current_cron=$(crontab -l 2>/dev/null)
for job in "${cron_jobs[@]}"; do
    if ! echo "$current_cron" | grep -F -q "$job"; then
        current_cron="$current_cron"$'\n'"$job"
    fi
done
echo "$current_cron" | crontab -

# Restart the cron service
systemctl restart cron

echo "$(date) - Cron jobs updated" >> "$backup_log"
```

## 🔗 Related Scripts

This setup integrates with the following automated backup and maintenance scripts:

- [[Homebridge Git Backup Sync]] – Handles daily Zigbee2MQTT data backup, ensuring data security and consistency.
- [[Zigbee2MQTT Git Backup Sync]] – Automates backup and version control of Homebridge and Zigbee2MQTT configurations using Git.
- [[Automatic Cleanup of Old Zigbee2MQTT Backups]] – Automatically removes outdated Zigbee2MQTT backups older than 7 days to optimize storage.

These scripts collectively ensure a **robust, automated, and version-controlled backup strategy** for your **Homebridge** and **Zigbee2MQTT** environments.
