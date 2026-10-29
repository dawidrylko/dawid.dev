---
title: Recreate Deployment
date: 2024-05-24
description: "Recreate deployment stops the running version completely before starting the new one: the simplest release strategy, paid for with a planned downtime window."
tags:
  - dev
  - ops
  - deployment
---

## Overview

Recreate deployment shuts down the current version completely before starting the new one. It is the simplest release strategy, and the price is downtime: the application is unavailable between the stop and the start. The whole application is replaced in one operation, not updated gradually.

## Key concepts

The current version serves traffic until the window opens. The new version replaces it entirely, with no instance of the old one left. The deployment window is the planned period of unavailability, announced to users and stakeholders in advance.

## Implementation steps

1. Test the new version in non-production environments.
2. Schedule a maintenance window and announce it.
3. Stop all instances of the current version, by shutting down servers or scaling the deployment to zero.
4. Install and configure the new version.
5. Start all components of the new version, so it begins to take traffic.
6. Verify the result with tests and monitoring.

## Advantages

There is one environment and one version at any time, so the scripts are short and the infrastructure cost is the lowest of all strategies. Nothing from the old version survives, which removes a whole class of compatibility problems. The same holds for the database: a migration does not have to keep the old schema working, because the old code is gone before it runs. The cutover is a single, definite point.

## Challenges

Users get no service during the window, and in a busy period that means lost revenue and complaints. A failure takes down the whole application at once, and there is no gradual validation that would catch it earlier. Rollback means running the entire procedure again with the old version, which costs another window.

## Use cases

Recreate fits internal enterprise applications with agreed maintenance windows, development and test environments, and batch systems that run on a schedule. It also suits small projects that cannot afford parallel environments, and major upgrades after which the old and the new version cannot coexist.

## Best practices

Deploy in the quietest hour you can find. Script the procedure end to end, because every manual step lengthens the downtime. Test thoroughly in staging, since production offers no gradual validation. Tell stakeholders about the window well in advance, and write down the rollback steps before the window starts.
