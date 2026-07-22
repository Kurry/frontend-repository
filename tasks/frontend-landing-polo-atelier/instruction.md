<summary>
Build "The Heron & Loom Polo Atelier Experience" — a fully fictional, single-page immersive factory-tour experience — using Vue 3, Pinia, Tailwind CSS, and Reka UI, with Three.js for the 3D machine scenes and GSAP for chapter transitions. Reproduce the reference experience's structure, chaptered 3D factory-tour ambition, and interaction quality, but none of its brand, mascot, logos, fonts, copy, links, or proprietary media: every asset and every word is newly authored for the fictional knitwear house Heron & Loom.
</summary>

<core_features>
Core features (each line is an observable behavior the finished experience must exhibit):
- The experience loads as a single-page app at route / only. The browser tab title reads exactly The Heron & Loom Polo Atelier Experience. All chapters — preloader, lobby, three machine halls (Knitting, Dyeing, Embroidering), prize-draw entry, and confirmation — live in this one page as client-side states; no second document ever loads.
- On load a full-viewport preloader shows an original animated Heron & Loom line-art logo (an origami-style heron mark), the words Welcome to the Heron & Loom Polo Atelier, and a visible loading progress indicator that reaches completion and then clears to reveal the lobby; it never permanently blocks content.
- The lobby introduces the tour: a floating fictional mascot (the origami heron), drifting knitted polo shirts, the headline The Polo Atelier Experience, an original one-paragraph invitation, a Begin the tour call-to-action, and a persistent sound toggle. Activating Begin the tour advances to the first machine hall.
- The tour has exactly three machine halls in fixed order — Knitting, Dyeing, Embroidering — plus a progress rail that always shows which halls are completed, which is active, and which are locked. A hall unlocks only after the previous hall's machine has been run.
- Each machine hall renders an interactive 3D scene (Three.js) of a stylized factory machine on a floating platform, with an oversized arcade-style push button in the foreground. The scene supports pointer-drag orbiting within clamped bounds and idle ambient animation (soft bobbing, blinking indicator lamps, drifting steam particles).
- Pressing and holding the arcade button (mouse down or touch) visibly depresses the button cap and charges the machine — a charge meter fills over about one second of hold; releasing early drains the meter. A completed charge triggers the machine run.
- A machine run is a staged, non-interruptible animation of roughly four to seven seconds during which the machine visibly processes the polo: the Knitting hall assembles a wireframe polo into knitted fabric, the Dyeing hall submerges the white polo and lifts it out in the session's chosen dye color, and the Embroidering hall stitches the heron crest onto the chest. Each run ends with the transformed polo presented under a spotlight and the hall marked complete on the progress rail.
- The Dyeing hall exposes a swatch picker of exactly six named dye colors (Marsh Green, River Blue, Clay Red, Sand, Ink, Chalk); the selected swatch drives the dye run's resulting polo color, is reflected in the run log, and persists through the rest of the session including the final export.
- Every machine run appends an entry to a session run log (hall, timestamp, outcome, and for dyeing the chosen color). Re-running a hall is allowed after the tour is complete and appends further entries rather than overwriting.
- Completing all three halls presents the finished polo in a showcase moment and unlocks the prize-draw entry chapter via a Claim your entry call-to-action.
- The prize-draw entry form collects first name, last name, email, country (a select with exactly eight fictional-safe options: United States, United Kingdom, France, Germany, Spain, Italy, Japan, Australia), and a required terms-of-participation checkbox whose label links to an in-page rules overlay (never an external site). Validation is schema-driven with inline per-field errors; a valid submission advances to the confirmation chapter.
- The confirmation chapter shows the headline Congratulations, a confirmation paragraph, a summary card of the session (entrant name, completed halls, dye color, run count), and the export controls.
- Export: a Download pass button and a Copy pass button emit an "atelier pass" JSON document compiled live from the Pinia store — entrant fields, ordered run log, chosen dye color, hall completion states, and a generated pass id — with copy-with-confirmation feedback. The export must reflect every mutation the session made.
- A persistent sound toggle mutes/unmutes all synthesized or locally bundled effects (button press, machine run, chapter chime); its state is visible in the chrome across all chapters.
- On viewports in portrait orientation below tablet width, a full-screen rotate-device overlay with an original illustration and the text Rotate your device to continue covers the experience until orientation or size changes; the underlying state is preserved.
- If WebGL is unavailable, each machine hall falls back to a static 2D illustrated composition of the same machine with the arcade button still fully functional (charge, run via staged 2D animation, log, progress) — the tour must remain completable end to end.
</core_features>

