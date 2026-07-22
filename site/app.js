let cy;
let graphData;
let activeView = "all";

const COLORS = {
  search: "#00bfb3", database: "#6f86ff", analytics: "#f4d44d", platform: "#e766a5",
  solution: "#f59f5c", workload: "#8f98a6", architecture: "#a978e3", role: "#67707c"
};
const MARKET_TYPES = new Set(["competes", "overlaps", "overlaps-and-complements", "alternative"]);
const STRUCTURAL_TYPES = new Set(["optimized-for", "supports", "implements", "role"]);

async function loadData() {
  const response = await fetch("data/graph.json");
  if (!response.ok) throw new Error(`graph.json: ${response.status}`);
  return response.json();
}

function relationGroup(type) {
  if (MARKET_TYPES.has(type)) return "market";
  if (type === "complements" || type === "overlaps-and-complements") return "complements";
  return "structural";
}

function renderGraph(data) {
  const elements = [
    ...data.nodes.map(node => ({ data: { ...node, color: COLORS[node.kind] || "#8f98a6" } })),
    ...data.edges.map((edge, index) => ({ data: { id: `e${index}`, ...edge, group: relationGroup(edge.type) } }))
  ];
  if (!window.cytoscape) throw new Error("Cytoscape unavailable");
  cy = cytoscape({
    container: document.getElementById("graph"), elements,
    wheelSensitivity: 0.18, minZoom: 0.35, maxZoom: 2.2,
    style: [
      { selector: "node", style: {
        "background-color": "data(color)", "background-opacity": .88, width: 18, height: 18,
        label: "data(label)", color: "#aeb5bf", "font-family": "Inter", "font-size": 9,
        "font-weight": 500, "text-margin-y": 8, "text-valign": "bottom",
        "text-background-color": "#0e1014", "text-background-opacity": .82,
        "text-background-padding": 3, "text-background-shape": "roundrectangle",
        "border-width": 4, "border-color": "data(color)", "border-opacity": .12,
        "transition-property": "opacity, width, height, border-width", "transition-duration": ".18s"
      }},
      { selector: "node[id = 'Elasticsearch']", style: { width: 35, height: 35, "font-size": 11, color: "#f4f6f8", "border-width": 10, "border-opacity": .1 }},
      { selector: "edge", style: {
        width: .8, "line-color": "#59616d", "target-arrow-color": "#59616d", "target-arrow-shape": "triangle",
        "arrow-scale": .55, "curve-style": "bezier", opacity: .38
      }},
      { selector: "edge[group = 'complements']", style: { "line-color": "#00bfb3", "target-arrow-color": "#00bfb3", opacity: .48 }},
      { selector: "edge[group = 'market']", style: { "line-color": "#e766a5", "target-arrow-color": "#e766a5", "line-style": "dashed", opacity: .62 }},
      { selector: ".faded", style: { opacity: .07 }},
      { selector: ".highlighted", style: { opacity: 1, "z-index": 8 }},
      { selector: "node.highlighted", style: { width: 29, height: 29, "border-width": 9, color: "#fff" }},
      { selector: ":selected", style: { "overlay-color": "#ffffff", "overlay-opacity": .08, "overlay-padding": 8 }}
    ],
    layout: { name: "cose", animate: false, fit: true, padding: 55, nodeRepulsion: 9000, idealEdgeLength: 102, edgeElasticity: 80, gravity: .16, numIter: 1800 }
  });

  cy.on("tap", "node", event => {
    const id = event.target.id();
    focusNode(id);
    showDetail(id);
  });
  cy.on("tap", event => {
    if (event.target === cy) {
      cy.elements().removeClass("faded highlighted");
      document.getElementById("detail-panel").classList.remove("open");
    }
  });
  document.getElementById("count-all").textContent = data.nodes.length;
  document.getElementById("graph-status").textContent = `${data.nodes.length}개 개념 · ${data.edges.length}개 관계`;
}

