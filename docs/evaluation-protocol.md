# Evaluation Reproducibility Protocol

This document describes the evaluation methodology used to assess the Archer tool, enabling independent reproduction of TP/FP/FN metrics reported in the paper.

## 1. Dataset and Environment

### Projects Under Evaluation

| # | Project            | Domain                | Key K8s Resources                                  | Namespace       |
|---|--------------------|-----------------------|----------------------------------------------------|-----------------|
| 1 | Cassandra          | Distributed database  | 1 StatefulSet, 1 Headless Service, 1 Pod (3 replicas), PVC | `cassandra`    |
| 2 | Guestbook          | Web application       | 3 Deployments, 3 Services, 3 Pods                  | `guestbook`     |
| 3 | TensorFlow Serving | ML model serving      | 1 Deployment, 1 Service, 1 Ingress, 1 Pod, PVC     | `model-serving` |

All projects originate from the official Kubernetes examples repository: https://github.com/kubernetes/examples

### File Locations

```
evaluate/
  cassandra-gt.yaml                        # Ground truth
  cassandra-recovered.yaml                 # Recovered model
  guestbook-gt.yaml
  guestbook-recovered.yaml
  model-serving-tensorflow-gt.yaml
  model-serving-tensorflow-recovered.yaml
  compute_metrics.py                       # Scoring script
  requirements.txt                         # Python dependencies
```

### Environment Requirements

- Kubernetes cluster with the three projects deployed
- Python 3.x with `pyyaml` package
- Archer recovery tool (GLSP server with Kubernetes client)

## 2. Ground Truth Construction

Ground truth (GT) models were constructed manually by inspecting Kubernetes manifests and live cluster state. Each GT model is a YAML file conforming to the KDL metamodel schema.

### Entity ID Assignment

Entity IDs are assigned sequentially per type within a namespace:

| Entity Type  | ID Pattern              | Example           |
|--------------|-------------------------|--------------------|
| Namespace    | `NamespaceNode{index}`  | `NamespaceNode0`   |
| Pod          | `PodNode{index}`        | `PodNode0`         |
| Service      | `ServiceNode{index}`    | `ServiceNode1`     |
| Ingress      | `IngressNode{index}`    | `IngressNode0`     |
| Container    | `ContainerNode{index}`  | `ContainerNode0`   |
| Port         | `Port{index}`           | `Port0`            |
| Volume       | `Volume{index}`         | `Volume0`          |

### Attribute Sources

| KDL Attribute              | K8s Source                                |
|----------------------------|-------------------------------------------|
| `NamespaceNode.name`       | Namespace name                            |
| `ServiceNode.name`         | `service.metadata.name`                   |
| `ServiceNode.type.name`    | Abbreviated service type (CIP, NP, LB)    |
| `IngressNode.name`         | `ingress.metadata.name`                   |
| `IngressNode.host`         | `rule.host` from ingress spec             |
| `PodNode.controller.name`  | Abbreviated controller kind (D, SS, DS, RS, RC) |
| `PodNode.cardinality.name` | `controller.spec.replicas` (as string)    |
| `ContainerNode.name`       | `container.name`                          |
| `PortNode.name`            | Port name from K8s spec                   |
| `PortNode.number`          | Port number from K8s spec                 |
| `VolumeNode.name`          | Secret/ConfigMap/PVC resource name        |
| `VolumeNode.type`          | Volume kind (`volumeMounts`, `persistentVolumeClaim`, `secret`, `configmap`) |

### Link Determination

Links are fully-qualified paths in the format `{diagramId}.{namespaceId}.{entityId}.{portId}`:

- **Service -> Pod:** Determined by matching `service.spec.selector` labels to pod labels, then matching `targetPort` to pod port numbers.
- **Ingress -> Service:** Determined by matching `path.backend.service.name` and port.

## 3. Matching Policy

Comparison uses **exact set matching** on three dimensions.

### 3.1 Entity Matching

Entities are identified by hierarchical path:

