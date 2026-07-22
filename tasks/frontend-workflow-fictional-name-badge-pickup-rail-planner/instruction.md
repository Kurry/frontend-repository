<summary>
Build a Fictional Name-Badge Pickup Rail Planner using React 19, Vite, Zustand, Tailwind CSS 4.3.2, and Framer Motion. The app allows an organizer to arrange fictional badge packets for an arrival rehearsal across four hooks. It uses strictly in-memory state without browser persistence mechanisms like localStorage, and produces a ten-file exported packet (including a standalone HTML proof) that perfectly matches the live canonical state.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at /reference-screenshots/. Recreate what they show. Where a screenshot and the text conflict, the text wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Feature: Badge rail and invalid-return recovery —
Render four named hooks (A–F, G–L, M–R, S–Z), 12 slots each, range boundaries, badge packets with fictional names/symbols, overflow lip, snap halos, selected provenance, back-mark preview, and issue markers.
Dragging BADGE-27 shows its origin ghost, target insertion slot, shifted ordinal ghosts, range-key proof, old/new counts, balance, redirect/completion effects, and exact snap distance.
Canonical release opens one confirmation sheet with badge/attendee IDs, normalized key, old/new hook/slot, shifted badges, route delta, issue effect, rail hash, and artifacts. Confirm commits once.
Cancel, Escape, double confirm, wrong range, full hook, occupied/stale slot, snap 13/14/15, invalid key, locked badge, no-op, pointer outside rail, and cross-session drag restore rail, selection, viewport, brush, cursor, focus, hashes, approval, and event count. Invalid return visibly slides the badge along its route back to the overflow lip.

Feature: Exact, keyboard, and compact placement —
Hooks/slots use roving tabindex in range then slot order. Arrow keys move among slots; Home/End select first/last legal slot; Enter opens the exact placement sheet.
Selecting BADGE-27, choosing HOOK-MR slot 7, and confirming creates the same event, geometry, shifted order, counts, profile, route, selection, persistence, and normalized artifact bytes as pointer placement.

Feature: Linked arrival profile, route, and issue evidence —
Rail, alphabet ribbon, badge-back preview, arrival timeline, hook histogram, balance gauge, redirect path, route-step ribbon, issue graph, history, scenario comparison, and packet preview share one stable-ID model.
Selecting attendee, badge, hook, slot, arrival, profile bar, redirect step, issue, event, or artifact record highlights the same provenance everywhere.
Brush any contiguous arrival sequence 1..48. The profile recomputes selected hook counts, modal hook using stable range order, redirect count, route steps, completion time, and affected issues without mutating the plan. Canonical movement while 1..48 is brushed produces exact linked deltas once. Filtering/sorting after movement retains BADGE-27 or shows explicit filtered-selection provenance; it never leaves a stale hook, slot, route, or back mark.

Feature: Check-in rehearsal and range repair preview —
The deterministic rehearsal runs on an isolated copy through ready→arrive→locate-hook→redirect-or-pickup→complete→mark. Step one attendee, one route step, or to next redirect. Before repair, ATT-27 visits G–L then M–R and adds 30 seconds. After repair, all 48 attendees use one step each, no hook exceeds 12, completion is 09:23:50.000Z, and the mark is verified. Reset restores the exact authored rail without completing canonical arrivals.
Reduced motion replaces badge travel and route pulses with numbered before/after hook cards, exact slot/shift lists, normalized name key, route steps, signed count/balance/completion deltas, issue status, and live phase text.
Preview changing the range boundary between G–L and M–R from L|M to M|N. The preview shows affected badges, new capacities, range ghosts, route deltas, and deterministic repair order by key/name/ID. Cancel restores all state. Confirmation is prohibited in the fixture because G–M would exceed capacity 12; no partial badge move, back-mark rewrite, or history event may occur.

Feature: Scenario branches, actor history, comments, and approval —
Baseline and Balanced branches share stable attendee/badge/arrival fixtures but store rail occupancy, brush, comments, rehearsal, and approval independently. Compare aligns badge/hook IDs and shows signed count, deviation, redirect, route-step, completion, issue, rehearsal, and artifact-hash deltas. Brushing a delta selects linked rail geometry.
Ari authors the canonical move. Sol then anchors COMMENT-06 keep Mero on M–R to BADGE-27, HOOK-MR, and ISSUE-05. Selectively undoing Ari's event returns the badge to the exact G–L overflow coordinate, restores counts/redirect/completion, and reopens the issue while preserving Sol's comment ID, text, actor, logical time, references, and visible orphan/provenance anchor. Redo/reapply restores the rail without duplicating the comment. Editing after undo forks history and retains the abandoned future with hashes.
Review status is needs-work|ready|accepted-fictional with optional note 0..240. Any occupancy, range, back mark, arrival fixture choice, comment resolution, branch, or import mutation stales approval. Approval requires 48 conserved badges, every hook exactly 12, every badge range-valid, zero redirect/unresolved issue, current verified rehearsal, one resolved comment, confirmed scenario comparison, and validated packet preview.

