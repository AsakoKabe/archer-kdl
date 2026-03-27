# KDL Metamodel and Kubernetes Mapping Specification

## 1. Overview

The Kubernetes Deployment Language (KDL) metamodel defines the formal structure for representing Kubernetes architectures. This document specifies the mapping semantics from Kubernetes API objects to KDL metamodel entities, including field-level mappings, edge inference rules, and edge case handling.

**Problem addressed:** Without explicit semantics the mapping from Kubernetes objects to KDL entities is ambiguous and results are hard to reproduce.

## 2. Metamodel Hierarchy

```
KDLDiagram
├── NamespaceNode[]
│   ├── IngressNode[]
│   ├── ServiceNode[]
│   │   ├── ServiceTypeNode
│   │   └── PortNode[]
│   └── PodNode[]
│       ├── PodController
│       ├── PodCardinality
│       ├── VolumeNode[]
│       ├── ContainerNode[]
│       └── PortNode[]
└── Diagram
    ├── NodeAttribute[]
    │   └── Dimensions
    └── EdgeAttribute[]
        └── Point[]
```

Every metamodel element carries two mandatory fields:

| Field | Type   | Description                      |
|-------|--------|----------------------------------|
| `id`  | string | Unique identifier within parent  |
| `name`| string | Human-readable display name      |

## 3. Entity Specifications

### 3.1 KDLDiagram (root)

| Field        | Type              | Description                          |
|--------------|-------------------|--------------------------------------|
| `id`         | string            | Diagram identifier                   |
| `name`       | string            | Diagram display name                 |
| `namespaces` | NamespaceNode[]   | Logical grouping of K8s resources    |
| `diagram`    | Diagram?          | Visual layout metadata               |

### 3.2 NamespaceNode

| Field       | Type            | Description                    |
|-------------|-----------------|--------------------------------|
| `id`        | string          | Generated index                |
| `name`      | string          | Kubernetes namespace name      |
| `ingresses` | IngressNode[]   | Ingress resources in namespace |
| `services`  | ServiceNode[]   | Service resources in namespace |
| `pods`      | PodNode[]       | Pod resources in namespace     |

### 3.3 PodNode

| Field         | Type             | Description                          |
|---------------|------------------|--------------------------------------|
| `id`          | string           | Generated as `PodNode{index}`        |
| `name`        | string           | Pod name                             |
| `controller`  | PodController?   | Owning controller (Deployment, etc.) |
| `cardinality` | PodCardinality?  | Replica count                        |
| `volumes`     | VolumeNode[]     | Attached volumes                     |
| `containers`  | ContainerNode[]  | Container specifications             |
| `ports`       | PortNode[]       | Exposed ports                        |

### 3.4 ServiceNode

| Field   | Type              | Description                             |
|---------|-------------------|-----------------------------------------|
| `id`    | string            | Generated as `ServiceNode{index}`       |
| `name`  | string            | Service name                            |
| `type`  | ServiceTypeNode?  | ClusterIP, NodePort, LoadBalancer, etc.  |
| `ports` | PortNode[]        | Service ports                           |
| `links` | Ref\<PortNode\>[] | Edges to target pod ports               |

### 3.5 IngressNode

| Field   | Type              | Description                        |
|---------|-------------------|------------------------------------|
| `id`    | string            | Generated as `IngressNode{index}`  |
| `name`  | string            | Ingress resource name              |
| `host`  | string            | Hostname from ingress rule         |
| `links` | Ref\<PortNode\>[] | Edges to target service ports      |

### 3.6 ContainerNode

| Field   | Type              | Description                        |
|---------|-------------------|------------------------------------|
| `id`    | string            | Generated as `ContainerNode{index}`|
| `name`  | string            | Container name                     |
| `links` | Ref\<PortNode\>[] | Edges to port targets              |

### 3.7 PortNode

