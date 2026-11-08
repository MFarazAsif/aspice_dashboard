const CSS = `
* { box-sizing: border-box; }
body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; background: #f3f2f1; color: #252423; }
.top { background: #252423; color: #fff; height: 48px; display: flex; align-items: center; padding: 0 16px; gap: 12px; }
.logo { width: 22px; height: 22px; background: #f2c811; border-radius: 3px; }
.top .title { font-size: 15px; font-weight: 600; }
.top .crumb { font-size: 12px; opacity: 0.7; }
.top .stamp { margin-left: auto; font-size: 12px; opacity: 0.7; }
.shell { display: flex; min-height: calc(100vh - 48px); }
.pane { width: 210px; background: #fff; border-right: 1px solid #e1dfdd; padding: 16px; flex-shrink: 0; }
.pane h4 { margin: 18px 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: #605e5c; }
.pane h4:first-child { margin-top: 0; }
.pane p { font-size: 13px; margin: 4px 0; color: #605e5c; }
.slicer { display: block; width: 100%; text-align: left; border: 1px solid #c8c6c4; background: #fff; padding: 7px 10px; margin-bottom: 6px; font-size: 13px; cursor: pointer; border-radius: 2px; font-family: inherit; }
.slicer:hover { background: #f3f2f1; }
.slicer.on { background: #118dff; border-color: #118dff; color: #fff; }
.canvas { flex: 1; padding: 16px; min-width: 0; }
.cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 12px; }
.card { background: #fff; border-radius: 4px; padding: 14px; border-top: 4px solid #118dff; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.card .label { font-size: 12px; color: #605e5c; }
.card .num { font-size: 30px; font-weight: 600; margin: 4px 0; }
.card .sub { font-size: 11px; color: #8a8886; }
.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 12px; }
.panel { background: #fff; border-radius: 4px; padding: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.panel h3 { margin: 0 0 10px; font-size: 13px; font-weight: 600; }
.panel .note { font-size: 11px; color: #8a8886; margin-top: 6px; }
svg text { font-family: "Segoe UI", Arial, sans-serif; }
.axis { font-size: 11px; fill: #605e5c; }
.val { font-size: 11px; font-weight: 600; fill: #252423; }
table { width: 100%; border-collapse: collapse; }
th { background: #f3f2f1; font-size: 12px; color: #605e5c; text-align: left; padding: 8px 10px; border-bottom: 2px solid #e1dfdd; }
td { padding: 8px 10px; border-bottom: 1px solid #edebe9; font-size: 13px; }
tr.click { cursor: pointer; }
tr.click:hover { background: #f3f9ff; }
.pill { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 11px; color: #fff; font-weight: 600; }
.databar { position: relative; background: #f3f2f1; height: 18px; border-radius: 2px; min-width: 100px; }
.databar span { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 2px; opacity: 0.85; }
.databar b { position: relative; font-size: 11px; padding-left: 6px; line-height: 18px; }
.donutwrap { display: flex; align-items: center; gap: 24px; justify-content: center; min-height: 190px; }
.legend { display: flex; flex-direction: column; gap: 8px; font-size: 12px; }
.legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; }
.empty { background: #fff; padding: 40px; text-align: center; color: #605e5c; border-radius: 4px; }
@media (max-width: 900px) {
  .cards { grid-template-columns: repeat(2, 1fr); }
  .grid { grid-template-columns: 1fr; }
  .shell { flex-direction: column; }
  .pane { width: auto; }
}
`;

const style = document.createElement("style");
style.textContent = CSS;
document.head.appendChild(style);

const root = document.getElementById("root");
const COLOR = { green: "#2e9e5b", amber: "#f2a900", red: "#d64550", blue: "#118dff", grey: "#c8c6c4" };
const state = { area: "all", status: "all" };

function passRate(p) {
  return p.pass_rate_pct === null ? 0 : p.pass_rate_pct;
}

function status(p) {
  if (p.coverage_pct < 70 || passRate(p) < 60) return "red";
  if (p.coverage_pct < 90 || passRate(p) < 80) return "amber";
  return "green";
}

function scoreColor(value, good, ok) {
  if (value >= good) return COLOR.green;
  if (value >= ok) return COLOR.amber;
  return COLOR.red;
}

function percent(part, whole) {
  if (whole === 0) return 0;
  return Math.round((1000 * part) / whole) / 10;
}

function sorted(list) {
  const order = { red: 0, amber: 1, green: 2 };
  return list.slice().sort(function (a, b) {
    return order[status(a)] - order[status(b)] || a.coverage_pct - b.coverage_pct;
  });
}

function filtered() {
  return DATA.overview.filter(function (p) {
    const okArea = state.area === "all" || p.area === state.area;
    const okStatus = state.status === "all" || status(p) === state.status;
    return okArea && okStatus;
  });
}

