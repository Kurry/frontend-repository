// main.js — boots the Riviera Trip Planner: builds the shell, runs the
// re-render loop (with focus restoration), handles responsive mode, and
// registers the WebMCP contract (window.webmcp_*) bound to the declared
// operations, with handlers that drive the same logic as the visible UI.
import { createStore, DATES, dayLabel, validateStop } from "./core.js";
import {
  initViews, topbar, sidebar, mainContent, mapView, bulkTray, consumeFocus, setFocus,
  openStopForm, openExport, openImport, setExportFmt,
} from "./views.js";
import { toast } from "./ui.js";

const store = createStore();
initViews(store);
const st = () => store.state;

const app = document.getElementById("app");

function matchMobile() { return window.innerWidth < 1024; }

function render() {
  const s = st();
  document.documentElement.setAttribute("data-theme", s.theme);
  app.setAttribute("data-mode", s.mode);
  app.setAttribute("data-view", s.view);
  app.setAttribute("data-drawer", s.drawerOpen ? "open" : "closed");
  app.setAttribute("data-sb", s.sbHidden ? "hidden" : "shown");

  app.innerHTML = "";
  app.appendChild(topbar());
  const shell = document.createElement("div");
  shell.className = "shell";
  shell.appendChild(sidebar());
  const main = document.createElement("main");
  main.className = "main";
  main.id = "main-scroll";
  main.appendChild(mainContent());
  shell.appendChild(main);
  shell.appendChild(mapView());
  app.appendChild(shell);
  app.appendChild(bulkTray());
  if (matchMobile() && s.drawerOpen) {
    const scrim = document.createElement("div");
    scrim.className = "sb-scrim";
    scrim.addEventListener("click", () => store.setDrawer(false));
    app.appendChild(scrim);
  }
  app.setAttribute("aria-busy", "false");

  // restore focus + caret after a re-rendering action
  const { key, caret } = consumeFocus();
  if (key) {
    const el = document.querySelector(`[data-focus="${CSS.escape(key)}"]`);
    if (el && el.focus) {
      el.focus();
      if (caret != null && typeof el.setSelectionRange === "function") {
        try { el.setSelectionRange(caret, caret); } catch (e) {}
      }
    }
  }
}

store.subscribe(render);

// responsive: a tablet/mobile viewport never uses the three-pane split
function syncMode() {
  if (matchMobile() && st().mode === "split") store.setMode("list");
}
let lastMobile = matchMobile();
window.addEventListener("resize", () => {
  const mob = matchMobile();
  if (mob !== lastMobile) { lastMobile = mob; if (mob && st().mode === "split") store.setMode("list"); else if (!mob && st().drawerOpen) store.setDrawer(false); }
});

if (matchMobile()) st().mode = "list";
render();

