// views.js — the full UI surface for the Riviera Trip Planner. Builds DOM via
// the h() helper; forms/notes/cells keep their interactivity local (no global
// re-render mid-typing) and commit through the store, while selections,
// toggles, and structural edits re-render with focus restored via data-focus.
import {
  h, $, $$, icon, uid, clamp, DAY_META, DATES, dayMeta, dayLabel, STOP_CATS, EXP_CATS, EXP_CUR,
  EXP_PAYERS, SPLIT_MODES, FX, BUDGET_CEILING, fmtMoney, fmtEur, toEur, fmtTimeRange,
  validateStop, validateExpense, categoryTotalsEur, grandTotalEur, balances, greedySettle,
  outstandingNet, dailySeries, projectedEndEur, reservedTotal, pivot, buildICS, buildTripJson,
  buildMarkdown, mdToHtml,
} from "./core.js";
import { toast, modal, confirm, drawer, announce, openOverlay } from "./ui.js";
import { coverSVG, mapSVG, sceneSVG, receiptSVG, SCENE_KINDS } from "./art.js";
import { burnChart, donut, debtNetwork } from "./charts.js";

let S = null; // store
export function initViews(store) { S = store; }
const st = () => S.state;

// focus restore across re-renders
let pendingFocus = null, pendingCaret = null;
export function setFocus(key, caret = null) { pendingFocus = key; pendingCaret = caret; }
export function consumeFocus() { const p = { key: pendingFocus, caret: pendingCaret }; pendingFocus = null; pendingCaret = null; return p; }

// module-local ephemeral UI hints (not undoable state)
let lastAddedStop = null, lastCompletedCat = null;
const navOpen = { overview: true, itinerary: true };
let exportFmt = "markdown";
export function setExportFmt(fmt) { if (["markdown", "ics", "json"].includes(fmt)) exportFmt = fmt; }
export function getExportFmt() { return exportFmt; }
let extrasTab = "notes";

const CAT_SCENE = { sightseeing: "museum", dining: "food", lodging: "hotel", transport: "harbour", other: "garden" };
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const SCENE_FOR = (stop) => CAT_SCENE[stop.category] || "village";

async function copyText(t) {
  try { await navigator.clipboard.writeText(t); }
  catch { const ta = h("textarea", {}); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove(); }
}
function download(name, text, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: name }); a.style.display = "none"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// ARIA tablist keyboard behaviour (roving tabindex; arrows select + move).
function tabKeydown(e, activate) {
  const tabs = Array.from(e.currentTarget.parentElement.querySelectorAll('[role="tab"]'));
  const i = tabs.indexOf(e.currentTarget);
  let n = -1;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % tabs.length;
  else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + tabs.length) % tabs.length;
  else if (e.key === "Home") n = 0;
  else if (e.key === "End") n = tabs.length - 1;
  else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(e.currentTarget.dataset.tab); return; }
  if (n >= 0) { e.preventDefault(); activate(tabs[n].dataset.tab); tabs[n].focus(); }
}

// -------------------------------- TOPBAR ----------------------------------
export function topbar() {
  const s = st();
  const ibtn = (label, html, onclick, key, disabled) =>
    h("button", { class: "btn ghost icon", type: "button", "aria-label": label, title: label, html, onclick, disabled: !!disabled, dataset: key ? { focus: key } : {} });
  return h("header", { class: "topbar" },
    h("button", { class: "btn ghost icon menu-btn", type: "button", "aria-label": "Open navigation", html: icon.menu, onclick: () => { if (matchMobile()) S.setDrawer(true); else { s.sbHidden = false; S.emit(); } } }),
    h("div", { class: "brand" },
      h("span", { class: "mark", html: icon.compass, "aria-hidden": "true" }),
      h("span", { class: "word" }, h("h1", {}, "Trip Planner"), h("span", {}, "Travel Planner · French Riviera"))),
    modeSwitch(),
    h("div", { class: "topgroup hide-sm", style: { marginLeft: "4px" } },
      ibtn("Undo last change", icon.undo, () => { setFocus("tb-undo"); S.undo(); }, "tb-undo", !S.canUndo()),
      ibtn("Redo change", icon.redo, () => { setFocus("tb-redo"); S.redo(); }, "tb-redo", !S.canRedo())),
    h("div", { class: "spacer" }),
    h("div", { class: "seg hide-sm", role: "group", "aria-label": "Workspace document mode" },
      segBtn("Trip plan", icon.file, s.docMode !== "journal", () => { s.docMode = "plan"; S.emit(); setFocus("doc-plan"); }, "doc-plan"),
      segBtn("Trip journal", icon.pencil, s.docMode === "journal", () => { s.docMode = "journal"; toast("Trip journal", "The journal view is a read-along companion in this demo trip.", "info"); setFocus("doc-journal"); }, "doc-journal")),
    h("button", { class: "btn primary", type: "button", html: icon.share + "<span>Share</span>", onclick: () => toast("Share trip", "A shareable link would be copied in the connected app; no outbound navigation here.", "info") }),
    ibtn(s.theme === "dark" ? "Switch to light theme" : "Switch to dark theme", s.theme === "dark" ? icon.sun : icon.moon, () => { setFocus("tb-theme"); S.toggleTheme(); }, "tb-theme"),
    ibtn("Export trip files", icon.download, () => openExport(), "tb-export"),
    ibtn("Import trip JSON", icon.upload, () => openImport(), "tb-import"),
    ibtn("More actions", icon.dots, () => openMore(), "tb-more"));
}
function segBtn(label, html, pressed, onclick, key) {
  return h("button", { type: "button", "aria-label": label, "aria-pressed": String(!!pressed), html: html + `<span>${label}</span>`, onclick, dataset: { focus: key } });
}
function openMore() {
  const body = h("div", { style: { display: "flex", flexDirection: "column", gap: "8px" } },
    h("button", { class: "btn block", type: "button", html: icon.wand + "<span>Load a sample trip</span>", onclick: () => { m.close(); S.templateSeed(); toast("Sample trip loaded", "Two stops and two expenses were added across the plan and ledger.", "ok"); } }),
    h("button", { class: "btn block danger", type: "button", html: icon.reset + "<span>Factory reset trip</span>", onclick: () => { m.close(); doReset(); } }));
  const m = modal({ title: "Trip actions", body });
}
async function doReset() {
  const ok = await confirm({ title: "Reset trip to the seeded plan?", message: "This restores the original French Riviera stops, expenses, and settings. Your current edits will be undone (one Undo can bring them back).", confirmLabel: "Reset trip", danger: true });
  if (ok) { S.factoryReset(); toast("Trip reset", "The seeded Cote d'Azur plan is restored across every pane.", "ok"); }
}

// ------------------------------- SIDEBAR ----------------------------------
export function sidebar() {
  const s = st();
  const group = (key, label, body) => {
    const head = h("button", { class: "nav-head", type: "button", "aria-expanded": String(!!navOpen[key]), onclick: (e) => { navOpen[key] = !navOpen[key]; e.currentTarget.setAttribute("aria-expanded", String(navOpen[key])); e.currentTarget.parentElement.dataset.open = String(navOpen[key]); const c = e.currentTarget.querySelector(".chev"); } },
      h("span", {}, label), h("span", { class: "chev", html: icon.chevronDown, "aria-hidden": "true" }));
    return h("div", { class: "nav-group", dataset: { open: String(!!navOpen[key]) } }, head, h("div", { class: "nav-body" }, body));
  };
  const overview = h("div", {},
    navItem("Explore", icon.compass, s.view === "explore" && s.mode !== "map", () => { S.setView("explore"); S.setMode(window.innerWidth < 1024 ? "list" : "split"); setFocus("nav-explore"); }, "nav-explore"),
    navItem("Notes", icon.file, s.view === "notes", () => { S.setView("notes"); setFocus("nav-notes"); }, "nav-notes"),
    navItem("Places to visit", icon.pin, s.view === "explore" && s.mode === "map", () => { S.setView("explore"); S.setMode("map"); setFocus("nav-places"); }, "nav-places"));
  const days = h("div", {},
    s.dayFilter ? h("button", { class: "nav-item", type: "button", html: icon.x + "<span>Show all days</span>", onclick: () => { s.view = "explore"; s.mode = matchMobile() ? "list" : "split"; S.clearDayFilter(); setFocus("day-all"); }, dataset: { focus: "day-all" } }) : null,
    ...DAY_META.map((d) => {
      const n = s.stops.filter((x) => x.day === d.date).length;
      const active = s.dayFilter === d.date;
      return h("button", { class: "nav-item nav-sub", type: "button", "aria-pressed": String(active), onclick: () => { s.view = "explore"; s.mode = matchMobile() ? "list" : "split"; S.setDayFilter(d.date); setFocus("day-" + d.date); }, dataset: { focus: "day-" + d.date } },
        h("span", { class: "dot", style: { background: d.color } }), h("span", {}, `${d.dow} ${d.md}`), h("span", { class: "meta" }, String(n)));
    }));
  const budgetRow = navItem("Budget", icon.euro, s.view === "budget", () => { S.setView("budget"); setFocus("nav-budget"); }, "nav-budget");
  const foot = h("div", { class: "nav-foot" },
    h("button", { class: "nav-item", type: "button", html: icon.lifebuoy + "<span>Support</span>", onclick: () => toast("Trip support", "Concierge support is a preview feature in this demo trip.", "info") }),
    h("button", { class: "nav-item", type: "button", html: icon.sidebar + "<span>Hide sidebar</span>", onclick: () => { if (matchMobile()) S.setDrawer(false); else { s.sbHidden = true; S.emit(); } } }),
    h("button", { class: "nav-item", type: "button", style: { color: "var(--danger)" }, html: icon.reset + "<span>Factory reset</span>", onclick: () => doReset() }));
  return h("aside", { class: "sidebar", "aria-label": "Trip navigation" },
    h("button", { class: "ai-pill", type: "button", html: icon.sparkles + "<span>AI Assistant</span>", onclick: () => toast("AI Assistant", "Ask the assistant to draft a day or balance the ledger in the connected app; this demo keeps you in the planner.", "info") }),
    group("overview", "Overview", overview),
    group("itinerary", "Itinerary", days),
    budgetRow, foot);
}
function navItem(label, html, current, onclick, key) {
  return h("button", { class: "nav-item", type: "button", "aria-current": current ? "true" : "false", html: html + `<span>${label}</span>`, onclick, dataset: { focus: key } });
}

// ------------------------- MAIN ROUTER CONTENT ----------------------------
export function mainContent() {
  const s = st();
  if (s.view === "notes") return notesView();
  if (s.view === "budget") return budgetView();
  return planView();
}

// --------------------------------- PLAN -----------------------------------

