<summary>
Manage recipe ingredients through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: connect a selected record to a handoff owner and update readiness. This app is built with React, Vite, and Tailwind CSS 4.3.2 using npm-local/no-CDN installation.
</summary>

<core_features>
Create, edit, archive, and filter recipe ingredients with explicit domain statuses.
Use the handoff map interaction to derive a decision about the collection.
Connect a selected record to a handoff owner and update readiness.
Undo the last mutation and inspect the linked representation.
Export and restore the actual session work in a fresh state.
</core_features>

<visual_design>
The visual hierarchy makes current state and next action clear.
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<requirements>
The app is built with React, Vite, and Tailwind CSS 4.3.2 using npm-local/no-CDN installation.
The handoff map mutation changes the primary record, linked view, and status together.
The visual hierarchy makes current state and next action clear.
Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
The tool result and artifact contain the declared API-shaped fields.
The end-to-end job is recoverable without reload.
Each invalid action gives field-level recovery and preserves prior valid state.
The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at a narrow viewport.
Alternate input produces identical state with visible focus and live feedback.
The signature interaction remains responsive and unrelated rows stay stable with large collections.
Copy names the domain consequence and recovery action precisely.
Linked views provide domain utility beyond CRUD.
The visual and interaction thesis is coherent without copying unrelated screens.
Export, clear, import, and inspect the edited variant record and derived state. Authored order/selection/geometry and domain state survive; invalid import is a no-op.
</requirements>

<webmcp_action_contract>
Window global tools:
- window.webmcp_session_info() -> Object
- window.webmcp_list_tools() -> Array
- window.webmcp_invoke_tool(name: string, args: object) -> Promise<Object>
</webmcp_action_contract>
