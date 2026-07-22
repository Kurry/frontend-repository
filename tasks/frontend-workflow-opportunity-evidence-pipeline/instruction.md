<summary>
Build an evidence-bound job application tracker that forces candidates to ground every resume claim in verified experience facts, manages the application lifecycle across a stage board, captures immutable submission snapshots, tracks interview obligations, and exports a portable artifact dossier (JSON, Markdown, ICS, CSV). Use Solid stores for state management and Tailwind CSS 4.3.2.
</summary>

<core_features>
Requirement extraction and classification: Users view an immutable opportunity brief and classify its exact text spans as must-have, preferred, responsibility, domain, logistics, or unknown.
Requirement-to-evidence lattice: Drag evidence cards (facts, artifacts, skills) onto requirement chips to bind them as direct, transferable, contextual, gap, or excluded.
Tailored packet branches: Assemble ordered resume blocks and cover sections from evidence-bound facts. Editing wording blocks any facts not present in bound evidence. Users can fork variants and merge.
Fit, gap, and integrity review: Exposes weighted coverage and unsupported wording. A deterministic reviewer labels ready, needs-evidence, needs-edit, or intentional-gap.
Constraint-aware application board: Move opportunity cards through stages: discovered, researching, tailoring, ready, submitted, screen, interview, offer, declined, withdrawn, archived.
Submission snapshots: Submitting freezes the opportunity revision, bindings, rendered documents, and timestamp.
Interview and follow-up obligations: Generates timeline tasks (prep, interview, thank-you) that can be rescheduled via drag under deadline rules.
Import and Export: Export produces a canonical JSON dossier, JSON Resume-compatible JSON, Markdown cover letter, ICS obligations, and CSV ledger. Import reconstructs the exact state.
</core_features>

<visual_design>
Use a dense, desktop-class UI with interconnected panes: a lattice view, a packet composer, a stage board, and an obligation timeline rail.
Visually distinguish requirement classes (e.g., must-have vs. preferred) and evidence binding types (direct vs. gap) using clear color and typographic treatments.
Highlight unsupported wording in the packet composer with inline error styles (e.g., red underlines or rails).
Use distinct visual states for stages on the Kanban board, snapping back invalid drops visually.
</visual_design>

<motion>
Drag-and-drop actions (binding evidence, reordering packet blocks, moving board cards, rescheduling timeline tasks) provide immediate visual feedback and snap to valid targets.
Transitions between views (lattice, composer, board, snapshot diff) are instantaneous but preserve contextual state (like selected requirement).
Use subtle animations for inline validation of unsupported claims and for adding/removing obligations.
</motion>

<requirements>
State Management: Use Solid stores for state management (in-memory only). Do NOT use localStorage or any browser persistence. A page reload must cleanly reset to the seeded fixture state.
Fixtures: Seed the app with a fictional profile (14 experience facts, 8 project artifacts, 6 skill assertions) and 5 fictional opportunities (containing requirements, deadlines).
Export Artifacts: The export payload must include OpportunityEvidenceDossier (schemaVersion: "opportunity-evidence-dossier/v1"), containing immutable profile/opportunity, bindings, and variant DAGs. Generate valid JSON, Markdown, ICS, and CSV text.
Responsive: The UI must transform gracefully on mobile to lane stacks, packet-block sheets, and vertical task lineages without horizontal overflow.
Tech Stack: React (or Solid/Vue), Vite, Tailwind CSS 4.3.2. No external component libraries other than basic headless UI.
All forms and edits enforce the integrity rules (e.g., blocked transitions, blocked unsupported wording) deterministically.
All libraries must be bundled locally. No CDNs.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1

Module specs:
<module_spec id="structured-editor-v1">
{
  "id": "structured-editor-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Structured editor",
  "purpose": "Document, diagram, canvas, configuration, and property editors.",
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview"],
  "binding_keys": {
    "required_any_of": [["editor_operations"], ["editor_object_types"]],
    "optional": ["editor_properties", "editor_modes", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP.",
    "Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters."
  ],
  "tool_name_prefix": "editor"
}
</module_spec>

<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Carts, records, favorites, calendar events, list items, and local entities.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Closed entity and field enums only.",
    "Bounded string and numeric values.",
    "No generic state setter or arbitrary patch object.",
    "Invokes the same domain command used by the visible control.",
    "Delete requires explicit confirm=true.",
    "Reorder only when gesture mechanics are not being evaluated."
  ],
  "tool_name_prefix": "entity"
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import, export, copy, print, and conversion workflows.",
  "permitted_operations": ["import", "export", "copy", "print_preview", "convert"],
  "binding_keys": {
    "required_any_of": [["artifact_operations"]],
    "optional": ["import_modes", "export_formats", "conversion_modes", "visible_postconditions"]
  },
  "restrictions": [
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results.",
    "File picker interaction, clipboard contents, and downloaded artifacts remain Playwright responsibilities."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Editor object types: requirement-span; evidence-binding; packet-block
- Editor properties: classification; binding_type; content
- Editor modes: edit; review; snapshot
- Entity: opportunity; task
- Entity fields: stage; name; deadline; status
- Export formats: dossier-json; resume-json; cover-md; timeline-ics; ledger-csv
- Import modes: dossier-json

Mechanics exclusions:
- Drag-and-drop card physics and invalid snap-backs stay Playwright-driven
- Raw file paths/blobs forbidden in WebMCP args
- Clipboard contents and downloaded file bytes remain Playwright responsibilities
- Inline validation visual styles (e.g., red underlines) stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
