# Soundscape Scene Composer — Constraint Canvas — Linear Filtered Views

<summary>
Manage sound layers through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: drag a selected record across constraint lanes and resolve a conflict. The app implements a shareable filtered workflow view whose grouping, context, and generated update remain linked. Built with React and Tailwind CSS 4.3.2. All assets must be loaded locally without CDNs.
</summary>

<core_features>
Create, edit, archive, and filter sound layers with explicit domain statuses.
Use the Constraint Canvas interaction to derive a decision about the collection by dragging a selected record across constraint lanes to resolve a conflict.
Mutate records and status fields through the Constraint Canvas, with changes immediately reflected in connected views.
Support undo of the last mutation to restore ordering, selection, and derived values.
</core_features>

<visual_design>
Provide a domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Display a primary surface, a summary view, and an inspector.
Use distinct tokens for states: empty, draft, ready, changed, archived for layers and idle, selected, changed, conflict, resolved for the canvas.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state during the drag-and-drop interaction.
Provide a reduced-motion equivalent that preserves feedback without transforms.
</motion>

<requirements>
All assets must be loaded locally without CDNs.
Maintain the session artifact soundscape-scene-v1-constraint-canvas.json purely in memory with schemaVersion v1, exportedAt RFC3339, records, derived state, and history. NO localStorage is permitted.
Implement an explicit export and import flow that restores authored structure and regenerates exportedAt.
Provide keyboard and touch-equivalent controls that produce the identical canonical mutation as drag-and-drop.
Support responsive behavior where the desktop surface becomes a usable stack, drawer, or stepper on mobile without horizontal overflow.
Reject invalid required fields and conflicting or incomplete mutations without partial updates.
</requirements>

<webmcp_action_contract>
```javascript
/**
 * @typedef {Object} WebMCPTaskContract
 * @property {string} name - Required: The exact name of the tool, must match the registered tool name.
 * @property {string} description - Required: A clear, specific description of what the tool does and when to use it.
 * @property {Object} schema - Required: A JSON Schema object defining the expected parameters.
 * @property {Function} handler - Required: An async function that executes the tool's logic.
 *
 * Requirements for handler:
 * 1. Must be an async function.
 * 2. Must accept exactly one argument: an object containing the validated parameters.
 * 3. Must return a JSON-serializable object matching this structure:
 *    {
 *      success: boolean,
 *      message: string, // Detailed explanation of what was done
 *      state: Object,   // Optional: The relevant subset of the application state after the action
 *      error: string    // Optional: Include if success is false
 *    }
 */
```
</webmcp_action_contract>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- The solution app must be served on port 3000.
- All source files should be placed in `/app`.
</delivery>
