<summary>
A learner imports or edits a deterministic flashcard deck, freely groups cards on a tabletop, commits groups as tags, runs a due-card review session, rates recall to move cards through five Leitner boxes, inspects scheduling and mastery changes across linked terrain/radial/timeline views, repairs malformed imports, and exports an interoperable deck with complete review history. The app uses in-memory state only (no localStorage) and produces a downloadable JSON/TSV artifact.
</summary>

<core_features>
Feature: Deterministic fixture —


Feature: Fixture —
Feature: Fixture load —
- First load populates a starter deck of exactly 30 fictional cards across six topics with a fixed local date 2026-03-10.
- The deck is distributed across five Leitner boxes with fixed intervals (1, 2, 4, 8, 16 days).
- Twelve cards are marked due, four are new, and two contain intentionally malformed optional import fields in a separate diagnostic fixture.
- Each card has a unique id, front/back Markdown subset text, tags, box, due date, difficulty, tabletop position, and immutable creation order.

Feature: Spatial tabletop and grouping —
- Cards can be freely dragged on a bounded 1600x1000 tabletop.
- Cards can be multi-selected by lasso and moved by keyboard on a 10-pixel grid, stacked, or distributed.
- Overlapping cards remain separately focusable through a stack fan.
- Drawing a named group region assigns a tag to contained card centers.
- Moving a card across a region border previews membership and commits on drop. Group regions may overlap, producing multiple tags.

Feature: Five-box memory terrain —
- The terrain view shows five spatial bins sized by card count and colored accessibly by interval.
- Dragging a non-session card between boxes creates a manual adjustment requiring a reason, and recomputes the due date from the fixed today (2026-03-10).
- Keyboard/mobile box pickers are available and equivalent to drag.
- During a review session, only rating transitions may move the active card.

Feature: Deterministic review engine —
- Starting a review freezes an ordered queue: overdue first by due date, then due, then new, with creation-order tie break and optional selected-tag filter.
- The active card flips front/back through pointer, Enter, or swipe.
Ratings again|hard|good|easy apply exact transitions: again→box1 today+1, hard→max(1,box-1), good→min(5,box+1), easy→min(5,box+2), using destination interval.
- A card can only be rated after it has been revealed.

Feature: Session replay and correction —
- The review ledger records reveal, rating, before/after box, due dates, response-time bucket, and queue mutation.
- Undo of the latest rating restores the card and queue position; earlier history is immutable until the session ends.
- Replay walks the completed session without mutating state.
- Abandoning saves the remaining queue; resuming reconstructs it exactly from the frozen session plan.

Feature: Mastery radial and due forecast —
- An interactive sunburst groups topic → box → card and shares selection with terrain/tabletop.
- A 30-day due heat strip and stacked forecast show scheduled counts.
- Selecting a radial wedge or date filters/highlights cards everywhere without altering the frozen active review queue.
- Mastered means box 5 with a successful latest rating; learning/new definitions are explicit.

Feature: Error clusters and card editing —
- Cards rated again/hard cluster in a mistake constellation by shared tags and fixture similarity edges.
- Selecting a cluster opens exact fronts/backs and review history.
- Card content uses a bounded Markdown subset and live preview.
- Edits during an active session are staged until session end so the frozen queue remains stable.
- Duplicate normalized front text is blocked.

Feature: Import diagnostics and artifact —
- JSON/TSV import shows row/field errors and supports cell-level repair before atomic commit.
- Merge matches card id, with explicit keep/import/merge choices; replace requires confirmation and remains undoable before another mutation.
- Export/import preserves cards, tags, regions, tabletop positions/stacks, boxes/due dates, sessions, history, selection/view state, and derived checksums.
</core_features>

<visual_design>
- Inspect stacked, grouped, due, active, revealed, rated, mastered, errored, filtered, and imported states to ensure spatial hierarchy remains legible.
- The 5 boxes are colored accessibly to reflect their intervals.
- The sunburst (mastery radial) clearly visually groups topic to box to card.
- Error clusters render distinctly as a constellation.
</visual_design>

<motion>
- Group/move, flip/rate, undo/replay, filter, and repeat operations have causal motion that explains scheduling and final box/date state.
- Card travel/flip, bin/radial/forecast updates, and replay explicitly animate to show scheduling transitions.
- A reduced motion setting uses instant endpoints plus persistent before/after box/date cues.
</motion>

<requirements>
- Tailwind CSS 4.3.2 is used for styling.
- All assets and styling must be loaded without using an external CDN (npm-local packages only).
- Desktop layout must show tabletop/terrain, review, radial, forecast, and clusters.
- Tablet transforms to spatial-view tabs.
- Mobile transforms into card stack, five-box carousel, tag-region list with coordinate editor, full-screen review, radial/forecast sheets, and import repair table.
- Every group, move, edit, review, undo, filter, import, and export action remains reachable with 44-pixel targets on mobile.
- Support complete keyboard operation (select/move/group cards, operate terrain/review, navigate radial/forecast, edit/repair, undo, export) with matching focus/state.
- Good-app genre: all state is in-memory only (NO localStorage).

Feature: Export requirement —
Feature: Export artifacts —
- The exported artifact must be an interoperable JSON or TSV deck with complete review history, containing fixed-today/timezone, ordered cards, tags/group regions, tabletop positions/stack order, box/due/manual adjustments, active/completed sessions, review events, staged edits, view state, ordered history, derived mastery/forecast/checksums, and UTC exportedAt.
- Card ids/front-normalizations are unique; front/back length 1–500; box integer 1–5; due ISO date; positions multiples of ten within bounds.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1
- command-session-v1

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

<module_spec id="command-session-v1">
{
  "id": "command-session-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Command / session",
  "purpose": "Media, games, presentations, simulations, demos, and remote-control shells.",
  "permitted_operations": ["start", "pause", "resume", "stop", "restart", "advance", "trigger_demo", "connect", "disconnect"],
  "binding_keys": {
    "required_any_of": [["session_operations"]],
    "optional": ["demos", "visible_postconditions"]
  },
  "restrictions": [
    "No batching or replay of gameplay.",
    "Timing, animation, collision, repeated input, and transient UI require immediate Playwright observation.",
    "Tool output cannot prove successful playback or connection."
  ],
  "tool_name_prefix": "session"
}
</module_spec>

Bindings:
- Editor object types: card; deck
- Editor properties: front; back; box; due; tags; group_region
- Editor modes: edit; move; group
- Editor operations: select; update_property; switch_mode
- Entity: card
- Entity operations: create; select; update; delete
- Artifact operations: export; import; copy
- Export formats: session-json; tsv
- Import modes: session-json; tsv
- Session operations: start; stop; restart; advance; undo

Mechanics exclusions:
- Drag-and-drop mechanics stay Playwright (gesture mechanics)
- Mobile touch/swipe gestures stay Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args
- Animations and replay effects stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
