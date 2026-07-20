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
- Aperture stepper is inverted relative to the raw f-number: the open direction widens the aperture toward a lower f-number (e.g. f/16 → f/11) and the other direction narrows it toward a higher f-number
- Default stops per control: aperture 22, 16, 11, 8, 5.6, 4, 2.8, 1.8 (default 16); shutter 2, 4, 8, 15, 30, 60, 125, 250, 500, 1000 shown as 1/N (default 60); ISO 50, 100, 200, 400, 800, 1600, 3200 (default 100)
Feature: Preview stack and exposure meter —
- Pressing any dial updates the whole preview stack together on that press: overall frame brightness (a wider aperture, slower shutter, or higher ISO brightens the frame; narrower/faster/lower darkens it), depth-of-field blur applied to both the depth plate and the motion stack (wider aperture → visibly stronger blur), the visible shutter motion frame (each shutter stop shows exactly one of the 10 local frames, ordered slow → fast), the tiled ISO noise overlay opacity (higher ISO → more visible grain, capped so it never fully hides the photo), and the vertical exposure meter indicator
- Exposure meter: a dot rests centered on a vertical track captioned UNDER EXPOSED and OVER EXPOSED; it travels toward over-exposed as net light increases and toward under-exposed as it decreases, and is capped at the track ends (a further step in the same direction cannot push it past either end)
- A live EV readout near the dials shows 0.0 EV at defaults (f/16, 1/60, ISO 100) and updates on the same press when a dial or light slider changes
- The preview stack renders its simulated capture effects as real pixel operations on a canvas surface: brightness, depth-of-field blur, and ISO grain exist in the rendered bitmap (the 10 local motion frames remain the source imagery for the shutter stack), not only as CSS decoration — which is why the PNG/JPEG exports can carry them
- Reset returns all three dials to their defaults (f/16, 1/60, ISO 100), zeros Contrast / Highlights / Shadows, restores the default scene Daylight Courtyard, restores the default preview, re-centers the exposure meter, and clears the active look pack and snapshot selection
Feature: Scene scenarios —
- A Scenes strip offers five fictional scenarios with exact names and stated light offsets: Daylight Courtyard (0 EV, active by default), Alpine Midday (+2 EV), Stadium Floodlights (+1 EV), Candlelit Study (-2 EV), and Neon Alley Night (-3 EV)
- Selecting a scene applies its light offset on the same press while the dials keep their current stops: the EV readout shifts by the scene's offset, the meter moves accordingly, the preview brightness changes, and the histogram reshapes; the active scene chip shows a selected treatment
- With identical dial stops, two different scenes produce visibly different preview brightness, EV numbers, and histogram shapes
Feature: Exposure bracketing —
- A Bracket panel offers a frame-count choice of 3 or 5, a step choice of 1 or 2 stops, and a required base-name field (non-empty, at most 40 characters)
- Generate bracket creates the whole series as saved presets in one action: the visible preset count increases by exactly the chosen frame count; each frame keeps the current aperture and ISO and shifts only the shutter along the discrete stop list by the step per frame, centered on the current shutter; frame names are the base name suffixed with the signed EV delta (for count 3 step 1: -1 EV, 0 EV, +1 EV; for count 5 step 2: -4 EV, -2 EV, 0 EV, +2 EV, +4 EV)
- A frame whose shutter shift would pass the first or last stop clamps at that end stop and its row is visibly marked as clamped
- A bracket preview strip renders the generated series as thumbnails ordered darkest to brightest; with a mid-list shutter and a nonzero step, adjacent thumbnails differ visibly in brightness
Feature: Clipping zebras —
- Two independent toggles, Highlight zebras and Shadow zebras: with highlight zebras on, striped hatching overlays preview regions near pure white; with shadow zebras on, striped hatching overlays regions near pure black; at default dials in Daylight Courtyard neither overlay covers any meaningful area
- Pushing exposure far toward over-exposed makes highlight-zebra coverage appear and grow; pushing far toward under-exposed makes shadow-zebra coverage appear and grow
- The histogram carries a highlight-clipping indicator at its right edge and a shadow-clipping indicator at its left edge that light up whenever clipped regions exist, whether or not the zebra toggles are on
Feature: A/B compare wipe —
- Set A and Set B capture the complete current exposure state (dials, light sliders, scene, look pack) into slots A and B; a filled slot shows a summary of its stored stops; the Compare control is available only once both slots are filled
- Compare view shows one preview split by a draggable vertical wipe handle: left of the handle renders slot A's exposure state and right of it renders slot B's, with A and B labels visible on their sides; dragging the handle moves the split continuously and it clamps at the preview edges; leaving Compare returns to the live edit state without altering either slot
Feature: Settings card export —
- Download settings card downloads a real PNG file named exposure-settings-card.png rendered client-side, whose pixels carry the current aperture (f/N), shutter (1/N), ISO, EV, and active scene name as readable text; downloading, changing any dial or the scene, and downloading again produces two visibly different card files whose text matches the readouts at each download
Feature: Light sliders and live histogram —
- Three light sliders — Contrast, Highlights, and Shadows — each range from -100 to 100 inclusive in integer steps, default 0, with a live integer readout beside the control
- Moving any light slider away from 0 visibly changes the preview tones on the same gesture and reshapes the live histogram; brightening exposure (wider aperture or higher ISO) shifts histogram mass toward the right, and darkening shifts it toward the left — the histogram is never a static decoration
Feature: Look packs —
- One-click look packs Warm, Subtle, Strong, and B&W each apply a multi-control edit state in a single press (dials and light sliders update together; preview and histogram match); B&W removes visible color while the other packs keep a color image; the active pack shows a selected treatment
Feature: Before/after and snapshots —
- Holding the Before/After control shows the original unedited photo for the hold duration and releasing returns to the current edit state without changing stored dial or slider values
- A Snapshots strip lets the user save the current dials, light sliders, and look pack under a required name; Apply restores that exact edit state; Delete removes the row; an empty snapshot name is rejected with inline validation naming the name field
Feature: Undo and redo —
- Undo and Redo controls reverse and reapply edit mutations (dial steps, light-slider changes, and scene selections) in order and restore the prior preview; both are visibly disabled when their stack is empty; a new edit after Undo clears and disables Redo
Feature: Finished image export (true pixel bake) —
- The app produces the user's finished photograph: Download PNG triggers a real file download named exposure-export.png whose pixels carry every current dial, light-slider, look-pack, blur, and grain edit baked into the bitmap — not a CSS-filter-only preview recipe or a settings file alone
- Download JPEG triggers a real file download named exposure-export.jpg with the same current edits baked into the image pixels
- Two different edit states produce two visibly different exported image files, and the just-exported file matches the tonal look of the on-screen preview at export time
Feature: Edit-stack JSON (develop API payload) —
- Download edit stack downloads a JSON document compiled live from the session; Copy edit stack copies the same text and shows a visible confirmation that reverts after a moment
- Import edit stack accepts a previously exported JSON file or pasted JSON and restores dials, light sliders, look pack, scene, snapshots, preview, histogram, and meter to the exported state
- The edit-stack document IS the would-be develop/settings API request body. All keys and nesting below are REQUIRED unless marked optional. Example values are illustrative only. Valid exports and imports MUST conform exactly:
  - schemaVersion: required string, exactly camera-exposure.edit-stack.v1
  - aperture: required number, one of 22, 16, 11, 8, 5.6, 4, 2.8, 1.8
  - shutter: required integer shutter denominator, one of 2, 4, 8, 15, 30, 60, 125, 250, 500, 1000 (UI shows as 1/N)
  - iso: required integer, one of 50, 100, 200, 400, 800, 1600, 3200
  - contrast: required integer from -100 through 100 inclusive
  - highlights: required integer from -100 through 100 inclusive
  - shadows: required integer from -100 through 100 inclusive
  - lookPack: required; either null (no pack) or exactly one of Warm, Subtle, Strong, B&W
  - scene: required string; exactly one of Daylight Courtyard, Alpine Midday, Stadium Floodlights, Candlelit Study, Neon Alley Night
  - snapshots: required array (may be empty); each item requires name (non-empty string, at most 64 characters) plus aperture, shutter, iso, contrast, highlights, shadows, and lookPack under the same bounds and enums as the top-level fields
