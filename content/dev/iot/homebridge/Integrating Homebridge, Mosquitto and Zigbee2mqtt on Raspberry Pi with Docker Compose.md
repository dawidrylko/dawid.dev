---
created: 2024-04-22
modified: 2025-07-31
tags:
  - dev
  - iot
  - ops
  - Homebridge
  - homelab
---

## 🌐 Overview

This `docker-compose.yml` file outlines a multi-container configuration for a home automation system, incorporating [Homebridge](https://homebridge.io/), [Mosquitto](https://mosquitto.org/), and [Zigbee2MQTT](https://www.zigbee2mqtt.io/). It encompasses essential configurations for each service, including volumes, devices, and environment variables.

This setup serves to seamlessly integrate diverse smart home devices, encompassing lights, sensors, and switches, into the home automation framework. Inter-service communication occurs over the local network through #MQTT and #Zigbee protocols. The host machine for container execution is a #RaspberryPi. [Conbee II](https://phoscon.de/en/conbee2) is the Zigbee USB dongle used for Zigbee device communication.

## 📝 Configuration

```yaml title="docker-compose.yml"
services:
  mosquitto:
    image: eclipse-mosquitto:latest
    restart: unless-stopped
    hostname: mosquitto
    container_name: mosquitto
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mosquitto/data:/mosquitto/data
      - ./mosquitto/log:/mosquitto/log
      - ./mosquitto/mosquitto.conf:/mosquitto/config/mosquitto.conf
    networks:
      - homebridge-network
    command: "mosquitto -c /mosquitto/config/mosquitto.conf"
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "mosquitto_pub -h localhost -t healthcheck -m test -q 1 || exit 1",
        ]
      interval: 60s
      retries: 5
      start_period: 60s
      timeout: 10s

  zigbee2mqtt:
    image: koenkk/zigbee2mqtt:latest
    restart: unless-stopped
    hostname: zigbee2mqtt
    container_name: zigbee2mqtt
    ports:
      - "8080:8080"
    volumes:
      - ./zigbee2mqtt:/app/data
      - /run/udev:/run/udev:ro
    environment:
      - TZ=Europe/Warsaw
    devices:
      - /dev/ttyACM0:/dev/ttyACM0
    group_add:
      - dialout
    networks:
      - homebridge-network
    depends_on:
      - mosquitto
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "wget --quiet --tries=1 --spider http://localhost:8080 || exit 1",
        ]
      interval: 60s
      retries: 5
      start_period: 120s
      timeout: 10s

  homebridge:
    image: homebridge/homebridge:latest
    restart: unless-stopped
    hostname: homebridge
    container_name: homebridge
    ports:
      - "8581:8581"
      - "51827:51827"
    volumes:
      - ./homebridge:/homebridge
    environment:
      - TZ=Europe/Warsaw
      - HOMEBRIDGE_CONFIG_UI=1
      - HOMEBRIDGE_CONFIG_UI_PORT=8581
    networks:
      - homebridge-network
    depends_on:
      - mosquitto
    logging:
      driver: json-file
      options:
        max-size: "10mb"
        max-file: "3"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8581 || exit 1"]
      interval: 60s
      retries: 5
      start_period: 240s
      timeout: 10s

networks:
  homebridge-network:
    driver: bridge
```

```conf title="mosquitto/mosquitto.conf"
listener 1883 0.0.0.0
allow_anonymous true
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
log_dest stdout
```

```yaml title="zigbee2mqtt/configuration.yaml"
mqtt:
  base_topic: zigbee2mqtt
  server: mqtt://mosquitto:1883
serial:
  port: /dev/ttyACM0
frontend:
  enabled: true
  port: 8080
advanced:
  network_key: GENERATE
  log_level: info
```

## 💁🏼‍♀️ Services

### 🏠 Homebridge

The `homebridge` service runs the [Homebridge](https://homebridge.io/) server, which acts as a bridge between smart home devices and Apple's HomeKit. It allows non-HomeKit compatible devices to be controlled via the Home app on iOS devices.

- `image`: Specifies the Docker image to use for the #Homebridge service. In this case, it uses the latest version of the [official Homebridge image](https://hub.docker.com/r/homebridge/homebridge).
- `restart`: Specifies the restart policy for the container. The `unless-stopped` option ensures that the container restarts automatically unless explicitly stopped.
- `hostname`: Defines the hostname for the container (`homebridge`).
- `container_name`: Specifies the name of the container (`homebridge`).
- `ports`: Maps ports from the container to the host machine.
  - `8581:8581`: Maps the Homebridge UI port.
  - `51827:51827`: Maps the Homebridge accessory port.
- `volumes`: Maps a local directory (`./homebridge`) to the `/homebridge` directory in the container. This volume is used to persist Homebridge configuration and data.
- `environment`: Sets environment variables for the container.
  - `TZ=Europe/Warsaw`: Sets the timezone to Europe/Warsaw.
  - `HOMEBRIDGE_CONFIG_UI=1`: Enables the Homebridge UI.
  - `HOMEBRIDGE_CONFIG_UI_PORT=8581`: Sets the port for the Homebridge UI.
- `networks`: Connects the container to the `homebridge-network`.
- `depends_on`: Ensures the `mosquitto` service starts before `homebridge`.
- `logging`: Configures the logging driver for the container to write logs to a JSON file.
  - `driver`: Specifies the logging driver to use (`json-file`).
  - `options`: Specifies additional options for the logging driver.
    - `max-size`: Limits the size of each log file to 10 MB.
    - `max-file`: Specifies that a maximum of 3 log files should be kept.
- `healthcheck`: Defines a health check for the `homebridge` container to monitor its availability.
  - `test`: Runs a command (`curl -f http://localhost:8581 || exit 1`) to check if the Homebridge UI is responding.
  - `interval`: Specifies how frequently the health check should run (every 60 seconds).
  - `retries`: Defines the number of failed attempts before considering the service unhealthy (5 retries).
  - `start_period`: Allows the service 240 seconds to start before running health checks.
  - `timeout`: Sets a timeout of 10 seconds for the health check command.

### 🔌 Mosquitto

The `mosquitto` service runs the [Mosquitto](https://mosquitto.org/) MQTT broker, which facilitates communication between MQTT clients and devices in the home automation system.

- `image`: Specifies the Docker image to use for the #Mosquitto service. In this case, it uses the [official Eclipse Mosquitto image](https://hub.docker.com/_/eclipse-mosquitto).
- `restart`: Specifies the restart policy for the container. The `unless-stopped` option ensures that the container restarts unless explicitly stopped.
- `hostname`: Defines the hostname for the container (`mosquitto`).
- `container_name`: Specifies the name of the container (`mosquitto`).
- `ports`: Exposes the MQTT broker on ports `1883` (standard MQTT) and `9001` (WebSockets) on the host machine.
- `volumes`: Maps local directories to directories in the container.
  - `./mosquitto/data:/mosquitto/data`: Persists Mosquitto data.
  - `./mosquitto/log:/mosquitto/log`: Persists Mosquitto logs.
  - `./mosquitto/mosquitto.conf:/mosquitto/config/mosquitto.conf`: Mounts a custom configuration file for Mosquitto.
- `networks`: Connects the container to the `homebridge-network`.
- `command`: Specifies the command to run when starting the Mosquitto container (`mosquitto -c /mosquitto/config/mosquitto.conf`), instructing it to use the mounted configuration file.
- `healthcheck`: Defines a health check for the `mosquitto` container.
  - `test`: Runs a command (`mosquitto_pub -h localhost -t healthcheck -m test -q 1 || exit 1`) to publish a test message, checking if the broker is responsive.
  - `interval`: Specifies how frequently the health check should run (every 60 seconds).
  - `retries`: Defines the number of failed attempts before considering the service unhealthy (5 retries).
  - `start_period`: Allows the service 60 seconds to start before running health checks.
  - `timeout`: Sets a timeout of 10 seconds for the health check command.

### 🐝 Zigbee2MQTT

The `zigbee2mqtt` service runs the [Zigbee2MQTT](https://www.zigbee2mqtt.io/) bridge, which allows Zigbee devices to communicate with MQTT clients and other services in the home automation system.

- `image`: Specifies the Docker image to use for the Zigbee2MQTT service. In this case, it uses the latest version of the [official Zigbee2MQTT image](https://hub.docker.com/r/koenkk/zigbee2mqtt).
- `restart`: Specifies the restart policy for the container. The `unless-stopped` option ensures that the container restarts unless explicitly stopped.
- `hostname`: Defines the hostname for the container (`zigbee2mqtt`).
- `container_name`: Specifies the name of the container (`zigbee2mqtt`).
- `ports`: Exposes the Zigbee2MQTT web interface on port `8080` on the host machine.
- `volumes`: Maps local directories to directories in the container.
  - `./zigbee2mqtt:/app/data`: Persists Zigbee2MQTT configuration and data.
  - `/run/udev:/run/udev:ro`: Grants read-only access to the host's `udev` directory, necessary for USB device detection.
- `environment`: Sets the `TZ` environment variable to `Europe/Warsaw`, specifying the container's time zone.
- `devices`: Binds the host device `/dev/ttyACM0` to the container device `/dev/ttyACM0`. This is crucial for communicating with the Conbee II Zigbee USB dongle.
- `group_add`: Adds the container to the `dialout` group on the host, which is often required for accessing serial devices.
- `networks`: Connects the container to the `homebridge-network`.
- `depends_on`: Ensures the `mosquitto` service starts before `zigbee2mqtt`, as Zigbee2MQTT relies on an MQTT broker.
- `healthcheck`: Defines a health check for the `zigbee2mqtt` container.
  - `test`: Runs a command (`wget --quiet --tries=1 --spider http://localhost:8080 || exit 1`) to check if the Zigbee2MQTT web interface is responding.
  - `interval`: Specifies how frequently the health check should run (every 60 seconds).
  - `retries`: Defines the number of failed attempts before considering the service unhealthy (5 retries).
  - `start_period`: Allows the service 120 seconds to start before running health checks.
  - `timeout`: Sets a timeout of 10 seconds for the health check command.

## 🌍 Network Configuration

The `homebridge-network` is a user-defined bridge network that allows the `mosquitto`, `zigbee2mqtt`, and `homebridge` containers to communicate with each other using their service names as hostnames. This provides isolated and efficient inter-service communication within the Docker environment.

- `homebridge-network`:
  - `driver: bridge`: Specifies that this is a standard Docker bridge network.
