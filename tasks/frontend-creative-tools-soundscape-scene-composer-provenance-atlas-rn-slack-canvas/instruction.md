<summary>
Build Soundscape Scene Composer, a domain-native browser surface (React, Tailwind CSS 4.3.2, Vite) for managing sound layers. The app demonstrates a Slack-Canvas-inspired collaborative workspace adapted for local artifact management: users can view linked sound layer records, select a record to trace its provenance in a connected "Provenance Atlas", quarantine bad lineages, and watch linked states (like summary metrics and record statuses) react instantly. It produces a useful interoperable end state—a portable JSON artifact—and runs entirely in-memory with NO localStorage. All assets must be loaded locally without CDNs.
</summary>

<core_features>
Feature: Sound Layers collection
The app manages a deterministic collection of "sound layers".
A sound layer record has: id, name, volume (0-100), status (empty, draft, ready, changed, conflict, archived), provenanceAtlasState (nodes with lineages), and timestamps.
The list supports creating a new layer, editing (name and volume bounds), archiving, and deleting.
The list can be filtered by domain state (status).
Validation: Exact field bounds are accepted. Adjacent out-of-range values are rejected (e.g., negative volume or missing name). Invalid fields preserve the prior valid record and explain recovery.
Feature: Provenance Atlas surface
A linked view called "Provenance Atlas".
Selecting a record in the collection loads it into the Atlas.
The Atlas displays the lineage/nodes for the selected record.
Signature interaction: "trace a selected record to source evidence and quarantine a bad lineage". The user can trace (expand/inspect) a lineage node and mark it as quarantined.
Quarantining a lineage node immediately updates the layer's status to conflict (if not already), updates the node's state, and recalculates derived summary metrics (e.g. number of quarantined items vs clean items).
An undo action restores the exact prior state: ordering, selection, derived values, and history.
Reject conflicting or incomplete mutations without partial updates.
Feature: Portable work artifact
"Export Session": Produces an interoperable JSON file (soundscape-scene-v1-provenance-atlas.json) with exact schema format.
Generates an exportedAt RFC3339 timestamp.
"Import Session": Accepts a previously exported JSON, clears the current state, and restores the authored structure, derived state, and history. Validates field-level schema.
Invalid imports (malformed schema, duplicate IDs, missing references) make no state change.
</core_features>

<visual_design>
Desktop layout features a primary collection list, the linked Provenance Atlas surface, and a derived summary panel.
On narrow mobile viewports, the secondary surfaces transform into stack/drawer/stepper layouts without horizontal clipping.
The visual thesis should evoke a calm, focused workbench with clear state tokens and intentional density.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state (e.g., when a lineage is quarantined or a layer changes status).
Honor prefers-reduced-motion by providing a reduced-motion equivalent that preserves feedback without transforms/animations.
</motion>

<requirements>
The app state must be strictly in-memory (no localStorage, external API calls, or backend sync).
Alternate input parity: Full keyboard support and touch-equivalent controls that produce identical canonical mutations. Ctrl/Cmd+Z triggers undo.
The shared canonical mutation ("trace... and quarantine") must update the primary record, linked view, and derived summary simultaneously in one atomic action.
All assets must be loaded locally without CDNs.
</requirements>

<integrity>
Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
The app must be developed in the solution/app directory.
It must run via npm start (mapped to vite preview or similar) serving the built output on 0.0.0.0:3000.
</delivery>

<webmcp_action_contract>
```xml
<webmcp_action_contract>
The application must expose a `window.webmcp_list_tools()` and `window.webmcp_invoke_tool(name, args)` interface for verification.

**Tool: `get_session_state`**
Returns the complete current artifact in the `soundscape-scene-v1` schema.
No arguments.

**Tool: `import_session`**
Imports an artifact into the app state.
Arguments:
- `session` (object): A valid `soundscape-scene-v1` schema object.

**Tool: `quarantine_lineage`**
Executes the signature canonical mutation programmatically.
Arguments:
- `recordId` (string)
- `nodeId` (string)

**Tool: `undo_last_action`**
Undoes the last action programmatically.
No arguments.
</webmcp_action_contract>
```
</webmcp_action_contract>
