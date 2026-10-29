---
title: Federated Deployment
date: 2025-03-12
description: "Federated deployment coordinates releases across clusters under shared policy: KubeFed (retired) as the model, Karmada and Open Cluster Management today."
tags:
  - dev
  - ops
  - deployment
---

## Overview

Federated deployment coordinates releases across several clusters or regions that stay autonomous but follow a shared governance model. It fits geographically distributed data centers, hybrid and multi-cloud setups, and edge or IoT scenarios, where one cluster is not enough or not allowed. Control is decentralized and coordination is central: each cluster decides locally, and shared policies keep them consistent.

The best-known implementation of this idea for Kubernetes was [KubeFed](https://github.com/kubernetes-retired/kubefed). The project is retired. The repository was archived in 2023 and now sits under `kubernetes-retired`. The model it defined, a `FederatedDeployment` resource that wraps a `Deployment` together with placement rules and per-cluster overrides, is still the clearest way to explain the concept, so this note uses it as the reference. For a new setup, use Karmada or Open Cluster Management.

## Key concepts

Each cluster keeps authority over local decisions, while globally shared policies keep the clusters coherent. A central control plane, often a dedicated host cluster, manages placement, overrides and synchronization, and day-to-day operation stays distributed. Consistent APIs, such as Kubernetes CRDs, give clusters in different clouds and data centers one interface. The desired state is declared once, for example the number of replicas per region, and the system propagates it to the member clusters. The topology can span edge nodes, on-prem data centers and several public clouds that contribute to one shared pool of resources.

## The KubeFed reference model

The host cluster runs the control plane and stores metadata about all member clusters. Member clusters are the runtime clusters, possibly in different regions or clouds, that receive resources such as Deployments, ConfigMaps or Secrets. Coordination is CRD-based: you define policies and overrides at the federated level, in resources such as `FederatedDeployment` or `FederatedNamespace`, and the controllers replicate them as ordinary objects into each member.

Placement policies decide where the workload lands:

| Strategy              | Description                                              | Use case                            |
| --------------------- | -------------------------------------------------------- | ----------------------------------- |
| Weighted distribution | Assign a specific percentage of replicas to each cluster | Hybrid cloud or tiered environments |
| Geo-affinity          | Route traffic or place pods closer to users (by region)  | Global low-latency applications     |
| Resource-based        | Distribute workloads based on cluster resources          | Heterogeneous node pools            |
| Cost-optimized        | Place replicas in lower-cost regions or clouds           | Multi-cloud cost controls           |

The synchronization flow has four steps:

1. An operator creates or updates the `FederatedDeployment` in the host cluster.
2. The controller reads the specification together with the overrides and placement rules.
3. The control plane creates matching `Deployment` objects in each target cluster.
4. A reconciliation loop checks for drift and restores the declared state in any cluster that diverges.

## Current alternatives

Karmada and Open Cluster Management cover the same ground with maintained control planes. Karmada propagates resources to member clusters through `PropagationPolicy` objects. Open Cluster Management distributes them from a hub cluster with `ManifestWork`, and picks target clusters with `Placement`.

## Advantages

Workloads survive the loss of a data center or a region, because traffic and replicas shift to healthy clusters. One policy set applied everywhere makes compliance, monitoring and scaling uniform. Each cluster can still adjust resource quotas or security contexts to local requirements. Rolling, canary and blue-green releases can run across clusters, so a rollout can go region by region.

## Challenges

More clusters mean a wider attack surface, so every link has to be secured, from control-plane APIs to cross-cluster traffic. Encrypt that traffic with TLS or mTLS, restrict inbound and outbound network policies in line with zero trust, and align RBAC or ABAC with the organizational boundaries when clusters serve different business units. Data residency rules may pin some workloads to given regions, and placement policies enforce that by keeping workloads out of unapproved clusters.

Stateless services federate easily. Databases and message queues need their own replication strategy to stay consistent. The extra layer of abstraction calls for an experienced DevOps team and mature processes, and cross-cluster synchronization adds latency, which hurts chatty or synchronous applications.

## Use cases

Smart-city and IoT systems pair edge clusters (traffic lights, sensors, gateways) that decide in real time with a cloud layer that coordinates updates and aggregates data. Retail and e-commerce run regional clusters for seasonal peaks, with weighted distribution steering load to cheap or low-latency regions. Telecoms operate microservices across edges and central data centers, each location meeting its own SLA while a global coordinator manages releases and security policy. Banks use placement rules to keep sensitive workloads in given regions while less sensitive components scale outward.

## Advanced techniques

GitOps keeps the whole multi-cluster state, overrides included, in Git, and a controller reconciles differences and can roll back when something fails. Federated machine learning trains models on sensitive data inside each cluster and merges only the updates in a central aggregator. For observability, Jaeger or OpenTelemetry unify traces across cluster boundaries, and central dashboards show performance and anomalies in one place.

## Best practices

Keep all federated resource definitions in version control for traceability and reproducibility. Apply TLS or mTLS across clusters, strict RBAC or ABAC and continuous vulnerability scanning from the start. Begin with a few clusters and widen the federation as the policies and metrics mature.
