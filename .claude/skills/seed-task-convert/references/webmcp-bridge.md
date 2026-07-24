# WebMCP: binding + bridge

The new verifier drives the app through a `window.webmcp_*` bridge. You do two
things: (1) register a module **binding** (phase 4), and (2) WRITE
`solution/app/src/webmcp.ts` that implements it against the app's real actions
(phase 5). Both must satisfy the oracle-ci `webmcp` probe.

## The binding JSON (input to register_task.py)

Pick 1–4 modules and describe the app's vocabulary. Model on a same-genre task
(`grep -A40 '"<skeleton>"' packages/corpuscheck/src/corpuscheck/schemas/webmcp-assignments.json`).
Shape:

```json
{
  "modules": ["browse-query-v1", "entity-collection-v1", "form-workflow-v1", "artifact-transfer-v1"],
  "bindings": {
    "destinations": ["home", "journal", "stats", "favorites"],
    "filters": ["virtue"],
    "entity": "journal-entry",
    "entity_operations": ["update", "delete"],
    "entity_fields": ["prompt", "virtue", "response"],
    "form_fields": ["prompt", "virtue", "response"],
    "form_operations": ["validate", "submit", "cancel"],
    "artifact_operations": ["export", "import"],
    "import_modes": ["malformed-sample"],
    "export_formats": ["journal-text"]
  },
  "mechanics_exclusions": [
    "Time-based/animation UI (timers, progress rings, expand/contract) stays Playwright-observed (no tool exposed)",
    "Counters read via the visible UI; no counter tool is exposed"
  ]
}
```

Module → tool-name prefix (this is how the probe attributes coverage):
`browse-query-v1`→`browse`, `entity-collection-v1`→`entity`,
`form-workflow-v1`→`form`, `artifact-transfer-v1`→`artifact`,
`structured-editor-v1`→`editor`, `command-session-v1`→`session`.

**mechanics_exclusions**: list the interactions that stay Playwright-only (real
timers, drag, gesture, hover, animation) — anything a WebMCP shortcut would
bypass or falsely satisfy. Don't expose tools for those.

## The probe contract (what oracle-ci checks)

The bridge must expose three functions on `window`:

- `webmcp_session_info()` → `{ contract_version, modules: [...all bound modules], tool_names, tool_count }`
- `webmcp_list_tools()` → array of `{ name, description, inputSchema }`, one per tool, names prefixed by module
- `webmcp_invoke_tool(name, args)` → dispatches to a handler, returns a plain object

The probe requires, in order:
1. all three functions live;
2. `list_tools` returns valid descriptors (each has a string `name`);
3. `session_info.modules` covers every assigned module, AND the tool set covers
   every assigned module (by name prefix);
4. **a read-only tool round-trips** — a tool whose name ends in `search`,
   `validate`, or `select` (or carries `annotations.readOnlyHint`) returns an
   object containing `ok` or `success`. `form.validate` is the reliable one.
5. a mutation tool changes some semantic path (best-effort; keep handlers real).

## Authoring the bridge

1. Read `solution/app/src/store.*` — find the exported state actions
   (create/save, update, delete, toggle, export, import, recovery). These ARE the
   app logic; wire handlers to them directly so a tool call and a user gesture hit
   one code path. "WebMCP is not graded; missing tools must not create fake UI
   success paths" — so never fabricate success.
2. Read the nav/tab structure (how views switch) for `browse.open`.
3. Copy `assets/webmcp.template.ts` to `solution/app/src/webmcp.ts` and adapt:
   - session_info `modules` = your bound modules.
   - one tool per permitted operation of each bound module, names `browse.*`,
     `entity.*`, `form.*`, `artifact.*`.
   - `form.validate` (read-only) validates fields and returns `{ ok, valid, errors }`.
   - `form.submit` / `entity.*` / `artifact.*` call the real store actions.
   - `browse.open` clicks the real nav control (by visible text) — read-only.
4. Register it in the entry file: import `initWebMcp` and call it after
   `render(...)` (SolidJS `src/index.tsx`) or in a top-level effect (React).
5. Keep it framework-appropriate: these seed apps are mostly SolidJS or React.
   The template is framework-agnostic (DOM + store imports) and works for both.

## Verify

`uv run corpuscheck oracle-ci <slug>` → the `webmcp` stage prints
`PASS (N tools; read=<tool>; mutate=<tool>; assigned modules covered)`.
If it says "surface not live", the entry file isn't calling `initWebMcp()`.
If "assigned module coverage incomplete", a module has no tool or session_info
omits it. If "no read-only app tool round-tripped", your `*.validate`/`*.search`
tool isn't returning `{ ok: ... }`.
