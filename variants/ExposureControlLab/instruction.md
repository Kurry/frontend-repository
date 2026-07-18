<summary>
Build a camera exposure control lab using Vue 3, Pinia, and Tailwind CSS.
</summary>

<core_features>
Core features:
- Direct simulator entry: full-viewport photo preview with overlaid dials — no login, admin gate, or multi-page shell
- Three steppers with discrete stop lists and live dial labels: APERTURE (f/N), SPEED (1/N), ISO (integer)
- Live preview stack updates together on each step: container brightness, depth-of-field blur on depth plate + motion stack, shutter motion-frame opacity swap (10 local frames), tiled ISO noise overlay opacity, and vertical exposure meter indicator
- Primary collection — saved exposure presets/looks: seed at least 6 presets; each has name, aperture, shutter, ISO, and a note or look tag; the list supports create, edit, and delete
- At least two interaction modes: Meter/Lab mode (live dials + meter on the preview) and Presets/Compare mode (browse saved looks, apply a preset to the dials, optional side-by-side compare of two presets)
- Domain behavior beyond CRUD: apply preset to dials; mark a preset as favorite; filter presets by look tag or favorites; exposure meter position derived from current stops; empty presets list state
- In-page help panel with aperture / shutter / ISO explainer; desktop and mobile help toggles; help stays on-page
- At each stop-list edge, the corresponding up/down stepper fades out and becomes non-interactive
- Invalid create: empty preset name must not add a row; show visible validation feedback
- Inert brand chip label Camera Exposure Simulator (not a link)
- Default stops: aperture 22…1.8 (default 16), shutter 2…1000 as 1/N (default 60), ISO 50…3200 (default 100)
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