- Cross-field rules: every stop field must be a member of its discrete list; every slider field must be an integer inside -100..100; lookPack must be null or one of the four pack names; scene must be one of the five scene names; a document missing schemaVersion, using any other schemaVersion, or carrying out-of-bounds values is invalid
- An export that omits the session's actual dial, slider, look-pack, scene, or snapshot mutations is incomplete
Feature: In-page help —
- A ? trigger opens a side help panel and its glyph swaps to X to close it again; the panel carries distinct Aperture, Shutter Speed, and ISO explainer paragraphs; opening or closing help never navigates away or reloads
Feature: Saved exposure presets —
- Saved exposure presets collection: seed at least 6 presets so the list is non-empty on first load; each preset carries a name, an aperture, a shutter, an ISO, and a note or look tag; the collection supports create, edit, and delete
- Preset create and edit submit a record shaped as the would-be preset API request body with these required fields and bounds: name (non-empty string, 1 to 64 characters), aperture (one of the aperture stop list), shutter (one of the shutter denominator list), iso (one of the ISO stop list), lookTag (non-empty string, 1 to 32 characters); favorite is optional boolean defaulting to false
- Two interaction modes: a Meter/Lab mode (live dials + meter + EV + histogram + light sliders over the preview) and a Presets/Compare mode (browse saved looks, apply a preset to the dials, optionally compare two presets side by side); switching modes swaps the region without a full page reload
- The preset create and edit form validates inline per field before submit: an invalid field shows an error message naming that field next to it, and the submit control stays disabled until every required field is valid
- A preset can be marked favorite; presets can be filtered by look tag or by favorites-only; the visible preset list recomputes from the shared collection when filters or favorites change
- Inert brand chip label reading Camera Exposure Simulator (styled text, not a link)
</core_features>

