<summary>
Build a Stack-Trace Path Finder debugger using React, Zustand, Tailwind CSS 4.3.2, and shadcn/ui. The app allows a debugger to paste a deterministic stack trace, correct parsing ambiguities, map each frame to candidate file/symbol nodes, assemble a temporally ordered fault path through a frozen code graph, compare hypotheses, and export a minimal localization package. The app produces the user's session artifact: a downloadable and copyable Session JSON document compiled live from the trace, graph state, hypotheses, and exported fields. It operates completely in-memory with NO localStorage.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Stack parsing workbench —
- Raw trace input: A textarea accepts a line-numbered mixed-format stack trace. Parsed frames appear as draggable cards preserving original line, normalized basename, symbol, line/column, language, and parse confidence.
- Frame editing: The debugger can split a fused line into two, join continuation text, collapse a wrapper, or mark noise.
- Frame reordering: Frames can be reordered via drag-and-drop or keyboard commands.
- Robust parsing: Blank, duplicated, or unsupported lines retain diagnostics rather than disappearing.
Feature: Candidate matching lattice —
- Candidate expansion: Each parsed frame expands into ranked candidate nodes based on deterministic basename, whole-word symbol, line range, and language signals.
- Candidate pinning: The debugger pins or rejects candidates.
- Evidence weighting: Bounded evidence weights can be adjusted with sliders that must sum to 100. Candidate scores, reasons, and ties update immediately. A pinned candidate cannot be silently displaced; if it becomes incompatible, the path is marked invalid with an explanation.
Feature: Ordered path graph —
- Graph view: Frames occupy an ordered spine beside a frozen 26-node code graph.
- Path mapping: Dragging a candidate onto a frame commits its mapping and highlights the shortest allowed graph segment to the next mapped frame.
- Keyboard parity: Keyboard source/target selection and mobile candidate sheets are equivalent to drag actions.
- Graph immutability: Graph edges are immutable; authored state consists of frame mapping, collapsed wrapper decisions, and connector path choices among equal-length alternatives.
Feature: Constraint and contradiction lens —
- Contradiction detection: The app detects reversed caller/callee order, missing connectors, forbidden generated-file crossings, lines outside symbol range, language mismatches, duplicate node reuse, and unresolved required frames.
- Focus sync: Selecting a contradiction synchronizes the two frames, graph segment, source excerpts, and score explanation.
- Wrapper constraints: An allowed wrapper collapse may bridge exactly one frame but cannot hide the unresolved terminal frame.
Feature: Hypothesis comparison and minimal locus —
- Hypothesis saving: The debugger saves up to two hypotheses and compares mapped membership, connector edges, scores, and contradictions.
- Scrubber: A scrubber walks frame by frame through synchronized source excerpts.
- Minimal locus: When a valid path exists, the app computes a deterministic minimal locus (the lowest common enclosing symbol span covering decisive mapped nodes).
- Annotations: Annotations attach to frames, nodes, edges, or exact source excerpt ranges.
Feature: Transfer and responsive transformation —
- Export/Import: Export and import preserve raw trace, parse edits, frame order, weights, candidate decisions, selected connectors, hypotheses, annotations, graph viewport, selection, and history.
- Responsive design: Desktop uses stack spine + graph + source panes; tablet overlays source; mobile uses an ordered frame stepper, candidate drawer, compact connector breadcrumb, and source sheet with all actions intact.
</core_features>

<visual_design>
- Inspect ambiguous, pinned, invalid, selected, compared, and resolved states: Stack order, graph direction, and evidence hierarchy must remain clearly legible.
- The UI should have a professional, debugger-oriented aesthetic (e.g. dark mode or high contrast) appropriate for a hard browser app/tool.
</visual_design>

<motion>
- Reorder, commit, reroute, reject, compare, and scrub operations must include causal transitions.
- A reduced motion toggle must provide instant endpoints with persistent route deltas, ensuring final routes agree in both modes.
</motion>

<requirements>
- Stack: React, Zustand (in-memory state only, no localStorage), Tailwind CSS 4.3.2, and shadcn/ui.
- The application must seed a deterministic fixture containing a 26-node shallow code graph, 38 directed call/import edges, 14 source excerpts, and a seven-line mixed-format stack trace.
- Artifact contract: StackPathHypothesisPack uses schemaVersion: "stack-path-hypothesis/v1" and stores fixture id/hash, raw trace hash/text, ordered frame records with original-line provenance, parse edits, evidence weights, candidate decisions, selected node ids, connector edge ids, wrapper collapses, two optional hypotheses, annotations with excerpt offsets, viewport, selection, ordered history, derived score/contradiction/minimal-locus checksums, and UTC exportedAt.
- Frame ids and order are unique; every non-noise character of raw input belongs to exactly one frame or diagnostic range.
- Evidence weights are integers 0-100 and sum exactly 100.
- Committed candidates belong to the frames deterministic candidate set; connector edges form a directed contiguous path in the fixture graph.
- Export provides a Copy and Download action for the StackPathHypothesisPack JSON. Import fully restores the state.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1

Module specs:
<module_spec id="structured-editor-v1">
{
  "id": "structured-editor-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Structured editor",
  "purpose": "Document, diagram, canvas, configuration, and property editors.",
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview"],
  "binding_keys": {
    "required_any_of": [["editor_operations"], ["editor_object_types"]],
    "optional": ["editor_properties", "editor_modes", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP.",
    "Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters."
  ],
  "tool_name_prefix": "editor"
}
</module_spec>

<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Carts, records, favorites, calendar events, list items, and local entities.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Closed entity and field enums only.",
    "Bounded string and numeric values.",
    "No generic state setter or arbitrary patch object.",
    "Invokes the same domain command used by the visible control.",
    "Delete requires explicit confirm=true.",
    "Reorder only when gesture mechanics are not being evaluated."
  ],
  "tool_name_prefix": "entity"
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import, export, copy, print, and conversion workflows.",
  "permitted_operations": ["import", "export", "copy", "print_preview", "convert"],
  "binding_keys": {
    "required_any_of": [["artifact_operations"]],
    "optional": ["import_modes", "export_formats", "conversion_modes", "visible_postconditions"]
  },
  "restrictions": [
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results.",
    "File picker interaction, clipboard contents, and downloaded artifacts remain Playwright responsibilities."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Editor object types: frame; candidate; node
- Editor properties: weights; pinned
- Editor modes: normal; edit
- Editor operations: select; update_property; preview; set_content
- Entity: hypothesis
- Entity operations: create; select; delete
- Entity fields: name
- Artifact operations: export; import; copy
- Export formats: stack-path-hypothesis-json
- Import modes: stack-path-hypothesis-json

Mechanics exclusions:
- Drag-and-drop operations for frames and candidate mappings stay Playwright (gesture mechanics)
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
