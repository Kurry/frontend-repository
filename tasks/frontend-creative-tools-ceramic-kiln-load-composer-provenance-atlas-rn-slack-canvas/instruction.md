<summary>
Build a Ceramic Kiln Load Composer and Provenance Atlas using React, Vite, Zustand, Tailwind CSS 4.3.2, and framer-motion. The app manages kiln pieces and implements a signature provenance atlas interaction where tracing a selected record to source evidence and quarantining a bad lineage updates linked views. The session exports to and imports from kiln-load-v1.json, acting as an interoperable work artifact.
</summary>

<core_features>
Kiln Pieces collection: Create, edit, archive, and filter kiln pieces with explicit domain statuses (empty, draft, ready, changed, archived). Invalid required fields must preserve the prior valid record and explain recovery.
Provenance Atlas surface: A linked decision surface to trace a selected record to source evidence and quarantine a bad lineage. A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
Portable work artifact: Export the current artifact, clear it, and import it with field-level validation. Malformed schema, duplicate IDs, unknown references, or invalid bounds make no state change. Valid import restores authored structure and regenerates exportedAt.
Shared-state effect: The signature mutation updates provenance-atlas geometry/selection, derived summaries, event history, and mutates records[] and status fields in kiln-load-v1.json.
</core_features>

<visual_design>
Distinctive, domain-specific workbench with clear state tokens.
Intentional density and a calm focused canvas.
Visual hierarchy makes current state and next action clear.
Layout: Desktop primary surface plus summary and inspector. Mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state.
Reduced motion preserves feedback without transforms.
</motion>

<requirements>
In-memory state only (Zustand). NO localStorage, sessionStorage, or other browser storage APIs.
The exported artifact must validate against a strict schema.
Record shape: CeramicKilnLoadComposerSession with schemaVersion, exportedAt, records[], derived{}, and history[].
schemaVersion is exactly v1. exportedAt is RFC3339. Record IDs are unique.
The UI must serve on port 3000 via npm start. No errors in console.
All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
</requirements>

<delivery>
All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- artifact-transfer-v1

Bindings:
- Entity operations: create; select; update; delete; query
- Artifact operations: export; import; clear
</webmcp_action_contract>