<user_flows>
End-to-end flows (state must stay coherent across every step without a reload unless a step says otherwise):
- Preset lifecycle: in Presets/Compare, creating a valid preset closes the form and the visible preset row count increases by exactly one; switching to Meter/Lab and back shows the same new preset without a reload; editing that preset's name updates the same row and any compare panel where it appears; deleting it removes it from the list, from any selection, and from the favorites and tag filter results, and the row count decreases by exactly one
- Apply-a-look: applying a preset from Presets/Compare writes its stops into the shared dial state, so switching to Meter/Lab shows all three dial readouts at the preset's values, the preview stack (brightness, blur, motion frame, grain) matching those stops, and the exposure meter at the corresponding position — all without a reload
- Dial-to-meter round trip: from defaults, stepping aperture one stop toward open brightens the frame, strengthens the blur, and moves the meter one increment toward over-exposed; stepping back narrows it and returns the frame, blur, and meter to the default state; switching to Presets/Compare and back preserves the current dial values
- Favorites echo: marking a preset favorite shows its favorite badge in the list immediately, and switching the filter to favorites-only shows that preset among the results; unmarking it while the favorites-only filter is active removes it from the visible list on the same action
- Pixel export differencing: from defaults, open aperture two stops and raise Contrast, Download PNG (exposure-export.png); then darken (narrow aperture, lower Shadows) and Download PNG again — the second file is visually darker or otherwise different from the first when both are inspected
- Edit-stack round trip: after dial and slider edits, a scene change, and a named snapshot, Download edit stack, Reset, then Import edit stack — dials, sliders, scene, snapshots, preview, histogram, and meter return to the exported state without a reload; the imported document must satisfy the edit-stack field contract
- Undo then redo: step a dial, move a light slider, Undo twice so both reverse, then Redo twice so both reapply in order with matching preview state
- Look pack then export: Apply the Strong look pack, confirm preview and sliders match that pack, then Download edit stack — the JSON includes lookPack equal to Strong reflecting the session
- Before/after then continue: after editing away from defaults, hold Before/After to see the original, release to return to the edited look, then continue stepping a dial — the edit state was not wiped by the hold
- Snapshot apply after further edits: save a snapshot at a distinctive edit state, change dials away from it, then Apply the snapshot — dials, sliders, look pack, preview, and histogram all return to the snapshot's stored combination
- Create preset then export: create a valid preset, then Download edit stack — the export still reflects current dial/slider state and snapshots; creating a preset does not clear the edit buffer
- Scene shift: with dials at defaults in Daylight Courtyard, select Neon Alley Night — the EV readout drops by 3, the meter moves toward under-exposed, the preview darkens, and the histogram shifts left while all three dial readouts stay at f/16, 1/60, 100; selecting Alpine Midday then raises EV above the default and brightens the preview — all without a reload
- Bracket then inspect: set frame count 5, step 1, base name Dusk, Generate bracket — the preset count increases by exactly five, rows Dusk -2 EV through Dusk +2 EV appear, and the bracket strip shows five thumbnails ordered darkest to brightest; applying the Dusk +2 EV preset writes its shifted shutter into the dials
- Zebra discovery: at defaults in Daylight Courtyard with both zebra toggles on, no stripes cover the preview; open the aperture and raise ISO until highlight zebras appear over the brightest regions and the histogram's right-edge clipping indicator lights; reverse to a strongly under-exposed combination until shadow zebras appear and the left-edge indicator lights
- A/B wipe compare: capture a bright exposure state with Set A, change to a clearly darker state and capture with Set B, open Compare — the preview is split with A's brighter render left of the handle and B's darker render right of it; dragging the handle right reveals more of A's render and the split follows the pointer continuously; leaving Compare restores the live state with both slots intact
- Settings card differencing: Download settings card, then change ISO two stops and select a different scene, then Download settings card again — the two card files are visibly different and the second card's rendered text matches the new aperture, shutter, ISO, EV, and scene readouts
- A page reload returns the app to its seeded state: default dials (f/16, 1/60, ISO 100), zeroed light sliders, scene Daylight Courtyard, no zebra overlays, empty A/B slots, centered meter, empty snapshots, empty undo/redo, no active look pack, and exactly the seeded presets
</user_flows>

