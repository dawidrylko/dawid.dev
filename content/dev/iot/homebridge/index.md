---
date: 2024-04-22
description: "Homebridge notes: a Docker Compose stack with Mosquitto and Zigbee2MQTT on a Raspberry Pi, plus cron jobs that back up its configuration and prune old copies."
title: Homebridge
tags:
  - dev
  - iot
  - Homebridge
  - homelab
---

## ℹ️ General

- [Homebridge Website](https://homebridge.io)
- [Homebridge GitHub](https://github.com/homebridge)
- [Homebridge Docker](https://hub.docker.com/r/homebridge/homebridge)
- [Homebridge Community Plugins](https://www.npmjs.com/search?q=homebridge-plugin)

## ⚙️ Config

- [[Integrating Homebridge, Mosquitto and Zigbee2mqtt on Raspberry Pi with Docker Compose|Homebridge, Mosquitto and Zigbee2MQTT on Docker Compose]]
  - [[Crontab Backup Jobs]]
    - [[Homebridge Git Backup Sync]]
    - [[Zigbee2MQTT Git Backup Sync]]
    - [[Automatic Cleanup of Old Zigbee2MQTT Backups]]
