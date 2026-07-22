<summary>
Proposed slug: frontend-creative-tools-contact-sheet-narrative-editor
Archetype: creative tools
Genre: hard browser app/photo selection and sequencing studio
Source basis: framework-agnostic synthesis of image, carousel, branch, actions, task pipeline, prediction, results review, and adaptive-grid primitives
Target user: A fictional photo editor selecting and sequencing a coherent 12-image story from a fixed shoot

The user groups burst frames, compares images in synchronized loupes, rates/flags/culls with provenance, adjusts nondestructive crop/rotation previews, enforces subject/scene/quality coverage, builds and branches a narrative sequence, reviews duplicate and continuity findings, approves a final edit, and exports a reversible edit-decision package plus contact sheets.
</summary>

<core_features>
- Contact sheet and burst clustering: Frames appear in a zoomable grid ordered by capture time. Users lasso/select, drag frames into/out of named burst clusters, collapse/expand clusters, and choose a representative. A frame belongs to at most one burst. Keyboard range selection/move and mobile source-target sheets equal pointer operations.
- Synchronized compare loupe: Two to four selected frames compare at identical normalized pan/zoom with optional subject-region lock. Histograms, metadata, sharpness/exposure fixture values, flags, crops, and difference notes stay aligned. Changing one compare slot never changes rating/cull state. Keyboard next/previous within burst preserves loupe transform.
- Rating, pick, and cull provenance: Frames have 0–5 stars, pick/alternate/reject, color tag, and cull reason duplicate|focus|exposure|expression|composition|coverage|other. Rejecting a current burst representative requires another representative or explicit empty-burst decision. Bulk changes preview exact affected ids and append decision events rather than erasing prior ratings.
- Nondestructive crop and orientation: Users draw/resize a normalized crop, rotate by 90 degrees, set aspect ratio, and position a safe subject region. Original pixels never change. Crops must stay in bounds, meet minimum dimensions, and include required subject regions unless an exception is documented. Keyboard handles and mobile numeric crop sheets equal pointer edits.
- Coverage and duplicate graph: The fixture requires counts across opening, place, people, detail, action, transition, and closing roles plus subject/scene diversity. A matrix and rings show selected versus required coverage. Duplicate edges and similarity clusters are immutable analysis inputs; the user accepts/rejects duplicate interpretation with note. Selecting a cell/edge highlights exact frames and sequence slots.
- Narrative sequence and branches: Picked frames drag into a 12-slot horizontal story with role, transition type, caption draft, and optional alternate. Rules enforce exact length, role minima, no same-burst adjacency, timestamp reversal limit, duplicate exclusion, and declared orientation rhythm. Users fork sequence branches, compare frame/order/crop/caption/coverage deltas, and merge each conflicting slot/property.
- Review workflow and stale state: The deterministic reviewer checks technical rejects, duplicate picks, crop subject loss, coverage, sequence continuity, caption-source mismatch, and unresolved decisions. Findings cite exact frames/slots/values. Approval freezes source revision, decisions, crops, active sequence, and artifact checksums. Later material edits mark approval stale.
- Responsive editor and artifacts: Desktop shows contact sheet, compare loupe, sequence, and coverage/review rail. Mobile becomes frame/burst cards, full-screen compare carousel, rating/crop sheets, vertical story slots, and coverage/finding drawers. Export produces canonical JSON, CSV frame decision ledger, SVG contact sheet with crop overlays, and Markdown edit decision list/captions; import reconstructs state exactly.
</core_features>

<visual_design>
- Inspect selected/clustered/representative/pick/alternate/reject, compare, crop-invalid, duplicate, coverage/slot/branch/stale/approved states -> hierarchy stays legible.
</visual_design>

<motion>
- Cluster/move, sync compare, crop, replace/reorder sequence, propagate coverage, merge, then repeat reduced -> causal endpoints/state agree.
- Causal motion: Frame movement, loupe synchronization, crop/subject overlays, coverage/sequence propagation, and branch merge explain cause; reduced motion retains persistent moved/changed-slot/crop deltas.
</motion>

<requirements>
- In-memory state only: DO NOT use localStorage, sessionStorage, indexedDB, or any other browser storage APIs.
- The fictional River Market Morning shoot must contain exactly 72 local image assets with immutable ids, dimensions, timestamps, camera metadata, scene/subject tags, deterministic perceptual-cluster ids, quality values, face/subject regions, and histograms. The starter set includes 14 bursts, eight near-duplicate pairs, three technical rejects, and exact final-edit requirements. No real people or AI/network are used. (Include these 72 local assets statically via data URI, generated placeholder svgs, or static JSON + canvas drawing as they must not rely on network).
- Implement the whole job described. No skip-stubs, no fabricated outputs.
- ContactSheetEdit uses schemaVersion: "contact-sheet-edit/v1" and stores fixture/hash, immutable frame metadata/analysis, burst clusters/representatives, compare state, append-only rating/flag/cull events, current decisions, normalized crops/orientations/exceptions, duplicate review decisions, sequence branch DAG/slots/roles/transitions/captions/alternates/merge choices, reviewer runs/findings/approval, filters/annotations/history, derived coverage/continuity/geometry/artifact checksums, CSV, SVG, Markdown, and UTC exportedAt.
- Frame ids and immutable metadata/hash remain fixed; each frame belongs to <=1 burst with valid representative semantics.
- Decision events are append-only and current state derives deterministically; bulk operations preserve ordered ids/reason.
- Crops use integer millionths normalized to oriented image, remain bounded/minimum-size, and satisfy required region or typed exception.
- Active sequence has exactly 12 unique picked frames and satisfies role/adjacency/time/duplicate/orientation rules; branch DAG is acyclic with resolved merges.
- Approval checksum is current and findings/coverage derive from exact active selection.
- CSV event/current-decision rows, SVG thumbnail/order/crop overlays, and Markdown slot/caption/cull rationale agree with canonical approved edit.
- Import rejects fixture/hash mismatch, duplicate burst/sequence membership, invalid representative/event/crop, branch cycle/unresolved merge, forged analysis/review/checksum, unsafe SVG, or artifact disagreement atomically.
- Canonical re-export changes only exportedAt; CSV, SVG, and Markdown remain byte-identical.
- Use Tailwind CSS 4.3.2.
- All libraries must be installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
</requirements>

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
- Editor object types: frame-crop, sequence-slot
- Editor properties: crop-dimensions, slot-role, slot-caption
- Editor modes: compare, crop, sequence, review
- Editor operations: select, update_property, switch_mode, preview
- Entity: burst, frame, branch, finding
- Entity operations: create, select, update, delete, reorder
- Entity fields: representative, rating, flag, cull-reason
- Artifact operations: export, import
- Export formats: contact-sheet-edit-json, csv, svg, markdown
- Import modes: contact-sheet-edit-json

Mechanics exclusions:
- Dragging frames into bursts/sequence stays Playwright
- Drawing/resizing crop handles stays Playwright
- File picker interaction stays Playwright

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
</webmcp_action_contract>
