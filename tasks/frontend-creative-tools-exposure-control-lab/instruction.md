<summary>
Build a camera exposure control lab using Vue 3, Pinia, Tailwind CSS 4.3.2, and Naive UI.
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
Feature: Simulator entry and dial control —
- Direct simulator entry: full-viewport photo preview with overlaid dials — no login, admin gate, or multi-page shell
- Three up/down steppers over discrete stop lists with live dial labels: APERTURE f/N, SPEED 1/N, ISO integer; the APERTURE up control narrows the aperture (raises the f-number) while its down control widens it, and each dial value updates the instant a stepper is pressed
- Default stops (exact discrete lists): aperture f/22, 16, 11, 8, 5.6, 4, 2.8, 1.8 (8 stops, default f/16); shutter 1/2, 1/4, 1/8, 1/15, 1/30, 1/60, 1/125, 1/250, 1/500, 1/1000 (10 stops, default 1/60); ISO 50, 100, 200, 400, 800, 1600, 3200 (7 stops, default 100)
- Holding a stepper repeats steps while held (hold-to-repeat); releasing stops further advances
Feature: Live preview stack —
- The preview stack updates together on each step: the whole preview brightens as the aperture widens, the shutter slows, or ISO rises (and darkens for the opposite moves); depth-of-field blur increases as the aperture widens (lower f-number), softening both the depth plate and the motion stack; the visible motion frame swaps to the one matching the current shutter stop (10 local frames, one per shutter stop); the tiled ISO noise overlay grows more opaque as ISO climbs; and the vertical exposure meter dot climbs toward OVER EXPOSED when overexposed and drops toward UNDER EXPOSED when underexposed
- A live EV numeric readout near the meter updates on the same press as any dial change; brighter stop combinations raise EV and darker combinations lower it
- A live luma histogram in the lab chrome reshapes on each stop change: brightening shifts mass toward the right and darkening shifts it toward the left — two clearly different stop combinations never leave an identical histogram shape
Feature: Develop panel — Light and Effects slider groups —
- A Develop panel presents two labeled slider groups, each slider with a live integer readout beside it that updates on the same gesture: the Light group holds Exposure, Contrast, Highlights, Shadows, Whites, and Blacks (each an integer from -100 through 100 inclusive, default 0); the Effects group holds Texture and Clarity (each -100 through 100, default 0) plus Vignette and Grain (each 0 through 100, default 0)
- Develop sliders are non-destructive edits over the same photo: moving any slider away from its default visibly changes the preview on the same gesture and reshapes the live histogram — raising Exposure shifts histogram mass toward the right and lowering it shifts mass left; raising Grain adds visible film grain; raising Vignette darkens the frame corners while the center stays brighter
- Each slider row includes a per-slider reset affordance that returns only that slider to its default value and updates preview, readout, and histogram on the same action
- Reset to original returns every develop slider to its default and the dials to f/16, 1/60, ISO 100 in one press, clears the active develop look, and leaves the presets and snapshots collections intact; the reset is a single undoable action
Feature: True pixel editing and edited-image export —
- Adjustments are applied to the actual bitmap client-side (canvas image processing): dial exposure, develop-slider tones, vignette, and grain exist in the rendered pixels, not only as stacked CSS decoration over an untouched image
- Download edited PNG triggers a real file download named exposure-lab-edit.png whose pixels carry every current dial and develop-slider edit baked in; two different edit states produce two visibly different exported image files, and the exported file matches the tonal look of the on-screen preview at export time
Feature: One-click develop looks —
- Four one-click look chips — Punch, Matte, Golden, and Mono — each apply a stored multi-slider develop state in a single press: at least three develop sliders move together to that look's values, with readouts, preview, and histogram updating on the same press
- Mono removes visible color from the preview while the other three looks keep a color image; the active look chip shows a selected treatment; activating the same look chip again leaves the sliders at that look's values (no double application); manually moving any develop slider afterwards clears the active-look indication
Feature: Copy and paste settings with group checkboxes —
- Copy settings opens a dialog listing three group checkboxes — Dials, Light, and Effects — all checked by default; the confirm control is disabled while zero groups are checked; confirming copies only the checked groups' current values to an in-app settings clipboard and shows a confirmation naming the copied groups
- Paste settings applies only the copied groups to the current edit state: every slider and dial in an uncopied group stays exactly as it was; the paste is a single undoable action; Paste settings is visibly disabled until a copy has happened in this session
Feature: Before hold —
- Holding the Before control shows the original unedited photo — default exposure (f/16, 1/60, ISO 100) and all develop sliders at their defaults — on the preview, meter, EV readout, and histogram without discarding the current stops or slider values; releasing Before restores the off-default dials, develop sliders, and all derived surfaces immediately
Feature: Versions (dial + develop snapshots) —
- Seed at least 2 named snapshots with stop readouts on first load
- Saving a valid named snapshot captures the current stops AND the current develop-slider values; the visible snapshot count increases by exactly one and the new row shows its name and stop readout
- Restoring a snapshot whose state differs from the current edit writes its stops into the shared dials and its develop values into the sliders so preview, meter, EV, histogram, and slider readouts all match the saved version
- Snapshot create submits a DialSnapshot record shaped as the would-be snapshot API request body. All keys below are REQUIRED. Example values are illustrative only. Valid creates MUST conform exactly:
  - name: required non-empty string, 1 to 40 characters, unique among snapshots
  - aperture: required; one of 22, 16, 11, 8, 5.6, 4, 2.8, 1.8 (UI shows as f/N)
  - shutter: required integer shutter denominator; one of 2, 4, 8, 15, 30, 60, 125, 250, 500, 1000 (UI shows as 1/N)
  - iso: required integer; one of 50, 100, 200, 400, 800, 1600, 3200
  - light: required object with exposure, contrast, highlights, shadows, whites, blacks — each a required integer from -100 through 100 inclusive
  - effects: required object with texture and clarity (each a required integer from -100 through 100) and vignette and grain (each a required integer from 0 through 100)
