<summary>
Build a Variable Type Motion Score kinetic typography editor using Solid.js, Solid stores, Tailwind CSS 4.3.2, and Kobalte. The user lays out text blocks, manipulates variable-font axes, creates keyframes and easing segments, coordinates semantic emphasis, tests desktop/tablet/mobile wraps, authors a meaningful reduced-motion state, branches and compares scores, validates clipping/readability/timing, and exports exact CSS, SVG storyboard, and motion-spec artifacts.
</summary>

<core_features>
- Text block stage: Blocks drag/resize/rotate within a fixed stage safe area and bind content, semantic role, alignment, max lines, and responsive anchor. Geometry uses normalized millionths per viewport. Keyboard nudge/resize/rotate and mobile numeric sheets equal pointer gestures.
- Variable-axis inspector: Each block has base axis values and per-axis keyframes. Sliders, numeric inputs, multi-selection deltas, and curve handles clamp to exact font bounds (wght 200–900, wdth 75–125, slnt -12–0, opsz 10–72). Axis values interpolate using declared linear, ease-in, ease-out, ease-in-out, or cubic-bezier rules.
- Timeline and keyframe score: Blocks have enter, hold, emphasis, and exit intervals; axis, opacity, position, rotation, and tracking curves share one timeline. Keyframes drag/snap to frame/beat markers, copy/paste, and retime. Crossing keyframes reorder only after explicit confirmation.
- Semantic emphasis choreography: Five message beats declare primary, supporting, or hidden blocks at each interval. Contrast, size, position, opacity, and axis weight contribute to a deterministic prominence score.
- Responsive line-break and anchor maps: 1440/768/375 viewports have fixed containers and font metric tables. Authors may create viewport overrides for geometry, font size, max lines, and keyframes. A linked map shows line breaks/clipping at all viewports and scrub times.
- Playback and reduced-motion design: Logical playback supports scrub, play/pause, frame step, beat loop. Reduced motion is separately authored (static or crossfade-only) and preserves reading order.
- Branch, compare, and validation: Users fork score branches, compare geometry, keyframes, and wraps. Validator checks axis bounds, clipping, line count, block overlap, continuity, beat coverage, and export parity.
- Export and import: Export produces canonical JSON, CSS custom properties/keyframes, standalone SVG storyboard sheets at required times/viewports, and Markdown motion/accessibility spec. Import reconstructs exactly.
</core_features>

<visual_design>
- Desktop shows stage, timeline/curves, block/axis inspector, and multi-viewport/validator rail.
- Mobile editing uses preview, block cards, property/keyframe sheets, vertical beat timeline, viewport/reduced-motion drawer, and frame controls.
</visual_design>

<motion>
- Keyframe/curve edits visibly change sampled typography, wraps/prominence, viewport preview, and validation.
</motion>

<requirements>
- "Northstar VF" font (mocked or loaded variable font) exposed with wght 200–900, wdth 75–125, slnt -12–0, opsz 10–72.
- 12-second fixture with six text blocks, five semantic beats, fixed glyph metrics at 1440/768/375 viewports, 24-fps logical playback.
- Good-app genre means in-memory state only, NO localStorage.
- Product naming: Variable Type Motion Score.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
</requirements>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- timeline-animation-v1
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
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP."
  ],
  "tool_name_prefix": "editor"
}
</module_spec>

<module_spec id="timeline-animation-v1">
{
  "id": "timeline-animation-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Timeline animation",
  "purpose": "Keyframes, tracks, and timeline controls.",
  "permitted_operations": ["play", "pause", "scrub", "add_keyframe", "update_keyframe", "delete_keyframe", "set_duration"],
  "binding_keys": {
    "required_any_of": [["timeline_operations"]],
    "optional": ["track_types", "easing_types"]
  },
  "restrictions": [],
  "tool_name_prefix": "timeline"
}
</module_spec>

<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Local entities like branches or layers.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [],
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
  "restrictions": [],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Editor object types: text-block
- Editor properties: wght; wdth; slnt; opsz; position; rotation; opacity
- Editor modes: full-motion; reduced-motion
- Editor operations: select; update_property; set_content; switch_mode; preview
- Timeline operations: play; pause; scrub; add_keyframe; update_keyframe; delete_keyframe
- Track types: wght; wdth; slnt; opsz; position; rotation; opacity
- Easing types: linear; ease-in; ease-out; ease-in-out; cubic-bezier
- Entity: branch
- Entity operations: create; select; update; delete
- Entity fields: name
- Artifact operations: export; import
- Export formats: json; css; svg; markdown
- Import modes: json

Mechanics exclusions:
- Dragging, scrubbing, resizing via pointers stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
