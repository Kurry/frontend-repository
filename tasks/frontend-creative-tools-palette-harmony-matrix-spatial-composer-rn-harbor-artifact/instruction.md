<summary>
Create "Palette Harmony Matrix", a domain-native browser surface where users can manage colors and perform a canonical mutation: place a selected record in a spatial composer and rebalance capacity. This interacts directly with an interoperable artifact (palette-harmony-v1.json). Based on Hbr's shipped pattern of explicit upload failures, scrubbing, plain JSON, and source labels, the app functions as an evidence artifact inspector with redaction, source lineage, and downloadable files. The state must be entirely in-memory using Solid stores (or Zustand for React) without localStorage, and the application must serve on port 3000.
</summary>

<core_features>
- Users can create, edit, archive, and filter colors with explicit domain statuses (empty, draft, ready, changed, archived) in a collection (at least 100 seeded records must not compromise responsiveness).
- Users can use the spatial composer surface to perform the signature mutation: "place a selected record in a spatial composer and rebalance capacity", which simultaneously changes the primary record, linked views, and status.
- Linked utility: mutating a record in the spatial composer updates the derived decision representation immediately, demonstrating domain utility beyond standard CRUD.
- Undo capability: users can undo the last mutation, which restores the prior ordering, selection, and derived values correctly.
- Robust boundary and error recovery: conflicting or incomplete mutations are rejected without partial updates. Invalid required fields during edits preserve prior valid state and explicitly explain recovery.
- Portable work artifact: Users can export the current session to "palette-harmony-v1.json" (with "schemaVersion" "v1" and regenerated "exportedAt" RFC3339 timestamp). The artifact preserves authored state, derived consequences, and event history.
- Importing an artifact supports field-level validation: malformed schemas, duplicate IDs, out-of-bounds values, or unknown references cause no state change (safe failure/no-op), while valid imports fully replace the state.
</core_features>

<visual_design>
- A distinctive domain-specific workbench with a clear visual hierarchy, intentional density, and a calm, focused canvas that clearly distinguishes current state vs next action.
- The UI contains a primary work surface (the spatial composer), a detail panel for the color records, and a derived summary view.
- Clear state tokens (e.g. badges or colored indicators for empty, draft, ready, changed, archived).
- Uses Tailwind CSS 4.3.2 for styling (no CDNs).
</visual_design>

<motion>
- Causal motion: The acted-on item animates (moves or morphs) into its new state when placed in the spatial composer, making the outcome clear.
- A reduced-motion equivalent is provided (e.g., via prefers-reduced-motion) that preserves feedback without coordinate transforms.
</motion>

<requirements>
- Shared application state must use Zustand (in-memory only); no localStorage or sessionStorage. A page reload returns the app to its seeded state.
- Stack: React, Zustand, Tailwind CSS 4.3.2 (pinned), and Vite. Frontend-only.
- All forms are validated (e.g. Zod).
- Alternate input parity: the signature interaction (placing in the spatial composer and rebalancing) works via mouse/touch and has a full keyboard equivalent that produces identical state with visible focus and live feedback.
- The desktop layout features the primary surface, summary, and inspector side-by-side or clearly demarcated. On narrow viewports (mobile mode), it transforms into a usable stack, drawer, or stepper without horizontal overflow.
- Accessibility: uses semantic HTML controls, explicit focus management, live updates (ARIA live regions where applicable), sufficient contrast, and respects reduced motion.
- All UI text, statuses, errors, and empty-state copy names the domain consequence and recovery actions precisely.
- All assets must be loaded locally without CDNs.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in /app; scaffold under /app as needed for the stack in <summary>; /app/package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds); run via npm start on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run npm run verify:build and confirm it exits 0, then run npm start and confirm the app serves on port 3000.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the <webmcp_action_contract> below.
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
- Editor object types: color-record
- Editor properties: capacity; position
- Editor modes: composer
- Editor operations: select; update_property; set_content
- Entity: color
- Entity operations: create; select; update; delete
- Entity fields: hex; status; capacity
- Artifact operations: export; import
- Export formats: palette-harmony-v1
- Import modes: palette-harmony-v1

Mechanics exclusions:
- Drag-and-drop mechanics in the spatial composer stay Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
