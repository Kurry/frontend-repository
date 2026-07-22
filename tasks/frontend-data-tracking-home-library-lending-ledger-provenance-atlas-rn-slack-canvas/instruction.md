<summary>
Create a browser-native "Home Library Lending Ledger" focusing on the signature interaction: trace a selected record to source evidence and quarantine a bad lineage via a "Provenance Atlas" view. Built as a good-app frontend without backend APIs.
</summary>

<core_features>
- Users can create, edit, delete, and view a collection of book records.
- Each book record tracks its domain status (draft, ready, changed, archived, quarantined).
- The Provenance Atlas view displays the historical lineage/events for a selected book.
- The signature interaction: while viewing a record's Provenance Atlas, users can "trace a selected record to source evidence and quarantine a bad lineage", moving it to quarantined status.
- A derived summary panel shows live counts of books by status.
- Users can undo the last mutation, accurately reverting the record's state, linked views, and history.
- The complete application state can be exported to library-lending-v1-provenance-atlas.json and imported to fully restore authored records, derived stats, and lineage history.
</core_features>

<user_flows>
- Creating a new book populates it with a clean slate and default draft status.
- Selecting a book opens the Provenance Atlas panel alongside the list.
- Activating the signature interaction updates the book's status and adds an event to its history immediately.
- Exporting produces a portable JSON artifact; importing a valid artifact replaces the local state entirely.
</user_flows>

<edge_cases>
- Exact boundary validation on inputs (e.g., maximum string lengths).
- Out-of-bounds fields or invalid schemas during import are rejected completely with field-level diagnostic messages, preserving the prior valid state.
- Empty states for the book collection and the Provenance Atlas are clearly visualized.
</edge_cases>

<visual_design>
- Uses a distinctive, domain-specific workbench aesthetic.
- The visual hierarchy directs attention between the primary list, the linked summary panel, and the Provenance Atlas detail view.
- Clear state tokens/badges indicate book statuses.
</visual_design>

<motion>
- Causal motion connects the acted-on item to its new state (e.g., smoothly transitioning a book into the quarantined visual state).
- Reduced motion preferences suppress transform animations while preserving feedback parity.
</motion>

<responsiveness>
- At narrow (mobile) viewports, the desktop side-by-side surface collapses into a usable stack, drawer, or stepper.
- Prevents horizontal overflow and maintains large touch targets.
</responsiveness>

<accessibility>
- All interactive controls are fully operable via keyboard.
- The signature interaction flow can be completed identically using keyboard navigation.
- Focus is managed properly inside the Provenance Atlas and modals.
- Screen readers receive live announcements of critical state changes.
</accessibility>

<performance>
- The application remains highly responsive with a generated dataset of at least 100 books.
- The signature interaction acknowledges input within 100ms, and linked derived views settle within 500ms.
</performance>

<writing>
- Domain-native copy accurately names domain consequences and clear recovery actions.
- Empty states explain how to populate the collection.
</writing>

<innovation>
- The linked provenance and lineage tracking provides a dedicated decision-making surface that goes beyond traditional CRUD paradigms.
</innovation>

<requirements>
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- No actual localStorage or external APIs are used to persist state; in-memory React state is the source of truth, bounded by export/import.
</requirements>

<integrity>
- A clean initial state without pre-seeded successful outcomes.
- Changes in the book collection list consistently trigger re-renders in the linked summary view.
</integrity>

<delivery>
- The solution is completely self-contained in the solution/app directory.
- npm run verify:build successfully builds the application without TypeScript or Vite errors.
</delivery>

<webmcp_action_contract>
<module_spec id="structured-editor-v1">
</module_spec>
<module_spec id="entity-collection-v1">
</module_spec>
<module_spec id="artifact-transfer-v1">
</module_spec>
</webmcp_action_contract>