- Cross-field rules: every stop field must be a member of its discrete list; every light and effects field must be an integer inside its stated bounds; a duplicate name is invalid; an empty name is invalid
Feature: Undo and redo —
- Undo and Redo reverse and reapply session mutations (dial steps, develop-slider changes, look applies, paste-settings, reset-to-original, preset create/edit/delete, snapshot save, batch actions, copy-stops) in order; both are visibly disabled when their stack is empty; a new mutation after Undo clears and disables Redo
Feature: Saved exposure presets (primary collection) —
- Seed at least 6 presets; each has name, aperture, shutter, ISO, lookTag, and favorite; the list supports create, edit, and delete
- Preset create and edit submit an ExposurePreset record shaped as the would-be preset API request body. All keys below are REQUIRED unless marked optional. Example values are illustrative only. Valid creates and edits MUST conform exactly:
  - name: required non-empty string, 1 to 40 characters, unique among presets
  - aperture: required; one of 22, 16, 11, 8, 5.6, 4, 2.8, 1.8 (UI shows as f/N)
  - shutter: required integer shutter denominator; one of 2, 4, 8, 15, 30, 60, 125, 250, 500, 1000 (UI shows as 1/N)
  - iso: required integer; one of 50, 100, 200, 400, 800, 1600, 3200
  - lookTag: required; exactly one of soft, crisp, grainy, night, daylight, cinematic
  - favorite: optional boolean defaulting to false
- Cross-field rules: every stop field must be a member of its discrete list; lookTag must be one of the six closed enum values; a duplicate name is invalid; a name longer than 40 characters is invalid
- The preset create and edit forms validate inline per field: an invalid or empty required field shows an error message naming that field next to it before submit, and the submit control stays disabled until every required field is valid
- Domain behavior beyond CRUD: apply a preset to the dials; mark a preset as favorite; filter presets by lookTag or favorites; exposure meter position is computed from the current stops
- Selecting at least two presets shows a batch bar; Delete selected removes every selected preset at once and the visible count decreases by exactly the selected count; Favorite selected with two or more selected marks every selected row favorite in one action
- With a preset selected whose stops differ from the dials: Copy stops overwrites that preset's aperture, shutter, and ISO with the current dial values and updates that preset's stop readout in the list and in the Export panel JSON without a reload
Feature: Interaction modes —
- At least two interaction modes: Meter/Lab mode (live dials + meter + EV + histogram on the preview) and Presets/Compare mode (browse saved looks, apply a preset to the dials, optional side-by-side compare of two presets)
Feature: Lab-package JSON (settings API payload) —
- The app produces the user's portable edit-stack settings package alongside the edited image: an Export panel shows monospaced JSON compiled live from the session; Download lab package triggers a real file download of that JSON; Copy lab package copies the same text and shows a brief copied confirmation that reverts after a moment
- Import lab package accepts a previously exported JSON file or pasted JSON and restores dials, develop sliders, active look, presets, snapshots, EV, histogram, meter, and Export panel text to the exported state
- The lab-package document IS the would-be settings/package API request body. All keys and nesting below are REQUIRED. Example values are illustrative only. Valid exports and imports MUST conform exactly:
  - schemaVersion: required string, exactly exposure-control-lab.package.v1
  - aperture: required number; one of 22, 16, 11, 8, 5.6, 4, 2.8, 1.8
  - shutter: required integer shutter denominator; one of 2, 4, 8, 15, 30, 60, 125, 250, 500, 1000
  - iso: required integer; one of 50, 100, 200, 400, 800, 1600, 3200
  - ev: required number reflecting the current exposure value derived from the three stops
  - light: required object with exposure, contrast, highlights, shadows, whites, blacks — each a required integer from -100 through 100 inclusive
  - effects: required object with texture and clarity (each a required integer from -100 through 100) and vignette and grain (each a required integer from 0 through 100)
  - look: required; either null (no active look) or exactly one of Punch, Matte, Golden, Mono
  - presets: required array (may be empty); each item is an ExposurePreset with name, aperture, shutter, iso, lookTag, and favorite under the same bounds and enums as the preset form
  - snapshots: required array (may be empty); each item is a DialSnapshot with name, aperture, shutter, iso, light, and effects under the same bounds as the snapshot form
