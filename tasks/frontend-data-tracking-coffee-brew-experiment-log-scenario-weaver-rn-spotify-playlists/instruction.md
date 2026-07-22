# Coffee Brew Experiment Log — Scenario Weaver

<summary>
Create a browser-native good-app genre application for managing coffee brew experiments. A selected experiment record can be branched into a scenario to compare linked outcomes. The UI adapts Spotify's pattern of collaborative reorder, bulk playlist actions, folders, queue reshuffle, and background-download progress into a self-contained frontend job. Ensure all state is managed in-memory with a downloadable artifact brew-experiment-v1-scenario-weaver.json. Built with React, Vite, and Tailwind CSS 4.3.2 installed via npm-local/no-CDN.
</summary>

<core_features>
Brew Experiments collection: Create, edit, archive, and filter brew experiments with explicit domain statuses (empty, draft, ready, changed, archived).
Scenario Weaver surface: Branch a selected record into a scenario and compare linked outcomes. Undo the last mutation.
Portable work artifact: Export and restore the session work brew-experiment-v1-scenario-weaver.json.
</core_features>

<visual_design>
Distinctive, domain-specific workbench with clear state tokens.
Desktop primary surface plus summary and inspector. Mobile transforms secondary surfaces into drawers or stacked steps.
Intentional density and a calm focused canvas.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state.
Reduced motion preserves feedback without transforms.
</motion>

<requirements>
Tailwind CSS 4.3.2 npm-local/no-CDN.
Tools must support CRUD on the collection, scenario branching, and export/import.
In-memory only; no localStorage.
No network dependencies, pure client-side React.
</requirements>

<webmcp_action_contract>
window.webmcp_session_info = () => ({ task_id: 'frontend-data-tracking-coffee-brew-experiment-log-scenario-weaver-rn-spotify-playlists', capabilities: ['...'], state_summary: '...' });
window.webmcp_list_tools = () => [...];
window.webmcp_invoke_tool = async (name, args) => { ... };
</webmcp_action_contract>
