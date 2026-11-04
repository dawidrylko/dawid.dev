---
title: "Lessons from a not-so-smart home: Pi, Zigbee, Homebridge"
date: 2026-11-04
description: "A Raspberry Pi smart home with Zigbee2MQTT, Mosquitto and Homebridge in Docker Compose: two dead memory cards, a NAS detour, backups, what to buy or skip."
tags:
  - dev
  - iot
  - homelab
  - Homebridge
---

> [!tldr]
> A home automation stack breaks at its cheapest parts first: the memory card, the path of the radio dongle, the hub you forgot you needed. What held up on my Raspberry Pi: NVMe instead of an SD card, one container per layer (Zigbee radio, MQTT broker, HomeKit bridge) in a single Compose file, a HomePod mini as the hub, and a scheduled backup of a directory that holds the Zigbee network key. Read a watt meter before moving anything to a NAS.

The smart part of a smart home is the cheap part. The parts that fail are the ones nobody puts in the plan.

Mine started on a Raspberry Pi 3 with a 32 GB memory card, and the card was the first casualty. Twice. The full story, with receipts and photos, is in [Moja historia z (nie)inteligentnym domem](https://dawidrylko.com/moja-historia-z-nie-inteligentnym-domem/) (in Polish). This note keeps the decisions and the failure modes.

## The stack that survived

After four hosts, the layout is boring, which was the goal. Each layer does one job and can be replaced without touching the others.

| Layer | What runs | Job |
| --- | --- | --- |
| Radio | ConBee II USB dongle | The Zigbee coordinator, a single device that holds the network |
| Translation | Zigbee2MQTT | Turns Zigbee devices into MQTT topics |
| Broker | Mosquitto | Carries messages between the layers |
| Bridge | Homebridge | Publishes the devices to Apple Home, so the Home app and Siri see them |
| Hub | HomePod mini | Keeps remote access and automations working when the phone is away |
| Host | Raspberry Pi 5 (4 GB), NVMe drive | Runs the three containers |
| Backup | cron, Bash, a Git repository | Daily copies of the Zigbee2MQTT and Homebridge data |

The three containers live in one Compose file, written up in [[Integrating Homebridge, Mosquitto and Zigbee2mqtt on Raspberry Pi with Docker Compose|Homebridge, Mosquitto and Zigbee2MQTT on Docker Compose]]. The backup side has its own notes: the schedule in [[Crontab Backup Jobs]], the two copy jobs in [[Homebridge Git Backup Sync]] and [[Zigbee2MQTT Git Backup Sync]], and the seven-day pruning in [[Automatic Cleanup of Old Zigbee2MQTT Backups]]. The wider index is [[dev/iot/homebridge/index|Homebridge]].

I started with Home Assistant, and it is still a good answer if you want history charts and rules. I dropped it because the Home app on the phone already did everything I needed, and Homebridge got me there with less. Both routes end in the same app: Home Assistant ships a HomeKit Bridge integration that exposes its entities to Apple Home. Starting points for that route are in [[dev/iot/ha/index|Home Assistant]].

## Failures I hit, in the order they hit me

| Failure | What happened | What it taught |
| --- | --- | --- |
| Memory card wear | Home Assistant on a Pi 3 with a 32 GB card, plus Bluetooth plant sensors. The first card died in under two weeks, the second ran for under a month, failed partly, then fully | The system disk is the write-heaviest part of the build, so it should not be a card |
| Bluetooth polling | Xiaomi plant sensors read by the Pi were unstable and irregular, and drained their coin cells. I bought an ESP32 to take over the Bluetooth work and had not connected it when the first card died | Treat Bluetooth polling from the central computer as the least reliable link in the build |
| Control only on the home network | Homebridge was reachable on the LAN only. With the phone's Wi-Fi off, every device vanished | An Apple home hub fixes it. A HomePod mini did |
| A dead host | A storm in July 2024 killed the Pi 3 | The Compose file and the backup rebuilt the stack on a Pi 5 with no redesign. The part I feared, the dongle, simply worked |
| Consolidation for tidiness | I moved the containers to a Synology NAS because I wanted everything in one place | The power bill disagreed, so I moved them back to a Pi 5 |

The card problem has a documented cause. The recorder in Home Assistant "constantly saves data", and its documentation says that on an SD card the defaults can shorten the life of the medium. It suggests a longer `commit_interval`, excluding entities from recording, or storing the data on another system. I cut the write frequency on my second card and still lost it within the month. An NVMe drive on the Pi 5 removed the question.

The hub problem has a documented fix too. Apple describes a home hub as the device that lets you control accessories away from home, share them with others and run automations, and says a HomePod or HomePod mini becomes one automatically when you set it up.

The NAS detour comes down to a measurement. By the figures I wrote down, the Synology DS423+ draws under 5 W with the disks hibernating and up to 32 W while they are accessed. The Pi 5 with its active cooler stayed under 4 W on a watt meter. For a workload that mostly sleeps, the NAS was the expensive host, and it was also carrying storage duty and a cache I did not want to disturb.

## Failures waiting to happen

These I know from documentation, not from losing a weekend to them. They are worth a line in any build.

The device path. My Compose file maps `/dev/ttyACM0`. The Zigbee2MQTT Docker guide says to always use the `/dev/serial/by-id/` path on the host, which names the adapter itself, unlike the `ttyACM` number the kernel hands out in the order devices appear. That is a one-line change, and I have not made it yet.

Discovery across a bridge network. HomeKit finds a bridge over mDNS, which does not cross a Docker bridge network. The Home Assistant documentation names `network_mode: host` as the first fix when a bridge does not show up in the Home app, and the Compose note carries the same warning.

The broker. A Mosquitto configuration with `listener 1883` binds to every interface. Since version 2.0 anonymous clients are rejected unless you opt in with `allow_anonymous true`, and the example in the Compose note opts in, which is acceptable only on a trusted home network. If the containers share a Compose network, the broker does not need a published port at all. If something outside needs it, set a password file.

The network key. Changing the Zigbee network key means re-pairing every device, according to the Zigbee2MQTT documentation. The data directory holds that key in `configuration.yaml`, which is precisely why it belongs in the backup and precisely why the repository receiving the backup has to be private.

## Rebuilding the stack from the Git backups

> [!note]
> Steps 1 to 3 follow the layout my own backup scripts produce, and I have run that route onto a new Pi 5 with the same dongle. The verification in step 4, the Homebridge fallback and the list of gaps come from the Zigbee2MQTT and Homebridge documentation. They are general guidance, not my practice.

The backup repository that the sync scripts push to has three folders, each holding the newest file from that day's run: `homebridge_config_backup`, `homebridge_instance_backup` and `zigbee2mqtt`. The jobs run once a day, so the restore point is at most a day old. The order matters more than the commands: data first, then the radio, then the bridge.

Step 1. Prepare the host. Install the OS and Docker, boot from NVMe, plug in the same coordinator and note its stable path:

```sh
ls -l /dev/serial/by-id/
```

Step 2. Recreate the stack directory and the Compose file. None of the backup scripts copy the Compose file or the Mosquitto configuration, so both come from wherever you keep them. Map the dongle by its stable path:

```yaml
    devices:
      - /dev/serial/by-id/<adapter-id>:/dev/ttyACM0
```

Step 3. Restore the Zigbee2MQTT data before its first start. The archive is created with `tar -czf <archive> -C <data-dir> .`, so it unpacks straight into the data directory:

```sh
git clone <backup-repo-url> restore && cd restore
ls -t backup/zigbee2mqtt | head -3
mkdir -p <stack-dir>/zigbee2mqtt
tar -xzf backup/zigbee2mqtt/<archive>.tar.gz -C <stack-dir>/zigbee2mqtt
```

What comes back is `configuration.yaml` with the network key, `database.db` with the paired devices and, if the adapter writes one, `coordinator_backup.json`. The order is not optional. Zigbee2MQTT started on an empty directory generates a new network key, and the documentation says that changing the key means re-pairing every device. In `configuration.yaml`, check that `serial.port` matches the path inside the container, as the Zigbee2MQTT FAQ advises when moving to a new host.

Step 4. Start the broker and Zigbee2MQTT, then check that the devices rejoined without pairing:

```sh
docker compose up -d mosquitto zigbee2mqtt
docker compose logs -f zigbee2mqtt
mosquitto_pub -h <broker-host> -t 'zigbee2mqtt/<friendly-name>/set' -m '{"state":"TOGGLE"}'
```

A clean start lists the devices from the database under their old friendly names. A line announcing an interview of a device means it joined as new, so stop and look at the restore before pairing anything. Mains-powered lights answer at once. Battery devices report when they next wake, so press the button or open the contact before you judge them.

Step 5. Start Homebridge and restore the newest file from `homebridge_instance_backup` through the UI, under Settings, Backup & Restore. According to the Homebridge wiki, that backup carries the storage folder: `config.json`, the plugin list, cached accessories, HomeKit pairing data and UI users, and missing plugins are installed during the restore. Restart Homebridge afterwards and keep `network_mode: host`, which the Docker image documents as required for HomeKit. If only `config.json` survives, the files in `homebridge_config_backup` are the fallback. If the bridge does not reappear in the Home app, the wiki's remedy is to reset Homebridge and add the bridge again.

What the backup does not cover:

- The Compose file and the Mosquitto configuration, as in step 2.
- The state of the dongle itself. The Zigbee2MQTT FAQ says backup and restore of the coordinator is implemented only for `zstack` and `ember` adapters. My ConBee II is a deCONZ adapter, so the data directory restores the host side and a dead dongle should be treated as a re-pairing job. I have not had to test that.
- Anything paired after the last run. A device added today is missing from yesterday's `database.db`.
- Rooms, scenes and automations. They live in Apple Home, not in the Homebridge folder.
- Silent failures. The scripts write their errors to the backup log, and a push that stopped working looks identical to a good backup until the day you need it.

## What to buy and what to skip

### Buy

- A coordinator from a family Zigbee2MQTT recommends. Its adapter page lists three: zStack (Texas Instruments), EmberZNet (Silicon Labs) and deCONZ (Dresden Elektronik). My ConBee II is in the third. It was not cheap, and it moved from the Pi 3 to a Pi 5 without a complaint.
- A Raspberry Pi 5 with active cooling, the official power supply and an NVMe drive. The first kit had the official 27 W supply, the official active cooler and an NVMe adapter board. The second is an Argon ONE V3 case with a built-in M.2 slot.
- A home hub you already have a reason to own. The same Apple page says Thread-enabled Matter accessories require a Thread-enabled home hub, and names HomePod mini and Apple TV 4K as examples. A hub bought for remote access today also covers that.
- Zigbee accessories from Chinese marketplaces. They were much cheaper than local shops for me. Dimmers I already owned gained a second life once the coordinator existed.

### Skip

- An SD card as a system disk for anything that records history.
- Bluetooth sensors read from the central computer. Keep Bluetooth for devices that live next to the radio that reads them.
- A NAS as the host for a four-watt workload, unless the NAS is awake all day anyway.
- A second computer before you have measured the first.

## Three questions before the next purchase

I closed the Polish write-up with three rules, and they cover every failure above that was self-inflicted:

1. Before you build something, count what it costs.
2. Before you buy something, check that you need it.
3. Before you move everything to other hardware, ask whether it is worth it.

**Move a workload to a bigger machine only after the watt meter agrees.**

## Sources

1. Zigbee2MQTT, [Supported adapters](https://www.zigbee2mqtt.io/guide/adapters/): recommended adapter families.
2. Zigbee2MQTT, [Docker installation](https://www.zigbee2mqtt.io/guide/installation/02_docker.html): passing the adapter by its `/dev/serial/by-id/` path.
3. Zigbee2MQTT, [Zigbee network configuration](https://www.zigbee2mqtt.io/guide/configuration/zigbee-network.html): `network_key` and re-pairing.
4. Home Assistant, [Recorder](https://www.home-assistant.io/integrations/recorder/): write load, `commit_interval`, exclusions.
5. Home Assistant, [HomeKit Bridge](https://www.home-assistant.io/integrations/homekit/): exposing entities to Apple Home, mDNS and `network_mode: host`.
6. Eclipse Mosquitto, [Migrating to 2.0](https://mosquitto.org/documentation/migrating-to-2-0/): loopback default and `allow_anonymous`.
7. Apple Support, [Set up your HomePod, HomePod mini or Apple TV as a home hub](https://support.apple.com/en-us/102557): what a home hub does and which devices become one.
8. Zigbee2MQTT, [FAQ](https://www.zigbee2mqtt.io/guide/faq/): moving to a new host, copying the `data` directory, backup and restore limited to `zstack` and `ember` adapters.
9. Homebridge, [Backup and Restore](https://github.com/homebridge/homebridge/wiki/Backup-and-Restore): what a backup contains and how to restore it on a new host.
10. Homebridge, [docker-homebridge](https://github.com/homebridge/docker-homebridge): host networking for HomeKit.
