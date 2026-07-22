<summary>
Build a Photo Sequence Caption Loom with a Scenario Weaver surface, using React, Tailwind CSS 4.3.2, and Zustand. The app manages a collection of photo sequences where branching a selected record into a scenario updates linked views and an interoperable artifact. It must run completely in-memory (no localStorage) and provide an export/import mechanism for a JSON session document.
</summary>

<core_features>
Feature: Photo Sequences collection
Provide a collection editor to create, edit, archive, and filter photo sequence records. Each record has a title, caption, sequence order, and a status (draft, ready, changed, archived).
Provide multi-select ordering, folders, queue state, and progress artifacts that agree with the main view.
Support empty, draft, ready, changed, and archived states.
Editing a sequence preserves the prior valid record when invalid fields are entered.

Feature: Scenario Weaver surface
Signature interaction: Branch a selected record into a scenario and compare linked outcomes. This derives a decision about the collection.
Support idle, selected, changed, conflict, and resolved states.
Reject a conflicting or incomplete mutation without partial updates.
Undo restores ordering, selection, and derived values.
The derived summary and event history are updated upon mutation.

Feature: Portable work artifact
Export and import the actual session work in a fresh state.
Export generates photo-caption-v1-scenario-weaver.json.
Schema Version: exactly photo-caption-v1.
Field contract for export: schemaVersion, exportedAt (RFC3339 format), records (array of sequences), derived (summary object), and history (event history array).
Validation on import: Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. Valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
The visual hierarchy makes current state and next action clear.
Layout: Desktop primary surface plus summary and inspector. Mobile transforms secondary surfaces into drawers or stacked steps without horizontal clipping.
Accessible semantic controls, contrast, and focus management.
</visual_design>

<motion>
Causal motion: The acted-on item moves or morphs into its new state.
Supports prefers-reduced-motion to preserve feedback without transforms.
</motion>

<requirements>
In-memory state only (NO localStorage or other persistent storage across unloads).
Implement WebMCP session info, tool listing, and tool invocation globally.
Strict field boundaries on inputs (validations for ranges, required fields).
Responsive behavior for mobile viewports (stacking or drawers).
Full keyboard and touch-equivalent controls for the signature mutation (branching a scenario).
All dependencies must be installed locally via npm (no external CDNs).
</requirements>

<webmcp_action_contract>
{
  "tools": [
    {
      "name": "exportSession",
      "description": "Exports the current state as a JSON session document."
    },
    {
      "name": "importSession",
      "description": "Imports a JSON session document."
    },
    {
      "name": "branchScenario",
      "description": "Branch a selected record into a scenario."
    }
  ]
}
</webmcp_action_contract>
