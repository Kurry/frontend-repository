# Comic Panel Rhythm Board — Spatial Composer

<summary>
Create a Comic Panel Rhythm Board with a Spatial Composer to manage comic panels through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. The app uses Tailwind CSS 4.3.2. All assets must be loaded locally without CDNs. This is an in-memory application; no localStorage or remote APIs should be used. The app manages a collection of comic panels, allowing users to place a selected record in a spatial composer and rebalance capacity. It includes an evidence artifact inspector with redaction, source lineage, downloadable files, and no silent failure.
</summary>

<core_features>
- Comic Panels collection: Create, edit, archive, and filter comic panels with explicit domain statuses (empty, draft, ready, changed, archived). Invalid required fields preserve the prior valid record and explain recovery.
- Spatial Composer surface: Place a selected record in a spatial composer and rebalance capacity. Undo the last mutation and inspect the linked representation. Visible states include idle, selected, changed, conflict, resolved. A conflicting or incomplete mutation is rejected without partial updates.
- Portable work artifact: Export and restore the actual session work in a fresh state. Clear and import it with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates the exportedAt timestamp.
</core_features>

<visual_design>
- Distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
- The visual hierarchy makes current state and next action clear.
- Provide clear labels, statuses, errors, and empty-state text.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms.
</motion>

<requirements>
- All assets must be loaded locally without CDNs.
- Tailwind CSS 4.3.2 must be used for styling.
- Ensure keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl or Cmd Z undoes it.
- Support narrow layouts by changing the interaction model, preserving touch targets, and avoiding horizontal clipping.
- Use semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Keep edits responsive on large collections of at least 100 records and avoid rebuilding unrelated surfaces.
- Record shape: ComicPanelRhythmBoardSession with schemaVersion (v1 enum), exportedAt (RFC3339), records array, derived object, and history array.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- The solution should be provided in the /app directory.
- It must run with npm run dev or equivalent local server.
</delivery>

<webmcp_action_contract>
<tool name="get_state">
<description>Get current session state</description>
<input_schema>
</input_schema>
</tool>
<tool name="import_state">
<description>Import session state</description>
<input_schema>
{
  "type": "object",
  "properties": {
    "session": { "type": "object" }
  },
  "required": ["session"]
}
</input_schema>
</tool>
<tool name="mutate_panel">
<description>Place a selected record in a spatial composer and rebalance capacity.</description>
<input_schema>
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "x": { "type": "number" },
    "y": { "type": "number" },
    "width": { "type": "number" },
    "height": { "type": "number" }
  },
  "required": ["id", "x", "y", "width", "height"]
}
</input_schema>
</tool>
</webmcp_action_contract>
