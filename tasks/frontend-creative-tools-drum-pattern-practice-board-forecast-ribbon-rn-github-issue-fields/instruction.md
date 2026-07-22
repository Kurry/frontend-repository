# Drum Pattern Practice Board - Forecast Ribbon - GitHub Issue Fields

<summary>
Manage drum patterns through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: adjust a selected record on a forecast ribbon and compare projected outcomes. Release-derived concept: a project evidence surface with typed fields, duplicate merges, saved queries, and release provenance.
All assets must be loaded locally without CDNs.
Styling framework: Tailwind CSS 4.3.2
</summary>

<core_features>
- Drum Patterns collection: Create, edit, archive, and filter drum patterns with explicit domain statuses.
- Forecast Ribbon surface: Use the forecast ribbon interaction to derive a decision about the collection. Adjust a selected record on a forecast ribbon and compare projected outcomes. Undo the last mutation and inspect the linked representation.
- Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact, clear and import it with field-level validation.
</core_features>

<visual_design>
- Visual hierarchy: The visual hierarchy makes current state and next action clear.
- Domain utility: Linked views provide domain utility beyond CRUD.
- Source fidelity: The visual and interaction thesis is coherent without copying unrelated screens.
- Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
- Causal motion: Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
- Reduced motion preserves feedback without transforms.
</motion>

<requirements>
- Clean round trip: Export, clear, import, and re-open the edited record; authored structure, derived state, and history must match.
- Schema validation: schemaVersion is a task-specific v1 enum and exportedAt is RFC3339.
- Invalid input: Invalid required fields preserve the prior valid record and explain recovery.
- Keyboard parity: Alternate input produces identical state with visible focus and live feedback.
- Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- Domain copy: Copy names the domain consequence and recovery action precisely.
- Strict isolation: All assets must be loaded locally without CDNs.
- Styling framework: Tailwind CSS 4.3.2
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Provide a working React application serving on port 3000 via npm start.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1

Module specs:
<module_spec id="structured-editor-v1">
{}
</module_spec>
<module_spec id="entity-collection-v1">
{}
</module_spec>
<module_spec id="artifact-transfer-v1">
{}
</module_spec>

Bindings:
- Drum Patterns collection -> entity-collection-v1
- Linked decision surface -> structured-editor-v1
- Portable work artifact -> artifact-transfer-v1
</webmcp_action_contract>
