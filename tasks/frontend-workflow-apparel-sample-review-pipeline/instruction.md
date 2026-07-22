# Apparel Sample Review Pipeline

<summary>
The user authors measurement and construction callouts on a fixed garment diagram, binds material/color lots, receives sample snapshots, records measured values and region issues, routes revisions, compares samples, resolves tolerance and material conflicts, approves a production-ready version, handles partial deliverable failure, and exports an exact tech pack and sample history.

This is a browser-based application with in-memory state only (NO localStorage or backend).
</summary>

<core_features>
- Diagram callout editor: Measurement points/lines and construction regions drag on normalized front/back coordinates. Callouts bind type, label, method, seam/edge anchors, leader line, and note. Geometry must stay within panel/allowed anchor zones and avoid label collisions under fixed layout rules. Keyboard coordinates and mobile callout sheets equal pointer gestures.
- Measurement schema and calculation: Each point defines base-size target millimeters, +/- tolerance, adjacent size rule, measurement method, and dependency. The table and diagram share selection. Editing a base or rule recalculates all size targets; circular dependencies and invalid bounds reject. Values use integer tenths of millimeters.
- Material and colorway bindings: Panels/callouts bind shell, lining, interfacing, thread, button, and label lots with colorway, width, shrink fixture, consumption, and approved substitution rules. Changing material propagates adjusted target fixtures/usage and marks samples/approvals stale. Lot quantities reserve per sample and conserve integer square centimeters/units.
- Sample snapshots and measurement review: Each received sample freezes spec revision, size/colorway, material lots, diagram/checksum, measured values, evidence regions, and receipt time. Users enter/accept fixture measurements, classify pass/high/low/not-measured, and annotate construction/color/material issues. Snapshots are immutable; corrections append an erratum.
- Issue and revision workflow: Issues move open to clarified to assigned to revision-proposed to accepted/rejected to implemented-in-spec to verified-in-sample to closed. Each binds exact sample, measurement/callout/material/region, severity, owner, expected correction, and evidence. Implementing accepted issues creates a spec revision branch and marks dependent sample conclusions stale.
- Compare and tolerance lenses: Two sample/spec revisions compare diagram positions, target/actual values, deltas, tolerance bands, callout text, materials, issues, and sizes. Heatmaps show deviations by measurement/size/sample; selecting a cell highlights diagram, evidence, revision event, and tech-pack row. Missing and zero remain distinct.
- Approval and partial package recovery: Approval gates are measurement, construction, material/color, calculation parity, issue closure, and package parity. Each freezes component checksums. Packaging generates SVG diagrams, measurement CSV, material bill, issue/sample history, and Markdown instructions. First package run deterministically fails one colorway diagram and one checksum; retry failed-only preserves successes.
- Responsive pipeline and artifacts: Desktop shows diagram, spec/material tables, sample compare, and issue/approval rail. Mobile becomes garment mini-map, callout/measurement/material cards, vertical revision/issue lineage, sample delta drilldowns, and package stepper. Export produces canonical JSON, SVG annotated diagrams, CSV measurements/materials/sample history, and Markdown tech pack/changelog; import reconstructs state exactly.
</core_features>

<visual_design>
- The application provides a legible hierarchy across callout anchors, targets, tolerance, sample states, issues, approvals, and packages.
- Distinctions between missing and zero values, pass/high/low classifications, and reserved material states are visually distinct.
</visual_design>

<motion>
- Callout movement, propagation, material/sample stale state, issue-to-revision transition, comparison, and package retry explain cause through animation.
- Reduced motion retains before/after values, regions, and status without animation.
</motion>

<requirements>
- Initial load shows immutable garment/spec/material/sample fixtures with no user edit, review decision, issue event, spec revision, approval, package attempt, annotation, or export.
- Forms cannot be substituted for spatial actions where geometry is required.
- Provide a downloadable artifact with standard JSON structure, SVGs, CSVs, and Markdown.
- Tailwind CSS 4.3.2 is required.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
</requirements>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- task-pipeline-v1
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

<module_spec id="task-pipeline-v1">
{
  "id": "task-pipeline-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Task pipeline",
  "purpose": "Workflow automation, approvals, state transitions.",
  "permitted_operations": ["approve", "reject", "transition", "review", "assign"],
  "binding_keys": {
    "required_any_of": [["pipeline_operations"]],
    "optional": ["pipeline_stages", "visible_postconditions"]
  },
  "restrictions": [
    "Follows strict workflow state boundaries."
  ],
  "tool_name_prefix": "pipeline"
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
- Editor object types: callout; material; measurement
- Editor properties: rule; tolerance; colorway
- Editor modes: compare; edit; review
- Editor operations: select; add; update_property; preview
- Pipeline operations: approve; reject; transition; review; assign
- Artifact operations: import; export
- Export formats: json; svg; csv; markdown
- Import modes: json

Mechanics exclusions:
- Callout geometry bounds stay Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args
</webmcp_action_contract>