- Cross-field rules: every stop field must be a member of its discrete list; every light and effects field must be an integer inside its stated bounds; look must be null or one of the four look names; every lookTag must be one of the six closed enum values; every preset and snapshot name must be unique within its array; a document missing schemaVersion, using any other schemaVersion, carrying out-of-list stops, carrying out-of-bounds slider values, or carrying an invalid lookTag or look is invalid
- An export that omits the session's actual dial, develop-slider, look, preset, or snapshot mutations is incomplete
Feature: Help and chrome —
- In-page help panel with aperture / shutter / ISO explainer; help stays on-page
- Inert brand chip label Camera Exposure Simulator (not a link)
</core_features>

<user_flows>
End-to-end flows (state must stay coherent across every step without a reload unless a step says otherwise):
- Stepping ISO up one stop updates four surfaces at once without a reload: the ISO dial label shows the next stop in the list, the tiled noise overlay on the preview becomes visibly more opaque, the exposure meter dot moves up the vertical track, and both the EV number and the histogram shape change
- After creating a valid preset in Presets/Compare mode with a lookTag from the closed enum, the visible preset count increases by exactly one, the new row appears with its name and stop readout, applying its lookTag filter still shows the new row, the Export panel JSON presets array includes that name and lookTag, and switching to Meter/Lab and back to Presets/Compare shows the same new preset without a reload
- Applying a preset writes its stops into the shared dial state: the three dial labels change to the preset's aperture, shutter, and ISO, the preview brightness, blur, motion frame, and noise all re-render to match, and the meter dot moves to the position those stops imply
- Editing a preset's name and stops updates that same record everywhere it appears — the list row, any compare panel showing it, the Export panel JSON, and the dials after re-applying it — without a reload
- Marking a preset as favorite shows its favorite badge immediately, and switching the filter to favorites recomputes the visible list to include it; deleting that preset removes it from the list, any selection or compare slot, and the favorites filter results, and the visible preset count decreases by exactly one
- Develop slider then histogram: dragging Exposure to +60 brightens the preview, shifts histogram mass toward the right, and updates the readout to 60 on the same gesture; then raising Grain to 80 adds visible grain to the preview — both without a reload
- Edited-image differencing: from the seeded state, Download edited PNG; then apply the Mono look (or drag Exposure to -60), confirm the preview changed, and Download edited PNG again — the two downloaded files are visibly different images, and the second matches the current on-screen preview's tonal look
- Copy/paste groups: set distinctive Light values and distinctive Effects values; Copy settings with only the Light group checked; change sliders in both groups; Paste settings — every Light slider returns to the copied values while every Effects slider keeps its changed value
- Look apply then clear: activate Punch and confirm at least three develop sliders, the preview, and the histogram change together and Punch shows selected; drag any one slider manually and confirm the active-look indication clears while the other sliders keep Punch's values
- Reset then undo: after dial and slider edits, Reset to original returns dials to f/16, 1/60, ISO 100 and every slider to default in one press; Undo restores the exact pre-reset dials and slider values
- Before hold then release: with dials and sliders off defaults, holding Before shows the original unedited preview/meter/EV/histogram; releasing restores the off-default dials, sliders, and derived surfaces exactly — without a reload
- Version save/restore: saving a named snapshot increases the snapshot count by one; stepping dials and dragging sliders away, then restoring that snapshot returns dial labels, slider readouts, preview, meter, EV, and histogram to the saved edit state
- Copy stops: select a preset whose stops differ from the dials, activate Copy stops, and confirm that preset's stop readout matches the current dials in the list and in the Export panel JSON
- Batch delete then undo: select three presets, choose Delete selected, confirm the count drops by exactly three and the Export panel loses those three names; press Undo and confirm the three presets and Export panel text return
- Lab-package round trip: mutate dials, drag at least two develop sliders off default, create one valid preset with a lookTag from the closed enum, and save one valid snapshot; copy or download the lab package; reload to seed; import that package and confirm dials, the develop sliders, the new preset (name, stops, lookTag), the new snapshot (including its light and effects values), EV, histogram, and Export panel text all match the pre-export session; the imported document must satisfy the lab-package field contract
- Reloading the page returns the app to its seeded state: default stops f/16, 1/60, ISO 100 on the dials, every develop slider at its default, no active look, only the seeded presets and seeded snapshots in their collections, and empty undo/redo stacks
</user_flows>