| Field    | Type    | Description                     |
|----------|---------|---------------------------------|
| `id`     | string  | Generated as `Port{index}`      |
| `name`   | string  | Port name                       |
| `number` | number? | Port number                     |

### 3.8 VolumeNode

| Field  | Type   | Description                          |
|--------|--------|--------------------------------------|
| `id`   | string | Generated as `Volume{index}`         |
| `name` | string | Resource name (Secret or ConfigMap)  |
| `type` | string | `"secret"` or `"configmap"`          |

### 3.9 PodController

| Field  | Type   | Description                                        |
|--------|--------|----------------------------------------------------|
| `id`   | string | Controller identifier                              |
| `name` | string | Abbreviated kind: D, SS, DS, RS, RC (see Table 6)  |

### 3.10 PodCardinality

| Field  | Type   | Description                   |
|--------|--------|-------------------------------|
| `id`   | string | Cardinality identifier        |
| `name` | string | Replica count (as string)     |

### 3.11 ServiceTypeNode

| Field  | Type   | Description                                      |
|--------|--------|--------------------------------------------------|
| `id`   | string | Always `"ServiceTypeNode"`                       |
| `name` | string | ClusterIP, NodePort, LoadBalancer, ExternalName   |

## 4. Kubernetes-to-KDL Field Mapping Tables

### Table 1: Namespace Mapping

| Kubernetes Source             | KDL Target            | Notes                                      |
|-------------------------------|-----------------------|--------------------------------------------|
| Namespace name (string)       | `NamespaceNode.name`  | Direct mapping                             |
| Namespace index               | `NamespaceNode.id`    | Generated sequentially                     |
| --                            | `.pods[]`             | Populated by Pod recovery                  |
| --                            | `.services[]`         | Populated by Service recovery              |
| --                            | `.ingresses[]`        | Populated by Ingress recovery              |

**Filter rule:** Namespaces starting with `kube` are excluded (e.g., `kube-system`).

### Table 2: Pod Mapping

| Kubernetes Source                          | KDL Target                 | Notes                                       |
|--------------------------------------------|----------------------------|---------------------------------------------|
| `V1Pod.metadata.name`                      | `PodNode.name`             | Direct mapping                              |
| Pod index in namespace                     | `PodNode.id`               | Generated as `PodNode{index}`               |
| `V1Pod.metadata.ownerReferences` (resolved)| `PodNode.controller`       | Resolved via controller chain (see Table 6) |
| Controller `.spec.replicas`                | `PodNode.cardinality.name` | Stored as string                            |
| `V1Pod.spec.containers[]`                  | `PodNode.containers[]`     | Delegated to Container recovery             |
| Container ports (aggregated)               | `PodNode.ports[]`          | Delegated to Port recovery                  |
| `V1Pod.spec.volumes[]` + container env     | `PodNode.volumes[]`        | Delegated to Volume recovery                |

**Deduplication rule:** `KubeClient.getPods()` returns only one pod per Deployment. It matches the ReplicaSet owner name against the pattern `/^(.+)-[a-z0-9]{9,}$/` and keeps the first pod per extracted deployment name.

### Table 3: Service Mapping

| Kubernetes Source              | KDL Target                   | Notes                              |
|--------------------------------|------------------------------|------------------------------------|
| `V1Service.metadata.name`      | `ServiceNode.name`           | Direct mapping                     |
| Service index in namespace     | `ServiceNode.id`             | Generated as `ServiceNode{index}`  |
| `V1Service.spec.type`          | `ServiceTypeNode.name`       | ClusterIP, NodePort, etc.          |
| `V1Service.spec.ports[]`       | `ServiceNode.ports[]`        | Delegated to Port recovery         |
| Label selector match (inferred)| `ServiceNode.links[]`        | See Edge Rule 1                    |

### Table 4: Ingress Mapping

