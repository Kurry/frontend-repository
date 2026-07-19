<summary>
Build a camera exposure simulator using Solid, Solid stores, Tailwind CSS 4.3.2, and Kobalte.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Simulator entry and dials —
- Direct simulator entry: the full-viewport, edge-to-edge photo preview with overlaid dials renders immediately — no login, admin gate, or multi-page shell
- Three dial steppers, each with an up button, a down button, a title, and a live value readout: APERTURE reads f/N (default f/16), SPEED reads 1/N (default 1/60), ISO reads a bare integer (default 100); pressing a stepper moves exactly one stop along that control's discrete list and updates that dial's readout on the same press
- Aperture stepper is inverted relative to the raw f-number: the "open" direction widens the aperture toward a lower f-number (e.g. f/16 → f/11) and the other direction narrows it toward a higher f-number
- Default stops per control: aperture 22, 16, 11, 8, 5.6, 4, 2.8, 1.8 (default 16); shutter 2, 4, 8, 15, 30, 60, 125, 250, 500, 1000 shown as 1/N (default 60); ISO 50, 100, 200, 400, 800, 1600, 3200 (default 100)
Feature: Preview stack and exposure meter —
- Pressing any dial updates the whole preview stack together on that press: overall frame brightness (a wider aperture, slower shutter, or higher ISO brightens the frame; narrower/faster/lower darkens it), depth-of-field blur applied to both the depth plate and the motion stack (wider aperture → visibly stronger blur), the visible shutter motion frame (each shutter stop shows exactly one of the 10 local frames, ordered slow → fast), the tiled ISO noise overlay opacity (higher ISO → more visible grain, capped so it never fully hides the photo), and the vertical exposure meter indicator
- Exposure meter: a dot rests centered on a vertical track captioned UNDER EXPOSED and OVER EXPOSED; it travels toward over-exposed as net light increases and toward under-exposed as it decreases, and is capped at the track ends (a further step in the same direction cannot push it past either end)
- Reset returns all three dials to their defaults (f/16, 1/60, ISO 100), restores the default preview, and re-centers the exposure meter
Feature: In-page help —
- A "?" trigger opens a side help panel and its glyph swaps to "X" to close it again; the panel carries distinct Aperture, Shutter Speed, and ISO explainer paragraphs; opening or closing help never navigates away or reloads
Feature: Saved exposure presets —
- Saved exposure presets collection: seed at least 6 presets so the list is non-empty on first load; each preset carries a name, an aperture, a shutter, an ISO, and a note or look tag; the collection supports create, edit, and delete
- Two interaction modes: a Meter/Lab mode (live dials + meter over the preview) and a Presets/Compare mode (browse saved looks, apply a preset to the dials, optionally compare two presets side by side); switching modes swaps the region without a full page reload
- The preset create and edit form validates inline per field before submit: an invalid field shows an error message naming that field next to it, and the submit control stays disabled until every required field is valid
- A preset can be marked favorite; presets can be filtered by look tag or by favorites-only; the visible preset list recomputes from the shared collection when filters or favorites change
- Inert brand chip label reading Camera Exposure Simulator (styled text, not a link)
</core_features>

<user_flows>
End-to-end flows (state must stay coherent across every step without a reload):
- Preset lifecycle: in Presets/Compare, creating a valid preset closes the form and the visible preset row count increases by exactly one; switching to Meter/Lab and back shows the same new preset without a reload; editing that preset's name updates the same row and any compare panel where it appears; deleting it removes it from the list, from any selection, and from the favorites and tag filter results, and the row count decreases by exactly one
- Apply-a-look: applying a preset from Presets/Compare writes its stops into the shared dial state, so switching to Meter/Lab shows all three dial readouts at the preset's values, the preview stack (brightness, blur, motion frame, grain) matching those stops, and the exposure meter at the corresponding position — all without a reload
- Dial-to-meter round trip: from defaults, stepping aperture one stop toward open brightens the frame, strengthens the blur, and moves the meter one increment toward over-exposed; stepping back narrows it and returns the frame, blur, and meter to the default state; switching to Presets/Compare and back preserves the current dial values
- Favorites echo: marking a preset favorite shows its favorite badge in the list immediately, and switching the filter to favorites-only shows that preset among the results; unmarking it while the favorites-only filter is active removes it from the visible list on the same action
- A page reload returns the app to its seeded state: default dials (f/16, 1/60, ISO 100), centered meter, and exactly the seeded presets
</user_flows>

<edge_cases>
- At each stop-list edge the corresponding stepper button fades to invisible and stops responding to clicks, so the value cannot step past the first or last stop
- A further step in the same direction at a meter track end cannot push the indicator past that end
- Invalid create: an empty preset name must not add a row and must show visible validation feedback naming the name field
- Double-activating the preset submit control creates exactly one preset: the row count increases by one and one new row appears
- After deleting every preset the list region shows an empty state message explaining that no presets exist and how to create one
</edge_cases>