<edge_cases>
- At each stop-list edge, the corresponding up/down stepper fades out and becomes non-interactive; pressing it changes nothing
- The exposure meter dot clamps within the track at the extreme stop combinations — it never leaves the visible track
- Submitting the preset form with an empty name adds no row: the visible preset count stays the same and an inline validation message naming the name field appears
- Submitting create or edit with a preset name that already exists on another preset does not save and shows an error naming the name field
- Choosing or forcing an aperture, shutter, or iso outside the discrete stop lists, or a lookTag outside soft/crisp/grainy/night/daylight/cinematic, does not save and shows an error naming that field
- A preset name longer than 40 characters is rejected with an error naming the name field (or input is blocked before submit) so no row is saved with a name over 40 characters
- Double-activating the preset submit control creates exactly one preset: the count increases by one and one new row appears
- After deleting all presets, the presets list region shows an empty state with a message and a control that opens the create flow
- Saving a snapshot with an empty name, a duplicate name, or out-of-list stops adds no snapshot row and shows inline validation naming the offending field
- Undo with an empty undo stack and Redo with an empty redo stack are disabled controls; activating them changes nothing
- Develop sliders clamp at their stated bounds: dragging past -100, 100, or 0 (for Vignette and Grain lower bound) leaves the value at the bound and the readout shows that bound
- Paste settings before any copy has happened in the session is disabled; activating it changes nothing
- In the Copy settings dialog, unchecking all three group checkboxes disables the confirm control
- Activating a look chip twice in a row leaves the sliders at that look's stored values — values never stack or drift on repeat activation
- Holding Before while dials and sliders are already at defaults leaves the preview, meter, EV, and histogram visually unchanged
- Importing malformed or schema-invalid lab-package JSON (missing schemaVersion, wrong schemaVersion, missing required fields, out-of-list stops, out-of-bounds light or effects values, a look outside Punch/Matte/Golden/Mono, or lookTag outside the closed enum) shows a visible error naming the import problem, leaves the current session state unchanged, and produces no console errors
- Batch Favorite selected with fewer than two presets selected is unavailable or does nothing; with two or more selected it marks every selected row favorite in one action
</edge_cases>

<visual_design>
- One full-viewport lab composition: edge-to-edge photo preview behind overlaid controls, with a presets panel or drawer for the collection (not a dashboard card grid)
- Condensed display UI type (Oswald / Bebas-style, bundled locally); dark chrome dials with white values and red accent on help trigger and meter emphasis
- Three circular dial controls (APERTURE / SPEED / ISO) with up/down arrow steppers; vertical exposure meter on the left with UNDER EXPOSED / OVER EXPOSED captions
- EV numeric readout and luma histogram sit in the lab chrome without replacing the overlaid three-dial composition
- A Develop panel presents two labeled groups (LIGHT and EFFECTS) of slider rows, each row carrying the slider name, the control, and a live integer readout; the look chips row (Punch, Matte, Golden, Mono), Copy settings, Paste settings, and Reset to original sit with the Develop panel
- An Export panel shows a monospaced JSON lab-package preview with visible API-shaped field names (schemaVersion, aperture, shutter, iso, ev, light, effects, look, presets, snapshots, lookTag, favorite) plus Download lab package, Copy lab package, and Download edited PNG controls
- Presets/Compare mode uses a dense list or strip of looks with name, stop readout, favorite/lookTag badges, and selection checkboxes; a batch bar appears when multiple rows are selected; a Snapshots strip shows named stop readouts
- Motion stack of local frames + depth plate + tiled noise overlay; all imagery from local assets
- Help panel overlays the preview from the side; no marketing sections or competing hero cards
- One icon set is used consistently across steppers, favorites, filters, undo/redo, export, and the help trigger
- Component states: steppers, form fields, and buttons show distinct default, hover, focus (visible ring), disabled, and error treatments
</visual_design>

