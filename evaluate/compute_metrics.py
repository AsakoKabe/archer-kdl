"""
Evaluation script for Archer architecture recovery.

Compares ground-truth (GT) and recovered KDL models across three dimensions:
  - Entities: structural elements (namespaces, pods, services, etc.)
  - Links: edges between entities (service->pod, ingress->service)
  - Attributes: properties of entities (name, type, port number, etc.)

Usage:
    python compute_metrics.py                          # Evaluate all projects
    python compute_metrics.py cassandra                # Evaluate one project
    python compute_metrics.py --verbose                # Show FP/FN details
    python compute_metrics.py --json                   # JSON output
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import yaml


# ---------------------------------------------------------------------------
# Extraction
# ---------------------------------------------------------------------------

def extract_entities(model: dict[str, Any]) -> set[str]:
    entities: set[str] = set()
    diagram_id = model.get("kdlDiagram", {}).get("id", "")
    for ns in model.get("kdlDiagram", {}).get("namespaces", []):
        ns_id = f"{diagram_id}.{ns['id']}"
        entities.add(ns_id)
        for ing in ns.get("ingresses", []):
            entities.add(f"{ns_id}.{ing['id']}")
        for svc in ns.get("services", []):
            svc_id = f"{ns_id}.{svc['id']}"
            entities.add(svc_id)
            for port in svc.get("ports", []):
                entities.add(f"{svc_id}.{port['id']}")
        for pod in ns.get("pods", []):
            pod_id = f"{ns_id}.{pod['id']}"
            entities.add(pod_id)
            for vol in pod.get("volumes", []):
                entities.add(f"{pod_id}.{vol['id']}")
            for cont in pod.get("containers", []):
                entities.add(f"{pod_id}.{cont['id']}")
            for port in pod.get("ports", []):
                entities.add(f"{pod_id}.{port['id']}")
    return entities


def extract_links(model: dict[str, Any]) -> set[str]:
    links: set[str] = set()
    for ns in model.get("kdlDiagram", {}).get("namespaces", []):
        for ing in ns.get("ingresses", []):
            for link in ing.get("links", []):
                links.add(link)
        for svc in ns.get("services", []):
            for link in svc.get("links", []):
                links.add(link)
        for pod in ns.get("pods", []):
            for container in pod.get("containers", []):
                for link in container.get("links", []):
                    links.add(link)
    return links


def _nested_name(obj: Any) -> Any:
    return obj.get("name") if isinstance(obj, dict) else obj


def extract_attributes(model: dict[str, Any]) -> set[tuple[str, tuple[str, Any]]]:
    attrs: set[tuple[str, tuple[str, Any]]] = set()
    diagram_id = model.get("kdlDiagram", {}).get("id", "")
    for ns in model.get("kdlDiagram", {}).get("namespaces", []):
        ns_id = f"{diagram_id}.{ns['id']}"
        attrs.add((ns_id, ("name", ns.get("name"))))
        for ing in ns.get("ingresses", []):
            ing_id = f"{ns_id}.{ing['id']}"
            attrs.add((ing_id, ("name", ing.get("name"))))
            attrs.add((ing_id, ("host", ing.get("host"))))
        for svc in ns.get("services", []):
            svc_id = f"{ns_id}.{svc['id']}"
            attrs.add((svc_id, ("name", svc.get("name"))))
            attrs.add((svc_id, ("type", _nested_name(svc.get("type", {})))))
            for port in svc.get("ports", []):
                port_id = f"{svc_id}.{port['id']}"
                attrs.add((port_id, ("name", port.get("name"))))
                attrs.add((port_id, ("number", port.get("number"))))
        for pod in ns.get("pods", []):
            pod_id = f"{ns_id}.{pod['id']}"
            attrs.add((pod_id, ("controller", _nested_name(pod.get("controller", {})))))
            attrs.add((pod_id, ("cardinality", _nested_name(pod.get("cardinality", {})))))
            for vol in pod.get("volumes", []):
                vol_id = f"{pod_id}.{vol['id']}"
                attrs.add((vol_id, ("name", vol.get("name"))))
                attrs.add((vol_id, ("type", vol.get("type"))))
            for cont in pod.get("containers", []):
                cont_id = f"{pod_id}.{cont['id']}"
                attrs.add((cont_id, ("name", cont.get("name"))))
            for port in pod.get("ports", []):
                port_id = f"{pod_id}.{port['id']}"
                attrs.add((port_id, ("name", port.get("name"))))
                attrs.add((port_id, ("number", port.get("number"))))
    return attrs


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

def compute_metrics(gt_set: set, rec_set: set) -> dict[str, Any]:
    tp = len(gt_set & rec_set)
    fp = len(rec_set - gt_set)
    fn = len(gt_set - rec_set)
    precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
    recall = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0
    return {
        "TP": tp, "FP": fp, "FN": fn,
        "Precision": precision, "Recall": recall,
        "fp_items": rec_set - gt_set,
        "fn_items": gt_set - rec_set,
    }


def evaluate_model(gt_model: dict, recovered_model: dict) -> dict[str, Any]:
    return {
        "entities": compute_metrics(extract_entities(gt_model), extract_entities(recovered_model)),
        "links": compute_metrics(extract_links(gt_model), extract_links(recovered_model)),
        "attributes": compute_metrics(extract_attributes(gt_model), extract_attributes(recovered_model)),
    }


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).parent

PROJECTS = {
    "cassandra": {
        "gt": SCRIPT_DIR / "cassandra-gt.yaml",
        "recovered": SCRIPT_DIR / "cassandra-recovered.yaml",
    },
    "guestbook": {
        "gt": SCRIPT_DIR / "guestbook-gt.yaml",
        "recovered": SCRIPT_DIR / "guestbook-recovered.yaml",
    },
    "model-serving-tensorflow": {
        "gt": SCRIPT_DIR / "model-serving-tensorflow-gt.yaml",
        "recovered": SCRIPT_DIR / "model-serving-tensorflow-recovered.yaml",
    },
}


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

def print_dimension(name: str, m: dict[str, Any], verbose: bool) -> None:
    print(f"  {name:12s}  TP={m['TP']:2d}  FP={m['FP']:2d}  "
          f"FN={m['FN']:2d}  P={m['Precision']:.4f}  R={m['Recall']:.4f}")
    if verbose:
        for item in sorted(str(x) for x in m["fp_items"]):
            print(f"    FP: {item}")
        for item in sorted(str(x) for x in m["fn_items"]):
            print(f"    FN: {item}")


def print_results(name: str, r: dict[str, Any], verbose: bool) -> None:
    print(f"\n{'=' * 60}")
    print(f"  {name}")
    print(f"{'=' * 60}")
    print_dimension("Entities", r["entities"], verbose)
    print_dimension("Links", r["links"], verbose)
    print_dimension("Attributes", r["attributes"], verbose)


def print_summary(all_results: dict[str, dict]) -> None:
    print(f"\n{'=' * 60}")
    print("  SUMMARY")
    print(f"{'=' * 60}")
    print(f"  {'Project':<28s} {'Ent P':>6s} {'Ent R':>6s} "
          f"{'Lnk P':>6s} {'Lnk R':>6s} {'Att P':>6s} {'Att R':>6s}")
    print(f"  {'-' * 70}")
    for name, r in all_results.items():
        e, l, a = r["entities"], r["links"], r["attributes"]
        print(f"  {name:<28s} {e['Precision']:>6.4f} {e['Recall']:>6.4f} "
              f"{l['Precision']:>6.4f} {l['Recall']:>6.4f} "
              f"{a['Precision']:>6.4f} {a['Recall']:>6.4f}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate Archer architecture recovery")
    parser.add_argument("projects", nargs="*", help="Project names (default: all)")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show FP/FN details")
    parser.add_argument("--json", action="store_true", help="JSON output")
    args = parser.parse_args()

    selected = args.projects if args.projects else list(PROJECTS.keys())
    for name in selected:
        if name not in PROJECTS:
            print(f"Unknown project: {name}", file=sys.stderr)
            print(f"Available: {', '.join(PROJECTS.keys())}", file=sys.stderr)
            sys.exit(1)

    all_results: dict[str, dict] = {}
    for name in selected:
        paths = PROJECTS[name]
        gt = yaml.safe_load(paths["gt"].read_text(encoding="utf-8"))
        rec = yaml.safe_load(paths["recovered"].read_text(encoding="utf-8"))
        all_results[name] = evaluate_model(gt, rec)
        if not args.json:
            print_results(name, all_results[name], args.verbose)

    if args.json:
        output = {
            name: {
                dim: {k: v for k, v in m.items() if k not in ("fp_items", "fn_items")}
                for dim, m in r.items()
            }
            for name, r in all_results.items()
        }
        print(json.dumps(output, indent=2))
    elif len(selected) > 1:
        print_summary(all_results)


if __name__ == "__main__":
    main()
