/**
 * WebMCP surface for the Novapay Sprint 26 microsite.
 * Tool names and input schemas mirror packages/webmcp-contracts exactly; every
 * handler drives the same visible control path as a person using the page.
 */

const DESTINATIONS = {
  hero: "#Hero",
  "agentic-stack": "#agentic-stack",
  international: "#international",
  "payment-gateway": "#payment-gateway",
  d2c: "#D2C",
  marketing: "#Marketers",
  "business-banking": "#finance",
  shortlist: "shortlist",
  compare: "compare",
  "sprint-brief": "sprint-brief",
};
const FILTERS = ["all", "agentic-stack", "international", "payment-gateway", "d2c", "marketing", "business-banking"];
const DEMOS = ["mobile-menu", "command-palette"];
const ENTITY_FIELDS = ["feature_name", "pinned"];
const SLUG_TO_THEME = {
  all: "All",
  "agentic-stack": "Agentic Stack",
  international: "International Payments",
  "payment-gateway": "Payment Gateway",
  d2c: "D2C",
  marketing: "Marketing",
  "business-banking": "Business Banking",
};

function objectSchema(properties, required = []) {
  const schema = { type: "object", additionalProperties: false, properties };
  if (required.length) schema.required = required;
  return schema;
}

function validateInput(schema, args) {
  if (!args || typeof args !== "object" || Array.isArray(args)) return "arguments must be an object";
  const properties = schema.properties || {};
  const unknown = Object.keys(args).find((key) => !(key in properties));
  if (unknown) return `unknown argument: ${unknown}`;
  const missing = (schema.required || []).find((key) => args[key] === undefined);
  if (missing) return `missing required argument: ${missing}`;
  for (const [key, rule] of Object.entries(properties)) {
    const value = args[key];
    if (value === undefined) continue;
    if (rule.type === "string" && typeof value !== "string") return `${key} must be a string`;
    if (rule.type === "boolean" && typeof value !== "boolean") return `${key} must be a boolean`;
    if (rule.type === "object" && (!value || typeof value !== "object" || Array.isArray(value))) return `${key} must be an object`;
    if (rule.maxLength && typeof value === "string" && value.length > rule.maxLength) return `${key} is too long`;
    if (rule.enum && !rule.enum.includes(value)) return `${key} is outside the declared enum`;
    if (rule.const !== undefined && value !== rule.const) return `${key} must equal ${rule.const}`;
    if (rule.type === "object" && rule.additionalProperties && typeof rule.additionalProperties === "object") {
      for (const [nestedKey, nested] of Object.entries(value)) {
        const nestedRule = rule.additionalProperties;
        if (nestedRule.type === "string" && typeof nested !== "string") return `${key}.${nestedKey} must be a string`;
        if (nestedRule.maxLength && typeof nested === "string" && nested.length > nestedRule.maxLength) return `${key}.${nestedKey} is too long`;
      }
    }
  }
  return "";
}

function openTray() {
  if (typeof window.openSessionTray !== "function") return false;
  window.openSessionTray();
  return true;
}

function openBrief() {
  const panel = document.getElementById("brief-panel");
  if (panel && getComputedStyle(panel).display !== "none") return true;
  const button = document.getElementById("btn-export-brief");
  if (!button) return false;
  button.click();
  return true;
}

function featureButton(className, name) {
  return Array.from(document.querySelectorAll(`button.${className}[data-feature]`))
    .find((button) => button.getAttribute("data-feature") === name);
}

function hasFeature(name) {
  return Array.from(document.querySelectorAll(".shortlist-item[data-feature]"))
    .some((card) => card.getAttribute("data-feature") === name);
}

function setSearch(query) {
  if (query.length > 120) return { ok: false, error: "query must be 120 characters or fewer" };
  openTray();
  const input = document.getElementById("search-query");
  if (!input) return { ok: false, error: "Launch search control not found" };
  input.value = query;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  return { ok: true, query };
}