```
{diagramId}.{namespaceId}                              # Namespace
{diagramId}.{namespaceId}.{entityId}                   # Pod, Service, Ingress
{diagramId}.{namespaceId}.{entityId}.{childId}         # Port, Container, Volume
```

Match criterion: exact string equality of the full path.

### 3.2 Link Matching

Links are stored as target path strings (e.g., `guestbook-example.NamespaceNode0.PodNode0.Port0`).

Match criterion: exact string equality.

### 3.3 Attribute Matching

Attributes are compared as `(entity_path, (attribute_name, attribute_value))` tuples.

Match criterion: exact equality of the full tuple. For nested objects (`type`, `controller`, `cardinality`), only the `.name` field is extracted.

### 3.4 Attributes Compared Per Entity Type

This table specifies **exactly** which attributes are compared for each entity type. Attributes not listed here are **excluded** from evaluation.

| Entity Type    | Attributes Compared          | Note                                    |
|----------------|------------------------------|-----------------------------------------|
| Namespace      | `name`                       |                                         |
| Ingress        | `name`, `host`               |                                         |
| Service        | `name`, `type`               | `type` extracted as `type.name`         |
| Service Port   | `name`, `number`             |                                         |
| Pod            | `controller`, `cardinality`  | **Pod `name` is NOT compared**          |
| Pod Container  | `name`                       |                                         |
| Pod Port       | `name`, `number`             |                                         |
| Pod Volume     | `name`, `type`               |                                         |

**Important:** Pod `name` is excluded from attribute comparison. This means pod instance name differences (e.g., `frontend` vs `frontend-75c448f886-9qf9s`) do not affect attribute metrics. This is a deliberate design choice: recovery extracts actual pod instance names with hash suffixes, while GT may use abstract names.

### 3.5 Recovery Defaults

When a field is absent during recovery, the following defaults are applied:

| Field               | Default Value     |
|---------------------|-------------------|
| `Ingress.host`      | `"localhost"`     |
| `Port.number`       | `8080`            |
| `Port.name`         | `Port{index}`     |
| `PodController.name`| `"RC"`            |

Defaults present in recovered but absent in GT count as FP. GT attributes absent from recovered count as FN.

## 4. Known Discrepancies Between GT and Recovered Models

### 4.1 Cassandra

| Category | GT                                         | Recovered    | Impact          |
|----------|---------------------------------------------|--------------|-----------------|
| Volume   | `Volume0` (cassandra-data, volumeMounts)    | Missing      | 1 FN entity, 2 FN attrs |

All other entities, links, and attributes match exactly.

### 4.2 Guestbook

| Category  | GT                                     | Recovered                           | Impact           |
|-----------|----------------------------------------|--------------------------------------|------------------|
| Pod 0 name| `frontend`                             | `frontend-75c448f886-9qf9s`         | Not compared     |
| Pod 2 name| `redis-replica-5dbc458645-q84tq`       | `redis-replica-5dbc458645-ff4xn`    | Not compared     |

Pod name is excluded from attribute matching → no impact on metrics. All compared attributes match.

### 4.3 TensorFlow Serving

| Category       | GT                             | Recovered                     | Impact               |
|----------------|--------------------------------|-------------------------------|----------------------|
| Ingress host   | `/tf(\|$)(.*)`            | `localhost`                   | 1 FP attr, 1 FN attr |
| Pod name       | `tf-serving`                   | `tf-serving-8474cc5bb7-fwdcq` | Not compared         |
| Volume 0       | model-volume (persistentVolumeClaim) | Missing                 | 1 FN entity, 2 FN attrs |
| Volume 1       | model-volume (volumeMounts)    | Missing                       | 1 FN entity, 2 FN attrs |

Root causes:
- **Volumes:** Recovery does not support `persistentVolumeClaim` or `volumeMounts` volume types
- **Ingress host:** Recovery defaults to `"localhost"` when the host value is a regex pattern

## 5. Scoring Pipeline

### 5.1 Script

