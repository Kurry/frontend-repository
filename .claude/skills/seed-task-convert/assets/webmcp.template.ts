// WebMCP bridge TEMPLATE (zto-webmcp-v1). Copy to solution/app/src/webmcp.ts
// and adapt the marked spots to THIS app. Handlers must call the app's REAL
// state actions (imported from the store) and drive the REAL visible controls —
// never fabricate success. Exposed on window as webmcp_session_info /
// webmcp_list_tools / webmcp_invoke_tool. Register with initWebMcp() in the
// entry file after render(...).
//
// ADAPT: import the app's actual store actions. Wire every handler below to one
// of these instead of the placeholders.
import {
  store,
  // e.g. saveEntry, updateEntry, deleteEntry, toggleFavorite, loadMalformedSample, ...
} from "./store";

const CONTRACT_VERSION = "zto-webmcp-v1";

// ADAPT: the app's views (match the nav button labels), filters, entity fields,
// form fields, and the modules you registered in the binding.
const destinations = ["home", "list", "stats"] as const;
const entityFields = ["field_a", "field_b"];
const MODULES = ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "artifact-transfer-v1"];

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
  return qa<HTMLButtonElement>("nav button").find((b) => (b.textContent || "").trim().toLowerCase() === wanted) || null;
}

// ---- browse-query-v1 -------------------------------------------------------
function browseOpen(args: Result): Result {
  const destination = String(args.destination || "");
  const btn = navButton(destination); // ADAPT if nav isn't <nav><button>label</button>
  if (!btn) return { ok: false, error: `destination not found: ${destination}` };
  click(btn);
  return { ok: true, destination, active: btn.getAttribute("aria-current") === "page" };
}
function browseSearch(args: Result): Result {
  // read-only; can also be the round-trip tool. ADAPT to the app's collection.
  const query = String(args.query || "").toLowerCase().trim();
  return { ok: true, query };
}

// ---- form-workflow-v1 ------------------------------------------------------
function validateFields(fields: Result): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  // ADAPT: encode the app's real form rules (required fields, enums, bounds).
  if ("response" in fields && !String(fields.response ?? "").trim()) errors.response = "must not be empty";
  return { valid: Object.keys(errors).length === 0, errors };
}
function formValidate(args: Result): Result {
  const { valid, errors } = validateFields((args.fields as Result) || {});
  return { ok: true, valid, errors }; // read-only round-trip (name ends in "validate")
}
function formSubmit(args: Result): Result {
  const fields = (args.fields as Result) || {};
  const { valid, errors } = validateFields(fields);
  if (!valid) return { ok: false, error: "validation failed", errors };
  // ADAPT: call the real create action, e.g. saveEntry({ ... }).
  return { ok: true };
}
function formCancel(): Result {
  return { ok: true };
}

// ---- entity-collection-v1 --------------------------------------------------
function entityUpdate(args: Result): Result {
  const id = String(args.id || "");
  // ADAPT: verify id exists in the store collection, then call updateEntry(id, patch).
  return { ok: true, id, updated: Object.keys((args.fields as Result) || {}) };
}
function entityDelete(args: Result): Result {
  const id = String(args.id || "");
  if (args.confirm !== true) return { ok: false, error: "confirm must be true" };
  // ADAPT: call deleteEntry(id).
  return { ok: true, id };
}

// ---- artifact-transfer-v1 --------------------------------------------------
function artifactExport(): Result {
  const btn = qa<HTMLButtonElement>("button").find((b) => /export/i.test(b.textContent || ""));
  if (btn) click(btn);
  return { ok: true };
}
function artifactImport(args: Result): Result {
  // ADAPT: for the "malformed-sample" mode call loadMalformedSample(); reject others.
  return { ok: true, mode: String(args.mode || "") };
}

// ---- registry --------------------------------------------------------------
type Tool = { name: string; description: string; inputSchema: Result; handler: (args: Result) => Result };
const objectSchema = (properties: Result = {}, required: string[] = []): Result => ({
  type: "object", additionalProperties: false, properties, ...(required.length ? { required } : {}),
});
const fieldsSchema = { type: "object", additionalProperties: { type: "string", maxLength: 500 } };

// ADAPT: one tool per permitted operation of each bound module. Names MUST be
// prefixed by module (browse./entity./form./artifact.). Keep a *.validate or
// *.search tool so the read-only probe round-trips.
const TOOLS: Tool[] = [
  { name: "browse.open", description: "Open a declared destination view.", inputSchema: objectSchema({ destination: { type: "string", enum: [...destinations] } }, ["destination"]), handler: browseOpen },
  { name: "browse.search", description: "Search the browsable collection.", inputSchema: objectSchema({ query: { type: "string", maxLength: 200 } }, ["query"]), handler: browseSearch },
  { name: "entity.update", description: "Update declared fields on an entity.", inputSchema: objectSchema({ id: { type: "string", maxLength: 128 }, fields: fieldsSchema }, ["id", "fields"]), handler: entityUpdate },
  { name: "entity.delete", description: "Delete an entity with explicit confirmation.", inputSchema: objectSchema({ id: { type: "string", maxLength: 128 }, confirm: { type: "boolean", const: true } }, ["id", "confirm"]), handler: entityDelete },
  { name: "form.validate", description: "Validate form fields without saving.", inputSchema: objectSchema({ fields: fieldsSchema }), handler: formValidate },
  { name: "form.submit", description: "Submit the form through the visible handler.", inputSchema: objectSchema({ fields: fieldsSchema }, ["fields"]), handler: formSubmit },
  { name: "form.cancel", description: "Cancel the active form workflow.", inputSchema: objectSchema(), handler: formCancel },
  { name: "artifact.export", description: "Export via a declared format.", inputSchema: objectSchema({ format: { type: "string" } }), handler: artifactExport },
  { name: "artifact.import", description: "Run a declared import mode.", inputSchema: objectSchema({ mode: { type: "string" } }, ["mode"]), handler: artifactImport },
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
  void store; // keep the store import live even before every handler is wired
  const w = window as unknown as Record<string, unknown>;
  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: MODULES,
    tool_names: TOOLS.map((t) => t.name),
    tool_count: TOOLS.length,
  });
  w.webmcp_list_tools = () => TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
  w.webmcp_invoke_tool = async (name: string | { name?: string; arguments?: Result }, args: Result = {}) => {
    if (name && typeof name === "object") { args = name.arguments || {}; name = name.name || ""; }
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