function modeSwitch() {
  const s = st();
  const mobile = matchMobile();
  const listOn = s.mode === "list" || (!mobile && s.mode === "split");
  const mapOn = s.mode === "map";
  return h("div", { class: "seg mode-switch", role: "group", "aria-label": "Plan List or Map mode", style: { marginLeft: "10px" } },
    segBtn("Plan List", icon.list, listOn && !mapOn, () => { S.setView("explore"); S.setMode(mobile ? "list" : "split"); setFocus("mode-list"); toast("Plan List mode", "Day sections and stop rows are emphasized.", "info", { ms: 1400 }); }, "mode-list"),
    segBtn("Map", icon.map, mapOn, () => { S.setView("explore"); S.setMode("map"); setFocus("mode-map"); toast("Map mode", "The map pane is emphasized with pin selection.", "info", { ms: 1400 }); }, "mode-map"));
}
function planView() {
  const s = st();
  const wrap = h("div", { class: "workspace" });
  wrap.appendChild(hero());
  wrap.appendChild(explore());
  if (s.stops.length === 0) {
    wrap.appendChild(h("div", { class: "empty-state", style: { marginTop: "8px" } },
      h("span", { html: icon.pin, "aria-hidden": "true" }),
      h("b", {}, "No stops in your plan yet"),
      h("p", {}, "Your itinerary is empty, so the ICS export has zero events and the trip JSON stops array is empty. Add your first stop to start compiling the plan."),
      h("button", { class: "btn primary", type: "button", html: icon.plus + "<span>Add your first stop</span>", onclick: () => openStopForm() })));
    return wrap;
  }
  const days = s.dayFilter ? DAY_META.filter((d) => d.date === s.dayFilter) : DAY_META;
  for (const d of days) wrap.appendChild(daySection(d));
  if (s.dayFilter && s.stops.filter((x) => x.day === s.dayFilter).length === 0) {
    // empty-day state already rendered inside daySection; ensure create affordance
  }
  return wrap;
}
function hero() {
  const s = st();
  const titleInput = h("input", { id: "trip-title", class: "title-input", type: "text", value: s.tripTitle || "Trip to the French Riviera - Cote d'Azur", maxlength: "80",
    oninput: (e) => { s.tripTitle = e.target.value; },
    onblur: (e) => { s.tripTitle = e.target.value.trim() || "Trip to the French Riviera - Cote d'Azur"; e.target.value = s.tripTitle; S.emit(); } });
  const avs = h("div", { class: "avatars", "aria-label": "Four travellers" },
    ...EXP_PAYERS.map((p, i) => h("span", { class: "av", title: p, "aria-label": p, style: { background: ["var(--d0)", "var(--d4)", "var(--d1)", "var(--d3)"][i] } }, p[0])));
  const card = h("div", { class: "card" }, h("label", { class: "sr-only", for: "trip-title" }, "Trip title"), titleInput,
    h("div", { class: "meta-row" }, h("span", { html: icon.calendar, "aria-hidden": "true" }), h("span", {}, "7/5 – 7/11 · 2025"), avs));
  return h("section", { class: "hero", "aria-label": "Trip cover and title" },
    h("div", { class: "cover", html: coverSVG() },
      h("button", { class: "edit", type: "button", "aria-label": "Edit trip title", html: icon.pencil, onclick: () => { titleInput.focus(); titleInput.select(); } })),
    card);
}
function explore() {
  const cards = [
    { kind: "food", t: "Best restaurants in the Cote d'Azur", p: "A food-lover's route through Vieux Nice and the harbours.", src: "Riviera" },
    { kind: "harbour", t: "Cote d'Azur 2023 — a coastal guide", p: "A community travel guide to the Riviera by rail and boat.", src: "Katy R." },
    { kind: "hotel", t: "Hotels with transparent pricing", p: "Seafront stays ranked by value, not by commission.", src: "Trip" },
  ];
  const strip = [
    { kind: "village", t: "Eglise Saint-Jacques, Nice" }, { kind: "museum", t: "Cinema de la Plage" },
    { kind: "garden", t: "Jardin Exotique d'Eze" }, { kind: "beach", t: "Plage de la Garoupe" },
  ];
  return h("section", { "aria-label": "Explore suggestions" },
    h("div", { class: "section-head" }, h("h1", { class: "display" }, "Explore"),
      h("button", { class: "btn coral", type: "button", style: { marginLeft: "auto" }, html: icon.search + "<span>Browse all</span>", onclick: () => toast("Browse all", "The full guide catalogue opens in the connected app; this demo keeps you in the planner.", "info") })),
    h("div", { class: "cards-row" }, ...cards.map((c) =>
      h("button", { class: "sugg", type: "button", onclick: () => toast("Guide preview", "“" + c.t + "” opens in the connected app; no outbound navigation here.", "info") },
        h("div", { class: "thumb", html: sceneSVG(c.kind) }),
        h("div", { class: "body" }, h("b", {}, c.t), h("p", {}, c.p), h("span", { class: "src" }, h("span", { class: "b" }, c.src[0]), c.src))))),
    h("div", { class: "strip", role: "list", "aria-label": "Suggested places to add" },
      h("div", { class: "chip-card", role: "listitem", style: { justifyContent: "center", color: "var(--ink-soft)" } }, h("span", { html: icon.plus, "aria-hidden": "true" }), h("span", { class: "x" }, "Add a place")),
      ...strip.map((p) => h("div", { class: "chip-card", role: "listitem" },
        h("span", { class: "t", html: sceneSVG(p.kind) }), h("span", { class: "x" }, p.t),
        h("button", { class: "btn icon sm", type: "button", "aria-label": "Add " + p.t + " as a stop", html: icon.plus, onclick: () => openStopForm({ title: p.t }) })))));
}
function daySection(d) {
  const s = st();
  const stops = s.stops.filter((x) => x.day === d.date).sort((a, b) => (a.startTime || "99:99").localeCompare(b.startTime || "99:99"));
  const head = h("div", { class: "day-head", style: { color: d.color } },
    h("span", { class: "dot" }), h("h3", { style: { color: "var(--ink)" } }, dayLabel(d.date)), h("span", { class: "when" }, d.date),
    h("span", { class: "right" }, h("span", { class: "count-pill" }, stops.length + (stops.length === 1 ? " stop" : " stops")),
      h("button", { class: "btn sm", type: "button", html: icon.plus + "<span>Add stop</span>", "aria-label": "Add stop on " + dayLabel(d.date), onclick: () => openStopForm({ day: d.date }) })));
  let body;
  if (stops.length === 0) {
    body = h("div", { style: { padding: "0 14px 14px" } }, h("div", { class: "empty-state" },
      h("span", { html: icon.calendar, "aria-hidden": "true" }),
      h("b", {}, `No stops on ${dayLabel(d.date)}`),
      h("p", {}, s.dayFilter ? "This day has no stops. Add one, or show the full week." : "A free day on the coast. Add a stop when you are ready."),
      h("div", { style: { display: "flex", gap: "8px" } },
        h("button", { class: "btn primary sm", type: "button", html: icon.plus + "<span>Add a stop</span>", onclick: () => openStopForm({ day: d.date }) }),
        s.dayFilter ? h("button", { class: "btn sm", type: "button", text: "Show all days", onclick: () => S.clearDayFilter() }) : null)));
  } else {
    body = h("div", {}, ...stops.map((stop) => stopRow(stop, d)));
  }
  return h("section", { class: "day-section", "aria-label": dayLabel(d.date) }, head, body);
}
function stopRow(stop, d) {
  const s = st();
  const sel = s.selectedStopId === stop.id;
  const isNew = lastAddedStop === stop.id;
  if (isNew) lastAddedStop = null;
  const row = h("div", {
    class: "stop-row" + (isNew ? " row-enter" : ""), role: "button", tabindex: "0",
    "aria-pressed": String(sel), "aria-label": `Select ${stop.title}, ${cap(stop.category)}, ${dayLabel(stop.day)}`,
    style: { "--day": d.color }, dataset: { focus: "row-" + stop.id },
    onclick: () => { S.selectStop(stop.id); setFocus("row-" + stop.id); },
    onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); S.selectStop(stop.id); setFocus("row-" + stop.id); } },
  },
    h("span", { class: "rail", "aria-hidden": "true" }),
    h("div", { class: "info" },
      h("div", { class: "ttl" }, h("span", {}, stop.title), h("span", { class: "cat-chip" }, cap(stop.category)), stop.startTime ? h("span", { class: "time-chip" }, fmtTimeRange(stop.startTime, stop.endTime)) : null),
      stop.location ? h("div", { class: "sub" }, stop.location) : null,
      stop.notes ? h("div", { class: "note" }, stop.notes) : null,
      customFieldInputs("stop:" + stop.id)),
    h("div", { class: "acts" },
      h("button", { class: "btn icon sm", type: "button", "aria-label": "Edit " + stop.title, html: icon.pencil, onclick: (e) => { e.stopPropagation(); openStopForm(stop); } }),
      h("button", { class: "btn icon sm danger", type: "button", "aria-label": "Delete " + stop.title, html: icon.trash, onclick: (e) => { e.stopPropagation(); deleteStop(stop.id); } })));
  return row;
}
function deleteStop(id) {
  const title = st().stops.find((x) => x.id === id)?.title || "stop";
  S.deleteStop(id);
  toast("Stop deleted", title + " was removed from the plan and the map.", "warn", { action: { label: "Undo", onClick: () => S.undo() } });
}

// custom-field inputs shown on stop/expense cards
function customFieldInputs(entityKey) {
  const s = st();
  if (!s.customFields.length) return null;
  const vals = s.customValues[entityKey] || {};
  return h("div", { class: "cf-list", style: { marginTop: "8px" } }, ...s.customFields.map((cf) =>
    h("label", { class: "cf-row", style: { background: "transparent", border: "0", padding: "3px 0" } },
      h("span", { style: { fontWeight: "700", minWidth: "84px" } }, cf.name),
      cf.type === "rating" ? ratingInput(vals[cf.id], (v) => S.setCustomValue(entityKey, cf.id, v))
        : h("input", { class: "input", type: cf.type === "number" ? "number" : "text", value: vals[cf.id] ?? "", "aria-label": cf.name,
            onchange: (e) => S.setCustomValue(entityKey, cf.id, cf.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value) }))));
}
function ratingInput(value, onChange) {
  const v = Number(value) || 0;
  return h("span", { class: "rating-input", role: "radiogroup", "aria-label": "Rating" },
    ...[1, 2, 3, 4, 5].map((n) => h("button", { type: "button", class: n <= v ? "on" : "", "aria-label": n + " of 5", "aria-pressed": String(n <= v), text: "★", onclick: (e) => { e.stopPropagation(); onChange(n === v ? 0 : n); } })));
}