function barChart(items, max, target) {
  const w = 480, labelW = 110, rowH = 34, top = 8;
  const h = top + items.length * rowH + 8;
  const barW = w - labelW - 50;
  let s = '<svg viewBox="0 0 ' + w + " " + h + '" width="100%">';
  items.forEach(function (it, i) {
    const y = top + i * rowH;
    const len = max > 0 ? Math.max(0, (barW * it.value) / max) : 0;
    s += '<text x="0" y="' + (y + 18) + '" class="axis">' + it.label + "</text>";
    s += '<rect x="' + labelW + '" y="' + (y + 4) + '" width="' + barW + '" height="20" rx="3" fill="#f3f2f1"/>';
    s += '<rect x="' + labelW + '" y="' + (y + 4) + '" width="' + len + '" height="20" rx="3" fill="' + it.color + '"/>';
    s += '<text x="' + (labelW + barW + 8) + '" y="' + (y + 18) + '" class="val">' + it.text + "</text>";
  });
  if (target) {
    const x = labelW + (barW * target) / max;
    s += '<line x1="' + x + '" y1="' + top + '" x2="' + x + '" y2="' + (h - 6) + '" stroke="#252423" stroke-width="1" stroke-dasharray="4 3"/>';
  }
  return s + "</svg>";
}

function columnChart(items, max, target) {
  const w = 480, h = 230, left = 10, bottom = 28, top = 24;
  const plotH = h - bottom - top;
  const slot = (w - left * 2) / items.length;
  const bw = Math.min(46, slot * 0.6);
  let s = '<svg viewBox="0 0 ' + w + " " + h + '" width="100%">';
  s += '<line x1="' + left + '" y1="' + (top + plotH) + '" x2="' + (w - left) + '" y2="' + (top + plotH) + '" stroke="#c8c6c4"/>';
  items.forEach(function (it, i) {
    const x = left + i * slot + (slot - bw) / 2;
    const bh = max > 0 ? (plotH * it.value) / max : 0;
    const y = top + plotH - bh;
    s += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="3" fill="' + it.color + '"/>';
    s += '<text x="' + (x + bw / 2) + '" y="' + (y - 6) + '" text-anchor="middle" class="val">' + it.text + "</text>";
    s += '<text x="' + (x + bw / 2) + '" y="' + (h - 10) + '" text-anchor="middle" class="axis">' + it.label + "</text>";
  });
  if (target) {
    const ty = top + plotH - (plotH * target) / max;
    s += '<line x1="' + left + '" y1="' + ty + '" x2="' + (w - left) + '" y2="' + ty + '" stroke="#252423" stroke-dasharray="4 3"/>';
  }
  return s + "</svg>";
}

function donut(parts, big, small) {
  const r = 60, c = 2 * Math.PI * r;
  const total = parts.reduce(function (a, p) { return a + p.value; }, 0);
  let s = '<svg viewBox="0 0 160 160" width="160" height="160">';
  s += '<circle cx="80" cy="80" r="60" fill="none" stroke="#f3f2f1" stroke-width="22"/>';
  let offset = 0;
  if (total > 0) {
    parts.forEach(function (p) {
      const len = (c * p.value) / total;
      if (len > 0) {
        s += '<circle cx="80" cy="80" r="60" fill="none" stroke="' + p.color + '" stroke-width="22"';
        s += ' stroke-dasharray="' + len + " " + (c - len) + '" stroke-dashoffset="' + -offset + '"';
        s += ' transform="rotate(-90 80 80)"/>';
      }
      offset += len;
    });
  }
  s += '<text x="80" y="82" text-anchor="middle" style="font-size:26px;font-weight:600;fill:#252423">' + big + "</text>";
  s += '<text x="80" y="100" text-anchor="middle" class="axis">' + small + "</text></svg>";
  let legend = '<div class="legend">';
  parts.forEach(function (p) {
    legend += '<div><i style="background:' + p.color + '"></i>' + p.label + ": <b>" + p.value + "</b></div>";
  });
  legend += "</div>";
  return '<div class="donutwrap">' + s + legend + "</div>";
}

function card(label, num, sub, color) {
  return '<div class="card" style="border-top-color:' + color + '"><div class="label">' + label +
    '</div><div class="num">' + num + '</div><div class="sub">' + sub + "</div></div>";
}

function panel(title, body, note) {
  return '<div class="panel"><h3>' + title + "</h3>" + body + (note ? '<div class="note">' + note + "</div>" : "") + "</div>";
}

function dataBar(value, color) {
  return '<div class="databar"><span style="width:' + Math.min(100, value) + "%;background:" + color + '"></span><b>' + value + "%</b></div>";
}

function pill(s) {
  return '<span class="pill" style="background:' + COLOR[s] + '">' + s + "</span>";
}

