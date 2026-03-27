# Evaluation

Reproducible evaluation of Archer architecture recovery against ground-truth KDL models.

## Quick Start

```bash
cd evaluate
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python compute_metrics.py
```

## Projects

| Project                  | Domain               | Key K8s Resources                                       |
|--------------------------|----------------------|---------------------------------------------------------|
| cassandra                | Distributed database | 1 StatefulSet, 1 Headless Service, 1 Pod (3 replicas), PVC |
| guestbook                | Web application      | 3 Deployments, 3 Services, 3 Pods                       |
| model-serving-tensorflow | ML model serving     | 1 Deployment, 1 Service, 1 Ingress, 1 Pod, PVC          |

All projects originate from https://github.com/kubernetes/examples.

## What is Compared

The evaluation compares GT and recovered models across three dimensions:

### 1. Entities
Structural elements identified by hierarchical path:
`{diagramId}.{namespaceId}.{entityId}.{childId}`

### 2. Links
Edges between entities (e.g., Service -> Pod port, Ingress -> Service port).

### 3. Attributes
Properties compared per entity type:

| Entity Type    | Attributes Compared          | Note                            |
|----------------|------------------------------|---------------------------------|
| Namespace      | `name`                       |                                 |
| Ingress        | `name`, `host`               |                                 |
| Service        | `name`, `type`               | `type` extracted as `type.name` |
| Service Port   | `name`, `number`             |                                 |
| Pod            | `controller`, `cardinality`  | Pod `name` is NOT compared      |
| Pod Container  | `name`                       |                                 |
| Pod Port       | `name`, `number`             |                                 |
| Pod Volume     | `name`, `type`               |                                 |

Metrics: **Precision** = TP / (TP + FP), **Recall** = TP / (TP + FN).

## How to Run

```bash
# All projects
python compute_metrics.py

# Single project
python compute_metrics.py cassandra

# Show FP/FN details
python compute_metrics.py --verbose

# JSON output
python compute_metrics.py --json
```

## Expected Results

| Project                  | Ent P  | Ent R  | Lnk P  | Lnk R  | Att P  | Att R  |
|--------------------------|--------|--------|--------|--------|--------|--------|
| cassandra                | 1.0    | 0.9    | 1.0    | 1.0    | 1.0    | 0.8889 |
| guestbook                | 1.0    | 1.0    | 1.0    | 1.0    | 1.0    | 1.0    |
| model-serving-tensorflow | 1.0    | 0.8182 | 1.0    | 1.0    | 0.9375 | 0.75   |

## Inconsistency Detection (Table 2)

Table 2 evaluates Archer's ability to detect inconsistencies between a KDL model and the live cluster state. Unlike Table 1, this evaluation is **manual** and requires a running Kubernetes cluster.

### Protocol

Modifications were applied from **both sides**: changes to the Kubernetes cluster (via `kubectl`) and changes to the KDL model (via VS Code editor). This tests detection in both directions.

1. Deploy one of the three projects to a Kubernetes cluster
2. Recover the architectural model using Archer (or open an existing KDL model)
3. Introduce a controlled modification from **one** side (cluster or model)
4. Trigger Archer's consistency check
5. Observe VS Code diagnostic messages (errors/warnings) produced by Archer validators
6. Record TP/FP/FN by comparing diagnostics against the known modification
7. Revert the modification and proceed to the next perturbation

### Perturbation Checklist

For each project, the following modifications were applied one at a time. Each perturbation was tested from both sides where applicable: (A) modifying the cluster while the model stays unchanged, and (B) modifying the KDL model while the cluster stays unchanged.

#### Entity perturbations (add/remove)

| Operation | Target Entity | Side A (cluster change)                     | Side B (model change)                  |
|-----------|---------------|---------------------------------------------|----------------------------------------|
| Remove    | Pod           | `kubectl delete deployment <name>`          | Remove pod node from KDL model         |
| Add       | Pod           | `kubectl apply` new deployment              | Add pod node to KDL model              |
| Remove    | Service       | `kubectl delete service <name>`             | Remove service node from KDL model     |
| Add       | Service       | `kubectl apply` new service                 | Add service node to KDL model          |
| Remove    | Ingress       | `kubectl delete ingress <name>`             | Remove ingress node from KDL model     |
| Add       | Ingress       | `kubectl apply` new ingress                 | Add ingress node to KDL model          |
| Remove    | Volume        | Remove volume mount from deployment spec    | Remove volume node from KDL model      |
| Add       | Volume        | Add volume mount to deployment spec         | Add volume node to KDL model           |

