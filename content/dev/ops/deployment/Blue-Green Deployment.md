---
title: Blue-Green Deployment
date: 2024-05-24
description: "Blue-green deployment keeps two identical production environments and switches traffic between them: zero downtime, instant rollback, and the cost of both."
tags:
  - dev
  - ops
  - deployment
---

## Overview

Blue-green deployment maintains two identical environments. Blue runs the current version and serves live traffic, green receives the new one. When green passes its checks, the router moves traffic from blue to green, so users see no downtime. The strategy suits systems where availability matters most and where a release has to be reversible in seconds. Red/black deployment, the name used by Netflix, is the same pattern.

## Key concepts

Blue is the production environment that runs the stable version. Green is its twin, built to the same configuration, and hosts the release candidate. A traffic router decides which of the two is live: a load balancer, a service mesh or DNS. DNS is the slowest option, because resolver caches keep sending some clients to the old side after the switch.

## Implementation steps

1. Deploy the new version to green, with the same configuration as blue.
2. Test green for functionality, performance and stability.
3. Switch traffic from blue to green, all at once or in stages, depending on risk tolerance.
4. Monitor green under production load.
5. Keep blue as the fallback until the release is proven, then update it for the next release or repurpose it.

## Advantages

Users see no downtime, because the switch is a routing change and not a restart. Rollback is the same switch in the other direction, which makes it the fastest among the common strategies. Green is tested in a production-like environment before it sees a single user, and the idle environment can double as a disaster recovery target.

## Challenges

Two full environments nearly double the infrastructure bill. They also have to stay identical apart from the version, otherwise green passes tests that blue's configuration would fail. The database is the hard part: both versions usually share one schema, so every migration must work for both. A cold green needs a warm-up before it takes the full load. All of this demands automation that a single environment never required.

## Use cases

The second environment pays off where downtime has a direct price: banking systems that process sensitive transactions, healthcare services, high-traffic stores in peak season, streaming platforms and critical public infrastructure.

## Advanced techniques

After the switch, the old blue becomes the target of the next release, so the two environments alternate roles. A canary stage can come first, with a small share of traffic sent to green before the full switch. Schema changes follow the expand and contract pattern, which keeps the old and the new version working against the same database during the cutover. Feature flags then enable new behavior in green gradually.

## Best practices

Automate the whole sequence to remove manual mistakes. Gate the switch on health checks instead of a person's impression. Plan database migrations to be backward and forward compatible. Define the infrastructure as code, so parity between the environments is a property of the code and not of discipline. Practice the switch often. A rollback that was never rehearsed is a guess.
