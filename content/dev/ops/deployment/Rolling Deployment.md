---
title: Rolling Deployment
date: 2024-05-24
description: "Rolling deployment replaces application instances in batches so the service stays up: how a rollout runs, what it costs, and when to halt it."
tags:
  - dev
  - ops
  - deployment
---

## Overview

Rolling deployment replaces application instances with the new version in batches, so the service stays available all the way through. Users keep working while old and new instances run side by side.

## Key concepts

Instances are the independent units of the application, such as containers or servers. During the rollout the fleet holds both the current and the new version at once, so the two must be compatible with each other and with any shared data.

## Implementation steps

1. Test the new release until it is ready for deployment.
2. Replace a small batch of instances and monitor it before moving on.
3. Validate the performance and stability of the updated instances against the success criteria.
4. Repeat for the remaining batches until the whole fleet runs the new version.
5. If errors or slowdowns appear, halt the rollout and return to the previous stable release.

## Advantages

There is no downtime, because capacity is never taken away all at once. Problems tend to surface in the first batches, where they touch few instances, so detection and fixes come sooner. Small steps also simplify troubleshooting, since the set of changed instances is small and known.

## Challenges

Coordination needs orchestration and monitoring that treat many instances consistently. Old and new versions run in parallel for a while, which uses extra resources and demands backward compatibility. Batches take longer than a switchover. On a large fleet the rollout can last a long time.

## Use cases

Rolling deployment suits high-availability systems such as online stores and real-time communication, and large fleets that cannot be taken down together. It works well for microservices, where loosely coupled components ship often. It is also the default strategy of a Kubernetes Deployment.

## Advanced techniques

A CI/CD pipeline can drive the whole rollout. Traffic can be shifted progressively toward the updated instances, which makes a rolling update behave much like a canary. Health checks and real-time metrics confirm each batch before the next one starts.

## Best practices

Gate every batch on a health check. Define the rollback criteria in advance, as the metrics or error counts that stop the rollout. Put new features behind flags, so activation and rollback do not need a redeploy. Collect logs, metrics and traces to see the progress of the rollout, not only its end state.
