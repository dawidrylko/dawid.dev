---
date: 2025-02-27
tags:
  - dev
  - ops
  - RabbitMQ
---

## 🌐 Overview

This guide outlines multiple methods to verify RabbitMQ operation on a server. RabbitMQ is a critical message broker component in distributed system architectures that implements the Advanced Message Queuing Protocol (AMQP). Proper verification involves service monitoring, network diagnostics, and log analysis.

## 🔗 Quick Links

- [RabbitMQ Documentation | RabbitMQ](https://www.rabbitmq.com/docs/)
- [Management Plugin | RabbitMQ](https://www.rabbitmq.com/docs/management)
- [Monitoring with Prometheus and Grafana | RabbitMQ](https://www.rabbitmq.com/docs/prometheus)

## 🔍 Verification Methods

### 1️⃣ Check System Service Status

On Linux systems with systemd, verify the RabbitMQ service status:

```bash
systemctl status rabbitmq-server
```

Expected output for a properly running service:

```
● rabbitmq-server.service - RabbitMQ broker
   Loaded: loaded (/usr/lib/systemd/system/rabbitmq-server.service; enabled; vendor preset: disabled)
   Active: active (running) since Wed 2025-02-27 10:21:32 UTC; 25s ago
 Main PID: 957 (beam.smp)
   Status: "Initialized"
```

> [!note]
> Look for `Active: active (running)` status. The `enabled` status indicates the service will start automatically on system boot.

### 2️⃣ Use RabbitMQ Control Tool

The `rabbitmqctl` utility provides detailed status information:

```bash
sudo rabbitmqctl status
```

This command returns comprehensive information including:

- Erlang/OTP version
- Memory usage statistics
- Active plugins
- Cluster status
- Mnesia database information

Example memory section output:

```
Memory
Total: 1.2 GB
Allocated: 856.4 MB
  Processes: 643.2 MB
  Binary: 45.8 MB
  Code: 123.7 MB
  ETS: 43.7 MB
```

For a more focused memory analysis:

```bash
sudo rabbitmq-diagnostics memory_breakdown
```

### 3️⃣ Check Network Ports

RabbitMQ listens on specific ports that should be active:

- Port 5672: Standard AMQP protocol
- Port 15672: Management web interface (if enabled)

Verify open ports with:

```bash
ss -tulnp | grep '5672\|15672'
```

Expected output:

```
tcp  LISTEN 0  128  [::]:5672   [::]:*  users:(("beam.smp",pid=957,fd=36))
tcp  LISTEN 0  128  [::]:15672  [::]:*  users:(("beam.smp",pid=957,fd=45))
```

Test connectivity to the AMQP port:

```bash
telnet localhost 5672
```

Or using OpenSSL for TLS connections:

```bash
openssl s_client -connect localhost:5672 -starttls amqp
```

### 4️⃣ Examine Active Processes

Check for the RabbitMQ Erlang processes:

```bash
ps aux | grep beam.smp
```

The output should show the main RabbitMQ broker process and its Erlang VM parameters.

### 5️⃣ Analyze RabbitMQ Logs

Inspect logs for errors or warnings:

```bash
journalctl -u rabbitmq-server --no-pager --lines=50
```

Or check log files directly:

```bash
tail -f /var/log/rabbitmq/rabbit@$(hostname).log
```

> [!important]
> Key log files are located in `/var/log/rabbitmq/`:
>
> - `rabbit@hostname.log` - Main event log
> - `rabbit@hostname-sasl.log` - Erlang SASL environment logs

### 6️⃣ Test Management API

If the management plugin is enabled, verify the API is accessible:

```bash
curl -u admin:password http://localhost:15672/api/overview
```

Expected response: JSON data containing cluster information, message rates, and queue statistics.

### 7️⃣ Advanced Diagnostics

For more comprehensive diagnostics:

```bash
# Check environment settings
sudo rabbitmq-diagnostics environment

# Verify cluster status
sudo rabbitmq-diagnostics cluster_status

# Test network connectivity
sudo rabbitmq-diagnostics check_port_connectivity

# Verify vhost permissions
sudo rabbitmq-diagnostics check_virtual_hosts
```

## 🚀 Creating Monitoring Users

For secure monitoring operations, create dedicated users with limited permissions:

```bash
rabbitmqctl add_user monitor SecurePassword123
rabbitmqctl set_user_tags monitor monitoring
rabbitmqctl set_permissions -p / monitor "^aliveness-test$" ".*" ".*"
```

## 📋 Prometheus Integration

Enable metric collection for Prometheus:

```bash
# Enable the plugin
sudo rabbitmq-plugins enable rabbitmq_prometheus

# Add to rabbitmq.conf
echo "prometheus.tcp.port = 15692" >> /etc/rabbitmq/rabbitmq.conf
echo "prometheus.path = /metrics" >> /etc/rabbitmq/rabbitmq.conf

# Verify metrics export
curl http://localhost:15692/metrics
```

## 🛠️ Troubleshooting Common Issues

### File Descriptor Limits

If RabbitMQ shows warnings about file descriptors:

```bash
# Check current limits
rabbitmqctl status | grep file_descriptors

# Adjust limits in /etc/security/limits.conf
echo "rabbitmq soft nofile 65536" >> /etc/security/limits.conf
echo "rabbitmq hard nofile 65536" >> /etc/security/limits.conf
```

### Mnesia Database Recovery

If database corruption occurs:

```bash
# Stop RabbitMQ
systemctl stop rabbitmq-server

# Backup and clear Mnesia directory
cp -r /var/lib/rabbitmq/mnesia /var/lib/rabbitmq/mnesia.bak
rm -rf /var/lib/rabbitmq/mnesia/*

# Restart service
systemctl start rabbitmq-server
```

> [!warning]
> Clearing Mnesia will remove all queues, exchanges, and messages. Only use this as a last resort when data integrity is compromised.

## 💁🏼‍♀️ Summary

A comprehensive verification of RabbitMQ requires checking multiple layers: service status, network availability, process health, log analysis, and performance metrics. For production environments, implement regular health checks through the Management API's aliveness test endpoint (`/api/aliveness-test/%2F`) and monitor file descriptor usage, message queue growth, and memory consumption.
