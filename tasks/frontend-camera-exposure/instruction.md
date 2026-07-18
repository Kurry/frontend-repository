<summary>
Build a camera exposure simulator using React, Zustand, and CSS Modules.
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
Core features (each line is an observable behavior the finished app must exhibit):
- Direct simulator entry: the full-viewport, edge-to-edge photo preview with overlaid dials renders immediately — no login, admin gate, or multi-page shell
- Three dial steppers, each with an up button, a down button, a title, and a live value readout: APERTURE reads f/N (default f/16), SPEED reads 1/N (default 1/60), ISO reads a bare integer (default 100); pressing a stepper moves exactly one stop along that control's discrete list and updates that dial's readout on the same press
- Aperture stepper is inverted relative to the raw f-number: the "open" direction widens the aperture toward a lower f-number (e.g. f/16 → f/11) and the other direction narrows it toward a higher f-number
- Pressing any dial updates the whole preview stack together on that press: overall frame brightness (a wider aperture, slower shutter, or higher ISO brightens the frame; narrower/faster/lower darkens it), depth-of-field blur applied to both the depth plate and the motion stack (wider aperture → visibly stronger blur), the visible shutter motion frame (each shutter stop shows exactly one of the 10 local frames, ordered slow → fast), the tiled ISO noise overlay opacity (higher ISO → more visible grain, capped so it never fully hides the photo), and the vertical exposure meter indicator
- Exposure meter: a dot rests centered on a vertical track captioned UNDER EXPOSED and OVER EXPOSED; it travels toward over-exposed as net light increases and toward under-exposed as it decreases, and is capped at the track ends (a further step in the same direction cannot push it past either end)
- At each stop-list edge the corresponding stepper button fades to invisible and stops responding to clicks, so the value cannot step past the first or last stop
- Reset returns all three dials to their defaults (f/16, 1/60, ISO 100), restores the default preview, and re-centers the exposure meter
- In-page help: a "?" trigger opens a side help panel and its glyph swaps to "X" to close it again; the panel carries distinct Aperture, Shutter Speed, and ISO explainer paragraphs; a separate mobile help trigger exists alongside the desktop one; opening or closing help never navigates away or reloads
- Saved exposure presets collection: seed at least 6 presets so the list is non-empty on first load; each preset carries a name, an aperture, a shutter, an ISO, and a note or look tag; the collection supports create, edit, and delete
- Two interaction modes: a Meter/Lab mode (live dials + meter over the preview) and a Presets/Compare mode (browse saved looks, apply a preset to the dials, optionally compare two presets side by side); switching modes swaps the region without a full page reload
- Applying a preset writes its stops into the shared dial state so the Meter/Lab preview jumps to that look; a preset can be marked favorite; presets can be filtered by look tag or by favorites-only; the visible preset list recomputes from the shared collection when filters or favorites change
- Invalid create: an empty preset name must not add a row and must show visible validation feedback; after deleting every preset the list region shows an empty state
- Inert brand chip label reading Camera Exposure Simulator (styled text, not a link)
- Default stops per control: aperture 22, 16, 11, 8, 5.6, 4, 2.8, 1.8 (default 16); shutter 2, 4, 8, 15, 30, 60, 125, 250, 500, 1000 shown as 1/N (default 60); ISO 50, 100, 200, 400, 800, 1600, 3200 (default 100)
</core_features>

<visual_design>
- One full-viewport lab composition: edge-to-edge photo preview behind overlaid controls, with a presets panel or drawer for the collection (not a dashboard card grid)
- Condensed display UI type (Oswald / Bebas-style); dark chrome dials with white values and red accent on help trigger and meter emphasis
- Three circular dial controls titled APERTURE / SPEED / ISO with up/down arrow (chevron) steppers and a large value readout each (f/16, 1/60, 100 at defaults); vertical exposure meter on the left with UNDER EXPOSED / OVER EXPOSED end captions and a centered rest marker
- Help trigger is a compact glyph badge showing "?" that reads "X" while the panel is open (desktop badge plus a mobile-only badge)
- Presets/Compare mode uses a dense list or strip of looks with name, stop readout, and favorite/tag badges
- Motion stack of local frames + depth plate + tiled noise overlay; all imagery from local assets
- Help panel overlays the preview from the side; brand chip is a small red-tinted, uppercase, bottom-centered inert label; no marketing sections or competing hero cards
</visual_design>

<motion>
- Dial steppers: short opacity transitions on up/down controls as stop edges enable/disable; pressed steps update dial values immediately with no page reload
- Exposure meter: the indicator eases along the vertical track by one increment per stop change (roughly half a second) and stops at the track ends — continuous travel, not hard jumps
- Preview stack: brightness filter, depth-of-field blur, shutter motion-frame crossfade (about 0.2s), and noise opacity all ease on stop changes rather than snapping
- Mode switch: Meter/Lab and Presets/Compare swap without full reload; applying a preset eases dials and preview to the saved stops
- Help overlay: the panel slides in from the right edge (offscreen transform → 0) with opacity, and the trigger glyph shifts from "?" to "X" when open
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
Stack: React + Zustand + CSS Modules (Vite or equivalent SPA). Styling is CSS Modules — not Tailwind utility classes or external component libraries. Vendored GSAP for the exposure meter is allowed.
- Seed at least 6 exposure presets so Presets mode is non-empty on first load
- Empty required fields on create must not increase the presets count; show visible validation feedback
- After deleting all presets, show an empty state in the presets list region
- Dials start at their defaults (f/16, 1/60, ISO 100); a reset returns all three dials and the exposure meter to that default state
- Each stepper cannot move past the first or last stop of its list; the edge button becomes invisible and non-interactive there
- Zero navigational outbound links — steppers, help, reset, and presets are in-app controls only
- All imagery (depth plate, 10 motion frames, noise texture, chevrons) loads from local assets; document title: Camera Exposure Simulator
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
- Continuous hold-to-repeat on edge buttons stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
