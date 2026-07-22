<summary>
Build a spatial fragment-alignment and evidence workbench for ceramic vessel reconstruction using React. The application must provide a deterministically defined "Kiln Lot K-17" fixture of fictional sherds and allow the user to physically translate and rotate pieces to test matches against strict geometric tolerances. It must incorporate linked evidence ledgers, hypothesis branching, and WebMCP integration, outputting a strictly shaped interoperable packet of artifacts representing the whole spatial logic and derivation.
</summary>

<core_features>
- Provide an SVG reconstruction table supporting pan/zoom, lasso selection, bring-to-inspection, and keyboard/pointer translation (0.5mm/5.0mm) and rotation (0.5deg/5.0deg). Dragging an edge near a candidate mate displays endpoint, tangent, length-ratio, and mean residual guides.
- Implement an Edge Microscope that compares matched edges using pre-calculated table transforms. A valid match strictly requires an opposite traversal direction, endpoint residual at most 1.5mm, mean residual at most 1.0mm, tangent mismatch at most 4.0 degrees, and length ratio from 0.92 through 1.08.
- Maintain linked assembly, profile, and coverage views. Accepted matches form an undirected match graph, computing group bounds and interior overlaps (rejecting overlaps > 0.5mm^2 or cycles with closure > 1.5mm/4.0deg). Selected rim/base edges contribute to a 2D axial profile view reporting radius, diameter, residual, and coverage.
- Support evidence decisions with reversible history. Every match decision captures transforms, metrics, rationale, and logical time. History can be previewed, captured, or merged via transaction. Undo must fully restore pre-snap state, graph membership, profile values, and notes.
- Support hypothesis branching to fork from any revision, compare ghosted transforms/metrics, and cleanly merge conflicting edits. The tool must lock and proof the hypothesis (freezing all state) unless a cycle or overlap exists, and reveal late fragment SH-29 at logical clock 20.
- Ensure the state can be exported (and cleanly imported) as kiln-lot-reconstruction.json (canonical API-shaped state), reconstruction-layout.svg, edge-decisions.csv, vessel-profile.svg, and evidence-plate.md.
</core_features>

<visual_design>
- Distinguish state entirely without relying solely on color. Provide visibly separate unreviewed, tentative, supported, rejected, selected, focused, snap-valid, invalid, overlap, cycle, rim, and base visual conditions.
- Ghost hypothesis branches with clear difference markers for conflicting edge alignments and transforms.
</visual_design>

<motion>
- Display causal motion where fragments approach their mate, guides converge, and accepted connectors settle smoothly. Dependent graph, profile, coverage, and ledger rows must visibly pulse on update.
- Respect reduced motion by instantly snapping to endpoints with persistent changed outlines and numeric delta indicators in place of animations.
</motion>

<requirements>
- The application must use Tailwind CSS 4.3.2. (Or standard tailwind as installed)
- All libraries must be npm-local (no CDNs).
- Begin from a clean state with no pre-seeded completion. Do not use localStorage or backend persistence.
- Do not use the Excalidraw framework or identity.
- Reject invalid, duplicate, overlapping, or cyclic matches silently during import/merge with diagnostic warnings naming the exact field/rule.
- Support strict keyboard accessibility with precise arrow-key adjustments (0.5mm/0.5deg and 5.0mm/5.0deg with modifiers) matching pointer interaction identically.
- Ensure minimum, maximum, just-inside, and just-outside boundaries are accurately checked for all matching metrics (1.5mm, 1.0mm, 4.0deg, 0.92/1.08 ratio).
- Ensure a 100ms response time for direct manipulation and 500ms for linked views at max fixture size (120 sherds).
</requirements>

<webmcp_action_contract>
{
  "client_name": "eval-intelligence/frontend-creative-tools-ceramic-sherd-reconstruction-studio",
  "client_version": "1.0",
  "tools": [
    {
      "name": "webmcp_session_info",
      "description": "Returns session context and status."
    },
    {
      "name": "webmcp_list_tools",
      "description": "Lists available webmcp operations."
    },
    {
      "name": "webmcp_invoke_tool",
      "description": "Invokes standard webmcp editing, collection, and workflow operations, covering structured-editor-v1, entity-collection-v1, browse-query-v1, form-workflow-v1, command-session-v1, and artifact-transfer-v1 modules."
    }
  ]
}
</webmcp_action_contract>