function slicer(kind, value, label) {
  return '<button class="slicer' + (state[kind] === value ? " on" : "") + '" onclick="setFilter(\'' + kind + "','" + value + '\')">' + label + "</button>";
}

function setFilter(kind, value) {
  state[kind] = value;
  route();
}

function openProject(name) {
  location.hash = "project=" + name;
}

function goHome() {
  location.hash = "";
}

function page(crumb, pane, canvas) {
  return '<div class="top"><div class="logo"></div><div class="title">ASPICE Project Status</div>' +
    '<div class="crumb">' + crumb + '</div><div class="stamp">Data loaded at ' + DATA.overview[0].loaded_at +
    '</div></div><div class="shell"><div class="pane">' + pane + '</div><div class="canvas">' + canvas + "</div></div>";
}

function showOverview() {
  const list = sorted(filtered());

  let pane = "<h4>Area</h4>";
  pane += slicer("area", "all", "All areas") + slicer("area", "software", "Software");
  pane += slicer("area", "system", "System") + slicer("area", "hardware", "Hardware");
  pane += "<h4>Status</h4>";
  pane += slicer("status", "all", "All") + slicer("status", "green", "Green");
  pane += slicer("status", "amber", "Amber") + slicer("status", "red", "Red");

  if (list.length === 0) {
    root.innerHTML = page("Overview", pane, '<div class="empty">No projects match these filters.</div>');
    return;
  }

  const totalReqs = list.reduce(function (a, p) { return a + p.total_reqs; }, 0);
  const covered = list.reduce(function (a, p) { return a + p.covered_reqs; }, 0);
  const totalTests = list.reduce(function (a, p) { return a + p.total_tests; }, 0);
  const passed = list.reduce(function (a, p) { return a + Math.round((passRate(p) * p.total_tests) / 100); }, 0);
  const openDefects = list.reduce(function (a, p) { return a + p.open_defects; }, 0);
  const gaps = list.reduce(function (a, p) { return a + p.trace_gaps; }, 0);
  const cov = percent(covered, totalReqs);
  const pass = percent(passed, totalTests);
  const needAttention = list.filter(function (p) { return status(p) === "red"; }).length;

  let cards = '<div class="cards">';
  cards += card("Projects", list.length, needAttention + " need attention", COLOR.blue);
  cards += card("Requirements covered", cov + "%", covered + " of " + totalReqs + " have a test", scoreColor(cov, 90, 70));
  cards += card("Tests passing", pass + "%", passed + " of " + totalTests + " tests", scoreColor(pass, 80, 60));
  cards += card("Open defects", openDefects, "across all shown projects", openDefects > 20 ? COLOR.red : COLOR.amber);
  cards += card("Traceability gaps", gaps, "requirements without a test", gaps > 20 ? COLOR.red : COLOR.amber);
  cards += "</div>";

  const covItems = list.map(function (p) {
    return { label: p.project, value: p.coverage_pct, text: p.coverage_pct + "%", color: scoreColor(p.coverage_pct, 90, 70) };
  });
  const passItems = list.map(function (p) {
    return { label: p.project, value: passRate(p), text: passRate(p) + "%", color: scoreColor(passRate(p), 80, 60) };
  });
  const defItems = list.map(function (p) {
    return { label: p.project, value: p.open_defects, text: String(p.open_defects), color: COLOR.blue };
  });
  const maxDef = Math.max.apply(null, defItems.map(function (i) { return i.value; }).concat([1]));

  const health = ["green", "amber", "red"].map(function (s) {
    return { label: s, value: list.filter(function (p) { return status(p) === s; }).length, color: COLOR[s] };
  });

  let charts = '<div class="grid">';
  charts += panel("Requirements coverage by project", barChart(covItems, 100, 90), "Dashed line is the 90% target");
  charts += panel("Test pass rate by project", barChart(passItems, 100, 80), "Dashed line is the 80% target");
  charts += panel("Open defects by project", columnChart(defItems, maxDef + 2, 0), "");
  charts += panel("Project health", donut(health, list.length, "projects"), "Red: coverage under 70% or pass rate under 60%");
  charts += "</div>";

  let table = "<table><tr><th>Project</th><th>Area</th><th>Status</th><th>Coverage</th><th>Pass rate</th>";
  table += "<th>Open defects</th><th>Avg age (days)</th><th>Trace gaps</th></tr>";
  list.forEach(function (p) {
    table += '<tr class="click" onclick="openProject(\'' + p.project + '\')">';
    table += "<td><b>" + p.project + "</b></td><td>" + p.area + "</td><td>" + pill(status(p)) + "</td>";
    table += "<td>" + dataBar(p.coverage_pct, scoreColor(p.coverage_pct, 90, 70)) + "</td>";
    table += "<td>" + dataBar(passRate(p), scoreColor(passRate(p), 80, 60)) + "</td>";
    table += "<td>" + p.open_defects + "</td><td>" + p.avg_defect_age_days + "</td><td>" + p.trace_gaps + "</td></tr>";
  });
  table += "</table>";

  root.innerHTML = page("Overview", pane, cards + charts + panel("All projects", table, "Click a row to open a project"));
}

