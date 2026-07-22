<summary>
Build a Freelance Invoice Aging Lens and Audit Lens application using React, Zustand, and Tailwind CSS 4.3.2. The app provides a domain-native browser surface where attaching evidence to a selected record resolves an audit discrepancy, updating linked views and producing a portable artifact. It operates purely in-memory, producing a downloadable invoice-aging-v1.json artifact containing the session work, without external APIs or backend sync. No npm-local/no-CDN installations are required beyond the standard Vite React setup.
</summary>

<core_features>
The primary work surface is an Audit Lens where selecting an invoice shows its details.
The signature mutation is attaching evidence to a selected record and resolving an audit discrepancy.
When the evidence is submitted, the record transitions to a resolved state.
A secondary action allows marking a record as having a conflict.
The app includes a linked summary view that updates immediately when the canonical mutation occurs.
An undo button reverses the last mutation and restores the previous state.
The application supports importing an invoice-aging-v1 session artifact, which replaces the current state.
The application supports exporting the current session as a downloadable invoice-aging-v1.json artifact.
The artifact export maintains exact field boundaries and includes all authored state and derived consequences.
</core_features>

<visual_design>
The layout features a desktop primary surface alongside a summary and inspector.
A distinctive, domain-specific workbench aesthetic is used, providing a calm focused canvas.
Clear state tokens represent the different status conditions of the records.
</visual_design>

<motion>
CSS transitions are used to animate UI state changes.
The acted-on item moves into its new state during the canonical mutation.
A reduced-motion equivalent is supported natively by the browser settings.
</motion>

<requirements>
The desktop surface must become a usable stack, drawer, or stepper on mobile without horizontal overflow.
The signature interaction must be operable via keyboard and touch-equivalent controls.
Invalid required fields must preserve the prior valid record and explain recovery.
Malformed schema, duplicate IDs, unknown references, and invalid bounds in the artifact import must result in no state change.
The application must expose a WebMCP contract on the window object with all specified state manipulation tools.
Must use npm-local/no-CDN for installation.
</requirements>

<webmcp_action_contract>
window.webmcp_list_tools = () => [ ... ];
window.webmcp_invoke_tool = async (tool, args) => { ... };
</webmcp_action_contract>
