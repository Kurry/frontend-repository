# Task proposal: Ceramic Kiln Load Composer — Forecast Ribbon — GitHub Issue Fields

**Proposed slug:** `frontend-creative-tools-ceramic-kiln-load-composer-forecast-ribbon-rn-github-issue-fields`
**Genre:** `good-app`
**Target users:** People who manage kiln pieces in a bounded local workflow

## Whole job

Manage kiln pieces through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: adjust a selected record on a forecast ribbon and compare projected outcomes. Release-derived concept: a project evidence surface with typed fields, duplicate merges, saved queries, and release provenance.

Existing tools split kiln pieces editing, derived decisions, and portable evidence. This task makes the connected user job observable in one frontend-only product. This concept adapts GitHub's shipped pattern of issue fields, duplicate detection, saved views, advanced project search, and release information in issue sidebars into a self-contained frontend job.

### Source inspiration

- https://ceramicartsnetwork.org/
- https://www.skutt.com/
- https://github.blog/changelog/label/projects-and-issues/

<summary>
Create a Ceramic Kiln Load Composer, a specialized local workbench for managing and forecasting kiln firings. The core mutation is adjusting a selected piece on a "forecast ribbon" to compare projected firing outcomes, which instantly updates a linked derived summary and a portable JSON artifact. The app uses an in-memory Solid.js store (no localStorage) with Tailwind CSS v4 and Kobalte. It adapts GitHub issue-tracking patterns into a local context: typed project fields for pieces, duplicate merge tools, saved queries, and release provenance tracking.
</summary>

<core_features>
Kiln Pieces Collection: Create, edit, archive, duplicate-merge, and filter kiln pieces (fields: id, title, maker, dimensions, clayBody, glaze, status).
Forecast Ribbon: A visual timeline/ribbon of pieces. Select a piece and adjust its target temperature/cone or position, comparing projected outcomes (e.g., safe, risk of glaze run, underfired).
Derived Summary: A sidebar or top panel showing aggregate load statistics (total volume, peak temperature, risk warnings) that updates live as the forecast ribbon is adjusted.
Saved Queries and Provenance: Save and switch between views/filters. Track the "release provenance" of a load (when it was fired, who approved it) in a dedicated sidebar panel.
Artifact Round Trip: Export the entire session (pieces, forecast state, saved queries, history) as kiln-load-v1-forecast-ribbon.json. Import must restore exact state.
</core_features>

<visual_design>
Visual hierarchy: Clear distinction between the primary forecast ribbon workspace, the detailed piece inspector, and the derived summary panel.
State tokens: Use explicit, domain-specific visual badges for statuses (e.g., 'draft', 'ready', 'changed', 'conflict', 'archived').
Focused canvas: A calm, intentional density suitable for a workbench, avoiding clutter while showing complex derived data.
</visual_design>

<motion>
Causal motion: When adjusting a piece on the forecast ribbon, smooth layout transitions (via framer-motion/motion.dev) connect the old position/state to the new one.
Reduced motion: Respects prefers-reduced-motion: reduce by replacing spatial transforms with instant updates and opacity fades.
</motion>

<requirements>
State Management: Strict in-memory Solid stores. No localStorage or sessionStorage. A page reload must cleanly reset to the seeded state.
Component Library: Kobalte for all UI chrome (dialogs, select, popovers).
Styling: Tailwind CSS 4.3.2 (pinned).
Forms and Validation: TanStack Form for Solid and Zod. Strict API-shaped schemas for the artifact (schemaVersion: 'kiln-load-v1', unique IDs, explicit enums for status/clayBody). Validation must show inline errors.
Artifact: Export produces kiln-load-v1-forecast-ribbon.json. Import clears current state, validates the payload against the Zod schema, and restores it if valid, or rejects it wholly with an error message if invalid.
Seed Data: Seed the app with at least 5 varied pieces (some draft, some ready, some conflicting) and 2 saved queries.
Dependencies: All libraries installed locally via npm. No CDNs.
Serve: npm start must serve the built app on port 3000. verify:build script required.
</requirements>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- artifact-transfer-v1

Module specs:
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
- Entity: piece; query
- Entity operations: create; select; update; delete
- Entity fields: piece(id, title, maker, cone, status); query(name, filter)
- Artifact operations: export; import
- Export formats: kiln-load-v1-forecast-ribbon.json
- Import modes: kiln-load-v1-forecast-ribbon.json

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args.
- Real drag-and-drop on the forecast ribbon is verified via Playwright.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
</webmcp_action_contract>