<user_flows>
- First-visit happy path: load / → preloader completes and clears → lobby → Begin the tour → Knitting hall → hold the button to full charge → watch the knitting run → hall marked complete, advance to Dyeing → pick River Blue → hold to charge → dye run shows a blue polo → advance to Embroidering → hold to charge → crest run completes → showcase → Claim your entry → fill the form validly → Congratulations chapter → Download pass and verify the JSON contains the entrant, three completed halls, River Blue, and three run entries.
- Early-release flow: in any hall, press the button briefly and release before full charge → the meter visibly drains, no run triggers, no run-log entry is created, and the hall stays incomplete.
- Locked-hall flow: from the Knitting hall (nothing run yet), attempt to jump to Embroidering via the progress rail → the locked hall does not activate and a visible locked affordance explains that halls unlock in order.
- Invalid-entry flow: on the prize-draw form, submit with an empty first name, a malformed email, and the terms checkbox unchecked → three inline field errors render, focus moves to the first invalid field, and no confirmation chapter appears; correcting all fields allows submission.
- Replay flow: from the confirmation chapter, navigate back to a completed hall via the progress rail, re-run the machine, return to confirmation, and export again → the new export contains the appended run entries.
- Sound flow: toggle sound off in the lobby → run a machine in any hall → no audio plays; toggle back on → subsequent button presses produce audio.
</user_flows>

<edge_cases>
- Rapid double-activation of a machine button during a run must not start a second overlapping run, duplicate log entries, or corrupt the progress rail.
- Resizing the window mid-run keeps the 3D canvas correctly sized with no stretched or letterboxed rendering and does not abort the run.
- The rotate-device overlay appearing mid-charge cancels the charge safely; returning to landscape restores the hall in its pre-charge state.
- Submitting the prize-draw form twice (double-click on submit) creates exactly one entrant record and one confirmation.
- Email validation rejects values without a domain (e.g. name@) and leading/trailing-whitespace-only names; trimmed values are what the export contains.
- Copy pass on an insecure or clipboard-denied context degrades to a visible fallback (selectable JSON in a dialog) rather than failing silently.
- Opening the rules overlay from the terms label and closing it via its close control or Escape returns focus to the checkbox label and never navigates away.
- With WebGL unavailable, all thirteen behaviors above remain reachable; the fallback never dead-ends the tour.
</edge_cases>

<visual_design>
- The visual language is an original "paper atelier" system: warm off-white paper field, deep botanical green primary, one warm accent (clay), and ink-dark text; soft grain, subtle topographic/knit-line patterns, and rounded card geometry. It must read as a crafted brand world, not a component-library default theme.
- The heron mascot, logo mark, wordmark, crest embroidery motif, machine illustrations, rotate-device illustration, and all decorative patterns are newly authored original assets bundled in /app; nothing may be traced, recolored, or derived from the source site's crocodile mascot, logotype, or imagery.
- The three machine scenes share one material language (matte painted metal, brass accents, fabric surfaces, emissive indicator lamps) while each hall keeps a distinct silhouette and signature mechanism (needle carriage, dye vat and hoist, embroidery gantry).
- The arcade push button is a signature object: oversized, three-part (cap, collar, base), with a visible pressed state, a circumferential charge meter, and lamp feedback tied to charge state.
- Typography: a bundled open-license display face with rounded, sporty character for headlines and a bundled open-license sans for UI text; rendered text must resolve to these bundled faces.
- The progress rail, swatch picker, form, overlays, and export cards all express the paper-atelier language (texture, green/clay accents, stitched or perforated edge details) rather than unstyled defaults.
- The confirmation summary card presents the session data with clear hierarchy: entrant name as the lead, then dye swatch chip, hall checklist, and run count.
</visual_design>

<motion>
- Signature interaction: the press-and-hold arcade button — cap depression, charge meter fill over about one second, lamp state changes, and on completion a machine run of staged, choreographed sub-animations (parts move in sequence, not all at once) ending in a spotlight polo reveal.
- Chapter transitions between lobby, halls, form, and confirmation are choreographed full-viewport transitions (e.g. iris, curtain, or conveyor wipe) of 600–900ms on a non-linear ease; content never pops between chapters.
- The preloader progress indicator animates smoothly to completion and exits with a transition that hands off into the lobby's entrance choreography.
- Idle scenes are alive: mascot drift, floating polos, steam particles, and lamp blinks run continuously at 60fps-target without jank.
- Early release of the button plays a distinct drain/settle animation clearly different from the completion animation.
- All motion respects prefers-reduced-motion: reduced variants replace large choreography with short fades while keeping every state change perceivable.
</motion>

<responsiveness>
- Landscape desktop (1440x900 and 1280x800) is the primary layout; landscape tablet reflows chrome (progress rail may collapse to compact form) with full functionality.
- Portrait below tablet width shows the rotate-device overlay; landscape phones (e.g. 844x390) must present a usable compact layout of every chapter.
- The 3D canvas, chrome, and overlays never overlap illegibly at any supported viewport; text never truncates meaningfully.
</responsiveness>

<accessibility>
- Every chapter's interactive chrome (Begin the tour, progress rail, swatch picker, sound toggle, form, export controls, overlays) is keyboard operable; the arcade button supports a keyboard equivalent (hold Space/Enter to charge) with the same visible charge feedback.
- The rules overlay and any dialog trap focus and restore it on close; Escape closes them.
- Charge progress, run completion, hall unlocks, form errors, and copy confirmation are announced via ARIA live regions in addition to visuals.
- The canvas scenes carry descriptive accessible names; all meaningful state also exists as DOM text (progress rail labels, run log, summary card).
- Color contrast meets WCAG AA for all text and controls, including text over textured backgrounds.
</accessibility>

