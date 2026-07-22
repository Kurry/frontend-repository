<summary>
Build a Recipe Substitution Sandbox using React, Tailwind CSS 4.3.2, and npm-local/no-CDN installations. Manage recipe ingredients through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: place a selected record in a spatial composer and rebalance capacity. Release-derived concept: an evidence artifact inspector with redaction, source lineage, downloadable files, and no silent failure.
</summary>

<core_features>
Recipe Ingredients collection: Create, edit, archive, and filter recipe ingredients with explicit domain statuses. Create, edit, delete one record. Filter or reorder records by domain state. Visible states: empty, draft, ready, changed, archived. Invalid required fields preserve the prior valid record and explain recovery.
Spatial Composer surface: Use the spatial composer interaction to derive a decision about the collection. Place a selected record in a spatial composer and rebalance capacity. Undo the last mutation and inspect the linked representation. Visible states: idle, selected, changed, conflict, resolved. A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact. Clear and import it with field-level validation. Visible states: unsaved, exported, validated, replayed. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
Artifact contract: The app must export and import a file named recipe-substitution-v1-spatial-composer.json matching the RecipeSubstitutionSandboxSession schema. The schema requires schemaVersion set to recipe-substitution-v1, an exportedAt RFC3339 string, an array of records, a derived state object, and a history array.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas. Desktop primary surface plus summary and inspector. Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state. Reduced motion preserves feedback without transforms.
</motion>

<requirements>
The application must be fully functional in-memory without relying on localStorage, external APIs, backend sync, collaboration, or authentication. The UI must be implemented using React and Tailwind CSS 4.3.2 installed via npm-local/no-CDN. The state management should support undo and redo operations. The signature mutation is placing a selected record in a spatial composer and rebalancing capacity. Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd Z undoes it. Linked views: The spatial composer surface, derived summary, and artifact query share one state. Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support. Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
</requirements>

<webmcp_action_contract>
The WebMCP contract requires standard lifecycle bindings (get_state, import_session, clear_session) and CRUD tools mapped to the internal state management. The tools must include add_record, update_record, delete_record, place_in_composer, and undo. These tools allow the verifier to inject starting states, drive valid interactions without mouse/keyboard simulation, and observe outcomes synchronously without screen parsing.
</webmcp_action_contract>