function showProject(name) {
  const p = DATA.overview.find(function (x) { return x.project === name; });
  const pane = '<button class="slicer" onclick="goHome()">Back to all projects</button>';
  if (!p) {
    root.innerHTML = page("Project", pane, '<div class="empty">Project not found.</div>');
    return;
  }

  const groups = DATA.groups.filter(function (g) { return g.project === name; });
  const gaps = DATA.gaps.filter(function (g) { return g.project === name; });
  const d = DATA.defects.find(function (x) { return x.project === name; });
  const s = status(p);
  const done = groups.reduce(function (a, g) { return a + g.done_reqs; }, 0);

  const side = pane + "<h4>Project</h4><p>" + p.project + "</p><h4>Area</h4><p>" + p.area +
    "</p><h4>Status</h4><p>" + pill(s) + "</p>";

  let cards = '<div class="cards">';
  cards += card("Requirements covered", p.coverage_pct + "%", p.covered_reqs + " of " + p.total_reqs, scoreColor(p.coverage_pct, 90, 70));
  cards += card("Tests passing", passRate(p) + "%", p.total_tests + " tests in total", scoreColor(passRate(p), 80, 60));
  cards += card("Open defects", p.open_defects, "average age " + p.avg_defect_age_days + " days", p.open_defects > 10 ? COLOR.red : COLOR.amber);
  cards += card("Oldest open defect", d ? d.oldest_days : 0, "days", COLOR.blue);
  cards += card("Traceability gaps", p.trace_gaps, "requirements without a test", p.trace_gaps > 10 ? COLOR.red : COLOR.amber);
  cards += "</div>";

  const covItems = groups.map(function (g) {
    const v = percent(g.covered_reqs, g.total_reqs);
    return { label: g.grp, value: v, text: v + "%", color: scoreColor(v, 90, 70) };
  });
  const passItems = groups.map(function (g) {
    const v = percent(g.passed_tests, g.total_tests);
    return { label: g.grp, value: v, text: v + "%", color: scoreColor(v, 80, 60) };
  });

  let charts = '<div class="grid">';
  charts += panel("Coverage by process group", columnChart(covItems, 100, 90), "Dashed line is the 90% target");
  charts += panel("Pass rate by process group", columnChart(passItems, 100, 80), "Dashed line is the 80% target");
  charts += panel("Requirements with a test", donut([
    { label: "Covered", value: p.covered_reqs, color: COLOR.green },
    { label: "No test", value: p.trace_gaps, color: COLOR.red }
  ], p.coverage_pct + "%", "covered"), "");
  charts += panel("Requirements done", donut([
    { label: "Done", value: done, color: COLOR.blue },
    { label: "Not done", value: p.total_reqs - done, color: COLOR.grey }
  ], percent(done, p.total_reqs) + "%", "done"), "");
  charts += "</div>";

  let gTable = "<table><tr><th>Group</th><th>Requirements</th><th>Done</th><th>Coverage</th><th>Pass rate</th></tr>";
  groups.forEach(function (g) {
    const c = percent(g.covered_reqs, g.total_reqs);
    const r = percent(g.passed_tests, g.total_tests);
    gTable += "<tr><td><b>" + g.grp + "</b></td><td>" + g.total_reqs + "</td><td>" + g.done_reqs + "</td>";
    gTable += "<td>" + dataBar(c, scoreColor(c, 90, 70)) + "</td><td>" + dataBar(r, scoreColor(r, 80, 60)) + "</td></tr>";
  });
  gTable += "</table>";

  let gapBody;
  if (gaps.length === 0) {
    gapBody = "<p>No gaps. Every requirement has a test.</p>";
  } else {
    gapBody = "<table><tr><th>Requirement</th><th>Group</th><th>Status</th></tr>";
    gaps.forEach(function (g) {
      gapBody += "<tr><td>" + g.req_id + "</td><td>" + g.grp + "</td><td>" + g.status + "</td></tr>";
    });
    gapBody += "</table>";
  }

  root.innerHTML = page("Overview / " + p.project, side,
    cards + charts + panel("Status by process group", gTable, "") + '<div style="height:12px"></div>' + panel("Traceability gaps", gapBody, ""));
}

function route() {
  const hash = location.hash.replace("#", "");
  if (hash.indexOf("project=") === 0) {
    showProject(hash.slice(8));
  } else {
    showOverview();
  }
}

window.addEventListener("hashchange", route);
route();