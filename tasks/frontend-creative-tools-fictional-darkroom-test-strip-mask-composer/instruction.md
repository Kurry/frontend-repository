<summary>
Build a darkroom-planning workbench for an entirely fictional black-and-white negative. The user drags the edge of a rectangular exposure mask across a test strip, watches cumulative exposure bands, a synthesized paper preview, zone-density curves, a pass stack, an intersection matrix, a contact-sheet proof, and the eventual print recipe update from one canonical interval mutation, cancels the change once, commits it, selects and annotates the best zone, handles a later lamp-calibration correction without rewriting the original decision, approves the rebased recipe, and exports a portable evidence packet.

This is a local frontend-only browser application using deterministic synthetic grayscale fixtures. It does not persist data to localStorage or a backend. The application must feature responsive design, direct manipulation (spatially moving and resizing exposure masks over a millimeter-addressed test strip), accessible alternate inputs (keyboard, numeric entry, touch steppers, WebMCP), linked evidence propagation (all overlaps sum cumulatively), branch history (event DAG), and a full deterministic artifact round-trip (ZIP with manifest, JSON, CSVs, SVGs, NDJSON, txt, schema).
</summary>

<core_features>
Negative Stage and Millimeter Mask Canvas: Render the synthetic negative, paper strip, zone dividers, pass masks, selected mask handles, cell grid at inspection zoom, and live millimeter rulers. Support drag of mask body and edges/corners with live preview of old/new outlines, covered/removed cell patterns, bounds, area, intersection count, duration, and prospective digest. Support keyboard movement (Alt+Arrow, Alt+Shift+Arrow), exact-geometry modal editor, and mobile full-screen strip with Start X/End X/Top/Bottom steppers.
Pass Stack, Intersections, and Cumulative Exposure: Show order, authored/effective duration, mask dimensions, calibration source/revision, covered zones/cells, and freshness. Matrix crosses passes with zones and other passes to expose x/y overlap, area, cell count, and zero-area edge touches. Support adding, duplicating, splitting, merging, and archiving passes. Cumulative exposure relies on pass intersection exactly using half-open intervals.
Linked Zone Evidence and Deterministic Comparison: Zone rail, density curve, response histogram, contact sheet, sample-cell inspector, and global rank table share a single selection/brush. Hover exposes dense tooltip metrics. Provide a draggable wipe comparing two checkpoints with synchronized before/after charts.
Preferred-zone Decision and Calibration Rebase: Select a preferred zone to open a decision preview (listing hashes, exact metrics, sources, rationale). Edit pass after selection makes decision stale (requires reconfirmation). Handle calibration lamp-correction (changing effective exposure but leaving authored duration/mask intact) with a preview to rebase recipe, producing a child decision while preserving the parent, leaving unaffected zones unchanged and recalculating affected zones.
History, Checkpoints, Review, and Approval: Event DAG exposing accepted, rejected, cancelled, and stale attempts. Undo/redo respects dependencies. Pin/compare checkpoints. Review blocks approval until specific canonical states are met. Approval freezes hashes.
Exact Evidence Packet, Atomic Import, and Reset: Export ZIP (manifest.json, darkroom-project.json, passes.csv, zone-samples.csv, test-strip-proof.svg, mask-plan.svg, events.ndjson, print-recipe.txt, darkroom-project.schema.json). Import ZIP or JSON only validates fully and commits atomically. JSON-only import deterministically regenerates derived artifacts. Reset restores clean fixture.
</core_features>

<user_flows>
Complete negative select -> mask preview/cancel -> mask commit -> brush/inspect -> prefer zone -> alternate-order comparison -> correction cancel/confirm -> note/selective view undo -> checkpoint/review/approve -> exact export/import with no precredited session work.
</user_flows>

<edge_cases>
Test x/y 0, exact right/bottom, width/height 4/5/max/+1, area 99/100/80000/80001, exact-half cell, edge-touch, crossed handle, no-op, stale/double confirm, hidden preferred zone, select-before-edit, correction race, orphan note, wrong response/rank, corrupt each member, and reset cancel; valid state persists and recovery is named.
</edge_cases>

<visual_design>
Inspect clean/selected, idle/hover/drag/resize/invalid-return/confirmed, covered/removed/edge-touch, filtered/hidden-selected/empty, fresh/stale/rebased, draft/reviewed/approved states; the darkroom worktable hierarchy stays legible and meaning never depends on tone/color alone.
</visual_design>

<motion>
Sample early/settled canonical edge move, invalid snap-back, 192-cell membership change, curve/rank/contact-sheet update, correction rebase, and approval invalidation; reduced motion exposes identical endpoints, bounds, patterns, exact deltas, focus, and live announcements.
</motion>

