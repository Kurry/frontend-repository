# Photo Sequence Caption Loom — Forecast Ribbon — GitHub Issue Fields

<summary>
Manage photo sequences through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: adjust a selected record on a forecast ribbon and compare projected outcomes. The tool adapts a project evidence surface with typed fields, duplicate merges, saved queries, and release provenance into a self-contained frontend job.

The application uses Tailwind CSS 4.3.2. All assets must be loaded locally without CDNs.
</summary>

<core_features>
- Create, edit, archive, and filter photo sequences with explicit domain statuses (empty, draft, ready, changed, archived).
- Adjust a selected record on a forecast ribbon and compare projected outcomes.
- Share state across a forecast ribbon surface, derived summary, and artifact query.
- Support undo/redo restoring ordering, selection, and derived values.
- Export and restore the session work in a fresh state using an interoperable format (photo-caption-v1-forecast-ribbon.json) with field-level validation.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The visual hierarchy makes current state and next action clear across the primary work surface, linked summary, and detail panel.
- Desktop layout features a primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms.
- Motion connects the acted-on item to its new state clearly.
</motion>

<requirements>
- The application state must be entirely in-memory. NO localStorage or external databases.
- The exported artifact must validate schemaVersion (v1 enum), unique record IDs, explicit enum status values, numeric/date bounds, and cross-record references.
- Invalid required fields must preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation is rejected without partial updates.
- Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Responsive design: narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- The application must remain responsive and unrelated rows stay stable when exercising a seeded collection with at least 100 records.
- All dependencies and assets must be local (no CDN usage).
- Use Tailwind CSS 4.3.2 for styling. All assets must be loaded locally without CDNs.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Serve the application locally on port 3000 via npm start.
- Ensure zero console or page errors.
- Include a committed build output directory if the application serves built files.
- Implement the WebMCP contract via window.webmcp_session_info, webmcp_list_tools, and webmcp_invoke_tool.
</delivery>
