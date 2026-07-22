<summary>
Build a web-based vector family editor named Icon Family Optical Studio for designing coherent 16-icon sets across sizes and states. It functions as a single-page application using React, Vite, Tailwind CSS 4.3.2, and in-memory state (no localStorage or backend). The application allows users to edit vector geometry, manage variants and states, preview multi-size pixel behaviors, create branches to compare changes, and export/import the family as a JSON project, plus SVG sprites and CSS tokens.
</summary>

<core_features>
Feature: Anchor and segment editor —
- The user can edit bounded vector anchors/segments (move, line, quadratic, cubic, close) on a 24x24 coordinate grid (integer thousandths)
- Features include dragging anchors/handles, inserting/deleting points, converting segment types, closing/opening paths, and applying mirror/rotate/translate transforms
- Must support grid/guide snapping, and provide keyboard control matching pointer actions
Feature: Construction guides and constraints —
- Users can bind icons to templates (keyline box, baseline, cap line, corner radii, etc.) and create explicit constraints (equal, align, mirror, distance, tangent, radius)
- The solver must prevent cycles/overdetermination and show previews before commit
Feature: Variant inheritance —
- Outline is the base; filled and state variants inherit geometry or declare overrides
- Editing base previews every inherited consequence
- Overrides have provenance and can be reset
Feature: Multi-size pixel previews —
- The studio renders previews at 16, 20, 24, and 32 pixels using deterministic occupancy tables (blur-risk, dropout, etc.)
- Designers can apply hint adjustments (±0.5 design unit) per size without changing master geometry
Feature: Branch and compare —
- Users can fork family branches, compare diffs (geometry, constraints, metrics, hints, etc.), and merge by icon/path/range/property
- Conflicts show dual overlays
- An approved family freezes checksums
Feature: Accessibility and interaction-state preview —
- Previews icons in functional wrappers (buttons/toggles) with states (normal, hover, focus, selected, disabled, high-contrast) mapped to exported tokens
Feature: Export and Import —
- Generates canonical JSON, individual SVGs, SVG symbol sprite, CSS custom properties/classes, and Markdown spec
- Import must exactly reconstruct the app state and perform validation (reject mismatch grids, invalid coords, cycles, forged checksums, unsafe SVG/CSS)
</core_features>

<visual_design>
- Responsive studio: The layout scales from a 1440px desktop view (family grid, vector canvas, path/constraint inspector, metric/preview rail) down to a 375px mobile reflow (icon cards, zoomed canvas, anchor/path/constraint sheets, vertical variant lineage, and carousel). Must retain all features and 44-pixel touch targets.
- Optical metrics and family lenses: Lenses overlay icons or small multiples to reveal structural insights (geometric/optical center, occupied bounds, stroke distribution, side bearings, corner inventory, silhouette density).
</visual_design>

<motion>
- Causal motion: Moving an anchor/solver, updating family overlay/metrics, propagation of inheritance, and size-preview deltas must clearly animate cause-and-effect.
</motion>

<requirements>
- No arbitrary path import or font rendering is used.
- The app operates purely in memory; NO localStorage or other persistence mechanisms. Reloading the page resets the app to the seeded fixture.
- A functional dummy application that acts as an "oracle" reference application.
- Deliverables must run under npm start on port 3000 with zero console or page errors.
- Code should be clean, using React/Vue/Solid or vanilla JS framework per preference as long as it works perfectly and fulfills the contract.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
- Stack: React with Vite, Tailwind CSS 4.3.2 (pinned), and any preferred accessible component library.
</requirements>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
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
- Editor object types: anchor; path; constraint; variant; hint; branch
- Editor properties: x; y; type; value
- Editor modes: edit; preview
- Editor operations: select; update_property; switch_mode; preview
- Artifact operations: export; import
- Export formats: json; svg; css; md
- Import modes: json

Mechanics exclusions:
- Drag-paint / brush stroke geometry stays Playwright (gesture mechanics)

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
</webmcp_action_contract>