<responsiveness>
At 1440x900, 768x1024, and 390x844, perform real edge preview/cancel/confirm, intersection/brush/curve inspection, zone decision, correction rebase, review/approval, and export/import through desk/tabs/stage/pass cards/evidence sheet/stepper with 44 px targets and no page overflow.
</responsiveness>

<accessibility>
Without pointer, move/resize the focused edge to exact geometry, inspect bounds/cells/exposure/top zones, confirm, traverse matrix/curve table/pass cards/sources/history, decide/rebase/approve/export; mask bounds, membership, exposure, rank, errors, live deltas, and modal focus return are announced.
</accessibility>

<performance>
On 1,000 strips/10,000 passes/100,000 zones/10,000,000 cells/100,000 events, manipulate one visible mask, recompute linked evidence, filter/brush, switch renderer, compare, reveal correction, undo view state, and export/import; meet 100/500/2,000 ms budgets, cancel stale work, retain selection/scroll, and drop no input.
</performance>

<writing>
Trigger every geometry/intersection/exposure/decision/correction/annotation/import/reset failure; copy names the fictional ID, exact coordinate/range/hash/revision or rule, unchanged-state consequence, and recovery without real photographic, chemical, safety, archival, or quality claims.
</writing>

<innovation>
One mask-edge mutation coherently drives half-open interval math, rational cell membership, cumulative exposure, curve/histogram/contact-sheet evidence, stale decision/correction provenance, UI/WebMCP parity, and nine-member visual round trip under cancel and alternate order.
</innovation>

<requirements>
All libraries must be installed locally using npm. Do not use CDNs or external network dependencies.
Use React 19, Vite, Zustand, Tailwind CSS 4.3.2, Framer Motion, and Zod.
Canonical values: Starting plan contains 3 read-only demonstration passes, 3 editable proposed passes.
Select editable pass pass-04, duration 20 deciseconds, whose proposed mask is the half-open rectangle [x=80,y=0,w=80,h=40] mm. Drag its left edge rightward to canonical x=100, leaving its right edge at 160. During the gesture, the proposed interval [100,160), intersection cells, per-zone cumulative deciseconds, predicted paper tones, density curve, affected-zone list, histogram, contact-sheet cells, recipe freshness, and prospective packet digest update as non-committing feed-forward. Release and inspect a confirmation. Cancel once.
Repeat the same gesture and confirm. Exactly one event evt-041 changes pass-04.mask.xMm from 80 to 100, its width from 80 to 60, and its rectangle hash from rect-a5d0 to rect-b640. Zone z-04 cumulative exposure changes from 100 to 80 deciseconds. Exactly 192 logical paper cells change pass-membership.
Choose z-04 as preferred zone (metrics: target error 2, highlight reserve 12, shadow separation 9, clipping count 0). Record rationale, confidence working, source links cal-02,cal-07.
Advance logical time to reveal fixture correction corr-03: output factor 1.000 changed to 0.900 for pass-04. Rebase recipe, updating affected zones cumulative effective exposure while keeping authored duration/mask intact and maintaining decision parent.
Export exact 9-file ZIP.
API-shaped records: NegativeRecord, StripRecord, ExposurePassRecord, ZoneDecisionRecord, AnnotationRecord, CheckpointRecord, ReviewRecord, ApprovalRecord, HistoryEvent.
Geometry: Half-open millimeter bounds [x,x+width) x [y,y+height). Commutative intersections.
Exposure: Effective exposure milli-deciseconds = durationDs * outputFactorMilli.
All mutation paths call one canonical handler and generate the exact same events.
</requirements>

<integrity>
Do not use localStorage, sessionStorage, IndexedDB, or backend APIs. All state must remain in-memory and be exportable/importable via ZIP/JSON.
Verify exact exact rational arithmetic and correct half-open boundary logic.
Follow the canonical file structures and definitions for ZIP members exactly.
</integrity>

<delivery>
Provide the solution in solution/app. Provide evidence.webm walking through the critical canonical paths.
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
- Editor object types: mask
- Editor properties: duration; geometry
- Editor modes: preview; compare
- Editor operations: select; update_property; switch_mode; preview; set_content
- Entity: pass; decision; history_event
- Entity operations: create; select; update; delete; toggle; reorder
- Entity fields: geometry; duration; zoneId; rationale; sources
- Artifact operations: export; import; copy
- Export formats: session-zip
- Import modes: session-zip; session-json

Mechanics exclusions:
- Drag/resize of masks stays Playwright (gesture mechanics)
- Raw file paths/blobs forbidden in WebMCP args
- Zip construction fidelity stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
