# Bike Maintenance Mileage Map — Audit Lens — Workbench Viewer

<summary>
Build a frontend-native application for managing bike service records through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. The signature interaction is to attach evidence to a selected record and resolve an audit discrepancy. A browser workbench with keyboard job switching, a file/artifact inspector, and explicit failed-upload recovery. Built with Tailwind CSS 4.3.2. All assets must be loaded locally without CDNs.
</summary>

<core_features>
Implement a bike service records collection with CRUD, status, validation, and query.
Create an Audit Lens surface allowing users to attach evidence to a selected record and resolve an audit discrepancy.
Include a portable work artifact interaction to export the current artifact and import it with field-level validation.
Link the views: The audit lens surface, derived summary, and artifact query share one state.
Support Undo functionality to undo the last mutation and restore the linked representation.
</core_features>

<visual_design>
Distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
Clear visual hierarchy that makes the current state and next action clear.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state.
Reduced motion equivalent must preserve feedback without transforms.
</motion>

<requirements>
In-memory state only. No localStorage or backend sync.
Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation.
Schema validation for importing the portable work artifact with strict field-level recovery.
Accessible semantic controls, focus management, and live updates.
Performance remains responsive on 100+ records.
All assets must be loaded locally without CDNs.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Provide the built application as a directory `app/` containing the frontend output.
</delivery>

<webmcp_action_contract>
Window functions:
- `window.webmcp_session_info`: Optional. A function that returns a JSON-serializable object describing the current session state.
- `window.webmcp_list_tools`: A function that returns a list of WebMCP tools available in the application.
- `window.webmcp_invoke_tool(tool_name: string, args: object)`: A function that invokes a specific WebMCP tool.
</webmcp_action_contract>
