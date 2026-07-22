<summary>
Build the Recipe Flavor Balance Studio, a domain-native good-app where users manage flavor components in a bounded local workflow. The signature interaction is to place a selected record in a spatial composer and rebalance capacity. This mutation must update linked views and produce an interoperable artifact. Implement a clean, focused spatial workbench UI with a primary spatial composer surface, a linked summary, and an artifact detail panel. The tool operates completely in-memory using React and Zustand (or equivalent local state), with NO localStorage or backend persistence. The final output is an interoperable artifact that supports redaction, source lineage, and explicit field-level import validation. Stack: React 19 (Vite), Zustand, Tailwind CSS 4.3.2 (no CDN), Framer Motion, and Lucide React.
</summary>

<core_features>
- Create, edit, archive, and filter a collection of flavor component records. Each record has explicit domain statuses (draft, ready, changed, archived).
- Place a selected record in a spatial composer and rebalance capacity. This signature interaction must change the primary record, linked view, and status together.
- Bounded capacity: Attempting to exceed a maximum capacity rejects the mutation entirely without partial updates, keeping the prior valid state and displaying a clear conflict recovery path.
- Exact field boundaries are accepted (e.g., maximum intensity values), while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
- Undo the last mutation (Ctrl/Cmd+Z or explicit button) and inspect the linked representation. Undo restores ordering, selection, and derived values.
- Manage a Portable Work Artifact: Export and restore the session work. The exported file contains schemaVersion v1, exportedAt RFC3339, records, derived, and history.
- Import with field-level validation: Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure, updates the UI, and regenerates exportedAt.
- Evidence Artifact Inspector: Displays source lineage, allows redaction of sensitive internal identifiers before export, provides downloadable JSON, and strictly prevents silent failures on upload.
- Seed a deterministic collection of at least 4 flavor component records (with empty, valid, and conflict-ready states) on load, without any target outcomes pre-completed.
</core_features>

<visual_design>
- Distinctive, domain-specific workbench UI with clear state tokens (idle, selected, changed, conflict, resolved) and intentional density.
- A calm focused canvas for the spatial composer.
- The visual hierarchy makes the current state and next action clear, with the primary work surface on the main canvas, a linked summary panel, and an artifact detail/inspector panel.
- Desktop layout features the primary surface, summary, and inspector side-by-side or clearly delineated.
- No generic CRUD tables for the spatial composer.
</visual_design>

<motion>
- Causal motion: The acted-on item moves or morphs into its new state within the spatial composer.
- Reduced motion: Support prefers-reduced-motion to preserve feedback and state changes without spatial transforms.
</motion>

<requirements>
- Shared application state must be entirely in-memory using a state library like Zustand. Do not use localStorage, sessionStorage, or other browser storage APIs. A page reload must return the app to its seeded state.
- Validation must be strict and explicit (e.g., Zod), ensuring the API-shaped schema fields (schemaVersion, exportedAt, records, derived, history) are enforced.
- Stack: React 19 (Vite), Zustand, Tailwind CSS 4.3.2 (installed locally via npm, no CDNs), Framer Motion, and Lucide React.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation as mouse drag/drop. Ctrl/Cmd+Z undoes it.
- Responsive behavior: Narrow (mobile) layouts must transform the secondary surfaces into drawers or stacked steps, preserving touch targets and avoiding horizontal clipping.
- Accessibility: Semantic controls, visible keyboard focus, live region updates for status changes, high contrast, and reduced-motion support.
- Performance: Must remain responsive with a collection of at least 100 seeded records. Unrelated rows and surfaces must not rebuild unnecessarily.
- Domain copy: Labels, statuses, errors, and empty-state text must precisely name the domain consequence and recovery action (e.g., "Draft", "Ready", "Capacity Exceeded").
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in solution/app; scaffold under solution/app as needed for the stack in <summary>; solution/app/package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds); run via npm start on port 3000.
- Before you finish, run npm run verify:build and confirm it exits 0, then run npm start and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same verify:build gate first, and an app that fails it is not served or judged and scores 0 outright.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the <webmcp_action_contract> below; register tools yourself from <module_spec> + Bindings using the same handlers as the visible UI; honor mechanics exclusions.
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
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview", "undo"],
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
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder", "filter"],
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
  "permitted_operations": ["import", "export", "copy", "print_preview", "convert", "redact"],
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
- Editor object types: spatial-composer-record
- Editor properties: position; capacity; status
- Editor modes: place; rebalance
- Editor operations: select; update_property; switch_mode; preview; set_content; undo
- Entity: flavor-component
- Entity operations: create; select; update; delete; filter; reorder
- Entity fields: name; intensity; status; domain_state
- Artifact operations: export; import; redact
- Export formats: flavor-balance-v1-spatial-composer.json
- Import modes: validated-artifact

Mechanics exclusions:
- Drag-and-drop placement in the spatial composer stays Playwright (gesture mechanics).
- Canvas morphing / causal motion transitions stay Playwright-observed.
- File picker interaction, raw file contents, and downloaded artifacts remain Playwright-observed.
</webmcp_action_contract>