<performance>
- First meaningful render of the preloader within 2 seconds on a cold local load; the lobby is interactive promptly after the preloader completes.
- Machine scenes hold smooth interaction (orbit, charge, run) without long main-thread stalls; chapter transitions do not drop to visible stutter.
- The console stays free of errors and unhandled promise rejections through a full happy-path session.
</performance>

<writing>
- All copy is original, in confident atelier-brand voice for the fictional Heron & Loom house: chapter intros, machine hall blurbs, form microcopy, rules overlay text, and confirmation copy. No sentence may be copied from the source experience; no real brand, retailer, or prize-partner may be named. The rules overlay text describes a fictional prize draw in plain language.
- Labels specified verbatim in this instruction (tab title, Congratulations, Rotate your device to continue, hall names, dye color names, country options) must appear exactly as written.
</writing>

<requirements>
- Framework and state: Vue 3 single-page app; all shared state (chapter, hall completion, charge state, run log, dye color, sound, entrant, export) lives in Pinia stores; views and WebMCP handlers derive from and invoke the same store commands as the visible controls.
- Styling: Tailwind CSS with the paper-atelier design tokens; Reka UI primitives for dialogs, select, checkbox, and toggle chrome.
- 3D and motion: Three.js for the machine scenes; GSAP allowed for chapter and UI choreography; no other animation libraries. Phosphor icons only for generic utility icons; all brand marks are original bundled SVGs.
- Forms with schemas: the prize-draw form is driven by a form library paired with Zod or Valibot; the schema models the entry payload (first_name and last_name non-empty trimmed strings, email RFC-shaped, country from the closed eight-value enum, terms_accepted literal true) and the atelier-pass export conforms to a documented schema: { pass_id, entrant {first_name, last_name, email, country}, dye_color, halls {knitting, dyeing, embroidering: boolean}, runs [{hall, at, outcome, color?}] }. A successful submission record IS the would-be request body; Download and Copy validate through the same schema.
- End-state contract: Download and Copy MUST emit the session's actual state compiled live from the store; an export that omits any session run, the chosen dye color, or the entrant is invalid.
- Do not use localStorage, sessionStorage, cookies, or any other browser storage API; nothing may be written to browser storage during the session.
- Offline and local-asset contract: the experience runs fully offline; every font, image, model, texture, audio file, script, and stylesheet loads from the same origin. No CDN, analytics, tag manager, or remote font/model host may be contacted at runtime.
- Audio is synthesized (Web Audio) or newly authored local files; no sourced-site audio.
- Asset originality: author every 3D model, texture, illustration, mark, and audio cue as a new original file in /app; do not copy, trace, decode, transcode, recolor, or redistribute any file from the source site. A missing asset is not an acceptable debranding strategy.
- All libraries installed via npm and bundled locally; build with Vite or equivalent; serve the built app on port 3000 with scripts named exactly start and verify:build.
</requirements>

<integrity>
Do not fabricate completion states, run-log entries, or export content that the session did not produce; do not special-case judge-visible strings; the WebMCP tools must drive the same store commands as the visible UI.
</integrity>

<delivery>
- Deliver a self-contained SPA in /app with package.json scripts start (serves on port 3000) and verify:build.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- browse-query-v1
- command-session-v1
- entity-collection-v1
- artifact-transfer-v1

Module specs:
<module_spec id="browse-query-v1">
{
  "id": "browse-query-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Browse / query",
  "purpose": "Content sites, catalogs, feeds, dashboards, and navigation.",
  "permitted_operations": ["open", "search", "apply_filter", "clear_filter", "sort", "set_locale", "set_theme"],
  "binding_keys": {
    "required_any_of": [["destinations"]],
    "optional": ["browsable_entity", "filters", "sorts", "locales", "themes", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary URL, selector, or undeclared route.",
    "Destinations and filters come from bounded PRD declarations.",
    "Visible navigation state must update via the same handlers as UI controls."
  ],
  "tool_name_prefix": "browse"
}
</module_spec>

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
- Destinations: lobby; knitting; dyeing; embroidering; entry-form; confirmation; rules-overlay
- Session operations: start; restart; advance
- Entity: entrant
- Entity operations: create; update; select
- Entity fields: first_name; last_name; email; country; terms_accepted; dye_color
- Artifact operations: export; copy
- Export formats: json

Mechanics exclusions:
- Press-and-hold charge timing and button depression stay Playwright-observed
- Machine run choreography, particles, and spotlight reveal stay Playwright-observed
- WebGL rendering and orbit gesture fidelity stay Playwright-observed
- Chapter transition choreography stays Playwright-observed
- Audio playback and the sound toggle's audible effect stay Playwright-observed
- Clipboard contents and downloaded atelier-pass artifacts remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
