# Comic Panel Continuity Studio

<summary>
The user lays out pages and panels, stages characters and props, defines camera and reading direction, writes and orders balloons, tracks continuity facts across panels, branches alternate beats, resolves violations, prepares print spreads, and exports a reproducible production packet.
This is not a drawing canvas or note board. The signature interaction is dragging a character, prop, balloon, or camera axis in one panel while continuity threads, adjacent-panel overlays, reading-order paths, branch differences, print bounds, issue queue, and artifacts update together.
</summary>

<core_features>
- Page and panel geometry: Users can split, merge, resize, reorder, and gutter-align panels on page and spread views. Geometry uses exact normalized coordinates with minimum sizes and print-safe/bleed bounds. Keyboard and mobile numeric controls equal pointer edits; invalid operations remain previews with recovery choices.
- Staging and camera axis: Users can place abstract character and prop tokens with pose, facing, depth, handedness, held-by, entrance/exit, and camera-side state. Move/rotate/flip operations update local coordinates and screen direction. Crossing the established axis is flagged unless explicitly bridged or annotated.
- Balloons and reading order: Users can create dialogue, thought, caption, and sound-effect objects; edit tail target, bounds, speaker, and order. The reading path follows locale fixture, panel order, and manual overrides. Collisions, orphan tails, ambiguous order, and overflow are visible and keyboard-addressable.
- Continuity thread lattice: Users track costume, injury, prop ownership, location, time, lighting, facing, knowledge, and dialogue facts across panel intervals. Selecting a fact highlights introduction, persistence, mutation, contradiction, and resolution. A change requires an on-panel event or an explicit off-panel transition.
- Beat branches and compare: Users fork a beat, change panels/staging/dialogue, compare ghosted geometry and continuity deltas, then merge per object/property. Stable ids persist through moves; deleted/recreated objects do not impersonate earlier lineage. Branch abandonment remains in history.
- Issue queue and proof states: Issues group geometry, reading order, balloon, continuity, page-turn, and print violations. Users resolve, waive with reason, or jump to loci. Proof locks a revision; later edits mark proof and exports stale. Reproof creates an append-only revision.
- Responsive studio and artifacts: Desktop links spread, panel stage, continuity lattice, branch compare, and issue queue. Tablet uses paired panes. Mobile uses page strip, panel viewport, selected-object sheet, reading-order stepper, continuity cards, and proof queue with all actions preserved.
- Artifact contract: Users can export/import comic-project.json, continuity.csv, page-proofs.svg, script.md, and print-plan.json. Export is deterministic except regenerated exportedAt; reset/import recreates canonical state and equivalent files. Imports reject bad transforms, cycles, dangling targets, duplicate ids, impossible fact intervals, incorrect derived order, or forged proof hashes atomically with exact paths.
</core_features>

<visual_design>
- Inspect page/spread, selected/ghosted, safe/bleed, speaker/tail, continuity mutation/conflict, waived/stale/proof states -> distinctions remain legible.
- UI elements convey exact boundaries for bleed/safe zones.
- Branch ghosting overlays show clear visual distinction between original and modified states.
- Reading paths and continuity threads use distinct path styling.
</visual_design>

<motion>
- Causal motion: Continuity threads and reading paths reroute from the changed locus; branch ghosts and stale-proof transitions preserve causality.
- Reduced motion: Keeps endpoints without animating paths or transitions.
- Split/resize, move/flip, reorder balloon, change fact, compare/merge, proof/stale/reproof transition smoothly or snap based on reduced-motion preference.
</motion>

<requirements>
- Hardness contract: Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded.
- For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization. No-op, invalid, cancelled, and double activation paths must create zero extra events.
- Exercise adversarial orderings, including canonical edit before/after the proposal's merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit; report every file/record/field diagnostic together; reject bad state with zero state mutation.
- Make the useful end state an interoperable downloadable artifact of the session's actual work. Specify exact filenames, schemas, required keys/columns, units, precision, stable sort order, relationship integrity, and regenerated values.
- Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence.
- Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules. Error copy must identify the field, rejected value or rule, and recovery action.
- Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts, modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.
- At the proposal's maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions.
- Fixture: A fictional eight-page story has 34 panels, four characters, 17 props, six locations, 58 balloons/captions, two flashback beats, three page turns, two alternate branches, and seeded continuity conflicts. All art is abstract vector geometry and all copy is original fixture text.
- Depth-first completion protocol (mandatory): Complete each named outcome, every interaction, visible state, and connected view/derived effect before moving on.

- All dependencies must be installed locally using npm. Do not use CDNs or external network requests for libraries, fonts, or assets.
- Use Tailwind CSS 4.3.2 for styling.
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
- Entity: comic-element
- Entity operations: select; update; delete

Mechanics exclusions:
- drag geometry resize/move
- branch compare visual ghosting
- spatial axis checks

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