function applyFilters() {
  if (!cy) return;
  const checked = new Set([...document.querySelectorAll("#relation-filters input:checked")].map(input => input.value));
  const query = document.getElementById("search-input").value.trim().toLowerCase();

  cy.batch(() => {
    cy.elements().style("display", "element").removeClass("faded highlighted");
    cy.edges().forEach(edge => {
      if (!checked.has(edge.data("group"))) edge.style("display", "none");
    });
    cy.nodes().forEach(node => {
      let visible = true;
      const kind = node.data("kind");
      if (activeView === "elastic") visible = node.id() === "Elasticsearch" || node.neighborhood().nodes().some(n => n.id() === "Elasticsearch");
      if (activeView === "data") visible = ["search", "database", "analytics", "platform", "architecture", "workload", "role"].includes(kind);
      if (activeView === "market") visible = node.connectedEdges().some(e => e.data("group") === "market");
      if (!visible) node.style("display", "none");
      if (query && !`${node.data("label")} ${node.data("summary")} ${node.data("types").join(" ")}`.toLowerCase().includes(query)) node.addClass("faded");
      else if (query) node.addClass("highlighted");
    });
    cy.edges().forEach(edge => {
      if (edge.source().style("display") === "none" || edge.target().style("display") === "none") edge.style("display", "none");
      if (query && !edge.source().hasClass("highlighted") && !edge.target().hasClass("highlighted")) edge.addClass("faded");
    });
  });
}

function focusNode(id) {
  if (!cy) return;
  const node = cy.getElementById(id);
  if (!node.length) return;
  const neighborhood = node.closedNeighborhood();
  cy.elements().removeClass("highlighted").addClass("faded");
  neighborhood.removeClass("faded").addClass("highlighted");
  cy.animate({ center: { eles: node }, zoom: Math.max(cy.zoom(), 1.05) }, { duration: 320 });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
}

function showDetail(id) {
  const node = graphData.nodes.find(item => item.id === id);
  if (!node) return;
  const relations = graphData.edges.filter(edge => edge.source === id || edge.target === id);
  const cards = relations.map(edge => {
    const otherId = edge.source === id ? edge.target : edge.source;
    const other = graphData.nodes.find(item => item.id === otherId);
    const context = edge.context ? ` · ${edge.context}` : "";
    return `<button class="relation-card" data-node="${escapeHtml(otherId)}"><strong>${escapeHtml(other?.label || otherId)}</strong><span>${escapeHtml(edge.label)}${escapeHtml(context)}</span>${edge.assessment ? `<p>${escapeHtml(edge.assessment)}</p>` : ""}</button>`;
  }).join("");
  const panel = document.getElementById("detail-panel");
  panel.innerHTML = `<div class="detail-content">
    <span class="detail-kind">${escapeHtml(node.kind)}</span>
    <h2>${escapeHtml(node.label)}</h2>
    <p class="detail-summary">${escapeHtml(node.summary)}</p>
    <div class="detail-section"><h3>ONTOLOGY TYPE</h3><div class="type-pills">${node.types.map(type => `<span>${escapeHtml(type)}</span>`).join("")}</div></div>
    <div class="detail-section"><h3>CONNECTED RELATIONS · ${relations.length}</h3><div class="relation-list">${cards || "<p class='detail-summary'>연결 관계가 없습니다.</p>"}</div></div>
    <div class="detail-section"><h3>PRIMARY SOURCE</h3><a class="source-link" href="${escapeHtml(node.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(node.sourceUrl)} ↗</a></div>
  </div>`;
  panel.classList.add("open");
  panel.querySelectorAll("[data-node]").forEach(button => button.addEventListener("click", () => {
    const targetId = button.dataset.node;
    focusNode(targetId); showDetail(targetId);
  }));
}

function bindControls() {
  document.getElementById("search-input").addEventListener("input", applyFilters);
  document.querySelectorAll("#relation-filters input").forEach(input => input.addEventListener("change", applyFilters));
  document.querySelectorAll("#view-tabs button").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll("#view-tabs button").forEach(item => item.classList.remove("active"));
    button.classList.add("active"); activeView = button.dataset.view; applyFilters();
    setTimeout(() => cy?.fit(cy.elements(":visible"), 50), 40);
  }));
  document.getElementById("fit-button").addEventListener("click", () => cy?.fit(cy.elements(":visible"), 50));
  document.getElementById("reset-button").addEventListener("click", () => { focusNode("Elasticsearch"); showDetail("Elasticsearch"); });
  document.addEventListener("keydown", event => {
    if (event.key === "/" && document.activeElement?.tagName !== "INPUT") { event.preventDefault(); document.getElementById("search-input").focus(); }
    if (event.key === "Escape") { document.getElementById("search-input").value = ""; applyFilters(); }
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  try {
    graphData = await loadData();
    renderGraph(graphData); bindControls();
    setTimeout(() => { showDetail("Elasticsearch"); cy?.fit(cy.elements(), 55); }, 250);
  } catch (error) {
    console.error(error);
    const fallback = document.getElementById("graph-fallback"); fallback.hidden = false; fallback.style.display = "grid";
    document.getElementById("graph-status").textContent = "그래프 로드 실패";
  }
});