| Kubernetes Source                  | KDL Target              | Notes                                |
|------------------------------------|-------------------------|--------------------------------------|
| `V1Ingress.metadata.name`          | `IngressNode.name`      | Direct mapping                       |
| Ingress index                      | `IngressNode.id`        | Generated as `IngressNode{index}`    |
| `V1IngressRule.host`               | `IngressNode.host`      | Default: `"localhost"` if missing    |
| Backend path match (inferred)      | `IngressNode.links[]`   | See Edge Rule 2                      |

**Cardinality:** One `IngressNode` is created **per rule**, not per Ingress object. An Ingress with 3 rules produces 3 IngressNodes.

### Table 5: Container Mapping

| Kubernetes Source           | KDL Target                 | Notes                              |
|-----------------------------|----------------------------|------------------------------------|
| `V1Container.name`          | `ContainerNode.name`       | Direct mapping                     |
| Container index in pod      | `ContainerNode.id`         | Generated as `ContainerNode{index}`|
| `V1Container.ports[]`       | Triggers Port recovery     | Ports added to parent PodNode      |

### Table 6: Controller Resolution Chain

| Owner Kind   | Resolution                                    | KDL Abbreviation |
|--------------|-----------------------------------------------|------------------|
| ReplicaSet   | Query RS -> check RS.ownerReferences          | RS               |
| -> Deployment| RS owned by Deployment                        | D                |
| -> StatefulSet| RS owned by StatefulSet                      | SS               |
| StatefulSet  | Direct owner                                  | SS               |
| DaemonSet    | Direct owner                                  | DS               |
| (none)       | No ownerReferences found                      | RC               |

### Table 7: Port Mapping

| Context      | Kubernetes Source              | KDL Target          | Default         |
|--------------|--------------------------------|---------------------|-----------------|
| Pod port     | `V1ContainerPort.containerPort`| `PortNode.number`   | `8080`          |
| Pod port     | `V1ContainerPort.name`         | `PortNode.name`     | `Port{index}`   |
| Service port | `V1ServicePort.port`           | `PortNode.number`   | `8080`          |
| Service port | `V1ServicePort.name`           | `PortNode.name`     | `Port{index}`   |

### Table 8: Volume Mapping

| Kubernetes Source                           | KDL Target         | Volume Type    |
|---------------------------------------------|---------------------|---------------|
| `V1Volume.secret.secretName`                | `VolumeNode.name`   | `"secret"`    |
| `V1Volume.configMap.name`                   | `VolumeNode.name`   | `"configmap"` |
| `V1Container.env[].valueFrom.secretKeyRef.name`     | `VolumeNode.name`   | `"secret"`    |
| `V1Container.env[].valueFrom.configMapKeyRef.name`  | `VolumeNode.name`   | `"configmap"` |
| `V1Container.envFrom[].secretRef.name`      | `VolumeNode.name`   | `"secret"`    |
| `V1Container.envFrom[].configMapRef.name`   | `VolumeNode.name`   | `"configmap"` |

**Deduplication:** Volumes are deduplicated by `(name, type)` pair across all sources.

**Unsupported volume types:** emptyDir, hostPath, persistentVolumeClaim, and others are not mapped.

## 5. Edge Inference Rules

Edges represent network dependencies between entities. All edges target `PortNode` instances.

### Edge Rule 1: Service -> Pod (label selector matching)

```
Source:  ServiceNode
Target:  PortNode (child of PodNode)
Trigger: V1Service.spec.selector
```

**Algorithm:**
1. Extract `V1Service.spec.selector` labels (e.g., `{ app: "nginx" }`)
2. Query Kubernetes API: `listNamespacedPod({ labelSelector: "app=nginx" })`
3. For each matched pod, for each `V1ServicePort`:
   - Find pod `PortNode` where `targetPort == port.number` OR `targetPort.toString() == port.name`
   - Create edge: `ServiceNode.links[] -> matched PortNode`

**Matching semantics:** All selector keys must match pod labels (AND logic). Empty selector `{}` matches all pods.

