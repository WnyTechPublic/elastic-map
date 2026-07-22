import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parents[1]


def test_build_produces_browser_graph_data(tmp_path):
    output = tmp_path / "graph.json"
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "build_graph.py"), "--output", str(output)],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    assert result.returncode == 0, result.stderr
    data = json.loads(output.read_text(encoding="utf-8"))
    assert data["meta"]["title"] == "Elastic Map"
    assert len(data["nodes"]) >= 20
    assert len(data["edges"]) >= 20
    assert {"id", "label", "kind", "summary"} <= set(data["nodes"][0])
    assert {"source", "target", "type", "label"} <= set(data["edges"][0])


def test_site_has_accessible_exploration_controls():
    index = (ROOT / "site" / "index.html").read_text(encoding="utf-8")
    assert 'lang="ko"' in index
    assert 'id="graph"' in index
    assert 'id="search-input"' in index
    assert 'aria-label="온톨로지 검색"' in index
    assert 'id="detail-panel"' in index
    assert 'id="view-tabs"' in index


def test_site_javascript_has_search_filter_and_detail_behaviors():
    script = (ROOT / "site" / "app.js").read_text(encoding="utf-8")
    for behavior in ["renderGraph", "applyFilters", "showDetail", "focusNode"]:
        assert f"function {behavior}" in script
