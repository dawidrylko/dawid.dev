---
title: Shadow Deployment
date: 2024-05-24
description: "Shadow deployment mirrors live traffic to a new version that never answers users: production-like evidence without exposure, plus the data and load costs."
tags:
  - dev
  - ops
  - deployment
---

## Overview

Shadow deployment runs the new version next to production and sends it a copy of the live traffic. The shadow processes the requests, but its responses never reach users. The team gets production-like evidence on performance, regressions and reliability with no user exposure.

## Key concepts

The production environment serves real users on the current version. The shadow environment hosts the new version and receives mirrored requests for testing only. Because its responses are discarded, anything the shadow writes or calls outside itself must be isolated. Otherwise it becomes a second production.

## Implementation steps

1. Deploy the new version into a dedicated shadow environment that mirrors the production configuration.
2. Duplicate live traffic and send it to the shadow as well, which handles the requests internally and returns nothing to users.
3. Compare metrics and responses between production and shadow to find bottlenecks and failures early.
4. Fix the issues, redeploy and test again until the new version meets the standard.
5. Promote the validated version to production.

## Advantages

No user can be hurt by the new version, since it never answers them. It processes genuine traffic patterns, so the performance data is authentic, unlike the output of a synthetic load test. Bugs and regressions surface before any user sees them.

## Challenges

Two environments cost resources and operational effort, and processing each request twice adds load, particularly on shared dependencies. Mirrored traffic carries real user data, so it needs careful handling, and writes made by the shadow must never reach shared state.

## Use cases

Shadow deployment fits large overhauls that would be risky to expose, such as a rewritten service or a new data path. It also fits benchmarking throughput and latency between the old and the new version, and catching regressions introduced by code changes.

## Advanced techniques

Mirroring rules live in the load balancer or the service mesh and can be automated. Anonymization strips or masks sensitive fields before they reach the shadow, which keeps the test compliant. Partial mirroring, borrowed from canary releases, duplicates only a fraction of the traffic to limit the extra load and grows it later.

## Best practices

Start with a low share of mirrored traffic and raise it as confidence grows. Log, measure and trace both environments, so differences between them are visible. Iterate quickly: fix what the comparison shows, then retest to confirm the fix.
