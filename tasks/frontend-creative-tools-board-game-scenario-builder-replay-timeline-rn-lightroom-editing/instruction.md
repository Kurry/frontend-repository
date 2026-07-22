# Board Game Scenario Builder — Replay Timeline — Lightroom Editing

<summary>
A board game scenario builder focused on "Replay Timeline" interactions, drawing structural inspiration from Lightroom's synchronized media board. The user works on scenario cards through a domain-native browser surface where one meaningful mutation (scrubbing a timeline and restoring a prior checkpoint) updates linked views and an interoperable artifact. Stack: Solid.js, Vite, Tailwind CSS 4.3.2, and motion (Vanilla). This is a "good-app" in-memory state only application.
</summary>

<core_features>
Scenario Cards Collection: Create, edit, archive, and filter scenario cards with explicit domain statuses.
Replay Timeline Surface: Scrub a selected record through its timeline and restore a prior checkpoint. Undo the last mutation and inspect the linked representation.
Portable Work Artifact: Export the current artifact and import it to a fresh state with field-level validation.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
The visual hierarchy makes the current state and next action clear.
Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
Causal Motion: The acted-on item moves or morphs into its new state.
Reduced-motion equivalent is provided (preserves feedback without transforms).
</motion>

<requirements>
Stack: Solid.js with Solid stores, Tailwind CSS 4.3.2, Vanilla motion.dev package. No other component UI libraries.
State: In-memory only. Do not use localStorage, sessionStorage, or other browser storage APIs. A page reload returns the app to its seeded state.
Data schema: Records conform to BoardGameScenarioBuilderSession shape: schemaVersion (v1), exportedAt (RFC3339), records[] (with unique IDs, status enums), derived{}, and history[].
Seed a deterministic collection with empty, boundary, valid, and conflict states; at least 100 records for performance testing.
UI behaves responsively. Narrow layouts preserve interaction without horizontal clipping.
Keyboard and touch-equivalent controls parity.
Validation: Forms handle exact field boundaries, required fields, and show explicit recovery.
Export functionality outputs an interoperable format (scenario-builder-v1-replay-timeline.json).
Import reads the JSON and restores the state, rejecting invalid bounds/schemas.
Product name: Scenario Builder.
All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds).
- WebMCP is a required delivery step. Implement the required modules.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1

Bindings:
- Editor object types: scenario-record
- Editor properties: timeline-state; status
- Editor modes: edit; replay
- Editor operations: select; update_property; switch_mode; preview; set_content
- Entity: scenario
- Entity operations: create; select; update; delete; toggle
- Entity fields: title; description; status
- Artifact operations: export; import; copy
- Export formats: scenario-builder-v1-replay-timeline.json
- Import modes: scenario-builder-v1-replay-timeline.json
</webmcp_action_contract>
