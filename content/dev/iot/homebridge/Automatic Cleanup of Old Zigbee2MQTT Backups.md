---
date: 2025-02-17
tags:
  - dev
  - iot
  - ops
  - Homebridge
  - homelab
---

## 🌐 Overview

This #Bash script automates the cleanup of old #Zigbee2MQTT backup files, ensuring that only recent backups are retained. The script is designed to:

- Locate backup files older than **7 days**.
- Remove outdated backup archives (`.tar.gz`) from the backup directory.
- Log all deletion events for monitoring and auditing.

This prevents excessive storage consumption and keeps backup storage **efficient and manageable**.

> [!note] Scheduled Execution  
> This script should be executed automatically via a #CRON job to ensure periodic cleanup without manual intervention.

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

```bash title="src/cleanup_zigbee2mqtt_backups.sh"
#!/bin/bash

SCRIPT_DIR=$(dirname "$(realpath "$0")")
source "${SCRIPT_DIR}/config.sh"

backups_dir="${homebridge_dir}${zigbee2mqtt_service}/backups/"
age_days=7

current_date=$(date +%s)

find "$backups_dir" -maxdepth 1 -type f -name '*.tar.gz' | while read -r backup_file; do
    file_date=$(date -r "$backup_file" +%s)
    age=$(( (current_date - file_date) / 86400 ))

    if [ "$age" -ge "$age_days" ]; then
        rm -f "$backup_file"
        echo "$(date) - Deleted obsolete backup: $backup_file" >> "$backup_log"
    fi
done
```
