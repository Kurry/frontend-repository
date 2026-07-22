<summary>
Build a Classroom Lesson Arc Planner using React, Tailwind CSS 4.3.2, and Lucide React. The application must operate with purely in-memory state and avoid using localStorage or any other persistence mechanisms. The app manages lesson blocks with explicit domain statuses and includes a signature "Forecast Ribbon" surface to adjust a selected record and compare projected outcomes. It must generate an interoperable artifact lesson-arc-v1-forecast-ribbon.json containing schemaVersion, exportedAt, records, derived state, and history. All libraries must be npm-local (no CDNs).
</summary>

<core_features>
Feature: Lesson Blocks collection
The application must allow users to create, edit, archive, and filter lesson blocks with explicit domain statuses (empty, draft, ready, changed, archived).
Invalid required fields must preserve the prior valid record and explain recovery.
The shared state and artifact effect must mutate records and status fields in lesson-arc-v1.json.
Exact field boundaries are accepted while adjacent out-of-range values are rejected.

Feature: Forecast Ribbon surface
The application must include a Forecast Ribbon surface that allows users to adjust a selected record and compare projected outcomes.
The interaction must support undoing the last mutation and inspecting the linked representation.
The visible states include idle, selected, changed, conflict, and resolved.
A conflicting or incomplete mutation must be rejected without partial updates.
Undo restores ordering, selection, and derived values.
The shared state and artifact effect updates forecast-ribbon geometry/selection, derived summaries, and event history.

Feature: Portable work artifact
The application must support exporting and restoring the actual session work in a fresh state.
The interaction allows exporting the current artifact and clearing/importing it with field-level validation.
The visible states are unsaved, exported, validated, and replayed.
Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
A valid import restores authored structure and regenerates exportedAt.
The artifact produces lesson-arc-v1-forecast-ribbon.json with schemaVersion, exportedAt, records, derived state, and history.
</core_features>

<visual_design>
The primary work surface, linked summary, and detail panel must establish a visual hierarchy that makes the current state and next action clear.
The visual thesis must present a distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
Motion must connect the acted-on item to its new state and have a reduced-motion equivalent.
The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
Narrow layouts change the interaction model, preserve touch targets, and avoid horizontal clipping.
The desktop primary surface plus summary and inspector must transform on mobile into secondary surfaces as drawers or stacked steps without horizontal overflow.
</responsiveness>

<accessibility>
The application must include semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
Alternate input must produce identical state with visible focus and live feedback using keyboard and touch-equivalent controls.
</accessibility>

<performance>
The signature interaction remains responsive and unrelated rows stay stable when exercising a seeded collection with at least 100 records.
Direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.
</performance>

<writing>
Copy names the domain consequence and recovery action precisely.
Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
</writing>

<requirements>
The application must use Tailwind CSS 4.3.2.
All libraries must be npm-local (no CDNs).
The whole job must be incomplete unless the implementation proves every clause through the proposal's own named entities, canonical mutation, linked views, and portable artifact.
Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded.
For every pointer or direct-manipulation path, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization.
Exercise adversarial orderings, including canonical edit before/after the proposal's merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits.
Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export.
Make the useful end state an interoperable downloadable artifact of the session's actual work.
Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly (in-memory state means it resets to seed).
Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules.
Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts, modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.
</requirements>

<webmcp_action_contract>
The application must expose a global WebMCP contract via `window.webmcp_session_info`, `window.webmcp_list_tools`, and `window.webmcp_invoke_tool`.
The WebMCP contract must fully implement the `entity-collection-v1` and `artifact-transfer-v1` modules to allow querying state, reading records, performing the signature Forecast Ribbon mutation, and exporting/importing the artifact document.
</webmcp_action_contract>