// --------------------------- MAP + DETAIL CARD ----------------------------
export function mapView() {
  const s = st();
  const stage = h("div", { class: "map-stage" });
  stage.innerHTML = mapSVG(s.stops, s.selectedStopId);
  // bind pins (keyboard + pointer)
  stage.querySelectorAll(".pin").forEach((g) => {
    const id = g.dataset.stop;
    const sel = () => { S.selectStop(id); setFocus("pin-" + id); };
    g.addEventListener("click", sel);
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sel(); } });
    g.setAttribute("data-focus", "pin-" + id);
  });
  const idx = s.stops.findIndex((x) => x.id === s.selectedStopId);
  const pager = h("div", { class: "map-pager" },
    h("button", { type: "button", "aria-label": "Previous stop", html: icon.chevronLeft, onclick: () => cycleSel(-1) }),
    h("span", {}, s.stops.length ? `${idx + 1} of ${s.stops.length}` : "0 of 0"),
    h("button", { type: "button", "aria-label": "Next stop", html: icon.chevronRight, onclick: () => cycleSel(1) }));
  const chrome = h("div", { class: "map-chrome" },
    h("div", { class: "map-toolbar" },
      h("button", { class: "map-btn", type: "button", html: icon.pin + "<span>Export</span>", onclick: () => openExport() }),
      h("div", { class: "right" },
        h("button", { class: "map-btn icon", type: "button", "aria-label": "Zoom in", html: icon.zoomIn, onclick: () => toast("Map zoom", "The map is a static snapshot in this product; zoom is illustrative.", "info") }),
        h("button", { class: "map-btn icon", type: "button", "aria-label": "Zoom out", html: icon.zoomOut, onclick: () => toast("Map zoom", "The map is a static snapshot in this product; zoom is illustrative.", "info") }),
        h("button", { class: "map-btn icon", type: "button", "aria-label": "Map layers", html: icon.layers, onclick: () => toast("Map layers", "Switching map layers is a preview feature in this demo trip.", "info") }))),
    h("button", { class: "map-btn", type: "button", style: { position: "absolute", left: "50%", top: "54px", transform: "translateX(-50%)" }, html: icon.route + "<span>Optimize route</span>", onclick: () => toast("Route optimized (preview)", "A reordered route would be drawn on the connected map; this demo keeps your order.", "ok") }),
    pager,
    s.selectedStopId ? detailCard() : h("div", { class: "detail-card", style: { maxHeight: "none", padding: "16px" } },
      h("div", { class: "empty-state", style: { border: "0", background: "transparent", padding: "8px" } }, h("span", { html: icon.pin, "aria-hidden": "true" }), h("b", {}, "Select a stop"), h("p", {}, "Choose a pin or a plan row to open its place detail over the map."))));
  return h("section", { class: "mappane", "aria-label": "Trip map" }, stage, chrome);
}
function cycleSel(dir) {
  const s = st(); if (!s.stops.length) return;
  const i = s.stops.findIndex((x) => x.id === s.selectedStopId);
  const n = (i + dir + s.stops.length) % s.stops.length;
  S.selectStop(s.stops[n].id);
}
function detailCard() {
  const s = st();
  const stop = s.stops.find((x) => x.id === s.selectedStopId);
  if (!stop) return null;
  const d = dayMeta(stop.day);
  const TABS = ["About", "Book", "Reviews", "Photos", "Mentions"];
  const tabs = h("div", { class: "tabs", role: "tablist", "aria-label": "Place detail sections" },
    ...TABS.map((t) => h("button", { class: "tab", role: "tab", type: "button", id: "dtab-" + t, "aria-selected": String(s.detailTab === t), tabindex: s.detailTab === t ? "0" : "-1", "data-tab": t, dataset: { tab: t, focus: "dtab-" + t },
      onclick: () => { S.setDetailTab(t); setFocus("dtab-" + t); }, onkeydown: (e) => tabKeydown(e, (tab) => { S.setDetailTab(tab); setFocus("dtab-" + tab); }) }, t)));
  const panel = h("div", { class: "panel swap", role: "tabpanel", "aria-labelledby": "dtab-" + s.detailTab }, ...detailPanelBody(stop, d));
  return h("div", { class: "detail-card" },
    h("button", { class: "btn ghost icon close", type: "button", "aria-label": "Close place detail", html: icon.x, onclick: () => S.selectStop(null) }),
    tabs, panel);
}
function detailPanelBody(stop, d) {
  const s = st();
  if (s.detailTab === "Book") return [
    h("div", { class: "dhead" }, h("div", { class: "pic", html: sceneSVG(SCENE_FOR(stop)) }), h("div", {}, h("h3", {}, stop.title), h("div", { class: "sub", style: { fontSize: "12px", color: "var(--ink-soft)" } }, "Booking & availability"))),
    h("p", { class: "desc" }, `Live booking is not connected in this static planner. In the connected app you would reserve ${stop.title} for ${dayLabel(stop.day)}${stop.startTime ? " at " + stop.startTime : ""}.`),
    h("div", { class: "pills" },
      ...["Ask AI", "Tour guide", "What are the admission fees?"].map((q) => h("button", { class: "btn sm", type: "button", onclick: () => toast(q, "This assistant prompt runs in the connected app; no outbound navigation here.", "info") }, q)))];
  if (s.detailTab === "Reviews") return [
    h("div", { class: "rating" }, h("span", { class: "stars" }, "★★★★★"), h("span", {}, "4.6 · 1,284 reviews")),
    h("div", { class: "review" }, h("div", { class: "who" }, "Camille — ", h("span", { class: "stars", style: { color: "var(--d2)" } }, "★★★★★")), h("p", {}, "Went at opening and had the whole place to ourselves. The light over the bay is unreal.")),
    h("div", { class: "review" }, h("div", { class: "who" }, "Tomas — ", h("span", { class: "stars", style: { color: "var(--d2)" } }, "★★★★")), h("p", {}, "Lovely stop on our coastal day. Allow a little extra time for the climb."))];
  if (s.detailTab === "Photos") return [
    h("div", { class: "photo-grid" }, ...["beach", "harbour", "village", SCENE_FOR(stop), "garden", "museum"].map((k) => h("div", { class: "ph", html: sceneSVG(k) }))),
    h("button", { class: "btn sm", type: "button", style: { marginTop: "10px" }, html: icon.image + "<span>Open gallery</span>", onclick: () => openGallery(stop) })];
  if (s.detailTab === "Mentions") return [
    h("div", { class: "rating" }, h("span", { class: "stars" }, "★★★★★"), h("span", {}, "Mentioned in 49 lists")),
    h("div", { class: "review" }, h("div", { class: "who" }, "Coastal art trail"), h("p", {}, "Featured as a must-see on the Antibes old-town walk.")),
    h("div", { class: "review" }, h("div", { class: "who" }, "Weekend on the Riviera"), h("p", {}, "Listed among the best half-day stops between Nice and Cannes."))];
  // About
  return [
    h("div", { class: "dhead" },
      h("div", { style: { display: "flex", alignItems: "center", gap: "8px", flex: "1", minWidth: "0" } },
        h("span", { class: "pin-no", style: { background: d.color } }, String((s.stops.filter((x) => x.day === stop.day).indexOf(stop)) + 1)),
        h("div", { style: { flex: "1", minWidth: "0" } }, h("h3", {}, stop.title))),
      h("div", { class: "pic", html: sceneSVG(SCENE_FOR(stop)) })),
    h("p", { class: "desc" }, stop.notes || `${stop.title} sits on the ${dayLabel(stop.day)} leg of your Cote d'Azur route${stop.location ? ", near " + stop.location : ""}. Tap a tab above for booking, reviews, photos, and mentions.`),
    h("div", { class: "pills" },
      h("span", { class: "tag" }, cap(stop.category)),
      h("span", { class: "tag" }, dayLabel(stop.day)),
      stop.startTime ? h("span", { class: "tag" }, fmtTimeRange(stop.startTime, stop.endTime)) : null,
      h("button", { class: "btn sm", type: "button", onclick: () => toast("Marked as visited", stop.title + " is checked off in this demo trip.", "ok") }, "Mark as visited")),
    customFieldInputs("stop:" + stop.id),
    h("div", { class: "rating" }, h("span", { class: "stars" }, "★★★★★"), h("span", {}, "4.6 (7065)")),
    stop.location ? h("div", { style: { fontSize: "12px", color: "var(--ink-soft)", marginTop: "8px", display: "flex", gap: "6px", alignItems: "center" } }, h("span", { html: icon.pin, "aria-hidden": "true" }), stop.location) : null,
    h("div", { style: { display: "flex", gap: "8px", marginTop: "10px" } },
      h("button", { class: "btn sm", type: "button", html: icon.image + "<span>Gallery</span>", onclick: () => openGallery(stop) }),
      h("button", { class: "btn sm", type: "button", html: icon.pencil + "<span>Edit stop</span>", onclick: () => openStopForm(stop) }))];
}

// ------------------------------- BUDGET -----------------------------------
function budgetView() {
  const s = st();
  const tabs = ["ledger", "spreadsheet", "settle", "ingest", "reports"];
  const labels = { ledger: "Ledger", spreadsheet: "Spreadsheet", settle: "Settle up", ingest: "Ingest", reports: "Reports" };
  const icons = { ledger: icon.euro, spreadsheet: icon.table, settle: icon.users, ingest: icon.upload, reports: icon.file };
  const total = grandTotalEur(s.expenses);
  const proj = projectedEndEur(s.expenses);
  const over = proj > BUDGET_CEILING;
  const kpis = h("div", { class: "kpis" },
    kpi("Spent", fmtMoney(total, s.displayCurrency), s.expenses.length + " expenses"),
    kpi("Projected end", fmtEur(proj), over ? "Over the ceiling" : "Within budget", over ? "over" : "ok"),
    kpi("Ceiling", fmtEur(BUDGET_CEILING), "Trip budget"),
    kpi("Travellers", "4", "Ava · Ben · Chloe · Dan"));
  const curToggle = h("div", { class: "seg", role: "group", "aria-label": "Display currency (does not change stored amounts)" },
    ...EXP_CUR.map((c) => segBtn(c, "", s.displayCurrency === c, () => { S.setDisplayCurrency(c); setFocus("dcur-" + c); }, "dcur-" + c)));
  const wsTabs = h("div", { class: "ws-tabs", role: "tablist", "aria-label": "Budget workspace sections" },
    ...tabs.map((t) => h("button", { class: "ws-tab", role: "tab", type: "button", "aria-selected": String(s.budgetTab === t), tabindex: s.budgetTab === t ? "0" : "-1", "data-tab": t, dataset: { tab: t, focus: "wstab-" + t }, html: icons[t] + `<span>${labels[t]}</span>`,
      onclick: () => { S.setBudgetTab(t); setFocus("wstab-" + t); }, onkeydown: (e) => tabKeydown(e, (tab) => { S.setBudgetTab(tab); setFocus("wstab-" + tab); }) })));
  let body;
  if (s.budgetTab === "ledger") body = ledgerTab();
  else if (s.budgetTab === "spreadsheet") body = spreadsheetTab();
  else if (s.budgetTab === "settle") body = settleTab();
  else if (s.budgetTab === "ingest") body = ingestTab();
  else body = reportsTab();
  return h("div", { class: "workspace" },
    h("div", { class: "section-head", style: { marginTop: 0 } }, h("h1", { class: "display" }, "Budget"),
      h("span", { class: "count-pill" }, "Live across ledger, charts, and reports"),
      h("div", { style: { marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" } },
        h("span", { class: "eyebrow", style: { textTransform: "none" } }, "Show as"), curToggle)),
    kpis, wsTabs, body);
}
function kpi(lab, val, sub, cls = "") { return h("div", { class: "kpi " + cls }, h("div", { class: "lab", style: { textTransform: "none" } }, lab), h("div", { class: "val" }, val), h("div", { class: "sub" }, sub)); }

function ledgerTab() {
  const s = st();
  const totals = categoryTotalsEur(s.expenses);
  const rows = sortedExpenses();
  const cfCols = s.customFields;
  const th = (key, label, cls = "") => h("th", { class: cls, "aria-sort": s.ledgerSort.key === key ? (s.ledgerSort.dir === "asc" ? "ascending" : "descending") : "none", onclick: () => { S.setLedgerSort(key); setFocus("th-" + key); }, dataset: { focus: "th-" + key } },
    label, h("span", { class: "arr" }, s.ledgerSort.key === key ? (s.ledgerSort.dir === "asc" ? "▲" : "▼") : "↕"));
  const head = h("tr", {},
    h("th", {}, h("input", { type: "checkbox", class: "rowcheck", "aria-label": "Select all expenses", checked: rows.length && s.selectedRows.length === rows.length, onchange: (e) => { s.selectedRows = e.target.checked ? rows.map((r) => r.id) : []; S.emit(); } })),
    th("description", "Description"), th("day", "Day"), th("category", "Category"), th("payer", "Payer"),
    th("amount", "Amount", "num"), h("th", {}, "Currency"), h("th", { class: "num" }, "In EUR"), h("th", {}, "Split"),
    ...cfCols.map((cf) => h("th", {}, cf.name)), h("th", {}, "Status"), h("th", { "aria-label": "Row actions" }, ""));
  const body = rows.length ? rows.map((x) => {
    const eur = toEur(x);
    const flagged = s.caps[x.category] != null && totals[x.category] > s.caps[x.category];
    return h("tr", { class: flagged ? "flagged" : "" },
      h("td", {}, h("input", { type: "checkbox", class: "rowcheck", "aria-label": "Select " + x.description, checked: s.selectedRows.includes(x.id), onchange: () => S.toggleRow(x.id) })),
      h("td", { class: "desc-cell" }, x.description),
      h("td", {}, dayLabel(x.day)),
      h("td", {}, cap(x.category)),
      h("td", {}, x.payer),
      h("td", { class: "num" }, fmtMoney(x.amount, x.currency).replace(" " + x.currency, "")),
      h("td", {}, h("select", { class: "select mini-sel", "aria-label": "Currency for " + x.description, onchange: (e) => S.updateExpense(x.id, { currency: e.target.value }) }, ...EXP_CUR.map((c) => h("option", { value: c, selected: c === x.currency }, c)))),
      h("td", { class: "num" }, fmtEur(eur)),
      h("td", {}, h("div", { style: { display: "flex", flexDirection: "column", gap: "4px", minWidth: "110px" } },
        h("select", { class: "select mini-sel", "aria-label": "Split mode for " + x.description, onchange: (e) => S.updateExpense(x.id, { splitMode: e.target.value, weights: e.target.value === "weighted" ? (x.weights || { Ava: 1, Ben: 1, Chloe: 1, Dan: 1 }) : undefined }) }, ...SPLIT_MODES.map((m) => h("option", { value: m, selected: m === x.splitMode }, m))),
        x.splitMode === "weighted" ? h("div", { class: "weight-inline", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px" } },
          ...EXP_PAYERS.map((p) => h("label", { style: { display: "flex", gap: "3px", alignItems: "center", fontSize: "10px" } },
            h("span", {}, p[0]),
            h("input", { class: "input", type: "number", min: "0.1", step: "0.1", value: (x.weights || {})[p] ?? 1, "aria-label": "Weight for " + p + " on " + x.description, style: { padding: "2px 4px", fontSize: "11px" },
              onchange: (e) => S.updateExpense(x.id, { weights: { ...(x.weights || { Ava: 1, Ben: 1, Chloe: 1, Dan: 1 }), [p]: Number(e.target.value) } }) })))) : null)),
      ...cfCols.map((cf) => h("td", {}, h("input", { class: "input", style: { padding: "4px 6px" }, type: cf.type === "number" ? "number" : "text", value: (s.customValues["exp:" + x.id] || {})[cf.id] ?? "", "aria-label": cf.name + " for " + x.description, onchange: (e) => S.setCustomValue("exp:" + x.id, cf.id, e.target.value) }))),
      h("td", {}, flagged ? h("span", { class: "flag", html: icon.alert + "<span>Over cap</span>" }) : h("span", { style: { color: "var(--ink-faint)" } }, "—")),
      h("td", {}, h("div", { style: { display: "flex", gap: "4px" } },
        h("button", { class: "btn icon sm", type: "button", "aria-label": "Edit " + x.description, html: icon.pencil, onclick: () => openExpenseForm(x) }),
        h("button", { class: "btn icon sm danger", type: "button", "aria-label": "Delete " + x.description, html: icon.trash, onclick: () => deleteExpense(x.id) }))));
  }) : [h("tr", {}, h("td", { colspan: 11 + cfCols.length }, h("div", { class: "empty-state" }, h("span", { html: icon.euro, "aria-hidden": "true" }), h("b", {}, "No expenses yet"), h("p", {}, "Add an expense to populate the ledger, charts, and settlement plan."))))];
  const table = h("table", { class: "ledger" }, h("thead", {}, head), h("tbody", {}, ...body));
  const donutData = donut(s);
  return h("div", { class: "grid-2" },
    h("div", { class: "panel" },
      h("div", { class: "phead" }, h("h3", {}, "Expense ledger"), h("span", { class: "count-pill" }, fmtMoney(grandTotalEur(s.expenses), s.displayCurrency)),
        h("div", { class: "right" }, h("button", { class: "btn primary sm", type: "button", html: icon.plus + "<span>Add expense</span>", onclick: () => openExpenseForm() }))),
      h("div", { class: "scroll-x" }, table)),
    h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } },
      fxPanel(), capsPanel(),
      h("div", { class: "panel" }, h("div", { class: "phead" }, h("h3", {}, "Cost allocation")),
        h("div", { class: "pbody pad" }, h("div", { class: "donut-row" }, h("div", { html: donutData.svg }),
          h("div", { class: "leg" }, ...donutData.items.map((it) => h("div", { class: "li" }, h("span", { class: "sw", style: { background: it.color } }), h("span", {}, it.label), h("span", { class: "v" }, fmtEur(it.eur)))))))),
      h("div", { class: "panel" }, h("div", { class: "phead" }, h("h3", {}, "Burn rate vs ceiling")),
        h("div", { class: "chart-wrap", html: burnChart(s) }),
        h("div", { class: "chart-legend" },
          h("span", { class: "li" }, h("span", { class: "sw line", style: { background: "var(--accent)" } }), "Spent (EUR)"),
          h("span", { class: "li" }, h("span", { class: "sw dash", style: { borderColor: "var(--accent-2)" } }), "Projected"),
          h("span", { class: "li" }, h("span", { class: "sw dash", style: { borderColor: "var(--warn)" } }), BUDGET_CEILING + " EUR ceiling")))));
}
function fxPanel() {
  return h("div", { class: "panel" },
    h("div", { class: "phead" }, h("h3", {}, "FX rates (against EUR)")),
    h("div", { class: "pbody" }, h("table", { class: "fx-table" }, h("tbody", {},
      ...["USD", "GBP", "CHF"].map((c) => h("tr", {},
        h("td", {}, "1 " + c + " ="),
        h("td", { class: "num" }, FX[c].toFixed(2) + " EUR"),
        h("td", { class: "num", style: { color: "var(--ink-faint)" } }, "1 EUR = " + (1 / FX[c]).toFixed(3) + " " + c)))))));
}
function capsPanel() {
  const s = st();
  return h("div", { class: "panel" },
    h("div", { class: "phead" }, h("h3", {}, "Category caps"), h("span", { class: "help", style: { marginLeft: "auto" } }, "Flags rows in EUR")),
    h("div", { class: "pbody pad" }, h("div", { class: "caps" }, ...EXP_CATS.map((c) =>
      h("label", { class: "cap-row" },
        h("span", { style: { width: "72px" } }, c),
        h("input", { class: "input", type: "number", min: "0", step: "1", value: s.caps[c] ?? "", "aria-label": "Cap for " + c + " in EUR", onchange: (e) => S.setCap(c, e.target.value) }))))));
}
function sortedExpenses() {
  const s = st();
  const { key, dir } = s.ledgerSort;
  const mul = dir === "asc" ? 1 : -1;
  const val = (x) => key === "amount" ? toEur(x) : key === "day" ? DATES.indexOf(x.day) : String(x[key] || "").toLowerCase();
  return [...s.expenses].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * mul);
}
function deleteExpense(id) {
  const desc = st().expenses.find((x) => x.id === id)?.description || "expense";
  S.deleteExpense(id);
  toast("Expense deleted", desc + " was removed from the ledger and every derived surface.", "warn", { action: { label: "Undo", onClick: () => S.undo() } });
}