// ============================ WebMCP contract ============================
// Bound exactly to the declared modules/operations in the instruction's
// <webmcp_action_contract>. Handlers call the same application logic as the
// visible UI. No artifact contents ever appear in arguments or results.
const DEST = ["overview", "day-detail", "activity-form", "budget-ledger", "export-canvas"];
const TOOLS = [
  { name: "browse_open", description: "Open a declared planner destination using the same handlers as the UI.", inputSchema: { type: "object", properties: { destination: { type: "string", enum: DEST } }, required: ["destination"] },
    run: ({ destination }) => {
      if (!DEST.includes(destination)) return { ok: false, error: "destination must be one of " + DEST.join(", ") };
      if (destination === "overview") { store.setView("explore"); store.setMode(matchMobile() ? "list" : "split"); }
      else if (destination === "day-detail") { store.setView("explore"); if (!st().selectedStopId && st().stops[0]) store.selectStop(st().stops[0].id); }
      else if (destination === "activity-form") { openStopForm(); }
      else if (destination === "budget-ledger") { store.setView("budget"); }
      else if (destination === "export-canvas") { openExport(); }
      return { ok: true, destination, visible: true };
    } },
  { name: "browse_apply_filter", description: "Apply a declared filter (day is wired to the visible day filter).", inputSchema: { type: "object", properties: { filter: { type: "string", enum: ["day", "type", "category"] }, value: { type: "string" } }, required: ["filter", "value"] },
    run: ({ filter, value }) => {
      if (filter === "day") { if (!DATES.includes(value)) return { ok: false, error: "value must be a trip date" }; store.setView("explore"); store.setDayFilter(value); return { ok: true, filter, value }; }
      return { ok: false, error: `filter "${filter}" has no control in this view; use day, or filter the ledger by category column.` };
    } },
  { name: "browse_clear_filter", description: "Clear the active day filter.", inputSchema: { type: "object", properties: {} }, run: () => { store.clearDayFilter(); return { ok: true }; } },
  { name: "browse_set_theme", description: "Set the workspace theme (light or dark).", inputSchema: { type: "object", properties: { theme: { type: "string", enum: ["light", "dark"] } }, required: ["theme"] }, run: ({ theme }) => { store.setTheme(theme); return { ok: true, theme }; } },

  { name: "entity_create", description: "Create an itinerary stop (activity) through the same validation as the form.", inputSchema: { type: "object", properties: { activity: { type: "object", properties: { title: { type: "string" }, day: { type: "string" }, category: { type: "string" }, location: { type: "string" }, notes: { type: "string" }, startTime: { type: "string" }, endTime: { type: "string" } }, required: ["title", "day", "category"] } }, required: ["activity"] },
    run: ({ activity }) => { const r = validateStop(activity || {}); if (!r.ok) return { ok: false, errors: r.errors }; const s = store.addStop(activity); setFocus("row-" + s.id); return { ok: true, id: s.id }; } },
  { name: "entity_select", description: "Select a stop to open its place detail over the map.", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }, run: ({ id }) => { if (!st().stops.find((x) => x.id === id)) return { ok: false, error: "unknown stop id" }; store.selectStop(id); return { ok: true, id }; } },
  { name: "entity_update", description: "Update a stop through the same validation as the edit form.", inputSchema: { type: "object", properties: { id: { type: "string" }, fields: { type: "object" } }, required: ["id", "fields"] },
    run: ({ id, fields }) => { if (!st().stops.find((x) => x.id === id)) return { ok: false, error: "unknown stop id" }; const merged = { ...st().stops.find((x) => x.id === id), ...fields }; const r = validateStop(merged); if (!r.ok) return { ok: false, errors: r.errors }; store.updateStop(id, fields); return { ok: true, id }; } },
  { name: "entity_delete", description: "Delete a stop; requires confirm=true.", inputSchema: { type: "object", properties: { id: { type: "string" }, confirm: { type: "boolean" } }, required: ["id", "confirm"] }, run: ({ id, confirm }) => { if (!confirm) return { ok: false, error: "delete requires confirm=true" }; if (!st().stops.find((x) => x.id === id)) return { ok: false, error: "unknown stop id" }; store.deleteStop(id); return { ok: true, id }; } },
  { name: "entity_reorder", description: "Move a stop to a new position within its day.", inputSchema: { type: "object", properties: { id: { type: "string" }, toIndex: { type: "integer" } }, required: ["id", "toIndex"] }, run: ({ id, toIndex }) => { if (!st().stops.find((x) => x.id === id)) return { ok: false, error: "unknown stop id" }; store.reorderStop(id, toIndex); return { ok: true, id }; } },

  { name: "form_validate", description: "Validate a stop form payload against the stop field contract.", inputSchema: { type: "object", properties: { fields: { type: "object" } }, required: ["fields"] }, run: ({ fields }) => { const r = validateStop(fields || {}); return { ok: r.ok, valid: r.ok, errors: r.errors }; } },
  { name: "form_submit", description: "Submit a stop form payload (validates, then creates on success).", inputSchema: { type: "object", properties: { fields: { type: "object" } }, required: ["fields"] }, run: ({ fields }) => { const r = validateStop(fields || {}); if (!r.ok) return { ok: false, valid: false, errors: r.errors }; const s = store.addStop(fields); setFocus("row-" + s.id); return { ok: true, valid: true, id: s.id }; } },
  { name: "form_cancel", description: "Cancel the active stop form (closes the overlay if open).", inputSchema: { type: "object", properties: {} }, run: () => { const scrim = document.querySelector("#modal-root .scrim"); if (scrim) scrim.remove(); return { ok: true, cancelled: true }; } },

  { name: "artifact_export", description: "Open the export canvas at the given format (compiled live). Result carries metadata only, never the payload.", inputSchema: { type: "object", properties: { format: { type: "string", enum: ["ics", "json", "markdown"] } }, required: ["format"] },
    run: ({ format }) => { setExportFmt(format); openExport(); return { ok: true, format, stops: st().stops.length, expenses: st().expenses.length }; } },
  { name: "artifact_import", description: "Open the trip-JSON import overlay. The document itself is supplied via file picker / clipboard (Playwright), never through this call.", inputSchema: { type: "object", properties: { mode: { type: "string", enum: ["trip-json"] } }, required: ["mode"] }, run: ({ mode }) => { openImport(); return { ok: true, mode, openedImportUI: true, note: "provide the document via the file picker or clipboard" }; } },
  { name: "artifact_copy", description: "Copy the current export format to the clipboard (same handler as the Copy button). Result carries no payload.", inputSchema: { type: "object", properties: { format: { type: "string", enum: ["ics", "json", "markdown"] } }, required: ["format"] },
    run: ({ format }) => { setExportFmt(format); const text = format === "ics" ? buildICSPeek() : format === "json" ? buildJSONPeek() : buildMdPeek(); copyPeek(text); return { ok: true, format, copied: true, byteLength: text.length }; } },
];
// local peek builders (import the real ones lazily to avoid a cycle at top)
import { buildICS, buildTripJson, buildMarkdown } from "./core.js";
function buildICSPeek() { return buildICS(st().stops); }
function buildJSONPeek() { return JSON.stringify(buildTripJson(st()), null, 2); }
function buildMdPeek() { return buildMarkdown(st()); }
async function copyPeek(t) { try { await navigator.clipboard.writeText(t); } catch (e) { const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (er) {} ta.remove(); } }

window.webmcp_session_info = () => ({ contract_version: "zto-webmcp-v1", modules: ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "artifact-transfer-v1"], tools: TOOLS.map((t) => t.name) });
window.webmcp_list_tools = () => TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
window.webmcp_invoke_tool = (name, args) => {
  const t = TOOLS.find((x) => x.name === name);
  if (!t) return { ok: false, error: "unknown tool: " + name };
  try { return t.run(args || {}) || { ok: true }; }
  catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
};

// expose a tiny, intentional self-test surface only (the contract APIs above);
// no ground-truth application state is placed on window.
if (!matchMobile()) setFocus("row-" + (st().selectedStopId || ""));
