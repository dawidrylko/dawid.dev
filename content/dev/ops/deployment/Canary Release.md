---
title: Canary Release
date: 2024-05-24
description: "Canary release exposes a new version to a small share of users first and widens it while the metrics stay healthy: setup, monitoring and rollback triggers."
tags:
  - dev
  - ops
  - deployment
---

## Overview

A canary release exposes a new version to a small group of users first and widens the group only while the measurements stay healthy. Problems show up early, when they touch few people, and the team still gets feedback from real traffic. The name comes from coal miners. They carried canaries into mines because the birds reacted to toxic gas before people did.

## Key concepts

Canary users are a selected subset that receives the new version first, and in a company this is often internal staff. The traffic share starts small, such as 1-5%, and grows in phases against success criteria and monitoring thresholds fixed in advance. An automated fallback watches for anomalies and triggers the rollback when a threshold is breached, so the release does not depend on someone noticing the problem in time.

## Implementation steps

1. Test the new version in pre-production until it is ready for limited exposure.
2. Choose a representative canary group by demographic, behavioral or technical criteria.
3. Set up routing with a load balancer, a service mesh or feature flags, so that the traffic share is controllable.
4. Release to the canary group at a small share of traffic, such as 1-5%.
5. Monitor technical metrics (errors, latency, resource usage) and business metrics (conversion, engagement), and read the qualitative feedback.
6. Expand in phases while the criteria hold, then roll out to everyone or roll back.

## Advantages

A defect is found while it affects only a small share of users, so it costs a fraction of a full-release failure. The data is real traffic, not a test environment. Exposure is controlled and reversal is a routing change, which lets the team release more often with less fear.

## Challenges

The routing and monitoring must be good enough to tell a bad canary from noise, which usually takes a service mesh or a capable load balancer and real-time alerting. A small sample can hide rare defects, because the canary group may never touch the path that breaks. Two versions run side by side. The code and the data schema have to tolerate that, often through feature flags or version-aware code.

## Use cases

Canary releases fit checkout flows, where a defect costs revenue directly, and API changes consumed by many clients. They also suit new recommendation or search algorithms, performance optimizations that must be proven under real load, and UI redesigns where user reaction decides whether to continue.

## Advanced techniques

Traffic shifting can be automated: a controller raises the share while the metrics stay within bounds and cuts it when they do not. Several canary cohorts with different characteristics test different use cases at once. Feature flags give control over single functions inside the canary build, and circuit breakers tie the rollback to predefined error thresholds.

## Best practices

Define the success metrics and the expansion criteria before the release, not after the first graph. Start with a small share of traffic, such as 1-5%, and increase it in steps. Watch business metrics next to system metrics, because a release can be healthy for the servers and still hurt conversion. Make sure the canary experience does not harm the users selected for it, and automate the response to anomalies.