Feature: Atomic import and independent proof —
Import accepts plan.json alone or the exact ZIP. It parses every file/record/field, presents attendee/badge/hook/slot/profile/route/history/rehearsal/approval diffs, and commits only after confirmation. Cancel or any contradiction leaves current state byte-for-byte unchanged including selection, viewport, brush, cursor, filters, focus, branch, approval, persistence, and event count.
Exported proof.html opens without network access or app CSS. Keyboard users traverse hooks/slots/badges, brush arrivals, inspect profile/routes/issues, step/reset rehearsal, compare Baseline/Balanced, traverse comments, and view canonical before/after placement. Its embedded normalized plan hash, rail geometry, sorted slot order, back marks, arrival route, SVG paths, and rehearsal sequence match the packet exactly.
</core_features>

<user_flows>
- Starting incomplete, brush arrivals, move badge, inspect linked evidence, preview/cancel invalid range repair, comment, selectively undo/redo, fork/compare, rehearse 48 pickups, review, approve, export, mutate, import, and reproduce proof.
</user_flows>

<edge_cases>
- Exercise slot 0/1/12/13, hook count 11/12/13, snap 13/14/15, wrong-range/invalid-key/locked/stale/duplicate/cross-session badge, occupied slot, outside release, cancel/double confirm, rehearsal redirect/reset, stale approval, bad hash, stale route, and back-mark mismatch; every rejection preserves exact state.
</edge_cases>

<visual_design>
- At 1440×900, the four patterned hooks and badge rail dominate while alphabet ribbon, arrivals/profile, routes, issues, rehearsal, and history form a deliberate welcome desk; overflow, preview, invalid, selected, redirected, branched, rehearsed, and approved states remain legible without color alone.
- Fresh, placement-preview, canonical, invalid-return, linked-selection, brushed, rehearsal, range-repair ghost, canceled, branched, approved, desktop, compact, reduced-motion, SVG, and standalone HTML states match authored oracle geometry, patterns, hierarchy, and endpoints.
</visual_design>

<motion>
- Sample canonical badge/slot shift, profile/route/completion transition, one rehearsal pickup, repair cancel, and invalid return at early/settled frames; motion explains causality and reduced motion exposes equivalent hooks, slots, routes, deltas, IDs, patterns, and phase status.
</motion>

<responsiveness>
At 390×844 the desktop rail/profile desk becomes one focused hook stack with a vertical range strip. Badges, Arrivals, Routes, and Proof are mutually exclusive bottom sheets. A large range picker and Place badge control replace precision dragging while using the same reducer. Other hooks become swipe cards with count/balance rings; every target is at least 44×44 and the page never scrolls horizontally.
</responsiveness>

<accessibility>
Without pointer input, select BADGE-27, choose M–R slot 7, confirm, brush arrivals, inspect linked evidence, cancel repair, undo/redo, rehearse, review, and export; focus/trap/return, announcements, event, shifted order, route, hashes, and artifacts equal pointer use.
</accessibility>

<performance>
- With 10,000 attendees/badges, 500 hooks, 10,000 arrivals, 5,000 issues/comments, and 20,000 events, move one visible badge and scrub 100 rehearsal/history states; acknowledgement remains under 100 ms, views settle under 500 ms, and import/export finishes under 2 seconds without dropped input or resource growth.
</performance>

<writing>
- Trigger key, range, capacity, slot, route, rehearsal, history, approval, and import faults; copy names stable entity/field/relation, rejected value or exact fictional rule, unchanged state, and recovery without real identity, access, or event claims.
</writing>

<innovation>
One badge placement reconciles rail geometry, alphabet classification, sorted occupancy, arrival profile, hook balance, redirect topology, rehearsal timing, actor history, WebMCP, and standalone proof through one stable-ID model, not covered by other tasks and requires evidence.
</innovation>

<requirements>
- Shared application state must use Zustand stores (in-memory only). Do not use localStorage, sessionStorage, or other browser storage APIs; a page reload returns the app to its seeded state.
- Stack: React 19, Vite, Zustand, Tailwind CSS 4.3.2, Framer Motion, and Lucide React.
- Fictional data only; no real identities.
- API-shaped state object structure per proposal: planId, attendees, badges, hooks, slots, arrivals, profile, issues, comments, selection, viewport, arrivalBrush, rehearsal, history, approval, generatedAt, exportedAt.
- All libraries installed via npm and bundled locally.
- Ship a downloadable end state with exact 10 artifacts including standalone proof.html, csvs, svgs, json and markdown.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`.
- `package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds).
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below.
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
- Editor object types: badge-rail; check-in-rehearsal
- Editor properties: approval-status; brush-sequence
- Editor modes: baseline; balanced
- Editor operations: select; update_property; switch_mode; preview; set_content
- Entity: comment; scenario; badge-move
- Entity operations: create; select; update; delete; toggle
- Entity fields: badgeId; hookId; slotId
- Artifact operations: export; import; copy
- Export formats: packet-zip; standalone-proof
- Import modes: plan-json; packet-zip

Mechanics exclusions:
- Drag-paint / badge drag geometry stays Playwright (gesture mechanics)
- File selection stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
</webmcp_action_contract>