<visual_design>
- One full-viewport lab composition: edge-to-edge photo preview behind overlaid controls, with a presets panel or drawer for the collection (not a dashboard card grid)
- Condensed display UI type (Oswald / Bebas-style); dark chrome dials with white values and red accent on help trigger and meter emphasis
- Three circular dial controls titled APERTURE / SPEED / ISO with up/down arrow (chevron) steppers and a large value readout each (f/16, 1/60, 100 at defaults); vertical exposure meter on the left with UNDER EXPOSED / OVER EXPOSED end captions and a centered rest marker
- Help trigger is a compact glyph badge showing "?" that reads "X" while the panel is open
- Presets/Compare mode uses a dense list or strip of looks with name, stop readout, and favorite/tag badges
- Motion stack of local frames + depth plate + tiled noise overlay; all imagery from local assets
- Help panel overlays the preview from the side; brand chip is a small red-tinted, uppercase, bottom-centered inert label; no marketing sections or competing hero cards
- Component states: steppers, buttons, and form fields show distinct default, hover, focus (visible ring), disabled, and error treatments
</visual_design>

<motion>
- Dial steppers: short opacity transitions on up/down controls as stop edges enable/disable; pressed steps update dial values immediately with no page reload
- Exposure meter: the indicator eases along the vertical track by one increment per stop change (roughly half a second) and stops at the track ends — continuous travel, not hard jumps
- Preview stack: brightness filter, depth-of-field blur, shutter motion-frame crossfade (about 0.2s), and noise opacity all ease on stop changes rather than snapping
- Mode switch: Meter/Lab and Presets/Compare swap without full reload; applying a preset eases dials and preview to the saved stops
- Help overlay: the panel slides in from the right edge (offscreen transform → 0) with opacity, and the trigger glyph shifts from "?" to "X" when open
- Preset list microinteractions: a newly created preset row animates into the list, a deleted row animates out, and validation feedback appears with a short transition rather than popping in
- Hover animations (required): help trigger brightens on hover; stepper buttons keep pointer cursor while enabled; preset rows and primary buttons take a visible hover wash; focus-visible rings on steppers and controls
- With prefers-reduced-motion set, easing and slide effects are removed and dial, meter, preview, and panel state changes apply instantly while every feature stays usable
</motion>

<responsiveness>
- A separate mobile help trigger exists alongside the desktop one; at mobile widths the mobile badge opens the same help panel content
- At 375 pixel width the preview stays edge-to-edge, the dials and meter remain visible and operable, and no content clips or produces horizontal scrolling
- At desktop widths (1440 pixels) the layout matches the reference composition: meter on the left, dials overlaid on the preview, help trigger in its corner position
</responsiveness>

<accessibility>
- Every stepper, mode switch, help trigger, reset, and preset control is reachable and operable with the keyboard alone, with a visible focus indicator
- The help panel is announced as a dialog or complementary region; opening it moves focus into the panel and closing it returns focus to the trigger
- Each dial's current value is readable as text by assistive technology (the readout is real text, not an image)
- Preset form validation messages are shown visually and associated with their fields so assistive technology announces them
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of dials, help, modes, and presets
- Rapid repeated stepper presses stay responsive: every press lands, readouts never desynchronize from the preview, and the UI never hangs
</performance>

<writing>
- Dial titles, meter captions, and mode labels keep one consistent uppercase convention; buttons use specific verbs such as Apply preset and Reset
- The three help explainer paragraphs are distinct, plain-language explanations of aperture, shutter speed, and ISO — no filler or placeholder text anywhere in the shipped UI
- Validation and empty-state messages name the problem and the fix
</writing>

<requirements>
Shared application state must live in Solid stores, the state library named in summary (in-memory only): aperture, shutter, ISO, help-open, active mode, presets collection, selection, favorites/filters. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid preset increases the collection and shows the new row in Presets/Compare
- Editing a preset updates that same record (name, stops, tags) everywhere it appears
- Deleting a preset removes it from the list, selection, and filters
- Applying a preset writes its stops into the shared dial state so Meter/Lab preview updates
- Favorites and tag filters recompute the visible preset list from the shared collection
- Views derive from the one shared store; no view keeps a second disconnected copy of the presets or dial state
Stack: Solid with Solid stores, built with Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned), with design tokens in @theme. Kobalte components for the help panel/dialog surface, mode switch, selects, toggles, and any toasts; no other external component library. The vanilla Motion library (motion.dev) is allowed for animation — exposure meter travel, preview easing, help panel slide, preset list transitions; no other animation libraries. Phosphor icons via unplugin-icons only; no raw pasted SVG icon sets and no icon CDNs. All forms (preset create and edit) validate through a Zod schema driven by a form library (TanStack Form for Solid or Felte) that renders inline per-field errors before submit. All libraries are installed via npm and bundled locally; no CDN imports.
- Seed at least 6 exposure presets so Presets mode is non-empty on first load
- Empty required fields on create must not increase the presets count; show visible validation feedback
- After deleting all presets, show an empty state in the presets list region
- Dials start at their defaults (f/16, 1/60, ISO 100); a reset returns all three dials and the exposure meter to that default state
- Each stepper cannot move past the first or last stop of its list; the edge button becomes invisible and non-interactive there
- Zero navigational outbound links — steppers, help, reset, and presets are in-app controls only
- All imagery (depth plate, 10 motion frames, noise texture) loads from local assets; document title: Camera Exposure Simulator
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