<edge_cases>
- At each stop-list edge the corresponding stepper button fades to invisible and stops responding to clicks, so the value cannot step past the first or last stop
- A further step in the same direction at a meter track end cannot push the indicator past that end
- Invalid create: an empty preset name must not add a row and must show visible validation feedback naming the name field
- Double-activating the preset submit control creates exactly one preset: the row count increases by one and one new row appears
- After deleting every preset the list region shows an empty state message explaining that no presets exist and how to create one
- Saving a snapshot with an empty name adds no snapshot and shows inline validation naming the name field
- Light sliders clamp at -100 and 100; dragging past either end leaves the value at the clamp and the readout shows that bound
- Importing a malformed edit-stack JSON (missing schemaVersion, wrong schemaVersion, out-of-bounds contrast, non-enum lookPack, or a scene outside the five scene names) shows a visible error naming that the file is invalid and leaves the current edit state unchanged
- Before any edit, Undo and Redo are disabled; after Undo empties the undo stack, Undo disables again
- At ISO 3200 the grain overlay is clearly stronger than at ISO 100 but the underlying photo remains discernible
- Opening and closing help never navigates away or reloads the page
- Reset clears the active look pack selection and snapshot selection while restoring default dials, zeroed sliders, and the Daylight Courtyard scene
- Generate bracket with an empty base name creates no presets: the count stays the same and inline validation names the base-name field
- A bracket generated at the shutter list's fastest or slowest stop clamps out-of-range frames at the end stop and marks those rows as clamped instead of inventing stops outside the list
- The Compare control stays unavailable while fewer than two slots are filled; activating it then changes nothing
- With zebra toggles on but no clipped regions in the current render, no stripes appear anywhere on the preview
- The wipe handle cannot be dragged past either preview edge — at the extremes one slot's render fills the preview
</edge_cases>

<visual_design>
- One full-viewport lab composition: edge-to-edge photo preview behind overlaid controls, with a presets panel or drawer for the collection (not a dashboard card grid)
- Condensed display UI type (Oswald / Bebas-style); dark chrome dials with white values and red accent on help trigger and meter emphasis
- Three circular dial controls titled APERTURE / SPEED / ISO with up/down arrow (chevron) steppers and a large value readout each (f/16, 1/60, 100 at defaults); vertical exposure meter on the left with UNDER EXPOSED / OVER EXPOSED end captions and a centered rest marker
- EV readout, live histogram, Contrast / Highlights / Shadows sliders, look-pack chips, Scenes strip, Bracket panel, zebra toggles, A/B compare controls, Before/After, Snapshots strip, Undo/Redo, and export controls sit in the lab chrome without breaking the overlaid dial composition
- The Scenes strip renders the five scenario chips with name and EV offset; the Bracket panel shows the count and step choices, the base-name field, and the generated thumbnail strip; the histogram carries small clipping indicators at its left and right edges
- Compare view shows the vertical wipe handle with visible A and B side labels; filled A/B slot summaries show their stored stop readouts
- Help trigger is a compact glyph badge showing ? that reads X while the panel is open
- Presets/Compare mode uses a dense list or strip of looks with name, stop readout, and favorite/tag badges
- Motion stack of local frames + depth plate + tiled noise overlay; all imagery from local assets
- Help panel overlays the preview from the side; brand chip is a small red-tinted, uppercase, bottom-centered inert label; no marketing sections or competing hero cards
- Component states: steppers, buttons, sliders, and form fields show distinct default, hover, focus (visible ring), disabled, and error treatments
</visual_design>