<motion>
- Dial steppers: short opacity transitions on up/down controls as stop edges enable/disable; pressed steps update dial values immediately with no page reload
- Exposure meter: indicator eases along the vertical track when exposure changes — continuous travel, not hard jumps
- Preview stack: brightness filter, depth-of-field blur, shutter motion-frame crossfade, and noise opacity all ease on stop changes
- Histogram bars ease into their new shape when dials or develop sliders change
- Develop sliders: preview tone, vignette, and grain changes ease as a slider moves rather than snapping between discrete looks; applying a look chip eases the affected sliders and the preview to the stored state
- Copy settings dialog enters and exits with transform + opacity rather than popping
- Before hold: pressing Before crossfades the preview stack toward the original unedited state, and releasing crossfades back to the current edit
- Mode switch: Meter/Lab and Presets/Compare swap without full reload; applying a preset eases dials and preview to the saved stops
- Preset list microinteractions: a created preset animates into the list, a deleted preset animates out, and toggling a favorite animates its badge rather than snapping
- Feedback motion: create, edit, and delete confirmations appear with an animated toast or equivalent notice that enters and exits smoothly
- Help overlay: panel enter/exit via transform + opacity; trigger icon stack shifts when open
- Hover animations (required): help trigger brightens on hover; stepper buttons keep pointer cursor while enabled; preset rows and primary buttons take a visible hover wash
- With prefers-reduced-motion set, easing and travel animations are removed and dial, meter, preview, histogram, before/after, and list state changes apply instantly while remaining fully usable
</motion>

<responsiveness>
- Desktop and mobile each have a working help toggle; at widths of 768 pixels and below the presets collection presents as a drawer or sheet over the preview instead of a persistent side panel
- At 375 pixel width the three dial steppers, the meter, the EV readout, the histogram, and the mode switch remain visible and operable with no content clipped and no horizontal scrolling
- At 375 pixel width the Develop panel (both slider groups and the look chips), Export panel controls, snapshot strip, undo/redo, and batch bar remain reachable — they may scroll within their containers but must not force page-level horizontal scrolling
</responsiveness>

<accessibility>
- Every stepper, develop slider, look chip, copy/paste-settings control, reset-to-original control, mode switch, preset control, snapshot control, undo/redo control, export/import control, Before control, and form field is reachable and operable with the keyboard alone, with a visible focus ring on the focused control
- Each develop slider is adjustable with arrow keys while focused and exposes its current value as text to assistive technology; look chips expose their selected state programmatically, not only by color
- The Copy settings dialog traps focus while open, closes on Escape, and returns focus to the Copy settings trigger on close
- Steppers disabled at a stop-list edge are exposed as disabled to assistive technology, not merely dimmed
- When undo or redo stacks are empty, those controls are exposed as disabled to assistive technology, not merely dimmed
- The help overlay behaves as a dialog: it traps focus while open, closes on Escape, and returns focus to the help trigger on close
- Preset form validation messages and import errors for malformed lab-package JSON are announced via an aria-live region as well as shown inline
- Every preset create/edit form field (name, aperture, shutter, ISO, lookTag) uses an explicit label associated with the control
- The exposure meter region exposes a text readout of the current exposure state (under, balanced, or over) that updates as the stops change
- Download lab package, Copy lab package, Import lab package, and Download edited PNG expose accessible names that identify the action
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors appear during a full exercise of dials, develop sliders, looks, copy/paste settings, modes, presets, snapshots, undo/redo, before/after, reset, image export, package export, import, and help
- Rapid repeated stepper presses stay responsive: every press lands, dial values never skip out of the stop lists, and the preview keeps updating without hangs
- Dragging a develop slider end to end keeps the preview and readout tracking the gesture without multi-second freezes
- Histogram and EV recompute immediately on each stop or slider change with no multi-second freeze under rapid input
- Download edited PNG completes without freezing the UI for more than a brief moment; the lab remains operable after the download
</performance>

