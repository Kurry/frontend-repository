<summary>
A fictional photo editor selecting and sequencing a coherent 12-image story from a fixed shoot.
The user groups burst frames, compares images in synchronized loupes, rates/flags/culls with provenance, adjusts nondestructive crop/rotation previews, enforces subject/scene/quality coverage, builds and branches a narrative sequence, reviews duplicate and continuity findings, approves a final edit, and exports a reversible edit-decision package plus contact sheets.
This is not an image annotation tool or gallery. The signature interaction is dragging frames between burst clusters and story positions while compare selection, duplicate relationships, coverage matrix, crop/rotation, continuity timeline, branch diff, review state, and artifacts update together.
</summary>

<core_features>
- Contact sheet and burst clustering: Frames appear in a zoomable grid ordered by capture time. Users lasso/select, drag frames into/out of named burst clusters, collapse/expand clusters, and choose a representative. A frame belongs to at most one burst. Keyboard range selection/move and mobile source-target sheets equal pointer operations.
- Synchronized compare loupe: Two to four selected frames compare at identical normalized pan/zoom with optional subject-region lock. Histograms, metadata, sharpness/exposure fixture values, flags, crops, and difference notes stay aligned. Changing one compare slot never changes rating/cull state. Keyboard next/previous within burst preserves loupe transform.
- Rating, pick, and cull provenance: Frames have 0-5 stars, pick/alternate/reject, color tag, and cull reason (duplicate, focus, exposure, expression, composition, coverage, or other). Rejecting a current burst representative requires another representative or explicit empty-burst decision. Bulk changes preview exact affected ids and append decision events rather than erasing prior ratings.
- Nondestructive crop and orientation: Users draw/resize a normalized crop, rotate by 90 degrees, set aspect ratio, and position a safe subject region. Original pixels never change. Crops must stay in bounds, meet minimum dimensions, and include required subject regions unless an exception is documented. Keyboard handles and mobile numeric crop sheets equal pointer edits.
- Coverage and duplicate graph: The fixture requires counts across opening, place, people, detail, action, transition, and closing roles plus subject/scene diversity. A matrix and rings show selected versus required coverage. Duplicate edges and similarity clusters are immutable analysis inputs; the user accepts/rejects duplicate interpretation with note. Selecting a cell/edge highlights exact frames and sequence slots.
- Narrative sequence and branches: Picked frames drag into a 12-slot horizontal story with role, transition type, caption draft, and optional alternate. Rules enforce exact length, role minima, no same-burst adjacency, timestamp reversal limit, duplicate exclusion, and declared orientation rhythm. Users fork sequence branches, compare frame/order/crop/caption/coverage deltas, and merge each conflicting slot/property.
- Review workflow and stale state: The deterministic reviewer checks technical rejects, duplicate picks, crop subject loss, coverage, sequence continuity, caption-source mismatch, and unresolved decisions. Findings cite exact frames/slots/values. Approval freezes source revision, decisions, crops, active sequence, and artifact checksums. Later material edits mark approval stale.
- Responsive editor and artifacts: Desktop shows contact sheet, compare loupe, sequence, and coverage/review rail. Mobile becomes frame/burst cards, full-screen compare carousel, rating/crop sheets, vertical story slots, and coverage/finding drawers. Export produces canonical JSON, CSV frame decision ledger, SVG contact sheet with crop overlays, and Markdown edit decision list/captions; import reconstructs state exactly.
</core_features>

<user_flows>
- Depth-first execution is mandatory for this group: complete its named outcome, every interaction and visible state, every connected view and derived/artifact effect, then exhaust enhancements, boundary and invalid/empty/conflict cases, recovery/undo/retry, alternate input, responsive behavior, accessibility, motion, and polish before beginning the next group. A feature is incomplete while any connected state, edge case, recovery path, or TODO/shallow placeholder remains.
- 20-second demo: Lasso a burst, choose a representative, compare three frames with synchronized subject zoom, reject a duplicate with reason, crop the pick until subject containment fails then repair it, drag picks into a 12-slot story, branch and merge a sequence conflict, resolve a coverage gap, approve, and export.
- Implement each component end-to-end first: state model, rendering, stream/error/approval/retry paths, persistence, verification assertions.
- Map every dependency before continuing: UI widgets, schemas, tool contracts, exports, WebMCP bindings, and test assertions.
- Explore each dependency recursively, then explore how each loops back through shared state and event timelines.
</user_flows>