<motion>
- Dial steppers: short opacity transitions on up/down controls as stop edges enable/disable; pressed steps update dial values immediately with no page reload
- Exposure meter: the indicator eases along the vertical track by one increment per stop change (roughly half a second) and stops at the track ends — continuous travel, not hard jumps
- Preview stack: brightness, depth-of-field blur, shutter motion-frame crossfade (about 0.2s), noise opacity, and light-slider tone changes all ease on edits rather than snapping
- Histogram bars ease into their new shape when dials or light sliders change
- Mode switch: Meter/Lab and Presets/Compare swap without full reload; applying a preset or look pack eases dials and preview to the saved stops
- Scene selection eases the preview brightness and histogram to the new offset rather than hard-cutting; the active scene chip's selected treatment transitions smoothly
- Zebra stripes fade in and out over a short transition when clipping appears or a toggle changes, rather than popping
- The wipe handle tracks the pointer continuously during drag with no visible lag or stepped jumps; bracket rows and thumbnails animate into their strip when generated
- Help overlay: the panel slides in from the right edge (offscreen transform → 0) with opacity, and the trigger glyph shifts from ? to X when open
- Preset list microinteractions: a newly created preset row animates into the list, a deleted row animates out, and validation feedback appears with a short transition rather than popping in
- Hover animations (required): help trigger brightens on hover; stepper buttons keep pointer cursor while enabled; preset rows, look-pack chips, and primary buttons take a visible hover wash; focus-visible rings on steppers and controls
- With prefers-reduced-motion set, easing and slide effects are removed and dial, meter, preview, histogram, panel, and list state changes apply instantly while every feature stays usable
</motion>

<responsiveness>
- A separate mobile help trigger exists alongside the desktop one; at mobile widths the mobile badge opens the same help panel content
- At 375 pixel width the preview stays edge-to-edge, the dials, meter, EV readout, histogram, light sliders, and export controls remain visible and operable, and no content clips or produces horizontal scrolling
- Export controls, snapshot strip, undo/redo, look packs, the Scenes strip, the Bracket panel, zebra toggles, and the A/B compare controls remain reachable at 375 pixel width — they may scroll within their own containers but must not force page-level horizontal scrolling
- At desktop widths (1440 pixels) the layout matches the reference composition: meter on the left, dials overlaid on the preview, help trigger in its corner position
</responsiveness>

<accessibility>
- Every stepper, mode switch, help trigger, reset, light slider, look pack, scene chip, zebra toggle, bracket control, A/B slot and Compare control, Before/After, snapshot control, undo/redo, export/import control, and preset control is reachable and operable with the keyboard alone, with a visible focus indicator
- Scene chips and zebra toggles expose their selected/pressed state programmatically, not only by color; the wipe handle is keyboard-operable (arrow keys move the split while it is focused)
- The bracket base-name field has an associated label and its validation message is programmatically associated with the field
- The help panel is announced as a dialog or complementary region; opening it moves focus into the panel and closing it returns focus to the trigger
- Each dial's current value and each light-slider readout is readable as text by assistive technology (real text, not an image)
- Preset form, snapshot name, and import validation messages are shown visually and associated with their fields so assistive technology announces them
- Download PNG, Download JPEG, Download settings card, Generate bracket, Download edit stack, Copy edit stack, and Import edit stack expose accessible names that identify the action
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of dials, light sliders, look packs, scenes, bracketing, zebras, A/B compare, help, modes, presets, snapshots, undo/redo, before/after, pixel export, settings-card export, and edit-stack import/export
- Rapid repeated stepper presses stay responsive: every press lands, readouts never desynchronize from the preview, and the UI never hangs
- Generating a five-frame bracket completes without freezing the UI; dragging the wipe handle end to end keeps both renders tracking the gesture smoothly
- Pixel export completes without freezing the UI for more than a brief moment; the lab remains operable after download
</performance>

<writing>
- Dial titles, meter captions, and mode labels keep one consistent uppercase convention; buttons use specific verbs such as Apply preset, Reset, Generate bracket, Set A, Set B, Compare, Download PNG, Download JPEG, Download settings card, Download edit stack, Copy edit stack, and Import edit stack
- The five scene names (Daylight Courtyard, Alpine Midday, Stadium Floodlights, Candlelit Study, Neon Alley Night) render exactly and consistently wherever they appear, including the settings card and the edit-stack JSON
- The three help explainer paragraphs are distinct, plain-language explanations of aperture, shutter speed, and ISO — no filler or placeholder text anywhere in the shipped UI
- Validation and empty-state messages name the problem and the fix, including edit-stack import errors that name the invalid file or field
</writing>