<writing>
- Dial labels, meter captions, and mode names keep one consistent capitalization convention throughout the app
- Buttons use specific verbs such as Apply preset, Copy stops, Copy settings, Paste settings, Reset to original, Download edited PNG, Download lab package, Copy lab package, and Import lab package rather than generic Submit or OK
- Develop slider names (Exposure, Contrast, Highlights, Shadows, Whites, Blacks, Texture, Clarity, Vignette, Grain) and look names (Punch, Matte, Golden, Mono) render exactly and consistently wherever they appear
- The help panel explains aperture, shutter, and ISO in plain sentences that each name the visible effect the control has on the preview
- Validation and empty-state messages name the problem and the fix, including import errors that name the invalid file or field; no placeholder or lorem-ipsum text appears anywhere in the shipped UI
</writing>

<innovation>
- Optional enhancements are welcome where they do not conflict with the specified behaviors: side-by-side compare polish that makes stop differences easy to scan, a per-channel histogram toggle, a stop-delta caption versus a chosen baseline, arrow-key dial stepping when a dial is focused, a split before/after divider in addition to the hold control, or a coachmark introducing the dials and Develop panel on first visit
</innovation>

<requirements>
Shared application state must use Pinia, the state library named in summary (in-memory only): aperture, shutter, ISO, EV, histogram data, develop-slider values (Light and Effects groups), active look, settings clipboard (copied groups and values), help-open, active mode, presets collection, selection, favorites/filters, snapshots collection, undo/redo stacks, before-hold flag, and the live lab-package export text. Views derive from this one store — never a second disconnected copy. Do not use localStorage, sessionStorage, or other browser storage APIs. Persistence for this good-app genre is the edited-image export plus the lab-package export and the MCP query surface — never browser storage.
State contracts (behavioral, not storage keys):
- Creating a valid preset increases the collection and shows the new row in Presets/Compare
- Editing a preset updates that same record (name, stops, lookTag, favorite) everywhere it appears
- Deleting a preset removes it from the list, selection, and filters
- Applying a preset writes its stops into the shared dial state so Meter/Lab preview updates
- Favorites and lookTag filters recompute the visible preset list from the shared collection
- Develop-slider, look, copy/paste-settings, reset-to-original, snapshot, undo/redo, before-hold, copy-stops, batch, and import/export mutations update the same shared store the dials use
- The edited-image export reads the current processed bitmap so the downloaded PNG matches the preview
- Lab-package export and import serialize and restore the settings payload fields listed under Feature: Lab-package JSON
- A page reload returns the app to its seeded state (default stops, default develop sliders, no active look, seeded presets, seeded snapshots, empty undo/redo)
Stack: Vue 3 + Pinia + Tailwind CSS 4.3.2 (pinned; Vite or equivalent SPA setup; design tokens in @theme). Naive UI is the component library for the preset dialogs/drawer, form inputs, selects, tag badges, and toasts; no other component libraries. Motion for Vue allowed for animation; no other animation libraries. Solar icons via unplugin-icons only; no raw pasted SVGs and no icon CDNs. All forms — preset create and edit, snapshot name, and import paste included — are driven by VeeValidate with a Zod schema: the schema defines the rules and the form surfaces inline per-field errors before submit; those schemas mirror the ExposurePreset, DialSnapshot, and lab-package API payload field contracts above. Pixel rendering for the preview and the edited-PNG export runs client-side against the photo bitmap (canvas or equivalent image processing) so the downloaded image contains the edits. All libraries installed via npm and bundled locally; no CDN imports.
- Seed at least 6 exposure presets and at least 2 dial snapshots so Presets mode and the Snapshots strip are non-empty on first load
- Empty required fields on create must not increase the presets or snapshots count; show visible validation feedback
- After deleting all presets, show an empty state in the presets list region
- Zero navigational outbound links — steppers, help, presets, export, and import are in-app controls only
- All imagery and fonts load from local assets; document title: Camera Exposure Simulator
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
- Editor properties: stop; brightness; exposure; contrast; highlights; shadows; whites; blacks; texture; clarity; vignette; grain; look
- Editor operations: select; update_property; preview
- Entity: preset
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; aperture; shutter; iso; lookTag; favorite
- Artifact operations: export; import; copy
- Export formats: json; png
- Import modes: lab-package

Mechanics exclusions:
- Hold-to-repeat control timing stays Playwright-observed
- Before-hold preview crossfade timing stays Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