<visual_design>
- Linked views: Contact sheet, burst clusters, compare loupe/metadata, decision history, crop preview, duplicate graph, coverage matrix, story sequence, reviewer, and artifacts share one reducer.
- Inspect selected/clustered/representative/pick/alternate/reject, compare, crop-invalid, duplicate, coverage/slot/branch/stale/approved states, ensuring hierarchy stays legible.
</visual_design>

<motion>
- Causal motion: Frame movement, loupe synchronization, crop/subject overlays, coverage/sequence propagation, and branch merge explain cause; reduced motion retains persistent moved/changed-slot/crop deltas.
</motion>

<responsiveness>
- Complete at 1440, 768, and 375 viewports: frame/burst/compare/rating/crop/sequence/review mobile flows retain every action, 44-pixel targets, no overflow.
- Mobile transformation: Frame/burst cards, compare carousel, rating/crop sheets, vertical sequence, and coverage/finding drawers preserve the complete job.
</responsiveness>

<accessibility>
- Alternate input: Range/lasso equivalent, burst move, loupe navigation, rating/cull, crop handles, sequence reorder/branch/merge, finding review, and export have keyboard paths.
- Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts (including undo and command/search where promised), modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.
</accessibility>

<performance>
- At the proposal maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.
</performance>

<writing>
- Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
</writing>