function setFilter(slug) {
  const theme = SLUG_TO_THEME[slug];
  if (!theme) return { ok: false, error: "Unknown filter" };
  openTray();
  const select = document.getElementById("theme-filter");
  if (!select) return { ok: false, error: "Theme filter control not found" };
  select.value = theme;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return { ok: true, filter: slug };
}

export function initWebmcp() {
  const tools = {
    "browse.open": {
      description: "Open a declared destination (route, tab, section, or item).",
      inputSchema: objectSchema({
        destination: { type: "string", enum: Object.keys(DESTINATIONS), description: "Declared destination" },
      }, ["destination"]),
      handler(args) {
        const destination = args.destination;
        if (destination === "sprint-brief") return { ok: openBrief(), destination };
        if (destination === "shortlist" || destination === "compare") {
          const ok = openTray();
          const dock = document.getElementById("session-dock");
          if (dock) dock.scrollIntoView({ behavior: "smooth", block: "nearest" });
          return { ok, destination };
        }
        const hash = DESTINATIONS[destination];
        const control = document.querySelector(`a.seg-cell[href="${hash}"]`);
        if (!control) return { ok: false, error: `Navigation control not found for ${destination}` };
        control.click();
        return { ok: true, destination };
      },
    },
    "browse.search": {
      description: "Search within the browsable surface.",
      inputSchema: objectSchema({ query: { type: "string", maxLength: 200 } }, ["query"]),
      handler(args) { return setSearch(args.query); },
    },
    "browse.apply_filter": {
      description: "Apply a declared filter.",
      inputSchema: objectSchema({
        filter: { type: "string", enum: FILTERS },
        value: { type: "string", maxLength: 200 },
      }, ["filter"]),
      handler(args) { return setFilter(args.filter); },
    },
    "browse.clear_filter": {
      description: "Clear one or all declared filters.",
      inputSchema: objectSchema({ filter: { type: "string", enum: FILTERS } }),
      handler() { return setFilter("all"); },
    },
    "session.start": {
      description: "Invoke session operation: start.",
      inputSchema: objectSchema({}),
      handler() {
        const play = document.querySelector("[data-video]");
        if (!play) return { ok: false, error: "No play control found" };
        play.click();
        return { ok: true, session: "video", started: true };
      },
    },
    "session.stop": {
      description: "Invoke session operation: stop.",
      inputSchema: objectSchema({}),
      handler() {
        const close = document.querySelector(".video-close-button");
        if (!close) return { ok: false, error: "No close control found" };
        close.click();
        return { ok: true, session: "video", stopped: true };
      },
    },
    "session.trigger_demo": {
      description: "Trigger a declared demo.",
      inputSchema: objectSchema({ demo: { type: "string", enum: DEMOS } }, ["demo"]),
      handler(args) {
        if (args.demo === "mobile-menu") {
          const toggle = document.getElementById("menu-toggle");
          if (!toggle) return { ok: false, error: "Mobile menu toggle not found" };
          toggle.click();
          return { ok: true, demo: args.demo, triggered: true };
        }
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
        return { ok: true, demo: args.demo, triggered: true };
      },
    },
    "entity.create": {
      description: "Create an entity using declared fields.",
      inputSchema: objectSchema({
        fields: { type: "object", additionalProperties: { type: "string", maxLength: 200 } },
      }),
      handler(args) {
        const fields = args.fields || {};
        const unknown = Object.keys(fields).find((key) => !ENTITY_FIELDS.includes(key));
        if (unknown) return { ok: false, error: `Unknown field: ${unknown}` };
        const name = fields.feature_name;
        if (!name || !hasFeature(name)) return { ok: false, error: "feature_name must identify a catalog feature" };
        const button = featureButton("btn-pin", name);
        if (!button) return { ok: false, error: "Pin control not found" };
        button.click();
        return { ok: true, id: name, pinned: true };
      },
    },
    "entity.delete": {
      description: "Delete an entity with explicit confirmation.",
      inputSchema: objectSchema({
        id: { type: "string", maxLength: 128 },
        confirm: { type: "boolean", const: true },
      }, ["id", "confirm"]),
      handler(args) {
        if (!hasFeature(args.id)) return { ok: false, error: "id must identify a catalog feature" };
        const button = featureButton("btn-unpin", args.id);
        if (!button) return { ok: false, error: "Unpin control not found" };
        button.click();
        return { ok: true, id: args.id, pinned: false };
      },
    },
    "entity.toggle": {
      description: "Toggle a boolean field on an entity.",
      inputSchema: objectSchema({
        id: { type: "string", maxLength: 128 },
        field: { type: "string", enum: ENTITY_FIELDS },
      }, ["id"]),
      handler(args) {
        if (!hasFeature(args.id)) return { ok: false, error: "id must identify a catalog feature" };
        if (args.field !== undefined && args.field !== "pinned") return { ok: false, error: "only pinned is toggleable" };
        const pinned = !!(window.appState && window.appState.shortlist.includes(args.id));
        const button = featureButton(pinned ? "btn-unpin" : "btn-pin", args.id);
        if (!button) return { ok: false, error: "Pin toggle control not found" };
        button.click();
        return { ok: true, id: args.id, pinned: !pinned };
      },
    },
    "artifact.import": {
      description: "Start a declared import mode (no file bytes in WebMCP).",
      inputSchema: objectSchema({ mode: { type: "string", enum: ["file", "sample"] } }, ["mode"]),
      handler(args) {
        if (!openBrief()) return { ok: false, error: "Sprint brief panel not found" };
        const button = document.getElementById(args.mode === "sample" ? "btn-load-sample" : "btn-import");
        if (!button) return { ok: false, error: "Import control not found" };
        if (args.mode === "sample") button.click();
        else button.focus();
        return { ok: true, mode: args.mode, import_started: true };
      },
    },
    "artifact.export": {
      description: "Export using a declared format (no blob/base64 in results).",
      inputSchema: objectSchema({ format: { type: "string", enum: ["json", "markdown"] } }, ["format"]),
      handler(args) {
        if (!openBrief()) return { ok: false, error: "Sprint brief panel not found" };
        const tab = document.getElementById(args.format === "markdown" ? "tab-markdown" : "tab-json");
        if (tab) tab.click();
        if (args.format === "json") {
          const download = document.getElementById("btn-download");
          if (!download) return { ok: false, error: "Download control not found" };
          download.click();
        }
        return { ok: true, format: args.format, export_started: true };
      },
    },
    "artifact.copy": {
      description: "Trigger copy via the visible control (clipboard verified in Playwright).",
      inputSchema: objectSchema({}),
      handler() {
        if (!openBrief()) return { ok: false, error: "Sprint brief panel not found" };
        const button = document.getElementById("btn-copy");
        if (!button) return { ok: false, error: "Copy control not found" };
        button.click();
        return { ok: true, copy_triggered: true };
      },
    },
  };

  window.webmcp_session_info = function () {
    return {
      contract_version: "zto-webmcp-v1",
      app: "novapay-sprint-26",
      modules: ["browse-query-v1", "command-session-v1", "entity-collection-v1", "artifact-transfer-v1"],
      destinations: Object.keys(DESTINATIONS),
      session_operations: ["start", "stop", "trigger_demo"],
      demos: DEMOS.slice(),
      tool_count: Object.keys(tools).length,
    };
  };
  window.webmcp_list_tools = function () {
    return Object.entries(tools).map(([name, tool]) => ({ name, description: tool.description, inputSchema: tool.inputSchema }));
  };
  window.webmcp_invoke_tool = function (name, args) {
    const tool = tools[name];
    if (!tool) return { ok: false, error: `unknown_tool: ${name}` };
    const input = args || {};
    const inputError = validateInput(tool.inputSchema, input);
    if (inputError) return { ok: false, error: inputError };
    try { return tool.handler(input); }
    catch (error) { return { ok: false, error: String(error && error.message ? error.message : error) }; }
  };
}
