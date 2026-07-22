<summary>
Build a Recipe Flavor Balance Studio — Audit Lens — Viewer using React, Vite, Zustand, and Tailwind CSS 4.3.2 (no CDN). The application allows users to manage a collection of flavor components and use an audit lens to resolve discrepancies. It produces a downloadable JSON artifact containing the full session state, with an Import function that round-trips that JSON.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Flavor Components collection —
- Create, edit, archive, and filter flavor components with explicit domain statuses (empty, draft, ready, changed, archived)
- Exact field boundaries are accepted while adjacent out-of-range values are rejected
- Invalid required fields preserve the prior valid record and explain recovery
Feature: Audit Lens surface —
- Attach evidence to a selected record and resolve an audit discrepancy
- Undo the last mutation and inspect the linked representation
- Visible states: idle, selected, changed, conflict, resolved
- A conflicting or incomplete mutation is rejected without partial updates
- Undo restores ordering, selection, and derived values
Feature: Portable work artifact —
- Export the current artifact to a JSON file named flavor-balance-v1-audit-lens.json
- Clear the current session and import a file with field-level validation
- Visible states: unsaved, exported, validated, replayed
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change
- A valid import restores authored structure and regenerates exportedAt
Feature: WebMCP Tools —
- Provide webmcp_action_contract tools for deterministic testing
</core_features>

<visual_design>
Visual Design criteria:
- Desktop primary surface plus summary and inspector
- Mobile mode transforms secondary surfaces into drawers or stacked steps
- Visual hierarchy makes current state and next action clear
- Distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas
</visual_design>

<motion>
Motion criteria:
- The acted-on item moves or morphs into its new state
- Reduced motion (prefers-reduced-motion) preserves feedback without transforms
</motion>

<requirements>
Requirements and constraints:
- Built with React 19, Vite, Zustand, Tailwind CSS 4.3.2 (npm-local/no-CDN), and framer-motion.
- Strictly in-memory persistence. No localStorage, indexedDB, or backend syncing.
- Complete alternate input parity (Keyboard and touch-equivalent controls).
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- Accessible semantic controls, focus management, contrast.
</requirements>

<webmcp_action_contract>
window.webmcp_list_tools = () => {
  return [
    {
      name: "query_state",
      description: "Query current flavor balance state",
      input_schema: { type: "object", properties: {} }
    },
    {
      name: "seed_state",
      description: "Seed the flavor balance state for testing",
      input_schema: {
        type: "object",
        properties: {
          records: { type: "array" }
        },
        required: ["records"]
      }
    }
  ];
};

window.webmcp_invoke_tool = async (name, args) => {
  if (!window.useFlavorStore) throw new Error("Store not initialized");
  const state = window.useFlavorStore.getState();
  if (name === "query_state") {
    return { result: JSON.stringify(state.getExportableState()) };
  }
  if (name === "seed_state") {
    state.seed(args.records);
    return { result: "Seeded successfully" };
  }
  throw new Error("Unknown tool: " + name);
};
</webmcp_action_contract>