<innovation>
- Optional enhancements are welcome where they do not conflict with the specified behaviors: a live RGB-channel histogram view, a focus-peaking style edge highlight, an animated exposure-triangle diagram in the help panel, a stop-delta caption versus a chosen baseline, arrow-key dial stepping when a dial is focused, or a coachmark introducing EV and the histogram on first visit
</innovation>

<requirements>
Shared application state must live in Solid stores, the state library named in summary (in-memory only): aperture, shutter, ISO, EV, histogram data, Contrast / Highlights / Shadows, active look pack, active scene, zebra toggle states, bracket configuration (count, step, base name), A/B compare slots and wipe position, help-open, active mode, presets collection, selection, favorites/filters, snapshots collection, undo/redo stacks, before-hold flag, and the live edit-stack export text. Do not use localStorage, sessionStorage, or other browser storage APIs. Persistence for this good-app genre is the pixel export plus edit-stack export and the MCP query surface — never browser storage.
State contracts (behavioral, not storage keys):
- Creating a valid preset increases the collection and shows the new row in Presets/Compare
- Editing a preset updates that same record (name, stops, tags) everywhere it appears
- Deleting a preset removes it from the list, selection, and filters
- Applying a preset writes its stops into the shared dial state so Meter/Lab preview updates
- Favorites and tag filters recompute the visible preset list from the shared collection
- Light-slider, look-pack, scene, zebra, bracket, A/B slot, snapshot, undo/redo, and import/export mutations update the same shared store the dials use
- Generate bracket creates its preset series through the same preset-creation command the form uses, so bracketed presets behave like hand-made ones (apply, edit, delete, filter)
- Pixel export and the settings-card export read the current processed state from that store so the downloaded files match the preview and readouts
- Edit-stack export and import serialize and restore the develop payload fields listed under Feature: Edit-stack JSON
- Views derive from the one shared store; no view keeps a second disconnected copy of the presets or dial state
- A page reload returns the app to its seeded state (default stops, zeroed sliders, scene Daylight Courtyard, empty A/B slots, zebra toggles off, seeded presets only, empty snapshots, empty undo/redo)
Stack: Solid with Solid stores, built with Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned), with design tokens in @theme. Kobalte components for the help panel/dialog surface, mode switch, selects, toggles, sliders, and any toasts; no other external component library. The vanilla Motion library (motion.dev) is allowed for animation — exposure meter travel, preview easing, histogram reshaping, help panel slide, preset list transitions; no other animation libraries. Phosphor icons via unplugin-icons only; no raw pasted SVG icon sets and no icon CDNs. All forms (preset create and edit, snapshot name, bracket base name, and import paste) validate through a Zod schema driven by a form library (TanStack Form for Solid or Felte) that renders inline per-field errors before submit; those schemas mirror the edit-stack and preset API payload field contracts above. Pixel baking for the PNG/JPEG frame exports and the settings-card PNG runs client-side against the preview bitmap (canvas or equivalent image processing) so downloaded files contain the edits and readouts as true pixels. All libraries are installed via npm and bundled locally; no CDN imports.
- Seed at least 6 exposure presets so Presets mode is non-empty on first load
- Empty required fields on create must not increase the presets or snapshots count; show visible validation feedback
- After deleting all presets, show an empty state in the presets list region
- Dials start at their defaults (f/16, 1/60, ISO 100); a reset returns all three dials, light sliders, look pack, snapshot selection, and the exposure meter to that default state
- Each stepper cannot move past the first or last stop of its list; the edge button becomes invisible and non-interactive there
- Zero navigational outbound links — steppers, help, reset, presets, export, and import are in-app controls only
- All imagery (depth plate, 10 motion frames, noise texture) loads from local assets; document title: Camera Exposure Simulator
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- command-session-v1
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1

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
- Session operations: start; stop; restart; advance
- Editor object types: exposure
- Editor properties: stop; brightness; contrast; highlights; shadows
- Editor operations: select; update_property; preview
- Entity: preset
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; aperture; shutter; iso; lookTag; favorite
- Artifact operations: export; import; copy
- Export formats: png; jpeg; edit-stack-json
- Import modes: edit-stack

Mechanics exclusions:
- Continuous hold-to-repeat on edge buttons stays Playwright-observed
- Before/After hold preview timing stays Playwright-observed
- File-picker Import and Blob download stay Playwright-observed; WebMCP must not return raw file/blob/base64 contents
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
