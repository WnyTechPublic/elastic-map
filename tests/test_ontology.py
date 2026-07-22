from pathlib import Path

import pytest
from rdflib import Graph, Namespace, RDF, RDFS, OWL

ROOT = Path(__file__).parents[1]
ONTOLOGY = ROOT / "ontology" / "elastic-map.ttl"
WNY = Namespace("https://pub.wnytech.co.kr/elastic-map/ontology#")
SCHEMA = Namespace("https://schema.org/")


@pytest.fixture()
def graph():
    assert ONTOLOGY.exists(), "canonical Turtle ontology is missing"
    parsed = Graph()
    parsed.parse(ONTOLOGY, format="turtle")
    return parsed


def test_ontology_declares_expected_core_entities(graph):
    expected = {
        WNY.Elasticsearch,
        WNY.PostgreSQL,
        WNY.MongoDB,
        WNY.Databricks,
        WNY.ClickHouse,
        WNY.ApacheDruid,
        WNY.Splunk,
        WNY.Datadog,
        WNY.OLTP,
        WNY.OLAP,
        WNY.Lakehouse,
    }
    subjects = set(graph.subjects())
    assert expected <= subjects


def test_every_technology_has_label_summary_and_primary_source(graph):
    technologies = set(graph.subjects(RDF.type, WNY.Technology))
    assert len(technologies) >= 8
    for subject in technologies:
        assert graph.value(subject, RDFS.label), subject
        assert graph.value(subject, WNY.summary), subject
        assert graph.value(subject, WNY.primarySource), subject


def test_market_relationships_are_contextual_claims(graph):
    claims = set(graph.subjects(RDF.type, WNY.PositioningClaim))
    assert len(claims) >= 6
    for claim in claims:
        assert graph.value(claim, WNY.subject), claim
        assert graph.value(claim, WNY.object), claim
        assert graph.value(claim, WNY.relationType), claim
        assert graph.value(claim, WNY.context), claim
        assert graph.value(claim, WNY.assessment), claim
        assert graph.value(claim, WNY.asOf), claim


def test_ontology_metadata_is_present(graph):
    ontology = graph.value(predicate=RDF.type, object=OWL.Ontology)
    assert ontology is not None
    assert graph.value(ontology, RDFS.label)
    assert graph.value(ontology, WNY.version)
