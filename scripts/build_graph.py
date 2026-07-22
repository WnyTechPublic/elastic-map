#!/usr/bin/env python3
"""Build browser-friendly JSON from the canonical Turtle ontology."""

import argparse
import json
from pathlib import Path

from rdflib import Graph, Namespace, RDF, RDFS

ROOT = Path(__file__).parents[1]
WNY = Namespace("https://pub.wnytech.co.kr/elastic-map/ontology#")

DIRECT_RELATIONS = {
    WNY.optimizedFor: ("optimized-for", "최적화"),
    WNY.supportsWorkload: ("supports", "지원"),
    WNY.implementsPattern: ("implements", "구현"),
    WNY.typicalRole: ("role", "주 역할"),
    WNY.commonlyComplements: ("complements", "보완"),
}


def local_name(value):
    text = str(value)
    return text.rsplit("#", 1)[-1].rsplit("/", 1)[-1]


def literal(graph, subject, predicate, default=""):
    value = graph.value(subject, predicate)
    return str(value) if value is not None else default


def build(input_path: Path):
    graph = Graph().parse(input_path, format="turtle")
    node_subjects = sorted(set(graph.subjects(WNY.nodeKind, None)), key=str)
    nodes = []
    for subject in node_subjects:
        types = [local_name(v) for v in graph.objects(subject, RDF.type)]
        nodes.append(
            {
                "id": local_name(subject),
                "label": literal(graph, subject, RDFS.label, local_name(subject)),
                "kind": literal(graph, subject, WNY.nodeKind, "concept"),
                "summary": literal(graph, subject, WNY.summary),
                "sourceUrl": literal(graph, subject, WNY.primarySource),
                "types": sorted(types),
            }
        )

    edges = []
    seen = set()
    for predicate, (edge_type, label) in DIRECT_RELATIONS.items():
        for source, target in graph.subject_objects(predicate):
            if graph.value(source, WNY.nodeKind) is None or graph.value(target, WNY.nodeKind) is None:
                continue
            key = (local_name(source), local_name(target), edge_type)
            if key in seen:
                continue
            seen.add(key)
            edges.append({"source": key[0], "target": key[1], "type": edge_type, "label": label})

    for claim in graph.subjects(RDF.type, WNY.PositioningClaim):
        source = graph.value(claim, WNY.subject)
        target = graph.value(claim, WNY.object)
        context = graph.value(claim, WNY.context)
        relation_type = literal(graph, claim, WNY.relationType, "related")
        edges.append(
            {
                "source": local_name(source),
                "target": local_name(target),
                "type": relation_type,
                "label": relation_type,
                "context": local_name(context) if context else "",
                "assessment": literal(graph, claim, WNY.assessment),
                "asOf": literal(graph, claim, WNY.asOf),
                "claimId": local_name(claim),
            }
        )

    nodes.sort(key=lambda item: (item["kind"], item["label"]))
    edges.sort(key=lambda item: (item["source"], item["target"], item["type"]))
    return {
        "meta": {
            "title": "Elastic Map",
            "version": "0.1.0",
            "asOf": "2026-07-22",
            "canonicalOntology": "ontology/elastic-map.ttl",
            "nodeCount": len(nodes),
            "edgeCount": len(edges),
        },
        "nodes": nodes,
        "edges": edges,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=ROOT / "ontology" / "elastic-map.ttl")
    parser.add_argument("--output", type=Path, default=ROOT / "site" / "data" / "graph.json")
    args = parser.parse_args()
    payload = build(args.input)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Built {len(payload['nodes'])} nodes and {len(payload['edges'])} edges -> {args.output}")


if __name__ == "__main__":
    main()
