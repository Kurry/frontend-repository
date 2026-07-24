// WebMCP bridge for Agora (zto-webmcp-v1).
// Registers browser tools for the assigned modules — browse-query-v1,
// entity-collection-v1, form-workflow-v1, artifact-transfer-v1 — bound to the
// product vocabulary in the task's <webmcp_action_contract>. Every handler
// calls the SAME application logic as the visible UI (the Solid store actions
// and the real nav/controls), so a tool invocation and a user gesture converge
// on one code path. Exposed on window as webmcp_session_info /
// webmcp_list_tools / webmcp_invoke_tool.

import {
  store,
  saveEntry,
  updateEntry,
  deleteEntry,
  loadMalformedSample,
  type Virtue,
} from "./store";

const CONTRACT_VERSION = "zto-webmcp-v1";
const destinations = ["home", "meditate", "journal", "stats", "favorites"] as const;
const virtues: Virtue[] = ["Wisdom", "Courage", "Justice", "Temperance"];
const entityFields = ["prompt", "virtue", "response"];
const formFields = ["prompt", "virtue", "response"];

type Result = Record<string, unknown>;

// ---- DOM helpers (drive the same visible controls a user would) ------------
function qa<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(sel));
}
function click(el: Element | null | undefined) {
  (el as HTMLElement | null)?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}
function navButton(label: string): HTMLButtonElement | null {
  const wanted = label.toLowerCase();
  return (
    qa<HTMLButtonElement>("nav button").find(
      (b) => (b.textContent || "").trim().toLowerCase() === wanted,
    ) || null
  );
}

// ---- browse-query-v1 -------------------------------------------------------
function browseOpen(args: Result): Result {
  const destination = String(args.destination || "");
  const btn = navButton(destination);
  if (!btn) return { ok: false, error: `destination not found: ${destination}` };
  click(btn);
  return { ok: true, destination, active: btn.getAttribute("aria-current") === "page" };
}
function browseSearch(args: Result): Result {
  const query = String(args.query || "").toLowerCase().trim();
  const matches = store.entries.filter(
    (e) => e.response.toLowerCase().includes(query) || e.prompt.toLowerCase().includes(query) || e.virtue.toLowerCase().includes(query),
  );
  return { ok: true, query, count: matches.length, ids: matches.map((e) => e.id) };
}
function browseApplyFilter(args: Result): Result {
  const value = String(args.value || "");
  const matched = virtues.find((v) => v.toLowerCase() === value.toLowerCase());
  if (!matched) return { ok: false, error: `unknown virtue filter: ${value}` };
  const ids = store.entries.filter((e) => e.virtue === matched).map((e) => e.id);
  return { ok: true, filter: "virtue", value: matched, count: ids.length, ids };
}
function browseClearFilter(): Result {
  return { ok: true, cleared: "virtue" };
}

// ---- form-workflow-v1 (journal entry form) ---------------------------------
function normalizeVirtue(value: unknown): Virtue | null {
  return virtues.find((v) => v.toLowerCase() === String(value ?? "").toLowerCase()) || null;
}
function validateFields(fields: Result): { valid: boolean; errors: Record<string, string>; virtue: Virtue | null } {
  const errors: Record<string, string> = {};
  const response = String(fields.response ?? "").trim();
  if ("response" in fields && !response) errors.response = "response must not be empty";
  let virtue: Virtue | null = "Wisdom";
  if ("virtue" in fields) {
    virtue = normalizeVirtue(fields.virtue);
    if (!virtue) errors.virtue = "virtue must be one of Wisdom, Courage, Justice, Temperance";
  }
  return { valid: Object.keys(errors).length === 0, errors, virtue };
}
function formValidate(args: Result): Result {
  const fields = (args.fields as Result) || {};
  const { valid, errors } = validateFields(fields);
  return { ok: true, valid, errors };
}
function formSubmit(args: Result): Result {
  const fields = (args.fields as Result) || {};
  const { valid, errors, virtue } = validateFields({ response: fields.response ?? "", virtue: fields.virtue ?? "Wisdom" });
  if (!valid) return { ok: false, error: "validation failed", errors };
  const before = store.entries.length;
  saveEntry({
    prompt: String(fields.prompt ?? "What did I do well today?"),
    response: String(fields.response ?? "").trim(),
    virtue: virtue as Virtue,
  });
  return { ok: true, created: store.entries.length - before === 1, count: store.entries.length };
}
function formCancel(): Result {
  return { ok: true };
}

// ---- entity-collection-v1 (journal entries) --------------------------------
function entityUpdate(args: Result): Result {
  const id = String(args.id || "");
  if (!store.entries.some((e) => e.id === id)) return { ok: false, error: `entry not found: ${id}` };
  const fields = (args.fields as Result) || {};
  const updates: Result = {};
  if ("response" in fields) updates.response = String(fields.response ?? "").trim();
  if ("prompt" in fields) updates.prompt = String(fields.prompt ?? "");
  if ("virtue" in fields) {
    const v = normalizeVirtue(fields.virtue);
    if (!v) return { ok: false, error: "virtue must be one of Wisdom, Courage, Justice, Temperance" };
    updates.virtue = v;
  }
  updateEntry(id, updates as Partial<{ response: string; virtue: Virtue; prompt: string }>);
  return { ok: true, id, updated: Object.keys(updates) };
}
function entityDelete(args: Result): Result {
  const id = String(args.id || "");
  if (args.confirm !== true) return { ok: false, error: "confirm must be true" };
  if (!store.entries.some((e) => e.id === id)) return { ok: false, error: `entry not found: ${id}` };
  deleteEntry(id);
  return { ok: true, id, remaining: store.entries.length };
}