<requirements>
- The app must be styled using Tailwind CSS 4.3.2.
- The app must use only npm-local dependencies; no CDN links are allowed.
- Dashboard-derived hardness contract: The whole job is incomplete unless the implementation proves every clause below through the proposal own named entities, canonical mutation, linked views, and portable artifact.
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
- For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization. No-op, invalid, cancelled, and double activation paths must create zero extra events.
- Exercise adversarial orderings, including canonical edit before/after the proposal merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit; report every file/record/field diagnostic together; reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
- Make the useful end state an interoperable downloadable artifact of the session actual work. Specify exact filenames, schemas, required keys/columns, units, precision, stable sort order, relationship integrity, and regenerated generatedAt/exportedAt values. A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
- Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions/import attempts must not silently share or overwrite state.
- Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules.
- Artifact contract: ContactSheetEdit uses schemaVersion contact-sheet-edit/v1 and stores fixture/hash, immutable frame metadata/analysis, burst clusters/representatives, compare state, append-only rating/flag/cull events, current decisions, normalized crops/orientations/exceptions, duplicate review decisions, sequence branch DAG/slots/roles/transitions/captions/alternates/merge choices, reviewer runs/findings/approval, filters/annotations/history, derived coverage/continuity/geometry/artifact checksums, CSV, SVG, Markdown, and UTC exportedAt.
- Frame ids and immutable metadata/hash remain fixed; each frame belongs to at most 1 burst with valid representative semantics.
- Decision events are append-only and current state derives deterministically; bulk operations preserve ordered ids/reason.
- Crops use integer millionths normalized to oriented image, remain bounded/minimum-size, and satisfy required region or typed exception.
- Active sequence has exactly 12 unique picked frames and satisfies role/adjacency/time/duplicate/orientation rules; branch DAG is acyclic with resolved merges.
- Approval checksum is current and findings/coverage derive from exact active selection.
- CSV event/current-decision rows, SVG thumbnail/order/crop overlays, and Markdown slot/caption/cull rationale agree with canonical approved edit.
- Import rejects fixture/hash mismatch, duplicate burst/sequence membership, invalid representative/event/crop, branch cycle/unresolved merge, forged analysis/review/checksum, unsafe SVG, or artifact disagreement atomically.
- Canonical re-export changes only exportedAt; CSV, SVG, and Markdown remain byte-identical.
- Deterministic fixture: The fictional River Market Morning shoot contains 72 local image assets with immutable ids, dimensions, timestamps, camera metadata, scene/subject tags, deterministic perceptual-cluster ids, quality values, face/subject regions, and histograms. The starter set includes 14 bursts, eight near-duplicate pairs, three technical rejects, and exact final-edit requirements. No real people or AI/network are used.
- Canonical mutation: Replacing or cropping one picked frame changes burst/decision state, duplicate/coverage matrix, sequence continuity, review/approval, history, WebMCP state, and artifacts.
- CRUD substitution: Forms cannot express dense contact-sheet selection, synchronized visual compare, nondestructive crop geometry, burst/duplicate relationships, or branchable image sequencing.
- Verification, scope, and pilot: Fresh load shows immutable images/metadata/analysis and unreviewed starter grouping with no user decision, crop, sequence, branch, review approval, annotation, or export. WebMCP exposes fixture queries and canonical cluster/representative, compare, decision, crop/orientation, duplicate review, sequence/branch/merge, review/approval, history, artifact, transfer, and reset handlers. Browser verification grades real grid/range/drag, synchronized loupe, crop handles, keyboard paths, focus, motion, responsive transformation, and downloaded CSV/SVG/Markdown parsing.
- In scope: One fictional local shoot, 5000 images, bounded clusters/branches, JSON + CSV + SVG + Markdown.
- Out of scope: Pixel editing/raw processing/generation, real photo upload, face recognition, cloud storage, collaboration, accounts, network, or backend persistence.
- Depth-first completion protocol completion gates: No TODO markers in user-facing behavior. Every feature branch has an explicit observable evidence path. Stream replay, retry, and cancellation outcomes are deterministic and non-duplicated. Zero partial mutation on validation/import failure. Final artifacts round-trip to the same canonical state shape, including timestamps/provenance fields.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in /app; scaffold under /app as needed for the stack in <summary>; /app/package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds); run via npm start on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run npm run verify:build and confirm it exits 0, then run npm start and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same verify:build gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the <webmcp_action_contract> below; register tools yourself from <module_spec> + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool only.
- Self-test tooling is preinstalled and optional to use: playwright@1.61.0 and @playwright/mcp are installed globally with browsers ready under /ms-playwright, a shared headless Chrome already exposes CDP at http://127.0.0.1:9222, and the same CDP bridge the verifier runs is baked at /opt/webmcp/webmcp_stdio_server.mjs. Drive your served app through that Chrome (playwright connectOverCDP, or npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222), and run node /opt/webmcp/webmcp_stdio_server.mjs (stdio MCP; defaults to that endpoint) to exercise your registered window.webmcp_* tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- structured-editor-v1
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
- Entity: burst-cluster; sequence-branch
- Entity operations: select; update; toggle; delete
- Entity fields: burst-representative; compare-slot; rating; cull-reason; duplicate-decision; approval-status
- Editor object types: crop-region; story-slot; caption
- Editor properties: aspect-ratio; rotation; safe-subject-region; transition-type
- Editor operations: select; add; update_property; switch_mode
- Editor modes: contact-sheet; compare-loupe; coverage; reviewer
- Artifact operations: export; import
- Export formats: contact-sheet-edit-json; decision-ledger-csv; contact-sheet-svg; decision-markdown
- Import modes: contact-sheet-edit-json

Mechanics exclusions:
- Frame drag-and-drop between burst clusters and into sequence slots is a gesture mechanism graded via Playwright.
- Drawing or resizing crop handles on the image is graded via Playwright; crop state changes can happen via WebMCP for bulk updates but physical crop drawing requires Playwright.
- Selecting ranges via lasso or shift-click is a gesture graded via Playwright.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
