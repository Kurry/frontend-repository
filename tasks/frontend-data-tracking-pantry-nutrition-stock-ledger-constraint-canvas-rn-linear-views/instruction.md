<summary>
Pantry Nutrition Stock Ledger is a domain-native web application for managing ingredients through a connected constraint canvas workflow. It allows users to create, edit, and organize ingredients into domains, providing a signature interaction to drag a selected record across constraint lanes and resolve conflicts. The application runs entirely in-memory with a downloadable JSON artifact for persistence.
</summary>

<core_features>
Feature: Ingredients collection
- A CRUD collection of ingredient records with domain statuses: empty, draft, ready, changed, archived.
- Create, edit, and delete one record at a time.
- Filter or reorder records by domain state.
- Invalid required fields preserve the prior valid record and explain recovery.
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.

Feature: Constraint Canvas surface
- A constraint canvas interaction to derive a decision about the collection.
- Drag a selected record across constraint lanes and resolve a conflict.
- Undo the last mutation and inspect the linked representation.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Shared-state effect: Updates constraint-canvas geometry/selection, derived summaries, and event history.

Feature: Portable work artifact
- Export the current artifact as nutrition-stock-v1.json.
- Clear and import it with field-level validation.
- Schema shape: PantryNutritionStockLedgerSession with schemaVersion, exportedAt, records[], derived{}, and history[].
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</core_features>

<user_flows>
- Complete user flow: Create an ingredient, edit it, drag the selected record across constraint lanes to resolve a conflict, undo the change, and complete the record.
- Artifact round trip: Export the state, clear the canvas, then import the file. The original state (records, derived summary, history) is perfectly restored.
</user_flows>

<edge_cases>
- Exact bounds: Submitting out-of-range fields gives field-level recovery and preserves the prior valid state.
- Empty states: The UI clearly indicates when the collection is empty.
- Malformed import: Invalid JSON or incorrect schema versions result in a clean error state without mutating the app state.
</edge_cases>

<visual_design>
- Visual thesis: A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
- The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
- Causal motion: Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
- The acted-on item moves or morphs into its new state.
</motion>

<responsiveness>
- Mobile mode: The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at narrow viewports.
</responsiveness>

<accessibility>
- Alternate input: Keyboard and touch-equivalent controls produce identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Focus management and live announcements are present.
- Contrast meets standard thresholds.
</accessibility>

<performance>
- Keeps edits responsive on 100+ records and avoids rebuilding unrelated surfaces.
- Direct manipulation must acknowledge within 100 ms, linked views within 500 ms.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely. Error copy identifies the field, rejected value or rule, and recovery action.
</writing>

<requirements>
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- Persistence must be strictly in-memory only (no localStorage or sessionStorage).
- Zero console errors and zero page errors allowed.
- The solution must serve on port 3000 via npm start.
</requirements>

<integrity>
- A CRUD table cannot satisfy the domain-native signature. The linked derived consequence, alternate input, causal motion, mobile transformation, and exact artifact round trip must be satisfied.
- The solution must begin from a genuinely clean state without preseeded complete states.
</integrity>

<delivery>
- Artifact: A React Vite single-page application built to a "dist" folder, served from port 3000.
</delivery>

<webmcp_action_contract>
The application exposes a WebMCP contract implementing window.webmcp_session_info, window.webmcp_list_tools, and window.webmcp_invoke_tool.

- entity-collection-v1: Query, create, update, delete records in the ingredients collection.
- artifact-transfer-v1: Export the full session and import a previously exported artifact.
</webmcp_action_contract>
