# Home Air Quality Trendbook — Recovery Board

<summary>
Manage air readings through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: move a failed record into a recovery path and repair its downstream consequences. Release-derived concept: a design workspace where desktop edits update mobile preview, timing notes, and a portable share artifact.

The application is a pure client-side experience built using Tailwind CSS 4.3.2. State is strictly in-memory (no localStorage, no network calls). All assets must be loaded locally without CDNs. It exports and imports an interoperable artifact format (air-quality-v1.json).
</summary>

<core_features>
Air Readings collection: Create, edit, archive, and filter air readings with explicit domain statuses (empty, draft, ready, changed, archived). Validation enforces exact field boundaries; adjacent out-of-range values are rejected, preserving the prior valid record and explaining recovery.
Recovery Board surface: The signature interaction: move a failed record into a recovery path and repair its downstream consequences. Undo the last mutation and inspect the linked representation. Conflicting/incomplete mutations are rejected without partial updates. Undo restores ordering, selection, and derived values. Updates recovery-board geometry/selection, derived summaries, and event history.
Portable work artifact: Export and restore the actual session work in a fresh state. States: unsaved, exported, validated, replayed. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change during import. A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Desktop layout features a primary surface plus summary and inspector panels.
Mobile transforms secondary surfaces into drawers or stacked steps.
The visual hierarchy must make the current state and next action clear.
</visual_design>

<motion>
Causal motion: The acted-on item moves or morphs into its new state.
Reduced motion: Emulating prefers-reduced-motion: reduce preserves feedback without transforms.
</motion>

<requirements>
Built with standard local tools (e.g., Vite, React/Solid, Tailwind CSS 4.3.2).
Fully entirely client-side, purely in-memory state; no localStorage, no network persistence. All assets must be loaded locally without CDNs.
Export produces an air-quality-v1-recovery-board.json file.
Implement responsive behavior: narrow layouts change the interaction model, preserve touch targets, and avoid horizontal clipping.
Alternate input parity: keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Provide a standard web build (e.g., via Vite).
- `npm start` must serve the built application on port 3000.
</delivery>

<webmcp_action_contract>
<action name="webmcp_session_info">
    <description>Get information about the current session and schema.</description>
    <returns>
      <property name="schemaVersion" type="string">The version of the schema.</property>
      <property name="sessionStartedAt" type="string">The timestamp when the session started.</property>
    </returns>
  </action>

  <action name="webmcp_list_tools">
    <description>List all available WebMCP tools.</description>
    <returns>
      <property name="tools" type="array">An array of tool objects with name and description.</property>
    </returns>
  </action>

  <action name="webmcp_invoke_tool">
    <description>Invoke a specific WebMCP tool.</description>
    <parameters>
      <property name="tool" type="string" required="true">The name of the tool to invoke.</property>
      <property name="args" type="object">The arguments for the tool.</property>
    </parameters>
    <returns>
      <property name="result" type="any">The result of the tool invocation.</property>
    </returns>
  </action>
</webmcp_action_contract>
