---
date: 2024-05-02
description: "A bash script that backs up Homebridge and Zigbee2MQTT configuration into a GitHub repository, with paths and service names kept in a separate config file."
tags:
  - dev
  - iot
  - ops
  - Homebridge
  - homelab
---

## 🌐 Overview

This #Bash script automates the backup and version control of #Homebridge and #Zigbee2MQTT configuration files using #git, specifically #GitHub, for storage and version tracking. The script is structured to use a separate configuration file (`config.sh`) to define essential paths and service names, ensuring modularity and maintainability.

The script first loads the configuration file, then iterates through defined backup directories to identify and copy the latest backup files to designated locations within the Git repository. Each operation is logged with a timestamp.

Following this, the script updates the local Git repository to reflect the latest state of the remote master branch, adds the newly copied backup files to the repository, and checks for changes before committing them with a timestamped message. If changes exist, they are pushed to the remote master branch on GitHub. If no files are found for backup, the script logs an error message.

> [!note] Script Execution via CRON
> This script is designed to run automatically via a #CRON job on the server, ensuring consistent and unattended backups and synchronization of Homebridge and Zigbee2MQTT configurations to GitHub.

## 🛠 Configuration File (`config.sh`)

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

```bash title="src/backup.sh"
#!/bin/bash

# Define script and configuration directory
SCRIPT_DIR=$(dirname "$(realpath "$0")")
source "${SCRIPT_DIR}/config.sh"

declare -A source_dirs=(
    ["${homebridge_service}_config_backup"]="${homebridge_dir}${homebridge_service}/backups/config-backups/"
    ["${homebridge_service}_instance_backup"]="${homebridge_dir}${homebridge_service}/backups/instance-backups/"
    ["${zigbee2mqtt_service}"]="${homebridge_dir}${zigbee2mqtt_service}/backups/"
)

# Change to repository directory
cd "$repo_dir" || { echo "Failed to change directory to $repo_dir"; exit 1; }

# Backup files
latest_files=()
for key in "${!source_dirs[@]}"; do
    source_dir="${source_dirs[$key]}"
    target_dir="${backup_dir}${key}/"
    latest_file=$(ls -t "$source_dir" | head -1)

    mkdir -p "$target_dir"
    cp "${source_dir}${latest_file}" "$target_dir"

    echo "$(date) - Copied $latest_file to $target_dir" >> "$backup_log"
    latest_files+=("${target_dir}${latest_file}")
done

# Update git repository
git fetch origin --prune
git checkout origin/master --force

# Commit and push changes if there are any
if [ "${#latest_files[@]}" -gt 0 ]; then
    git add "${latest_files[@]}"

    if git status | grep -q "Changes to be committed"; then
        git commit -m "Backup Homebridge on $(date +'%Y-%m-%d %H:%M:%S')"
        git push origin HEAD:master
        echo "$(date) - Pushed backups to git" >> "$backup_log"
    else
        echo "$(date) - ERROR: No changes to commit" >> "$backup_log"
    fi
else
    echo "$(date) - ERROR: No files to back up" >> "$backup_log"
fi
```
