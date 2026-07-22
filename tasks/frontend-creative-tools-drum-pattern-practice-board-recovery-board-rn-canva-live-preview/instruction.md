<summary>
A creative tool that allows users to create, practice, and manage drum patterns with robust recovery features, undo/redo capabilities, and portable state. Built with Vite, React 19, Tailwind CSS 4.3.2, Zustand, and Framer Motion.
</summary>

<core_features>
1. Drum Patterns Collection: Create, edit, and organize drum patterns on a practice board grid.
2. Recovery Board: Full undo/redo stack, history tracing, and auto-save state recovery.
3. Portable Artifact: Export and import board state to/from JSON with schema validation.
4. Live Preview: Real-time visual feedback of patterns (Canvas-like interactions).
</core_features>

<requirements>
Use React 19, Vite, Tailwind CSS 4.3.2, Zustand, and Framer Motion.
Build interactive accessible components.
Expose WebMCP tool endpoints for all state manipulations.
Ensure malformed imported artifacts are rejected gracefully without corrupting state.
All dependencies must be strictly local via npm install; no remote CDNs.
</requirements>

<webmcp_action_contract>
window.webmcp_list_tools = () => [
  { name: 'get_pattern_state', description: 'Gets the current drum pattern state, including tracks and steps.', inputSchema: { type: 'object', properties: {} } },
  { name: 'toggle_step', description: 'Toggles a drum step on or off.', inputSchema: { type: 'object', properties: { trackId: { type: 'string' }, stepIndex: { type: 'number' } }, required: ['trackId', 'stepIndex'] } },
  { name: 'undo_change', description: 'Undo the last action.', inputSchema: { type: 'object', properties: {} } },
  { name: 'redo_change', description: 'Redo the previously undone action.', inputSchema: { type: 'object', properties: {} } },
  { name: 'set_tempo', description: 'Sets the playback tempo in BPM (20-300).', inputSchema: { type: 'object', properties: { tempo: { type: 'number' } }, required: ['tempo'] } }
];
window.webmcp_invoke_tool = (name, args) => { /* logic */ };
</webmcp_action_contract>