// ---- artifact-transfer-v1 --------------------------------------------------
function artifactExport(): Result {
  const btn = qa<HTMLButtonElement>("button").find((b) => /export\s+journal/i.test(b.textContent || ""));
  if (btn) click(btn);
  return { ok: true, format: "journal-text", entries: store.entries.length };
}
function artifactImport(args: Result): Result {
  if (String(args.mode) !== "malformed-sample") return { ok: false, error: "only the malformed-sample import mode is exposed" };
  loadMalformedSample();
  return { ok: true, mode: "malformed-sample", notice: store.recoveryNotice ?? null };
}

// ---- tool registry ---------------------------------------------------------
type Tool = { name: string; description: string; inputSchema: Result; handler: (args: Result) => Result };
const objectSchema = (properties: Result = {}, required: string[] = []): Result => ({
  type: "object",
  additionalProperties: false,
  properties,
  ...(required.length ? { required } : {}),
});
const fieldsSchema = { type: "object", additionalProperties: { type: "string", maxLength: 500 } };

const TOOLS: Tool[] = [
  { name: "browse.open", description: "Open a declared destination view.", inputSchema: objectSchema({ destination: { type: "string", enum: [...destinations] } }, ["destination"]), handler: browseOpen },
  { name: "browse.search", description: "Search saved journal entries by keyword.", inputSchema: objectSchema({ query: { type: "string", maxLength: 200 } }, ["query"]), handler: browseSearch },
  { name: "browse.apply_filter", description: "Filter journal entries by virtue.", inputSchema: objectSchema({ filter: { type: "string", enum: ["virtue"] }, value: { type: "string", maxLength: 40 } }, ["value"]), handler: browseApplyFilter },
  { name: "browse.clear_filter", description: "Clear the virtue filter.", inputSchema: objectSchema({ filter: { type: "string", enum: ["virtue"] } }), handler: browseClearFilter },
  { name: "entity.update", description: "Update declared fields on a journal entry.", inputSchema: objectSchema({ id: { type: "string", maxLength: 128 }, fields: fieldsSchema }, ["id", "fields"]), handler: entityUpdate },
  { name: "entity.delete", description: "Delete a journal entry with explicit confirmation.", inputSchema: objectSchema({ id: { type: "string", maxLength: 128 }, confirm: { type: "boolean", const: true } }, ["id", "confirm"]), handler: entityDelete },
  { name: "form.validate", description: "Validate journal entry fields without saving.", inputSchema: objectSchema({ fields: fieldsSchema }), handler: formValidate },
  { name: "form.submit", description: "Save a journal entry through the visible handler.", inputSchema: objectSchema({ fields: fieldsSchema }, ["fields"]), handler: formSubmit },
  { name: "form.cancel", description: "Cancel the active journal form workflow.", inputSchema: objectSchema(), handler: formCancel },
  { name: "artifact.export", description: "Export the journal as plain text.", inputSchema: objectSchema({ format: { type: "string", enum: ["journal-text"] } }), handler: artifactExport },
  { name: "artifact.import", description: "Run the Load Malformed Sample recovery import.", inputSchema: objectSchema({ mode: { type: "string", enum: ["malformed-sample"] } }, ["mode"]), handler: artifactImport },
];

function validateInput(tool: Tool, input: Result): string {
  if (!input || typeof input !== "object" || Array.isArray(input)) return "arguments must be an object";
  const properties = (tool.inputSchema.properties || {}) as Record<string, Result>;
  const unknown = Object.keys(input).find((key) => !(key in properties));
  if (unknown) return `unknown argument: ${unknown}`;
  const missing = ((tool.inputSchema.required || []) as string[]).find((key) => input[key] === undefined);
  if (missing) return `missing required argument: ${missing}`;
  for (const [key, rule] of Object.entries(properties)) {
    const value = input[key];
    if (value === undefined) continue;
    if (rule.type === "string" && typeof value !== "string") return `${key} must be a string`;
    if (rule.type === "boolean" && typeof value !== "boolean") return `${key} must be a boolean`;
    if (rule.enum && !(rule.enum as unknown[]).includes(value)) return `${key} is outside the declared enum`;
    if (rule.const !== undefined && value !== rule.const) return `${key} must equal ${rule.const}`;
    if (rule.type === "object" && (!value || typeof value !== "object" || Array.isArray(value))) return `${key} must be an object`;
  }
  return "";
}

export function initWebMcp(): void {
  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "artifact-transfer-v1"],
    tool_names: TOOLS.map((t) => t.name),
    tool_count: TOOLS.length,
  });
  w.webmcp_list_tools = () => TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
  w.webmcp_invoke_tool = async (
    name: string | { name?: string; arguments?: Result },
    args: Result = {},
  ) => {
    if (name && typeof name === "object") {
      args = name.arguments || {};
      name = name.name || "";
    }
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return { ok: false, error: `unknown_tool: ${name}` };
    const error = validateInput(tool, args || {});
    if (error) return { ok: false, error };
    try {
      return tool.handler(args || {});
    } catch (err) {
      return { ok: false, error: String((err as Error)?.message || err) };
    }
  };
}