#### Link perturbations

| Operation  | Side A (cluster change)                                        | Side B (model change)                        |
|------------|----------------------------------------------------------------|----------------------------------------------|
| Break link | Change `service.spec.selector` so it no longer matches pod labels | Remove link reference from KDL model       |
| Add link   | Add new service selector targeting an existing pod             | Add link reference to KDL model              |

#### Attribute perturbations

| Attribute             | Side A (cluster change)                          | Side B (model change)                        |
|-----------------------|--------------------------------------------------|----------------------------------------------|
| `ingress.host`        | Change host value in ingress rule                | Edit host value in KDL ingress node          |
| `service.type`        | Change service type (e.g., ClusterIP → NodePort) | Edit type value in KDL service node          |
| `pod.controller`      | Change controller kind (e.g., Deployment → StatefulSet) | Edit controller name in KDL pod node  |
| `pod.cardinality`     | Change replica count in controller spec          | Edit cardinality value in KDL pod node       |

#### Model-only perturbations (introducing errors)

| Operation                    | How Applied                                              |
|------------------------------|----------------------------------------------------------|
| Reference non-existent entity | Add a link to a port/service that does not exist in the cluster |
| Invalid attribute value       | Set an attribute to a value that contradicts cluster state |

### How TP/FP/FN are counted

- **TP**: Archer displays a diagnostic message that correctly identifies the introduced inconsistency
- **FP**: Archer reports an inconsistency that was not introduced (e.g., default value differences like `Ingress.host = localhost`)
- **FN**: An introduced inconsistency that Archer does not report (e.g., unsupported volume types)

### Known limitations

- **Volumes**: Unsupported volume types (`persistentVolumeClaim`, `volumeMounts`) cannot be detected, causing systematic FN
- **Ingress host defaults**: Recovery inserts `localhost` when host is absent or regex-based, which may produce FP
- **Not automated**: Results depend on manual inspection of VS Code diagnostics against a running cluster

### Expected Results (Table 2)

| Project                  | Ent TP | Ent FP | Ent FN | Ent P | Ent R | Att TP | Att FP | Att FN | Att P | Att R | Lnk TP | Lnk FP | Lnk FN | Lnk P | Lnk R |
|--------------------------|--------|--------|--------|-------|-------|--------|--------|--------|-------|-------|--------|--------|--------|-------|-------|
| model-serving-tensorflow | 12     | 0      | 2      | 1.0   | 0.86  | 6      | 1      | 1      | 0.86  | 0.86  | 3      | 0      | 0      | 1.0   | 1.0   |
| cassandra                | 8      | 0      | 1      | 1.0   | 0.89  | 6      | 0      | 1      | 1.0   | 0.86  | 3      | 0      | 0      | 1.0   | 1.0   |
| guestbook                | 8      | 0      | 0      | 1.0   | 1.0   | 6      | 0      | 0      | 1.0   | 1.0   | 3      | 0      | 0      | 1.0   | 1.0   |

## File Structure

```
evaluate/
  compute_metrics.py                       # Scoring script
  requirements.txt                         # Python dependencies
  README.md                                # This file
  cassandra-gt.yaml                        # Ground truth models
  cassandra-recovered.yaml                 # Recovered models
  guestbook-gt.yaml
  guestbook-recovered.yaml
  model-serving-tensorflow-gt.yaml
  model-serving-tensorflow-recovered.yaml
```

## Adding New Projects

1. Create `{project}-gt.yaml` and `{project}-recovered.yaml` in this directory
2. Add an entry to the `PROJECTS` dict in `compute_metrics.py`:
   ```python
   "my-project": {
       "gt": SCRIPT_DIR / "my-project-gt.yaml",
       "recovered": SCRIPT_DIR / "my-project-recovered.yaml",
   },
   ```
3. Run `python compute_metrics.py my-project`
