<summary>
Build a Breakpoint Reflow Constraint Forge using React, Tailwind CSS 4.3.2, and a state management approach of your choice (e.g., Zustand or React Context). The app is a layout-authoring tool where a designer arranges eight fixture components on a desktop grid, defines intrinsic track rules, and overrides constraints at tablet and mobile breakpoints. The app resolves overflow/reading-order conflicts and exports a reproducible ResponsiveLayoutContract JSON document plus generated CSS Grid rules, conforming to API-shaped schemas, with import that round-trips that JSON.
</summary>

<core_features>
- Studio entry: first load shows the tool title, a viewport scrubber, a layout preview canvas, and an empty layout with eight unplaced component fixtures.
- Desktop grid composition: Components drag/resize on a 12-column grid and snap to integer column/row lines. Overlap is forbidden (rejected visibly). Each item sets width behavior (min-content|fixed|fraction) and row behavior (auto|fixed|minmax).
- Breakpoint inheritance: Desktop (1024-1440) is the base. Tablet (600-1023) and mobile (320-599) initially inherit all component areas, order, sizing, visibility, and gap. Users can create explicit overrides at tablet or mobile, which are shown in a three-column change rail (inherited, overridden, conflicted). Removing an override restores live inheritance.
- Continuous viewport scrubber: A width ruler scrubs 320–1440 px and updates the live preview, active breakpoint, and component rectangles. Exact transition widths 599/600 and 1023/1024 are addressable.
- Intrinsic sizing and measurements: Selecting a component exposes fixture min/preferred content boxes. A content-pressure switch applies short/long/localized fixtures. Long content can grow auto rows or trigger an allowed collapse mode.
- Reflow and conflict graph: A graph lists current layout conflicts (horizontal/vertical overflow, overlap, intrinsic squeeze, hidden-required item, focus clipping, reading-order mismatch). Selecting a conflict focuses the component and inspector fields.
- Layout topology comparison: Two named layout strategies can be authored. A comparison view diffs property overrides, topology, and component bounds at all eight measurements between the two strategies.
- Accessibility order rehearsal: A rehearsal mode tabs through focusable fixtures in semantic DOM order, drawing the visual order path. The designer can adjust a canonical semantic order shared across all breakpoints.
- Session export and import: Export produces a ResponsiveLayoutContract JSON (schemaVersion: "responsive-layout-contract/v1") containing fixtures, desktop grid setup, per-breakpoint overrides, semantic order, content-pressure, active/measurement widths, strategies, derived CSS checksums, and generated CSS rules. Import replaces the entire app state and recomputes the UI exactly. Invalid JSON or broken constraints are rejected with an inline validation error.
</core_features>

<user_flows>
- Compose and export: drag components onto the desktop grid, set row/column spans, switch to tablet and override one component's position. Switch to mobile and hide an optional component. Open Export and copy the resulting JSON/CSS.
- Conflict resolution: switch to mobile, resize a component below its intrinsic min-width. A conflict appears in the graph. Resolve it by increasing the component's column span; the conflict disappears.
- Rehearsal flow: enter Rehearsal mode, press Tab to move focus. Notice the visual order path crosses itself. Reorder the canonical semantic list to match the visual flow, resolving the mismatch.
- Import round-trip: save the layout, refresh the page to clear it. Click Import and paste the JSON. The layout, overrides, and semantic order are perfectly restored.
</user_flows>

<edge_cases>
- Overlap rejection: attempting to place a component over another (that is not an allowed overlay) reverts the placement instantly.
- Stale imports: importing a document with unrecognized schemaVersion or corrupted grid lines rejects with a clear error without crashing.
- Impossible inherited layout: if an inherited layout from desktop mathematically cannot fit on the mobile 12-column grid due to intrinsic sizes, it flags a hard conflict and visually highlights the overflowing components.
</edge_cases>

<visual_design>
- Dark or high-contrast technical UI suited for layout debugging, utilizing mono-spaced typography for inspector values and coordinates.
- Grid canvas shows explicit 12-column hairlines. Component rectangles show their ID, current span, and intrinsic boundaries.
- The three-column inheritance rail uses clear visual diffing (e.g., strike-through for overridden inherited values).
- The conflict graph uses warning/error colors (yellow/red) mapped to the severity of the rule broken.
</visual_design>

<motion>
- Dragging components updates a temporary ghost rectangle, snapping to grid lines. On drop, it commits.
- Scrubbing the viewport width smoothly animates component bounds (unless prefers-reduced-motion is active).
- Switching breakpoints snaps the scrubber and instantly applies the relevant overrides.
</motion>

<responsiveness>
- The tool itself is responsive: at desktop, it shows the multi-column layout with preview, inspector, and rails side-by-side.
- At mobile (375px), it transforms into a stacked interface with component cards, grid-coordinate sheets, and a measurement carousel, preserving full authoring mechanics.
</responsiveness>

<accessibility>
- All grid items can be moved and resized using keyboard controls (e.g., arrow keys for move, Shift+arrow for resize) when focused.
- All toolbar actions, breakpoint toggles, and inspector fields are keyboard accessible.
- The focus rehearsal path must have high contrast and be discernible without color.
</accessibility>

<performance>
- Continuous scrubbing of the viewport must not drop frames or recalculate layouts redundantly.
- Validating the 8-measurement constraints is debounced or optimized to prevent UI lockup during drag/scrub.
</performance>

<writing>
- Technical, precise terminology matching CSS Grid and layout constraints (e.g., "Intrinsic Min-Width", "Fractional Track", "Canonical Semantic Order").
- Error messages explicitly state the broken rule and the component involved.
</writing>

<requirements>
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
- Stack: React, Tailwind CSS 4.3.2, Vite. Local state management (no network calls, no localStorage).
- The app must serve on port 3000 via npm start.
- No arbitrary code execution; layout is solved purely using standard React/CSS-in-JS mechanics based on the deterministic fixtures.
- Generated CSS must use exact media queries at 1024px and 600px.
- The 8 fixtures must be hardcoded with immutable IDs, intrinsic sizes, and allowed collapse modes.
- Implement the exact WebMCP action contract specified below.
</requirements>

<delivery>
- Produce an original self-contained app in `/solution/app`.
- `/solution/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds).
- WebMCP is required; register tools in `window.webmcp_session_info`, `webmcp_list_tools`, `webmcp_invoke_tool`.
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
  "permitted_operations": ["select", "update_property", "switch_mode", "preview"],
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
  "permitted_operations": ["import", "export", "copy"],
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
- Editor object types: component, override
- Editor properties: colSpan, rowSpan, colStart, rowStart, widthBehavior, rowBehavior, visibility
- Editor modes: desktop, tablet, mobile, rehearsal, compare
- Editor operations: select, update_property, switch_mode, preview
- Artifact operations: export, import, copy
- Export formats: layout-json, css
- Import modes: layout-json

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
</webmcp_action_contract>
