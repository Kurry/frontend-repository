# Board Game Scenario Builder — Provenance Atlas — Slack Canvas

## Overview
Manage scenario cards through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: trace a selected record to source evidence and quarantine a bad lineage. Release-derived concept: a collaborative canvas with embedded state transitions, approval gates, and usage evidence.

<summary>
Manage scenario cards through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: trace a selected record to source evidence and quarantine a bad lineage. Release-derived concept: a collaborative canvas with embedded state transitions, approval gates, and usage evidence.
Tailwind CSS 4.3.2 is required. The oracle must be npm-local/no-CDN.
</summary>

<core_features>
- Create, edit, archive, and filter scenario cards with explicit domain statuses.
- Use the provenance atlas interaction to derive a decision about the collection (trace a selected record to source evidence and quarantine a bad lineage).
- Export and restore the actual session work in a fresh state.
</core_features>

<visual_design>
- Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<requirements>
- The provenance atlas mutation changes the primary record, linked view, and status together.
- The visual hierarchy makes current state and next action clear.
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
- Querying the current state and exporting after the mutation shows the tool result and artifact contain the declared API-shaped fields.
- Create, edit, mutate, undo, and complete one record; the end-to-end job is recoverable without reload.
- Each invalid action gives field-level recovery and preserves prior valid state.
- The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at a narrow viewport.
- Alternate input produces identical state with visible focus and live feedback.
- The signature interaction remains responsive and unrelated rows stay stable with at least 100 records.
- Copy names the domain consequence and recovery action precisely.
- Linked views provide domain utility beyond CRUD.
- The visual and interaction thesis is coherent without copying unrelated screens.
- Authored order/selection/geometry and domain state survive export, clear, and import; invalid import is a no-op.
- Tailwind CSS 4.3.2 must be used.
- Dependencies must be npm-local/no-CDN.
</requirements>

<webmcp_action_contract>
- webmcp_session_info
- webmcp_list_tools
- webmcp_invoke_tool
</webmcp_action_contract>

## Data Schemas
**Record Shape:** `BoardGameScenarioBuilderSession` with `schemaVersion`, `exportedAt`, `records[]`, `derived{}`, and `history[]`; each record is an API-shaped would-be request body.

- `schemaVersion` is a task-specific v1 enum (`scenario-builder-v1`).
- `exportedAt` is RFC3339.
- Record IDs are unique and status values are explicit enums.
- Required fields, numeric/date bounds, and cross-record references validate together.

**Interoperable format:** `scenario-builder-v1-provenance-atlas.json`
