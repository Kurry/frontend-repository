(function () {
  "use strict";

  const CONTRACT_VERSION = "zto-webmcp-v1";
  const MODULES = ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "artifact-transfer-v1"];
  const DESTINATIONS = ["hero", "brand-portfolio", "annual-report", "culture-statement", "market-snapshot", "latest-news", "culture-stats", "awards", "careers-cta", "mobile-menu", "responsibility-dropdown", "investor-briefing", "command-palette"];
  const DESTINATION_IDS = { hero: "hero", "brand-portfolio": "portfolio", "annual-report": "annual-report", "culture-statement": "culture", "market-snapshot": "market", "latest-news": "latest-news", "culture-stats": "culture-stats", awards: "awards", "careers-cta": "careers" };
  const TITLES = [
    "Northstar Earns People-First Workplace Certification",
    "Trailmark Celebrates 45 Years Outside",
    "Cadence Velocity Pro Wins Best Racing Shoe",
    "Northstar Studio Receives Four Creative Honors",
    "Cadence Brings the Daily Runner Back",
    "Trailmark Launches a Flow-Focused Trail Shoe",
    "Forgeworks Steps Onto the Small Screen",
    "Northstar Named Company of the Year",
  ];
  const CONSENT_FIELDS = ["necessary", "analytics", "marketing", "functional"];
  const app = () => window.NorthstarApp;

  function bounded(value, label, max = 200) {
    if (typeof value !== "string" || !value.length || value.length > max) throw new Error(`${label} must be a non-empty string of at most ${max} characters`);
    return value;
  }

  function consentFields(args) {
    const raw = args && args.fields;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const unknown = Object.keys(raw).find((field) => !CONSENT_FIELDS.includes(field));
    if (unknown) throw new Error(`Unknown consent field: ${unknown}`);
    const values = {};
    Object.entries(raw).forEach(([field, value]) => {
      if (value !== "true" && value !== "false") throw new Error(`${field} must be true or false`);
      values[field] = value === "true";
    });
    return values;
  }

  function entityTitle(args) {
    const raw = args && args.fields;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("fields must be an object");
    const unknown = Object.keys(raw).find((field) => field !== "title" && field !== "pinned");
    if (unknown) throw new Error(`Unknown news-pin field: ${unknown}`);
    if (raw.pinned !== undefined && raw.pinned !== "true") throw new Error("pinned must be true when creating a news pin");
    const title = bounded(raw.title, "title");
    if (!TITLES.includes(title)) throw new Error("title must identify a declared news story");
    return title;
  }

  const tools = [
    {
      name: "browse.open", module: "browse-query-v1", description: "Open a declared homepage destination through its visible handler.",
      handler(args) {
        const destination = bounded(args.destination, "destination", 64);
        if (!DESTINATIONS.includes(destination)) return { ok: false, error: "unknown destination" };
        if (DESTINATION_IDS[destination]) return { ...app().openSection(DESTINATION_IDS[destination]), destination };
        if (destination === "mobile-menu") app().openMobile();
        if (destination === "responsibility-dropdown") app().openResponsibility();
        if (destination === "investor-briefing") app().openBriefing();
        if (destination === "command-palette") app().openCommand();
        return { ok: true, destination };
      },
    },
    {
      name: "browse.search", module: "browse-query-v1", description: "Search the visible command palette.",
      handler(args) {
        const query = bounded(args.query, "query");
        app().openCommand();
        const input = document.querySelector("#command-search");
        if (!input) return { ok: false, error: "command palette unavailable" };
        input.value = query;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        return { ok: true, query, visible_results: document.querySelectorAll("#command-results li").length };
      },
    },
    {
      name: "entity.create", module: "entity-collection-v1", description: "Create a declared news pin from fields.",
      handler: (args) => app().setPinned(entityTitle(args), true),
    },
    {
      name: "entity.select", module: "entity-collection-v1", description: "Reveal a declared news story by public id.",
      handler(args) {
        const id = bounded(args.id, "id", 128);
        if (!TITLES.includes(id)) return { ok: false, error: "news story not found" };
        app().openSection("latest-news");
        const card = Array.from(document.querySelectorAll(".news-card")).find((node) => node.dataset.title === id);
        if (!card) return { ok: false, error: "news card unavailable" };
        card.scrollIntoView({ block: "nearest", inline: "center" });
        card.querySelector(".pin-button")?.focus();
        return { ok: true, id, pinned: app().getPinnedTitles().includes(id) };
      },
    },
    {
      name: "entity.delete", module: "entity-collection-v1", description: "Delete a news pin with explicit confirmation.",
      handler(args) {
        const id = bounded(args.id, "id", 128);
        if (args.confirm !== true) return { ok: false, error: "confirm=true is required" };
        return app().setPinned(id, false);
      },
    },
    {
      name: "entity.toggle", module: "entity-collection-v1", description: "Toggle the pinned field on a declared news story.",
      handler(args) {
        const id = bounded(args.id, "id", 128);
        if (args.field !== undefined && args.field !== "pinned") return { ok: false, error: "only pinned is toggleable" };
        return app().togglePinned(id);
      },
    },
    {
      name: "form.validate", module: "form-workflow-v1", description: "Validate declared consent fields and show normal field errors.",
      handler(args) {
        const fields = consentFields(args);
        app().openPreferences(fields);
        const result = app().validateConsent(fields);
        document.querySelectorAll("[data-error]").forEach((node) => { node.textContent = result.errors[node.dataset.error] || ""; });
        return { ok: result.valid, errors: result.errors };
      },
    },
    {
      name: "form.submit", module: "form-workflow-v1", description: "Submit declared consent fields through the visible validation handler.",
      handler(args) {
        const fields = consentFields(args);
        app().openPreferences(fields);
        return app().applyConsent(fields, "save preferences");
      },
    },
    {
      name: "form.cancel", module: "form-workflow-v1", description: "Cancel the open preferences form through its visible control.",
      handler() {
        const close = document.querySelector("#preferences-close");
        if (!close || document.querySelector("#preferences-modal").hidden) return { ok: false, error: "preferences form is not open" };
        close.click();
        return { ok: true, cancelled: true };
      },
    },
    {
      name: "form.reset", module: "form-workflow-v1", description: "Reset the visible consent draft to current session values.",
      handler() {
        app().openPreferences(app().getConsent());
        return { ok: true };
      },
    },
    {
      name: "artifact.import", module: "artifact-transfer-v1", description: "Open and focus the declared visible briefing import surface.",
      handler(args) {
        const mode = bounded(args.mode, "mode", 16);
        if (mode !== "paste" && mode !== "file") return { ok: false, error: "mode must be paste or file" };
        app().openBriefing();
        const target = document.querySelector(mode === "file" ? "#import-file" : "#import-text");
        target?.focus();
        return { ok: Boolean(target), mode, completed: false };
      },
    },
    {
      name: "artifact.export", module: "artifact-transfer-v1", description: "Trigger a visible declared-format briefing download.",
      handler(args) {
        const format = bounded(args.format, "format", 16);
        if (format !== "json" && format !== "markdown") return { ok: false, error: "format must be json or markdown" };
        app().openBriefing();
        app().setFormat(format);
        app().downloadBriefing();
        return { ok: true, format };
      },
    },
    {
      name: "artifact.copy", module: "artifact-transfer-v1", description: "Trigger the visible copy control for the active briefing format.",
      handler() {
        app().openBriefing();
        const button = document.querySelector("#copy-briefing");
        button?.click();
        return { ok: Boolean(button) };
      },
    },
  ];

  const byName = new Map(tools.map((tool) => [tool.name, tool]));
  const listed = () => tools.map(({ name, module, description }) => ({ name, module, description }));
  window.webmcp_session_info = () => ({ contract_version: CONTRACT_VERSION, app: "northstar-collective-home", modules: MODULES, tools: tools.map((tool) => tool.name) });
  window.webmcp_list_tools = listed;
  window.webmcp_invoke_tool = async (name, args = {}) => {
    const tool = byName.get(name);
    if (!tool) return { ok: false, error: `unknown tool: ${name}` };
    try { return await tool.handler(args); }
    catch (error) { return { ok: false, error: error instanceof Error ? error.message : String(error) }; }
  };
  try { if (!navigator.modelContext) navigator.modelContext = { listTools: listed, callTool: window.webmcp_invoke_tool }; } catch (_) {}
})();
