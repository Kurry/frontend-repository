<summary>
Build a camera exposure control lab using Vue 3, Pinia, and Tailwind CSS.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
`/reference-screenshots/`: `overview.png` is a full-page desktop-layout
overview (downscaled); `segment-NN.png` are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into `/app` or ship them as app assets.
</reference_screenshots>

<core_features>
Core features:
- Direct simulator entry: full-viewport photo preview with overlaid dials — no login, admin gate, or multi-page shell
- Three up/down steppers over discrete stop lists with live dial labels: APERTURE f/N, SPEED 1/N, ISO integer; the APERTURE up control narrows the aperture (raises the f-number) while its down control widens it, and each dial value updates the instant a stepper is pressed
- Live preview stack updates together on each step: the whole preview brightens as the aperture widens, the shutter slows, or ISO rises (and darkens for the opposite moves); depth-of-field blur increases as the aperture widens (lower f-number), softening both the depth plate and the motion stack; the visible motion frame swaps to the one matching the current shutter stop (10 local frames, one per shutter stop); the tiled ISO noise overlay grows more opaque as ISO climbs; and the vertical exposure meter dot climbs toward OVER EXPOSED when overexposed and drops toward UNDER EXPOSED when underexposed, clamping within the track at the extremes
- Primary collection — saved exposure presets/looks: seed at least 6 presets; each has name, aperture, shutter, ISO, and a note or look tag; the list supports create, edit, and delete
- At least two interaction modes: Meter/Lab mode (live dials + meter on the preview) and Presets/Compare mode (browse saved looks, apply a preset to the dials, optional side-by-side compare of two presets)
- Domain behavior beyond CRUD: apply preset to dials; mark a preset as favorite; filter presets by look tag or favorites; exposure meter position derived from current stops; empty presets list state
- In-page help panel with aperture / shutter / ISO explainer; desktop and mobile help toggles; help stays on-page
- At each stop-list edge, the corresponding up/down stepper fades out and becomes non-interactive
- Invalid create: empty preset name must not add a row; show visible validation feedback
- Inert brand chip label Camera Exposure Simulator (not a link)
- Default stops (exact discrete lists): aperture f/22, 16, 11, 8, 5.6, 4, 2.8, 1.8 (8 stops, default f/16); shutter 1/2, 1/4, 1/8, 1/15, 1/30, 1/60, 1/125, 1/250, 1/500, 1/1000 (10 stops, default 1/60); ISO 50, 100, 200, 400, 800, 1600, 3200 (7 stops, default 100)
</core_features>

<visual_design>
- One full-viewport lab composition: edge-to-edge photo preview behind overlaid controls, with a presets panel or drawer for the collection (not a dashboard card grid)
- Condensed display UI type (Oswald / Bebas-style); dark chrome dials with white values and red accent on help trigger and meter emphasis
- Three circular dial controls (APERTURE / SPEED / ISO) with up/down arrow steppers; vertical exposure meter on the left with UNDER EXPOSED / OVER EXPOSED captions
- Presets/Compare mode uses a dense list or strip of looks with name, stop readout, and favorite/tag badges
- Motion stack of local frames + depth plate + tiled noise overlay; all imagery from local assets
- Help panel overlays the preview from the side; no marketing sections or competing hero cards
</visual_design>

<motion>
- Dial steppers: short opacity transitions on up/down controls as stop edges enable/disable; pressed steps update dial values immediately with no page reload
- Exposure meter: indicator eases along the vertical track when exposure changes — continuous travel, not hard jumps
- Preview stack: brightness filter, depth-of-field blur, shutter motion-frame crossfade, and noise opacity all ease on stop changes
- Mode switch: Meter/Lab and Presets/Compare swap without full reload; applying a preset eases dials and preview to the saved stops
- Help overlay: panel enter/exit via transform + opacity; trigger icon stack shifts when open
- Hover animations (required): help trigger brightens on hover; stepper buttons keep pointer cursor while enabled; preset rows and primary buttons take a visible hover wash; focus-visible rings on steppers and controls
</motion>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): aperture, shutter, ISO, help-open, active mode, presets collection, selection, favorites/filters. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid preset increases the collection and shows the new row in Presets/Compare
- Editing a preset updates that same record (name, stops, tags) everywhere it appears
- Deleting a preset removes it from the list, selection, and filters
- Applying a preset writes its stops into the shared dial state so Meter/Lab preview updates
- Favorites and tag filters recompute the visible preset list from the shared collection
Stack: Vue 3 + Pinia + Tailwind CSS (Vite or equivalent SPA). No external component libraries beyond the stack.
- Seed at least 6 exposure presets so Presets mode is non-empty on first load
- Empty required fields on create must not increase the presets count; show visible validation feedback
- After deleting all presets, show an empty state in the presets list region
- Zero navigational outbound links — steppers, help, and presets are in-app controls only
- All imagery loads from local assets; document title: Camera Exposure Simulator
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- command-session-v1
- structured-editor-v1

Module specs:
<module_spec id="command-session-v1">
{
  "id": "command-session-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Command / session",
  "purpose": "Media, games, presentations, simulations, demos, and remote-control shells.",
  "permitted_operations": ["start", "pause", "resume", "stop", "restart", "advance", "trigger_demo", "connect", "disconnect"],
  "binding_keys": {
    "required_any_of": [["session_operations"]],
    "optional": ["demos", "visible_postconditions"]
  },
  "restrictions": [
    "No batching or replay of gameplay.",
    "Timing, animation, collision, repeated input, and transient UI require immediate Playwright observation.",
    "Tool output cannot prove successful playback or connection."
  ],
  "tool_name_prefix": "session"
}
</module_spec>

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

Bindings:
- Session operations: start; stop; restart; advance
- Editor object types: exposure
- Editor properties: stop; brightness
- Editor operations: select; update_property; preview

Mechanics exclusions:
- Hold-to-repeat control timing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
