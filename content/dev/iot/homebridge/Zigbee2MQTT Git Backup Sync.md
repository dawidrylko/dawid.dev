---
date: 2024-07-05
tags:
  - dev
  - iot
  - ops
  - Homebridge
  - homelab
---

## 🌐 Overview

This #Bash script automates the backup of #Zigbee2MQTT data. It begins by defining the locations for the log file, source directory, and backup directory, which are now managed via an external configuration file (`config.sh`) for better maintainability.

The script ensures that the backup directory exists before proceeding. It then creates a compressed tarball of the Zigbee2MQTT data, excluding the backup directory itself, and names the backup file with a timestamp.

If the backup creation is successful, the script logs this event with a timestamp in the log file. If the backup creation fails, it logs an error message. This ensures that the Zigbee2MQTT data is consistently and securely backed up.

> [!note] Script Execution via CRON
> This script has been designed to run automatically via a #CRON job on the server, ensuring consistent and unattended backups of Zigbee2MQTT data.

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

```bash title="src/backup_zigbee2mqtt.sh"
#!/bin/bash

# Define script and configuration directory
SCRIPT_DIR=$(dirname "$(realpath "$0")")
source "${SCRIPT_DIR}/config.sh"

source_dir="${homebridge_dir}${zigbee2mqtt_service}/"
backup_dir="backups"

# Ensure backup directory exists
mkdir -p "${source_dir}${backup_dir}"

# Define backup file with timestamp
backup_file="${source_dir}${backup_dir}/${zigbee2mqtt_service}-backup-$(date +%Y%m%d%H%M%S).tar.gz"

# Create backup
tar --exclude="./${backup_dir}" -czf "$backup_file" -C "$source_dir" .

# Log success or failure
if [ $? -eq 0 ]; then
    echo "$(date) - Backup created successfully: $backup_file" >> "$backup_log"
else
    echo "$(date) - Backup failed" >> "$backup_log"
fi
```