### Edge Rule 2: Ingress -> Service (backend path matching)

```
Source:  IngressNode
Target:  PortNode (child of ServiceNode)
Trigger: V1IngressRule.http.paths[]
```

**Algorithm:**
1. For each `V1HTTPIngressPath` in the rule:
   - Resolve `path.backend.service.name` -> find `ServiceNode` by name in namespace
   - Match port: `path.backend.service.port.number == port.number` OR `path.backend.service.port.name == port.name`
   - Create edge: `IngressNode.links[] -> matched PortNode`

**Matching semantics:** Port matching uses OR logic (either number or name match).

### Edge Source/Target Type Constraints

| Edge Source Type | Edge Target Type | Relationship                    |
|------------------|------------------|---------------------------------|
| IngressNode      | PortNode         | Ingress routes to service port  |
| ServiceNode      | PortNode         | Service selects pod port        |
| ContainerNode    | PortNode         | Container exposes port          |

## 6. Diagram Layout Schema

The `Diagram` section stores visual metadata for rendering.

### NodeAttribute

| Field        | Type              | Description                          |
|--------------|-------------------|--------------------------------------|
| `id`         | string            | Attribute identifier                 |
| `nodeID`     | Ref\<NodeType\>   | Reference to any metamodel node      |
| `dimensions` | Dimensions        | Position and size                    |

### Dimensions

| Field    | Type   | Description          |
|----------|--------|----------------------|
| `x`      | number | X coordinate         |
| `y`      | number | Y coordinate         |
| `width`  | number | Width in pixels      |
| `height` | number | Height in pixels     |

### EdgeAttribute

| Field      | Type                  | Description                    |
|------------|-----------------------|--------------------------------|
| `id`       | string                | Attribute identifier           |
| `sourceID` | Ref\<SourceNodeType\> | Ingress, Service, or Container |
| `targetID` | Ref\<TargetNodeType\> | PortNode only                  |
| `points`   | Point[]               | Routing waypoints              |

### Point

| Field | Type   | Description  |
|-------|--------|--------------|
| `x`   | number | X coordinate |
| `y`   | number | Y coordinate |

## 7. Default Values and Edge Cases

| Situation                        | Default Behavior                                  |
|----------------------------------|---------------------------------------------------|
| Pod without controller owner     | `PodController.name = "RC"`                       |
| Missing port number              | Defaults to `8080`                                |
| Missing port name                | Defaults to `Port{index}`                         |
| Missing ingress host             | Defaults to `"localhost"`                          |
| Service without selector         | No pod matching; `links[]` remains empty          |
| Ingress path with nil backend    | Skipped silently                                  |
| Service not found by name        | Error logged, edge not created                    |
| Multiple pods per deployment     | Only first pod kept (deduplication via RS pattern) |
| Volume referenced from multiple sources | Single VolumeNode (deduplicated by name+type) |
| Namespace starting with `kube`   | Excluded from recovery                            |
| Controller replicas undefined    | Empty PodCardinality created                      |

## 8. Recovery Orchestration Order

The cluster recovery process follows a deterministic order per namespace:

```
1. Create NamespaceNode
2. Recover Pods       (PodRecovery)
   2.1 Resolve controller (via ownerReferences chain)
   2.2 Recover containers (ContainerRecovery)
       2.2.1 Recover pod ports (PortRecovery)
   2.3 Recover volumes (VolumeRecovery)
3. Recover Services   (ServiceRecovery)
   3.1 Recover service ports (PortRecovery)
   3.2 Resolve service-to-pod links (ServiceLinkRecovery)
4. Recover Ingresses  (IngressRecovery)
   4.1 Resolve ingress-to-service links (IngressLinkRecovery)
```

Pods must be recovered before Services (Service linking depends on existing PodNodes). Services must be recovered before Ingresses (Ingress linking depends on existing ServiceNodes).