// ----------------------------- SPREADSHEET --------------------------------
let ssActive = { r: 0, c: 1 };
let ssEditing = false;
let ssFormula = "";
function spreadsheetTab() {
  const s = st();
  const cfCols = s.customFields;
  const baseCols = [
    { key: "description", label: "Description", type: "text" },
    { key: "day", label: "Day", type: "enum", opts: DATES, fmt: (v) => dayLabel(v) },
    { key: "category", label: "Category", type: "enum", opts: EXP_CATS },
    { key: "payer", label: "Payer", type: "enum", opts: EXP_PAYERS },
    { key: "amount", label: "Amount", type: "number" },
    { key: "currency", label: "Currency", type: "enum", opts: EXP_CUR },
  ];
  const cols = [...baseCols, ...cfCols.map((cf) => ({ key: "cf:" + cf.id, label: cf.name, type: cf.type === "number" ? "number" : "text", cf: cf.id }))];
  const rows = s.expenses;
  if (ssActive.r >= rows.length) ssActive.r = Math.max(0, rows.length - 1);
  if (ssActive.c >= cols.length) ssActive.c = cols.length - 1;
  const colLetter = (c) => String.fromCharCode(65 + (c % 26));

  const grid = h("table", { class: "ss", role: "grid", "aria-label": "Expense spreadsheet matrix" });
  const thead = h("tr", {}, h("th", {}, ""), ...cols.map((c, ci) => h("th", {}, colLetter(ci))));
  const tbody = h("tbody", {});
  rows.forEach((x, ri) => {
    const tr = h("tr", {}, h("td", { class: "rowhead" }, String(ri + 1)));
    cols.forEach((col, ci) => {
      const active = ssActive.r === ri && ssActive.c === ci;
      const raw = col.cf ? ((s.customValues["exp:" + x.id] || {})[col.cf] ?? "") : x[col.key];
      const shown = col.fmt ? col.fmt(raw) : (raw == null ? "" : String(raw));
      const td = h("td", { class: (active ? "active " : "") + (col.type === "number" ? "num" : "") + (s.selectedRows.includes(x.id) ? " sel" : ""),
        role: "gridcell", "aria-colindex": String(ci + 1), "aria-rowindex": String(ri + 2), "aria-selected": String(active),
        tabindex: active ? "0" : "-1", dataset: { focus: `cell-${ri}-${ci}` } });
      if (active && ssEditing) {
        td.classList.add("editing");
        const inp = col.type === "enum"
          ? h("select", { class: "cell", "aria-label": col.label }, ...col.opts.map((o) => h("option", { value: o, selected: o === raw }, col.fmt ? col.fmt(o) : o)))
          : h("input", { class: "cell", type: col.type === "number" ? "number" : "text", value: shown, "aria-label": col.label });
        const commit = () => {
          const v = inp.value;
          applyCell(x, col, v);
          ssEditing = false; S.emit(); setFocus(`cell-${ri}-${ci}`);
        };
        inp.addEventListener("keydown", (e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); moveActive(1, 0); }
          else if (e.key === "Escape") { e.preventDefault(); ssEditing = false; S.emit(); setFocus(`cell-${ri}-${ci}`); }
          else if (e.key === "Tab") { e.preventDefault(); commit(); moveActive(0, e.shiftKey ? -1 : 1); }
        });
        inp.addEventListener("blur", commit);
        td.appendChild(inp);
        requestAnimationFrame(() => inp.focus());
      } else {
        td.appendChild(h("span", { class: "cell", style: { display: "block", lineHeight: "28px", padding: "0 8px", pointerEvents: "none" } }, shown));
      }
      td.addEventListener("click", () => { ssActive = { r: ri, c: ci }; ssEditing = false; S.emit(); setFocus(`cell-${ri}-${ci}`); });
      td.addEventListener("dblclick", () => { ssActive = { r: ri, c: ci }; ssEditing = true; S.emit(); setFocus(`cell-${ri}-${ci}`); });
      td.addEventListener("keydown", (e) => { if (e.key === "Enter" && !ssEditing) { e.preventDefault(); ssEditing = true; S.emit(); setFocus(`cell-${ri}-${ci}`); } else { cellKeydown(e, ri, ci, rows.length, cols.length); } });
      td.id = `cell-${ri}-${ci}`;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  grid.appendChild(thead); grid.appendChild(tbody);

  const formulaResult = h("span", { class: "result" });
  const formulaInput = h("input", { class: "input", type: "text", placeholder: "e.g. =SUM(E2:E13) or =AVERAGE(E2:E13)", "aria-label": "Formula bar", value: ssFormula,
    oninput: (e) => { ssFormula = e.target.value; const r = evalFormula(ssFormula, rows, cols); formulaResult.textContent = r.text; formulaResult.className = "result" + (r.err ? " err" : ""); } });
  if (ssFormula) { const r0 = evalFormula(ssFormula, rows, cols); formulaResult.textContent = r0.text; formulaResult.className = "result" + (r0.err ? " err" : ""); }
  formulaInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); ssFormula = formulaInput.value; const r = evalFormula(ssFormula, rows, cols); formulaResult.textContent = r.text; formulaResult.className = "result" + (r.err ? " err" : ""); announce(r.err ? "Formula error: " + r.text : "Formula result " + r.text); } });

  const pivotGrid = renderPivot();
  return h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } },
    h("div", { class: "panel" },
      h("div", { class: "ss-toolbar" },
        h("div", { class: "formula" }, h("span", { class: "fx" }, "fx"), formulaInput, formulaResult),
        h("span", { class: "help", "aria-hidden": "false" }, "Arrows move · Enter edits · Esc cancels")),
      h("div", { class: "scroll-x" }, grid)),
    h("div", { class: "panel" },
      h("div", { class: "phead" }, h("h3", {}, "Pivot summary"),
        h("div", { class: "right" }, h("div", { class: "seg", role: "group", "aria-label": "Pivot grouping" },
          ...[["cat-day", "Category × Day"], ["day-cat", "Day × Category"], ["payer-cat", "Payer × Category"]].map(([m, l]) =>
            segBtn(l, "", s.pivotMode === m, () => { S.setPivotMode(m); setFocus("pv-" + m); }, "pv-" + m))))),
      h("div", { class: "scroll-x" }, pivotGrid)));
}
function moveActive(dr, dc) {
  const s = st();
  const cols = 6 + s.customFields.length;
  ssActive = { r: clamp(ssActive.r + dr, 0, Math.max(0, s.expenses.length - 1)), c: clamp(ssActive.c + dc, 0, cols - 1) };
  ssEditing = false; S.emit(); setFocus(`cell-${ssActive.r}-${ssActive.c}`);
}
function cellKeydown(e, ri, ci, rlen, clen) {
  if (ssEditing) return;
  if (e.key === "ArrowDown") { e.preventDefault(); moveActive(1, 0); }
  else if (e.key === "ArrowUp") { e.preventDefault(); moveActive(-1, 0); }
  else if (e.key === "ArrowRight") { e.preventDefault(); moveActive(0, 1); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); moveActive(0, -1); }
  else if (e.key === "Enter" || e.key === "F2") { e.preventDefault(); ssEditing = true; S.emit(); setFocus(`cell-${ri}-${ci}`); }
  else if (e.key === " ") { e.preventDefault(); S.toggleRow(st().expenses[ri].id); setFocus(`cell-${ri}-${ci}`); }
  else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) { ssEditing = true; S.emit(); setFocus(`cell-${ri}-${ci}`); }
}
function applyCell(x, col, v) {
  if (col.cf) { S.setCustomValue("exp:" + x.id, col.cf, col.type === "number" ? (v === "" ? "" : Number(v)) : v); return; }
  const patch = {};
  if (col.type === "number") patch[col.key] = v === "" ? 0 : Number(v);
  else if (col.type === "enum") patch[col.key] = col.opts.includes(v) ? v : x[col.key];
  else patch[col.key] = v;
  S.updateExpense(x.id, patch);
}
function evalFormula(expr, rows, cols) {
  const m = String(expr || "").trim().match(/^=(SUM|AVERAGE)\(([A-Z])(\d+):([A-Z])(\d+)\)$/i);
  if (!expr || !expr.trim()) return { text: "", err: false };
  if (!m) return { text: "Use =SUM(A1:A9) or =AVERAGE(A1:A9)", err: true };
  const fn = m[1].toUpperCase();
  const c1 = m[2].toUpperCase().charCodeAt(0) - 65, c2 = m[4].toUpperCase().charCodeAt(0) - 65;
  if (c1 !== c2) return { text: "Range must be a single column", err: true };
  if (c1 < 0 || c1 >= cols.length) return { text: "Column out of range", err: true };
  const col = cols[c1];
  if (col.type !== "number" && !col.cf) { /* allow amount col */ }
  const r1 = parseInt(m[3], 10) - 1, r2 = parseInt(m[5], 10) - 1;
  if (r1 < 0 || r2 >= rows.length || r1 > r2) return { text: "Row range out of bounds", err: true };
  const vals = [];
  for (let r = r1; r <= r2; r++) {
    let raw = col.cf ? ((st().customValues["exp:" + rows[r].id] || {})[col.cf]) : rows[r][col.key];
    if (col.fmt) raw = rows[r][col.key]; // day fmt shouldn't be summed
    const n = col.type === "number" ? Number(raw) : (col.key === "amount" ? Number(raw) : NaN);
    if (!Number.isFinite(n)) return { text: `Cannot compute ${fn} on non-numeric column ${col.label}`, err: true };
    vals.push(n);
  }
  if (!vals.length) return { text: "Empty range", err: true };
  const sum = vals.reduce((a, b) => a + b, 0);
  const res = fn === "SUM" ? sum : sum / vals.length;
  return { text: (Math.round(res * 100) / 100).toFixed(2), err: false };
}
function renderPivot() {
  const s = st();
  const p = pivot(s.expenses, s.pivotMode);
  const head = h("tr", {}, h("th", {}, ""), ...p.cols.map((c) => h("th", {}, c)), h("th", {}, "Total"));
  const body = p.rows.map((r) => {
    let rowTotal = 0;
    const cells = p.cols.map((c) => { rowTotal += p.cells[r][c]; return h("td", {}, fmtEur(p.cells[r][c])); });
    return h("tr", {}, h("td", { class: "rowlab" }, r), ...cells, h("td", {}, fmtEur(Math.round(rowTotal * 100) / 100)));
  });
  return h("table", { class: "pivot-grid" }, h("thead", {}, head), h("tbody", {}, ...body));
}