`evaluate/compute_metrics.py`

### 5.2 Algorithm

```
For each dimension (entities, links, attributes):
    GT_set  = extract(gt_model)       # Set of strings or tuples
    REC_set = extract(recovered_model)
    TP = |GT_set ∩ REC_set|
    FP = |REC_set \ GT_set|
    FN = |GT_set \ REC_set|
    Precision = TP / (TP + FP)
    Recall    = TP / (TP + FN)
```

Precision and recall are rounded to 4 decimal places. The pipeline is fully deterministic.

### 5.3 Extraction Functions

The script contains three extraction functions:

- `extract_entities(model)` — builds hierarchical ID paths for all entities
- `extract_links(model)` — collects link target paths from services, ingresses, and containers
- `extract_attributes(model)` — builds `(entity_id, (attr_name, attr_value))` tuples per the attribute table in Section 3.4

### 5.4 Running the Evaluation

```bash
cd evaluate
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python compute_metrics.py
```

### 5.5 Output Format

15 metrics per project:

```
Entity TP / FP / FN / Precision / Recall
Link   TP / FP / FN / Precision / Recall
Attr   TP / FP / FN / Precision / Recall
```

## 6. Computed Results

### 6.1 Cassandra

| Dimension  | TP | FP | FN | Precision | Recall |
|------------|----|----|-----|-----------|--------|
| Entities   | 9  | 0  | 1   | 1.0       | 0.9    |
| Attributes | 16 | 0  | 2   | 1.0       | 0.8889 |
| Links      | 1  | 0  | 0   | 1.0       | 1.0    |

FN entities: `Volume0` (missing in recovered).
FN attributes: `Volume0.name`, `Volume0.type`.

### 6.2 Guestbook

| Dimension  | TP | FP | FN | Precision | Recall |
|------------|----|----|-----|-----------|--------|
| Entities   | 16 | 0  | 0   | 1.0       | 1.0    |
| Attributes | 28 | 0  | 0   | 1.0       | 1.0    |
| Links      | 3  | 0  | 0   | 1.0       | 1.0    |

Perfect recovery. Pod name differences do not affect metrics (see Section 3.4).

### 6.3 TensorFlow Serving

| Dimension  | TP | FP | FN | Precision | Recall |
|------------|----|----|-----|-----------|--------|
| Entities   | 9  | 0  | 2   | 1.0       | 0.8182 |
| Attributes | 15 | 1  | 5   | 0.9375    | 0.75   |
| Links      | 3  | 0  | 0   | 1.0       | 1.0    |

FN entities: `Volume0`, `Volume1`.
FP attributes: `IngressNode0.host = "localhost"`.
FN attributes: `IngressNode0.host = "/tf(/|$)(.*)"`, 4 volume attributes.

## 7. Limitations and Threats to Validity

1. **Small dataset:** Only 3 projects evaluated. Results may not generalize to complex multi-namespace deployments with dozens of services.
2. **ID-based matching:** Relies on deterministic ID assignment order. If recovery assigns IDs in a different order, structurally correct entities would be counted as FP+FN.
3. **Pod name exclusion:** Pod `name` is not compared as an attribute. This avoids false mismatches from hash suffixes but also means pod naming errors would go undetected.
4. **Volume type coverage:** Recovery does not support `persistentVolumeClaim` or `volumeMounts` types, causing systematic FN in projects that use them.
5. **Ingress host defaults:** Regex-based or missing hosts default to `"localhost"`, producing FP when compared against GT.
6. **Single evaluator:** GT was constructed by one person; no inter-rater reliability was measured.
7. **Inconsistency detection (Table 2):** This evaluation is manual and not automated by a script. See `evaluate/README.md` → "Inconsistency Detection (Table 2)" for the full perturbation protocol, checklist, and scoring method. In summary: controlled modifications (add/remove entities, change attributes, break/add links) are applied one at a time to the cluster or KDL model, and Archer's VS Code diagnostic messages are manually compared against the known modification to count TP/FP/FN.