// ------------------------------- SETTLE UP --------------------------------
function settleTab() {
  const s = st();
  const full = balances(s.expenses);
  const txs = greedySettle(full);
  const out = outstandingNet(full, txs, s.settled);
  const outTxs = greedySettle(out);
  const net = out;
  const maxAbs = Math.max(1, ...EXP_PAYERS.map((p) => Math.abs(full[p] || 0)));
  const balList = h("div", {}, ...EXP_PAYERS.map((p) => {
    const v = Math.round((net[p] || 0) * 100) / 100;
    const zero = Math.abs(v) < 0.005;
    return h("div", { class: "bal-row" + (zero ? " zero" : "") },
      h("span", { class: "name" }, p),
      h("span", { class: "bar" }, h("i", { style: { width: (Math.abs(v) / maxAbs * 100).toFixed(0) + "%", background: v >= 0 ? "var(--ok)" : "var(--danger)" } })),
      h("span", { class: "amt " + (zero ? "" : v > 0 ? "owed" : "owe") }, (v >= 0 ? "+" : "") + fmtEur(v)));
  }));
  const checklist = txs.length ? h("div", {}, ...txs.map((t) => {
    const done = !!s.settled[t.id];
    return h("label", { class: "settle-item" + (done ? " done" : "") },
      h("input", { type: "checkbox", checked: done, "aria-label": `Mark settled: ${t.from} pays ${t.to} ${fmtEur(t.amount)}`, onchange: () => S.toggleSettle(t.id) }),
      h("span", { class: "txt" }, h("strong", {}, t.from), " pays ", h("strong", {}, t.to)),
      h("span", { class: "amt" }, fmtEur(t.amount)));
  })) : h("div", { class: "empty-state" }, h("span", { html: icon.check, "aria-hidden": "true" }), h("b", {}, "All settled up!"), h("p", {}, "Every computed transaction is marked settled, so all outstanding balances are zero."));
  return h("div", { class: "grid-2" },
    h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } },
      h("div", { class: "panel" }, h("div", { class: "phead" }, h("h3", {}, "Per-traveller balances")), h("div", { class: "pbody" }, balList)),
      h("div", { class: "panel" }, h("div", { class: "phead" }, h("h3", {}, "Who owes whom"), h("span", { class: "count-pill" }, outTxs.length + " minimum transaction" + (outTxs.length === 1 ? "" : "s"))),
        h("div", { class: "chart-wrap", html: debtNetwork(out, outTxs) }))),
    h("div", { class: "panel" }, h("div", { class: "phead" }, h("h3", {}, "Settlement checklist"),
      h("div", { class: "right" }, h("button", { class: "btn sm", type: "button", html: icon.file + "<span>Settlement report</span>", onclick: () => openSettlementReport() }))),
      h("div", { class: "pbody" }, checklist)));
}

// ------------------------------- INGEST -----------------------------------
function ingestTab() {
  return h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" } },
    parserCard(),
    h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } },
      launcher(icon.upload, "CSV import wizard", "Map columns, fix invalid cells, then commit rows to the ledger.", () => openCsvWizard()),
      launcher(icon.wand, "Load a sample trip", "Seed a complete sample trip (stops and expenses) in one action.", async () => {
        const ok = await confirm({ title: "Load a sample trip?", message: "This adds a short sample trip's stops and expenses to your current plan. You can Undo it." , confirmLabel: "Load sample trip" });
        if (ok) { S.templateSeed(); toast("Sample trip loaded", "New stops and expenses now show in the plan, ledger, and charts.", "ok"); } }),
      launcher(icon.receipt, "Receipt scanner", "Drop a receipt image to extract a cost and date into a draft expense.", () => openReceiptScanner())));
}
function launcher(ic, title, desc, onclick) {
  return h("button", { class: "panel", type: "button", style: { textAlign: "left", padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start", transition: "transform 140ms var(--ease), box-shadow 220ms var(--ease)" }, onclick,
    onmouseenter: (e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-lift)"; }, onmouseleave: (e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; } },
    h("span", { class: "mark", style: { width: "38px", height: "38px", borderRadius: "10px", background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", flex: "none" }, html: ic }),
    h("div", {}, h("div", { style: { fontWeight: "800" } }, title), h("div", { style: { fontSize: "12.5px", color: "var(--ink-soft)", marginTop: "2px" } }, desc)));
}
function parserCard() {
  const out = h("div", { class: "parse-out", "aria-live": "polite" });
  const drafts = h("div", {});
  const ta = h("textarea", { class: "input", rows: "5", "aria-label": "Paste confirmation text to parse", placeholder: "Paste a booking confirmation, e.g.:\nHotel Azure, ref HZ-48215, 07/08, EUR 240.00\nTrain Nice-Monaco 07/06 22.00 EUR",
    oninput: (e) => runParse(e.target.value, out, drafts) });
  runParse("", out, drafts);
  return h("div", { class: "panel" }, h("div", { class: "phead" }, h("h3", {}, "Confirmation parser"), h("span", { class: "help", style: { marginLeft: "auto" } }, "Highlights dates and codes")),
    h("div", { class: "pbody pad" }, h("div", { class: "field" }, h("label", {}, "Paste confirmation text"), ta),
      h("div", { style: { marginTop: "10px" } }, h("div", { class: "eyebrow", style: { textTransform: "none", marginBottom: "6px" } }, "Recognised text"), out),
      h("div", { style: { marginTop: "12px" } }, h("div", { class: "eyebrow", style: { textTransform: "none", marginBottom: "6px" } }, "Draft items"), drafts)));
}
function runParse(text, out, drafts) {
  const dateRe = /(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}\b)/gi;
  const codeRe = /\b([A-Z]{2,}-?\d{3,}|REF[- ]?\d{4,}|[A-Z]{2}\d{4,})\b/g;
  let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(dateRe, (m) => `<mark>${m}</mark>`);
  html = html.replace(codeRe, (m) => `<mark class="code">${m}</mark>`);
  out.innerHTML = text ? html : '<span style="color:var(--ink-faint)">Recognised dates and booking codes will be highlighted here as you paste.</span>';
  // draft items: lines with an amount
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items = [];
  for (const l of lines) {
    const amt = l.match(/(?:EUR|USD|GBP|CHF|€|\$|£)?\s*(\d{1,6}(?:[.,]\d{1,2}))\s*(EUR|USD|GBP|CHF|€|\$|£)?/i);
    const d = l.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})/);
    if (amt) {
      const cur = (l.match(/EUR|USD|GBP|CHF/i) || ["EUR"])[0].toUpperCase();
      items.push({ desc: l.replace(amt[0], "").replace(/[,;|]/g, " ").trim().slice(0, 60) || "Parsed item", amount: Number(amt[1].replace(",", ".")), currency: cur, day: normDay(d && d[1]) });
    }
  }
  drafts.innerHTML = "";
  if (!text) { drafts.appendChild(h("div", { class: "help" }, "Paste text containing amounts to see draft items you can accept or discard.")); return; }
  if (!items.length) { drafts.appendChild(h("div", { class: "empty-state", style: { padding: "14px" } }, h("span", { html: icon.info, "aria-hidden": "true" }), h("b", {}, "No items detected"), h("p", {}, "No amounts or bookable lines were recognised in that text."))); return; }
  for (const it of items) {
    drafts.appendChild(h("div", { class: "draft-item" },
      h("div", { class: "t" }, it.desc || "Parsed item", h("small", {}, ` · ${fmtMoney(it.amount, it.currency)} · ${it.day ? dayLabel(it.day) : "no date"}`)),
      h("button", { class: "btn sm", type: "button", text: "Add to ledger", onclick: () => { S.addExpense({ description: it.desc || "Parsed item", amount: it.amount, currency: it.currency, day: it.day || "2025-07-05", category: "Activities", payer: "Ava" }); toast("Added to ledger", (it.desc || "Parsed item") + " was added.", "ok"); } }),
      h("button", { class: "btn sm", type: "button", text: "Add to plan", onclick: () => { S.addStop({ title: (it.desc || "Parsed item").slice(0, 80), day: it.day || "2025-07-05", category: "other" }); toast("Added to plan", (it.desc || "Parsed item") + " was added as a stop.", "ok"); } }),
      h("button", { class: "btn ghost sm", type: "button", text: "Discard", onclick: (e) => e.currentTarget.parentElement.remove() })));
  }
}
function normDay(d) {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return DATES.includes(d) ? d : null;
  const [m, day] = d.split("/").map(Number);
  const cand = `2025-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return DATES.includes(cand) ? cand : null;
}

// ------------------------------- REPORTS ----------------------------------
function reportsTab() {
  return h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" } },
    budgetSummaryPanel(), settlementReportPanel());
}
function budgetSummaryText() {
  const s = st();
  const totals = categoryTotalsEur(s.expenses);
  const proj = projectedEndEur(s.expenses);
  const total = grandTotalEur(s.expenses);
  const over = proj > BUDGET_CEILING;
  let t = `Budget summary — Trip to the French Riviera\nDisplay currency: ${s.displayCurrency} (totals below in EUR)\n\n`;
  t += "Category totals (EUR)\n";
  for (const c of EXP_CATS) t += `  ${c.padEnd(11)} ${fmtEur(totals[c])}${s.caps[c] != null ? `  (cap ${fmtEur(s.caps[c])}${totals[c] > s.caps[c] ? " — OVER" : ""})` : ""}\n`;
  t += `\nSpent to date      ${fmtEur(total)}\nProjected end      ${fmtEur(proj)}  (incl. ${fmtEur(reservedTotal())} reserved lodging + flight)\nCeiling            ${fmtEur(BUDGET_CEILING)}\n`;
  t += over ? `Projected overage  ${fmtEur(Math.round((proj - BUDGET_CEILING) * 100) / 100)}\n` : `Remaining headroom ${fmtEur(Math.round((BUDGET_CEILING - proj) * 100) / 100)}\n`;
  return t;
}
function settlementReportText() {
  const s = st();
  const full = balances(s.expenses);
  const txs = greedySettle(full);
  const out = outstandingNet(full, txs, s.settled);
  let t = "Settlement report — Trip to the French Riviera\n\nBalances (EUR, + is owed, - owes)\n";
  for (const p of EXP_PAYERS) t += `  ${p.padEnd(7)} ${fmtEur(Math.round((out[p] || 0) * 100) / 100)}\n`;
  t += `\nMinimum settle-up transactions: ${txs.length}\n`;
  if (!txs.length) t += "  (none — everyone is settled)\n";
  for (const x of txs) t += `  ${x.from} -> ${x.to}  ${fmtEur(x.amount)}  ${s.settled[x.id] ? "[settled]" : "[outstanding]"}\n`;
  const settledCount = txs.filter((x) => s.settled[x.id]).length;
  t += `\nSettled: ${settledCount} of ${txs.length}\n`;
  return t;
}
function budgetSummaryPanel() {
  const txt = budgetSummaryText();
  return h("div", { class: "panel" }, h("div", { class: "phead" }, h("h3", {}, "Budget summary"),
    h("div", { class: "right" }, h("button", { class: "btn sm", type: "button", html: icon.copy + "<span>Copy budget summary</span>", onclick: () => { copyText(txt); toast("Copied", "Budget summary copied to the clipboard.", "ok"); } }))),
    h("div", { class: "pbody pad" }, h("div", { class: "report" }, txt)));
}
function settlementReportPanel() {
  const txt = settlementReportText();
  return h("div", { class: "panel" }, h("div", { class: "phead" }, h("h3", {}, "Settlement report"),
    h("div", { class: "right" }, h("button", { class: "btn sm", type: "button", html: icon.copy + "<span>Copy settlement report</span>", onclick: () => { copyText(txt); toast("Copied", "Settlement report copied to the clipboard.", "ok"); } }))),
    h("div", { class: "pbody pad" }, h("div", { class: "report" }, txt)));
}

// --------------------------- NOTES / EXTRAS -------------------------------
function notesView() {
  const s = st();
  const seg = h("div", { class: "seg", role: "tablist", "aria-label": "Notes workspace" },
    ...[["notes", "Notes"], ["packing", "Packing"], ["fields", "Custom fields"]].map(([k, l]) =>
      h("button", { role: "tab", type: "button", "aria-selected": String(extrasTab === k), tabindex: extrasTab === k ? "0" : "-1", "data-tab": k, dataset: { tab: k, focus: "xtab-" + k }, html: (k === "notes" ? icon.file : k === "packing" ? icon.package : icon.tag) + `<span>${l}</span>`,
        onclick: () => { extrasTab = k; S.emit(); setFocus("xtab-" + k); }, onkeydown: (e) => tabKeydown(e, (t) => { extrasTab = t; S.emit(); setFocus("xtab-" + t); }) })));
  let body;
  if (extrasTab === "notes") body = notesEditor();
  else if (extrasTab === "packing") body = packingView();
  else body = customFieldsView();
  return h("div", { class: "workspace" }, h("div", { class: "section-head", style: { marginTop: 0 } }, h("h1", { class: "display" }, "Notes & extras"), h("div", { style: { marginLeft: "auto" } }, seg)), body);
}
function notesEditor() {
  const s = st();
  const preview = h("div", { class: "md-preview" });
  const render = () => { preview.innerHTML = mdToHtml(ta.value); bindMd(preview, ta); };
  const ta = h("textarea", { class: "input", rows: "14", style: { fontFamily: "var(--mono)", fontSize: "12.5px", lineHeight: "1.6" }, "aria-label": "Markdown note editor", value: s.notesDoc,
    oninput: (e) => { s.notesDoc = e.target.value; render(); } });
  render();
  return h("div", { class: "md-split" },
    h("div", { class: "field" }, h("label", {}, "Markdown"), ta, h("span", { class: "help" }, "Supports # headings, - bullets, - [ ] checklists, and https links (preview cards never navigate away).")),
    h("div", { class: "field" }, h("label", {}, "Preview"), preview));
}
function bindMd(preview, ta) {
  preview.querySelectorAll("input[data-mdchk]").forEach((cb, i) => {
    cb.addEventListener("change", () => {
      // map this checkbox back to its line index in the current source
      const lines = ta.value.split("\n");
      let chkIdx = -1, count = 0;
      for (let li = 0; li < lines.length; li++) if (/\[[ xX]\]/.test(lines[li])) { if (count === i) { chkIdx = li; break; } count++; }
      if (chkIdx >= 0) {
        lines[chkIdx] = lines[chkIdx].replace(/\[([ xX])\]/, () => `[${cb.checked ? "x" : " "}]`);
        ta.value = lines.join("\n"); s_notes_set(ta.value);
        preview.innerHTML = mdToHtml(ta.value); bindMd(preview, ta);
      }
    });
  });
  preview.querySelectorAll("[data-url]").forEach((a) => {
    a.addEventListener("click", (e) => { e.preventDefault(); toast("Link preview", "“" + a.dataset.url + "” stays in the planner; no outbound navigation.", "info"); });
  });
}
function s_notes_set(v) { S.state.notesDoc = v; }
function packingView() {
  const s = st();
  return h("div", {}, ...Object.entries(s.packing).map(([cat, items]) => {
    const done = items.filter((i) => i.done).length;
    const full = done === items.length;
    const celebrate = lastCompletedCat === cat;
    if (celebrate) lastCompletedCat = null;
    return h("div", { class: "pack-cat" + (celebrate ? " celebrate" : "") },
      h("div", { class: "ph" }, h("span", {}, cat), h("span", { class: "prog" }, `${done}/${items.length} packed`)),
      h("div", { class: "pack-bar" + (full ? " full" : "") }, h("i", { style: { width: (done / items.length * 100).toFixed(0) + "%" } })),
      h("div", {}, ...items.map((it) => h("label", { class: "pack-item" + (it.done ? " done" : "") },
        h("input", { type: "checkbox", checked: it.done, "aria-label": it.done ? "Uncheck " + it.label : "Pack " + it.label, dataset: { focus: "pack-" + it.id }, onchange: (e) => { const completed = S.setPacking(cat, it.id, e.target.checked); if (completed) { lastCompletedCat = cat; toast("Category packed!", cat + " is fully packed — nice work.", "ok"); } setFocus("pack-" + it.id); } }),
        h("span", {}, it.label)))));
  }));
}
function customFieldsView() {
  const s = st();
  const name = h("input", { class: "input", type: "text", placeholder: "e.g. Booking reference", "aria-label": "Custom field name" });
  const type = h("select", { class: "select", "aria-label": "Custom field type" }, ...["text", "number", "rating"].map((t) => h("option", { value: t }, t)));
  const add = () => { const n = name.value.trim(); if (!n) { toast("Name required", "Give the custom field a name first.", "warn"); return; } S.addCustomField(n, type.value); name.value = ""; toast("Custom field added", n + " now appears on every stop and expense card and as a spreadsheet column.", "ok"); };
  return h("div", { class: "grid-2" },
    h("div", { class: "form-card" }, h("h3", {}, "Create a custom field"),
      h("div", { class: "form-grid" }, h("div", { class: "field" }, h("label", {}, "Name"), name), h("div", { class: "field" }, h("label", {}, "Type"), type)),
      h("button", { class: "btn primary", type: "button", style: { marginTop: "12px" }, html: icon.plus + "<span>Add custom field</span>", onclick: add }),
      h("p", { class: "help", style: { marginTop: "10px" } }, "Custom fields are editable on every stop and expense card and show as a column in the spreadsheet matrix.")),
    h("div", { class: "panel" }, h("div", { class: "phead" }, h("h3", {}, "Defined fields"), h("span", { class: "count-pill" }, String(s.customFields.length))),
      h("div", { class: "pbody pad" }, s.customFields.length ? h("div", { class: "cf-list" }, ...s.customFields.map((cf) =>
        h("div", { class: "cf-row" }, h("strong", {}, cf.name), h("span", { class: "ty" }, cf.type),
          h("button", { class: "btn icon sm danger", type: "button", style: { marginLeft: "auto" }, "aria-label": "Remove " + cf.name, html: icon.trash, onclick: () => S.deleteCustomField(cf.id) }))))
        : h("div", { class: "empty-state" }, h("span", { html: icon.tag, "aria-hidden": "true" }), h("b", {}, "No custom fields yet"), h("p", {}, "Define one and it appears everywhere stops and expenses are edited.")))));
}

// ----------------------------- BULK TRAY ----------------------------------
export function bulkTray() {
  const s = st();
  const n = s.selectedRows.length;
  const show = n >= 2;
  const cat = h("select", { class: "select", style: { width: "auto", padding: "6px 26px 6px 8px", background: "rgba(255,255,255,0.12)", color: "#fff", border: "0" }, "aria-label": "Recategorize selection" }, ...EXP_CATS.map((c) => h("option", { value: c, style: { color: "#000" } }, c)));
  const day = h("select", { class: "select", style: { width: "auto", padding: "6px 26px 6px 8px", background: "rgba(255,255,255,0.12)", color: "#fff", border: "0" }, "aria-label": "Reassign day for selection" }, ...DATES.map((d) => h("option", { value: d, style: { color: "#000" } }, dayLabel(d))));
  return h("div", { class: "tray" + (show ? " show" : ""), role: "region", "aria-label": "Bulk actions for selected rows" },
    h("span", { class: "n" }, n + " selected"),
    h("span", { style: { display: "flex", alignItems: "center", gap: "6px" } }, cat, h("button", { class: "btn sm", type: "button", text: "Recategorize", onclick: () => { S.bulkRecategorize([...s.selectedRows], cat.value); toast("Recategorized", n + " expenses updated.", "ok"); } })),
    h("span", { style: { display: "flex", alignItems: "center", gap: "6px" } }, day, h("button", { class: "btn sm", type: "button", text: "Reassign day", onclick: () => { S.bulkReassignDay([...s.selectedRows], day.value); toast("Day reassigned", n + " expenses moved.", "ok"); } })),
    h("button", { class: "btn sm danger", type: "button", html: icon.trash + "<span>Delete</span>", onclick: async () => { const ids = [...s.selectedRows]; const ok = await confirm({ title: `Delete ${ids.length} expenses?`, message: "This removes the selected expenses from the ledger and every derived surface. One Undo restores them.", confirmLabel: "Delete", danger: true }); if (ok) { S.bulkDelete(ids); toast("Deleted", ids.length + " expenses removed.", "warn", { action: { label: "Undo", onClick: () => S.undo() } }); } } }),
    h("button", { class: "btn sm", type: "button", text: "Clear", onclick: () => S.clearRows() }));
}

// ------------------------------- MODALS -----------------------------------
function fieldShell(id, label, control, error, required, help) {
  const errId = id + "-err";
  const f = h("div", { class: "field" + (error ? " invalid" : "") },
    h("label", { for: id }, label, required ? h("span", { class: "req" }, " *") : null),
    control, help ? h("span", { class: "help" }, help) : null);
  control.setAttribute("id", id);
  control.setAttribute("aria-describedby", errId);
  if (error) control.setAttribute("aria-invalid", "true");
  const errEl = h("div", { class: "err-msg", id: errId, role: "alert", style: error ? "" : "display:none", html: error ? icon.alert + `<span>${error}</span>` : "" });
  f.appendChild(errEl);
  f._setError = (msg) => {
    if (msg) { f.classList.add("invalid"); control.setAttribute("aria-invalid", "true"); errEl.style.display = ""; errEl.innerHTML = icon.alert + `<span>${msg}</span>`; }
    else { f.classList.remove("invalid"); control.removeAttribute("aria-invalid"); errEl.style.display = "none"; errEl.innerHTML = ""; }
  };
  return f;
}
function mkInput(type = "text", value = "", extra = {}) { return h("input", { class: "input", type, value, ...extra }); }
function mkSelect(value, opts, fmt = (o) => o) { return h("select", { class: "select" }, ...opts.map((o) => h("option", { value: o, selected: o === value }, fmt(o)))); }

export function openStopForm(stop) {
  const s = st();
  const editing = !!stop;
  const v = stop ? { ...stop } : { title: "", day: s.dayFilter || DATES[0], category: "sightseeing", location: "", startTime: "", endTime: "", notes: "" };
  const title = mkInput("text", v.title, { maxlength: "80" });
  const day = mkSelect(v.day, DATES, dayLabel);
  const category = mkSelect(v.category, STOP_CATS, cap);
  const location = mkInput("text", v.location || "", { maxlength: "120" });
  const startTime = mkInput("text", v.startTime || "", { placeholder: "10:00" });
  const endTime = mkInput("text", v.endTime || "", { placeholder: "12:00" });
  const notes = h("textarea", { class: "input", rows: "3", maxlength: "400" }); notes.value = v.notes || "";
  const fields = {};
  const fTitle = fieldShell("sf-title", "Title", title, null, true, "Required, 1–80 characters.");
  const fDay = fieldShell("sf-day", "Day", day, null, true);
  const fCat = fieldShell("sf-category", "Category", category, null, true);
  const fLoc = fieldShell("sf-location", "Location", location);
  const fStart = fieldShell("sf-start", "Start time", startTime, null, false, "HH:MM, 24-hour clock.");
  const fEnd = fieldShell("sf-end", "End time", endTime, null, false, "Must be after start time.");
  const fNotes = fieldShell("sf-notes", "Notes", notes, null, false, "Optional, up to 400 characters.");
  const collect = () => ({ title: title.value, day: day.value, category: category.value, location: location.value, startTime: startTime.value, endTime: endTime.value, notes: notes.value });
  const validate = (showAll) => {
    const r = validateStop(collect());
    fTitle._setError(r.errors.title); fDay._setError(r.errors.day); fCat._setError(r.errors.category);
    fLoc._setError(r.errors.location); fStart._setError(r.errors.startTime); fEnd._setError(r.errors.endTime); fNotes._setError(r.errors.notes);
    submit.disabled = !r.ok;
    return r.ok;
  };
  [title, day, category, location, startTime, endTime, notes].forEach((el) => el.addEventListener("input", () => validate(false)));
  const cfWrap = h("div", {});
  const renderCf = () => { cfWrap.innerHTML = ""; if (s.customFields.length) cfWrap.appendChild(h("div", { class: "form-grid", style: { marginTop: "4px" } }, ...s.customFields.map((cf) => {
    const key = editing ? "stop:" + stop.id : null;
    const cur = key ? ((s.customValues[key] || {})[cf.id] ?? "") : "";
    const inp = cf.type === "rating" ? ratingInput(cur, (val) => { cf._val = val; }) : mkInput(cf.type === "number" ? "number" : "text", cur);
    cf._val = cur; if (cf.type !== "rating") inp.addEventListener("input", () => { cf._val = inp.value; });
    return h("div", { class: "field" }, h("label", {}, cf.name + " (custom)"), inp);
  }))); };
  renderCf();
  const submit = h("button", { class: "btn primary", type: "button", text: editing ? "Save stop" : "Add stop", disabled: "true" });
  const cancel = h("button", { class: "btn", type: "button", text: "Cancel" });
  submit.addEventListener("click", () => {
    if (submit.disabled || submit.dataset.busy) return;
    if (!validate(true)) return;
    submit.dataset.busy = "1"; submit.disabled = true;
    const data = collect();
    if (editing) { S.updateStop(stop.id, data); for (const cf of s.customFields) if (cf._val !== "" && cf._val != null) S.setCustomValue("stop:" + stop.id, cf.id, cf.type === "number" ? Number(cf._val) : cf._val); toast("Stop updated", data.title + " was updated across the plan, map, and exports.", "ok"); }
    else { const ns = S.addStop(data); for (const cf of s.customFields) if (cf._val !== "" && cf._val != null) S.setCustomValue("stop:" + ns.id, cf.id, cf.type === "number" ? Number(cf._val) : cf._val); lastAddedStop = ns.id; setFocus("row-" + ns.id); toast("Stop added", data.title + " was added to " + dayLabel(data.day) + ".", "ok"); }
    handle.close();
  });
  cancel.addEventListener("click", () => handle.close());
  const body = h("div", {}, h("div", { class: "form-grid" }, fTitle, fDay, fCat, fLoc, fStart, fEnd), fNotes, cfWrap);
  const handle = modal({ title: editing ? "Edit stop" : "Add stop", body, foot: [cancel, submit], wide: true });
  validate(false);
  setTimeout(() => title.focus(), 30);
}

export function openExpenseForm(exp) {
  const s = st();
  const editing = !!exp;
  const v = exp ? { ...exp, weights: { ...(exp.weights || {}) } } : { description: "", amount: "", currency: "EUR", day: s.dayFilter || DATES[0], category: "Food", payer: "Ava", splitMode: "per-capita", weights: { Ava: 1, Ben: 1, Chloe: 1, Dan: 1 } };
  const description = mkInput("text", v.description, { maxlength: "120" });
  const amount = mkInput("number", v.amount === 0 ? "" : v.amount, { min: "0", step: "0.01" });
  const currency = mkSelect(v.currency, EXP_CUR);
  const day = mkSelect(v.day, DATES, dayLabel);
  const category = mkSelect(v.category, EXP_CATS);
  const payer = mkSelect(v.payer, EXP_PAYERS);
  const splitMode = mkSelect(v.splitMode, SPLIT_MODES);
  const fDesc = fieldShell("ef-desc", "Description", description, null, true, "Required, 1–120 characters.");
  const fAmt = fieldShell("ef-amt", "Amount", amount, null, true, "Greater than 0, up to two decimals.");
  const fCur = fieldShell("ef-cur", "Currency", currency, null, true);
  const fDay = fieldShell("ef-day", "Day", day, null, true);
  const fCat = fieldShell("ef-cat", "Category", category, null, true);
  const fPay = fieldShell("ef-pay", "Payer", payer, null, true);
  const fSplit = fieldShell("ef-split", "Split mode", splitMode, null, true);
  const weightsWrap = h("div", {});
  const wInputs = {};
  const renderWeights = () => {
    weightsWrap.innerHTML = "";
    if (splitMode.value !== "weighted") return;
    const grid = h("div", { class: "form-grid" });
    for (const p of EXP_PAYERS) {
      const wi = mkInput("number", v.weights[p] ?? 1, { min: "0", step: "0.1", "aria-label": "Weight for " + p });
      wInputs[p] = wi;
      grid.appendChild(h("div", { class: "field" }, h("label", {}, p), wi));
    }
    weightsWrap.appendChild(h("div", { class: "field", id: "ef-weights-shell" }, h("label", {}, "Weights"), grid, h("div", { class: "err-msg", id: "ef-weights-err", role: "alert", style: "display:none" })));
  };
  const collect = () => ({ description: description.value, amount: amount.value, currency: currency.value, day: day.value, category: category.value, payer: payer.value, splitMode: splitMode.value, weights: splitMode.value === "weighted" ? Object.fromEntries(EXP_PAYERS.map((p) => [p, wInputs[p] ? wInputs[p].value : 1])) : undefined });
  const validate = () => {
    const r = validateExpense(collect());
    fDesc._setError(r.errors.description); fAmt._setError(r.errors.amount); fCur._setError(r.errors.currency);
    fDay._setError(r.errors.day); fCat._setError(r.errors.category); fPay._setError(r.errors.payer); fSplit._setError(r.errors.splitMode);
    const wShell = $("#ef-weights-shell"); const wErr = $("#ef-weights-err");
    if (wShell && r.errors.weights) { wShell.classList.add("invalid"); wErr.style.display = ""; wErr.innerHTML = icon.alert + `<span>${r.errors.weights}</span>`; }
    else if (wShell) { wShell.classList.remove("invalid"); wErr.style.display = "none"; wErr.innerHTML = ""; }
    submit.disabled = !r.ok; return r.ok;
  };
  [description, amount, currency, day, category, payer, splitMode].forEach((el) => el.addEventListener("input", validate));
  splitMode.addEventListener("change", () => { renderWeights(); validate(); });
  renderWeights();
  const submit = h("button", { class: "btn primary", type: "button", text: editing ? "Save expense" : "Add expense", disabled: "true" });
  const cancel = h("button", { class: "btn", type: "button", text: "Cancel" });
  submit.addEventListener("click", () => {
    if (submit.disabled || submit.dataset.busy) return;
    if (!validate()) return;
    submit.dataset.busy = "1"; submit.disabled = true;
    const data = collect();
    if (editing) { S.updateExpense(exp.id, data); toast("Expense updated", data.description + " updated; ledger, charts, and balances recomputed.", "ok"); }
    else { S.addExpense(data); setFocus("wstab-ledger"); toast("Expense added", data.description + " added to the ledger.", "ok"); }
    handle.close();
  });
  cancel.addEventListener("click", () => handle.close());
  const body = h("div", {}, h("div", { class: "form-grid" }, fDesc, fAmt, fCur, fDay, fCat, fPay, fSplit), weightsWrap);
  const handle = modal({ title: editing ? "Edit expense" : "Add expense", body, foot: [cancel, submit], wide: true });
  validate();
  setTimeout(() => description.focus(), 30);
}

export function openExport() {
  const s = st();
  const fmts = [["markdown", "Markdown"], ["ics", "ICS"], ["json", "Trip JSON"]];
  const pre = h("pre", { class: "export-pre", tabindex: "0", "aria-label": "Export preview" });
  const bar = h("div", { class: "export-bar" });
  const content = () => exportFmt === "ics" ? buildICS(s.stops) : exportFmt === "json" ? JSON.stringify(buildTripJson(s), null, 2) : buildMarkdown(s);
  const refresh = (pulse) => { pre.textContent = content(); if (pulse) { pre.classList.remove("pulse"); void pre.offsetWidth; pre.classList.add("pulse"); } };
  const buildBar = () => {
    bar.innerHTML = "";
    const label = exportFmt === "json" ? "trip JSON" : exportFmt;
    bar.appendChild(h("button", { class: "btn", type: "button", html: icon.copy + `<span>Copy ${label}</span>`, onclick: () => { copyText(content()); toast("Copied", `Copied ${label} to the clipboard.`, "ok"); } }));
    bar.appendChild(h("button", { class: "btn", type: "button", html: icon.download + `<span>Download ${label}</span>`, onclick: () => { const ext = exportFmt === "json" ? "json" : exportFmt; download(`riviera-trip.${ext}`, content(), exportFmt === "json" ? "application/json" : "text/plain"); toast("Downloaded", `riviera-trip.${ext} is downloading.`, "ok"); } }));
    bar.appendChild(h("span", { class: "help", style: { marginLeft: "auto" } }, "Compiled live from your current plan."));
  };
  const tabs = h("div", { class: "export-tabs", role: "tablist", "aria-label": "Export format" }, ...fmts.map(([k, l]) =>
    h("button", { class: "ws-tab", role: "tab", type: "button", "aria-selected": String(exportFmt === k), tabindex: exportFmt === k ? "0" : "-1", "data-tab": k, dataset: { tab: k }, text: l,
      onclick: () => { exportFmt = k; tabs.querySelectorAll('[role="tab"]').forEach((t) => { const on = t.dataset.tab === k; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; }); refresh(true); buildBar(); },
      onkeydown: (e) => tabKeydown(e, (t) => { exportFmt = t; refresh(true); buildBar(); }) })));
  refresh(false); buildBar();
  const handle = modal({ title: "Export trip files", body: h("div", {}, tabs, pre, bar), foot: [h("button", { class: "btn", type: "button", text: "Close", onclick: () => handle.close() })], wide: true });
}

export function openImport() {
  const errBox = h("div", { id: "trip-json-error", class: "err-msg", role: "alert", style: "display:none" });
  const ta = h("textarea", { id: "trip-json-input", class: "input", rows: "10", style: { fontFamily: "var(--mono)", fontSize: "12px" }, "aria-describedby": "trip-json-help trip-json-error", placeholder: "Paste a trip JSON document, or choose a file below." });
  const file = h("input", { id: "trip-json-file", type: "file", accept: "application/json,.json", style: { fontSize: "12.5px" } });
  file.addEventListener("change", () => { const f = file.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { ta.value = String(rd.result || ""); }; rd.readAsText(f); });
  const doImport = () => {
    let obj;
    try { obj = JSON.parse(ta.value); } catch (e) { showErr("The JSON could not be parsed: " + e.message + ". Your plan is unchanged."); return; }
    const r = S.importTrip(obj);
    if (!r.ok) { showErr(r.error + " Your plan is unchanged."); return; }
    toast("Trip imported", `Imported ${obj.stops.length} stops and ${obj.expenses.length} expenses; every surface now matches the document.`, "ok");
    handle.close();
  };
  const showErr = (m) => { ta.setAttribute("aria-invalid", "true"); errBox.style.display = ""; errBox.innerHTML = icon.alert + `<span>${m}</span>`; toast("Import failed", m, "err"); };
  const handle = modal({ title: "Import trip JSON", body: h("div", { class: "field" }, h("label", { for: "trip-json-input" }, "Trip JSON"), ta, h("span", { id: "trip-json-help", class: "help" }, "Must conform to the trip JSON contract (schemaVersion \"1\", trip dates 2025-07-05 to 2025-07-11, ceiling 4500). Malformed or invalid documents leave your plan unchanged."), h("label", { for: "trip-json-file" }, "Choose a trip JSON file"), file, errBox),
    foot: [h("button", { class: "btn", type: "button", text: "Cancel", onclick: () => handle.close() }), h("button", { class: "btn primary", type: "button", html: icon.upload + "<span>Import trip JSON</span>", onclick: doImport })], wide: true });
  setTimeout(() => ta.focus(), 30);
}

export function openGallery(stop) {
  const s = st();
  const items = S.getGallery(stop.id);
  const grid = h("div", { class: "gallery-grid" });
  const render = () => {
    grid.innerHTML = "";
    S.getGallery(stop.id).forEach((it, i) => {
      const capInput = h("input", { type: "text", value: it.caption, "aria-label": "Caption for image " + (i + 1), onchange: (e) => S.setGalleryCaption(stop.id, it.id, e.target.value) });
      grid.appendChild(h("div", { class: "gallery-item" },
        h("div", { class: "im", html: sceneSVG(it.kind) }),
        h("div", { class: "cap" }, capInput),
        h("div", { class: "reorder" },
          h("button", { type: "button", "aria-label": "Move image left", html: icon.chevronLeft, disabled: i === 0, onclick: () => { S.reorderGallery(stop.id, it.id, -1); render(); } }),
          h("button", { type: "button", "aria-label": "Move image right", html: icon.chevronRight, disabled: i === S.getGallery(stop.id).length - 1, onclick: () => { S.reorderGallery(stop.id, it.id, 1); render(); } }))));
    });
  };
  render();
  drawer({ title: "Gallery — " + stop.title, body: h("div", {}, h("p", { class: "help", style: { marginBottom: "12px" } }, "Reorder images and edit captions; both persist for this session."), grid) });
}

export function openSettlementReport() {
  const txt = settlementReportText();
  drawer({ title: "Settlement report", body: h("div", {}, h("button", { class: "btn", type: "button", style: { marginBottom: "12px" }, html: icon.copy + "<span>Copy settlement report</span>", onclick: () => { copyText(txt); toast("Copied", "Settlement report copied.", "ok"); } }), h("div", { class: "report" }, txt)) });
}

export function openCsvWizard() {
  const s = st();
  const FIELDS = ["skip", "description", "amount", "currency", "day", "category", "payer"];
  let step = 1;
  let rows = []; // {cells:[...], map:{}, errors:{idx:msg}, exclude:bool, fixed:{}}
  let mapping = {}; // colIndex -> field
  const body = h("div", {});
  const foot = h("div", { style: { display: "flex", gap: "8px", justifyContent: "flex-end" } });
  const render = () => {
    body.innerHTML = ""; foot.innerHTML = "";
    const stepsBar = h("div", { class: "steps" },
      stepEl(1, "Paste CSV", step), h("span", { class: "bar" }), stepEl(2, "Map columns", step), h("span", { class: "bar" }), stepEl(3, "Diagnostics", step));
    body.appendChild(stepsBar);
    if (step === 1) {
      const ta = h("textarea", { class: "input", rows: "7", "aria-label": "Paste CSV rows", placeholder: "description,amount,currency,day,category,payer\nFerry to Iles de Lerins,16,EUR,2025-07-07,Transit,Chloe\nMuseum audio guide,abc,EUR,2025-07-08,Activities,Dan" });
      body.appendChild(h("div", { class: "field" }, h("label", {}, "Paste CSV (header row + data rows)"), ta, h("span", { class: "help" }, "Or choose a .csv file."),
        h("input", { type: "file", accept: ".csv,text/csv", "aria-label": "Choose a CSV file", style: { marginTop: "8px", fontSize: "12.5px" }, onchange: (e) => { const f = e.target.files[0]; if (f) { const rd = new FileReader(); rd.onload = () => { ta.value = String(rd.result || ""); }; rd.readAsText(f); } } })));
      foot.appendChild(h("button", { class: "btn", type: "button", text: "Cancel", onclick: () => handle.close() }));
      foot.appendChild(h("button", { class: "btn primary", type: "button", text: "Map columns", onclick: () => { parseCsv(ta.value); if (rows.length) { step = 2; render(); } else toast("No rows", "Paste at least a header and one data row.", "warn"); } }));
    } else if (step === 2) {
      const ncols = rows[0] ? rows[0].cells.length : 0;
      const grid = h("div", { style: { display: "flex", flexDirection: "column", gap: "8px" } });
      const header = rows._header || (rows[0] ? rows[0].cells : []);
      for (let c = 0; c < ncols; c++) {
        const sel = mkSelect(mapping[c] || guessField(header[c]), FIELDS);
        mapping[c] = sel.value;
        sel.addEventListener("change", () => { mapping[c] = sel.value; });
        grid.appendChild(h("div", { class: "cap-row" }, h("span", { style: { width: "120px", fontFamily: "var(--mono)", fontSize: "12px" } }, header[c] || `col ${c + 1}`), h("span", { class: "help" }, "→"), sel));
      }
      body.appendChild(h("div", { class: "field" }, h("label", {}, "Map each column to a field"), grid));
      foot.appendChild(h("button", { class: "btn", type: "button", text: "Back", onclick: () => { step = 1; render(); } }));
      foot.appendChild(h("button", { class: "btn primary", type: "button", text: "Review rows", onclick: () => { step = 3; buildDiagnostics(); render(); } }));
    } else {
      const diag = h("div", {});
      buildDiagnosticsInto(diag);
      body.appendChild(diag);
      const validCount = rows.filter((r) => !r.exclude && Object.keys(r.errors).length === 0).length;
      foot.appendChild(h("button", { class: "btn", type: "button", text: "Back", onclick: () => { step = 2; render(); } }));
      const commit = h("button", { class: "btn primary", type: "button", html: icon.check + `<span>Commit ${validCount} row(s)</span>`, disabled: validCount === 0 });
      commit.addEventListener("click", () => {
        commit.disabled = true; commit.innerHTML = '<span>Committing…</span>';
        setTimeout(() => {
          let added = 0;
          for (const r of rows) { if (r.exclude || Object.keys(r.errors).length) continue; S.addExpense(buildExpFromRow(r)); added++; }
          toast("CSV committed", added + " valid row(s) added to the ledger; invalid rows were skipped.", "ok");
          handle.close();
        }, 420);
      });
      foot.appendChild(commit);
    }
  };
  function stepEl(n, label, cur) { return h("div", { class: "st" + (n === cur ? "" : n < cur ? " done" : ""), "aria-current": n === cur ? "step" : "false" }, h("span", { class: "n" }, String(n)), label); }
  function parseCsv(text) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) { rows = []; return; }
    const parseLine = (l) => { const out = []; let cur = "", q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (ch === '"') q = !q; else if (ch === "," && !q) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map((c) => c.trim()); };
    const header = parseLine(lines[0]);
    rows = lines.slice(1).map((l) => ({ cells: parseLine(l), errors: {}, exclude: false, fixed: {} }));
    mapping = {};
    header.forEach((hc, i) => { mapping[i] = guessField(hc); });
    // re-point rows[0].cells used as header labels in step 2: store header separately
    rows._header = header;
  }
  function guessField(name) {
    const n = String(name || "").toLowerCase();
    if (/amount|price|cost|total/.test(n)) return "amount";
    if (/curr/.test(n)) return "currency";
    if (/day|date/.test(n)) return "day";
    if (/cat/.test(n)) return "category";
    if (/pay|who/.test(n)) return "payer";
    if (/desc|name|item|title/.test(n)) return "description";
    return "skip";
  }
  function buildDiagnostics() { /* compute errors */ for (const r of rows) computeRowErrors(r); }
  function computeRowErrors(r) {
    r.errors = {};
    const get = (f) => { const ci = Object.keys(mapping).find((k) => mapping[k] === f); return ci == null ? "" : (r.fixed[ci] != null ? r.fixed[ci] : r.cells[ci]); };
    const desc = (get("description") || "").trim();
    const amt = Number(get("amount"));
    const cur = get("currency"); const day = get("day"); const cat = get("category"); const pay = get("payer");
    if (!desc) r.errors[Object.keys(mapping).find((k) => mapping[k] === "description")] = "Description required";
    if (!Number.isFinite(amt) || amt <= 0) r.errors[Object.keys(mapping).find((k) => mapping[k] === "amount")] = "Invalid amount";
    if (cur && !EXP_CUR.includes(cur)) r.errors[Object.keys(mapping).find((k) => mapping[k] === "currency")] = "Bad currency";
    if (day && !DATES.includes(day) && !normDay(day)) r.errors[Object.keys(mapping).find((k) => mapping[k] === "day")] = "Bad date";
    if (cat && !EXP_CATS.includes(cat)) r.errors[Object.keys(mapping).find((k) => mapping[k] === "category")] = "Bad category";
    if (pay && !EXP_PAYERS.includes(pay)) r.errors[Object.keys(mapping).find((k) => mapping[k] === "payer")] = "Bad payer";
  }
  function buildDiagnosticsInto(container) {
    const header = rows._header || [];
    const validCount = rows.filter((r) => !r.exclude && Object.keys(r.errors).length === 0).length;
    container.appendChild(h("div", { class: "help", style: { marginBottom: "8px" } }, `${validCount} valid row(s). Fix or exclude invalid rows before committing.`));
    rows.forEach((r, ri) => {
      const bad = Object.keys(r.errors).length > 0;
      const rowEl = h("div", { class: "diag-row" + (bad ? " bad" : ""), style: { gridTemplateColumns: "24px 1fr auto" } });
      const excl = h("input", { type: "checkbox", checked: r.exclude, "aria-label": "Exclude row " + (ri + 1), onchange: (e) => { r.exclude = e.target.checked; render(); } });
      const detail = h("div", {}, h("div", { style: { fontFamily: "var(--mono)", fontSize: "12px" } }, r.cells.join(" · ")));
      if (bad && !r.exclude) {
        const fixes = h("div", { class: "fix", style: { flexWrap: "wrap", marginTop: "4px" } });
        for (const ci of Object.keys(r.errors)) {
          const errId = `csv-err-${ri}-${ci}`;
          const inp = h("input", { class: "input", value: r.fixed[ci] != null ? r.fixed[ci] : (r.cells[ci] || ""), "aria-label": `Fix column ${header[ci] || ci} row ${ri + 1}`, "aria-invalid": "true", "aria-describedby": errId, onchange: (e) => { r.fixed[ci] = e.target.value; computeRowErrors(r); render(); } });
          fixes.appendChild(h("span", { style: { display: "flex", alignItems: "center", gap: "5px" } },
            h("span", { class: "help" }, header[ci] + ":"), inp, h("span", { class: "err-msg", id: errId, role: "alert", html: icon.alert + `<span>${r.errors[ci]}</span>` })));
        }
        detail.appendChild(fixes);
      } else if (bad && r.exclude) detail.appendChild(h("span", { class: "help" }, "Excluded — will not be committed."));
      else detail.appendChild(h("span", { style: { color: "var(--ok)", fontSize: "12px", fontWeight: "700" } }, "Valid"));
      rowEl.appendChild(excl); rowEl.appendChild(detail);
      rowEl.appendChild(h("span", { class: "help" }, bad && !r.exclude ? "needs fix" : ""));
      container.appendChild(rowEl);
    });
  }
  function buildExpFromRow(r) {
    const get = (f) => { const ci = Object.keys(mapping).find((k) => mapping[k] === f); return ci == null ? "" : (r.fixed[ci] != null ? r.fixed[ci] : r.cells[ci]); };
    const day = normDay(get("day")) || (DATES.includes(get("day")) ? get("day") : DATES[0]);
    return { description: get("description"), amount: Number(get("amount")), currency: EXP_CUR.includes(get("currency")) ? get("currency") : "EUR", day, category: EXP_CATS.includes(get("category")) ? get("category") : "Activities", payer: EXP_PAYERS.includes(get("payer")) ? get("payer") : "Ava" };
  }
  render();
  const handle = modal({ title: "CSV import wizard", body, foot, wide: true });
}

export function openReceiptScanner() {
  const cost = h("input", { class: "input", type: "number", step: "0.01", value: "19.00", "aria-label": "Extracted cost" });
  const date = h("input", { class: "input", type: "text", value: "2025-07-10", "aria-label": "Extracted date" });
  const desc = h("input", { class: "input", type: "text", value: "Cafe de la Plage", "aria-label": "Draft expense description" });
  const stage = h("div", { class: "receipt-stage", html: receiptSVG() + `<svg viewBox="0 0 320 220" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true"><rect class="bbox" x="150" y="140" width="92" height="18"/><text class="bbox-label" x="152" y="136">cost 19.00</text><rect class="bbox" x="80" y="166" width="120" height="16"/><text class="bbox-label" x="82" y="162">date 2025-07-10</text></svg>` });
  const drop = h("div", { class: "dropzone", tabindex: "0", role: "button", "aria-label": "Drop a receipt image or use the sample" },
    h("span", { html: icon.receipt, "aria-hidden": "true", style: { display: "block", margin: "0 auto 8px", width: "28px", height: "28px" } }),
    h("div", { style: { fontWeight: "700" } }, "Drop a receipt image here"),
    h("div", { class: "help" }, "or use the sample receipt already loaded"),
    h("button", { class: "btn sm", type: "button", style: { marginTop: "10px" }, text: "Use sample receipt", onclick: (e) => { e.stopPropagation(); drop.style.display = "none"; stage.style.display = ""; } }));
  stage.style.display = "none";
  ["dragover", "dragenter"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("drag"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("drag"); if (ev === "drop") { drop.style.display = "none"; stage.style.display = ""; } }));
  const add = h("button", { class: "btn primary", type: "button", html: icon.check + "<span>Add draft expense</span>", onclick: () => {
    const amt = Number(cost.value);
    if (!Number.isFinite(amt) || amt <= 0) { toast("Check the cost", "The extracted cost must be greater than 0.", "warn"); return; }
    S.addExpense({ description: desc.value || "Receipt", amount: amt, currency: "EUR", day: normDay(date.value) || DATES[0], category: "Food", payer: "Ava" });
    toast("Receipt added", (desc.value || "Receipt") + " was added to the ledger.", "ok"); handle.close();
  } });
  const handle = modal({ title: "Receipt scanner", wide: true, body: h("div", {}, drop, stage, h("div", { class: "form-grid", style: { marginTop: "12px" } }, h("div", { class: "field" }, h("label", {}, "Description"), desc), h("div", { class: "field" }, h("label", {}, "Cost (EUR)"), cost), h("div", { class: "field" }, h("label", {}, "Date"), date)), h("p", { class: "help", style: { marginTop: "8px" } }, "Bounding boxes mark the extracted cost and date. Confirm or edit, then add the draft expense.")), foot: [h("button", { class: "btn", type: "button", text: "Cancel", onclick: () => handle.close() }), add] });
}

function matchMobile() { return window.innerWidth < 1024; }
