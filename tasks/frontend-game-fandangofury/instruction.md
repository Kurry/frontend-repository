<summary>
Build a side-scrolling hack-and-slash festival combat game called FandangoFury using Astro with hydrated Svelte 5 islands, Svelte runes, Tailwind CSS 4.3.2, and Bits UI.
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
Feature: Stage map and campaign chrome —
- The app opens at / with no login into a FandangoFury Stage-select map: a title, a row of Stage nodes (Plaza del Sol, Mercado Nocturno, Fortaleza Roja), a Pesos balance, an owned-Masks count, and buttons to open the Cantina, open the Masks screen, open Fighter Settings, open Export Campaign, open Import Campaign, open the History panel, and Reset progress. On first load with empty storage only Stage 1 is unlocked and playable; the later Stage nodes render locked
- When a saved run checkpoint exists, the Stage-select map also shows a Resume Run control; when no checkpoint exists, Resume Run is hidden or disabled
Feature: Real combat loop —
- Clicking an unlocked Stage node starts a combat run for that Stage: the fighter stands at the left of a town-square scene while bandit enemies approach from the right in successive waves, and a combat HUD with the fighter Health bar, the Fury meter, and a "Wave X of Y" indicator is always visible during the run
- Light Attack (Z key or the Strike button) and Heavy Attack (X key or the Smash button) each play a distinct attack animation and deal a different damage value to the nearest in-range enemy, whose own health bar drops; each landed hit advances an on-screen combo counter
- Chaining Light, Light, then Heavy triggers a named Fiesta Combo that deals bonus damage and shows a distinct celebratory flash and label beyond the plain combo counter
- Holding Block (C key or the Block button) reduces the damage the fighter takes from enemy attacks while held compared with the same attack taken unblocked
- Dodge Roll (Space key or the Dodge button) grants a brief window of invulnerability and then starts a visible cooldown; the dodge becomes available again only after the cooldown visibly clears
- Landing hits fills the Fury meter; the Fiesta Fury control is disabled until the meter is full and enabled only once full. Activating Fiesta Fury (F key or the Fiesta Fury button) fires a screen-wide special that hits every onscreen enemy, then empties the meter and disables the control again, and the meter begins refilling from empty as new hits land
- Defeating the enemies clears the current wave: the "Wave X of Y" indicator's total Y stays fixed while the current-wave number X increments by one after each wave clears, and once the final wave is cleared the Stage advances into a named Boss Duel instead of spawning another regular wave
- The Boss has its own labelled health bar and telegraphs its attacks with a brief visually distinct wind-up cue before it strikes; defeating the Boss awards a larger Pesos drop and can drop a collectible Mask, then shows a Victory screen summarizing the Pesos earned and Masks found this run with a Continue control — a decided win outcome
- If the fighter's Health reaches 0 the run ends on a Derrota (defeated) screen showing the Pesos earned that attempt, with a Try Again control that restarts the current Stage from its first wave with Health restored to full and with no state leaking from the lost attempt into the new run — a decided loss outcome
Feature: Pause, save, and resume —
- During an active combat run, Pause (P key or the Pause button) freezes enemy movement and attack resolution and shows a Pause overlay with Resume, Save Checkpoint, and Abandon Run controls; while paused, combat keys do not mutate Health, Fury, wave progress, or enemy state
- Resume (from the Pause overlay or the P key while paused) continues the same run from the exact Health, Fury, wave or boss phase, combo count, and on-screen enemies that were frozen
- Save Checkpoint from the Pause overlay persists a mid-run checkpoint and returns to the Stage-select map with a visible confirmation; after a full page refresh the Resume Run control remains available
- Resume Run from the Stage-select map restores that checkpoint exactly: same Stage, same wave index or boss phase, same fighter Health, same Fury meter value, and same Pesos earned this run, then combat continues from that point
- Abandon Run asks for confirmation, then clears the checkpoint and returns to the Stage-select map without applying Victory rewards; cancelling the confirmation leaves the paused run intact
Feature: Masks, Cantina, and fighter settings —
- Defeating certain enemies drops a collectible Mask; the Masks screen shows each Mask as locked, unlocked-but-unequipped, or currently equipped, and lets the player equip exactly one Mask at a time. Each equipped Mask grants one passive stat bonus (Speed, Damage, or Defense) and changes the Fiesta Fury visual effect
- The Cantina shop lets the player spend Pesos on permanent upgrades (Max health, Attack power, Fury gain rate); each upgrade shows its current level and its cost before purchase, and each subsequent purchase of the same upgrade costs strictly more than the previous one
- A Fighter Settings form, opened from the Stage-select map, contains a fighter display name field (required, 2 to 20 characters) and an effects intensity field (required, a whole number from 0 to 100); an invalid or empty field shows an inline validation message naming that field before submit, the Save control stays disabled while any field is invalid, and saving shows the fighter display name in the Stage-select header. The saved Fighter Settings record IS the fighter object in the Campaign JSON field contract below
- A Reset Progress control, guarded by a confirmation step, wipes all saved data back to Stage 1 defaults (only Stage 1 unlocked, no Mask equipped, no owned Masks, the starting Peso balance, no upgrades, and no run checkpoint)
Feature: History —
- A History panel, opened from a visible control, models changes to the run and its progression as explicit transitions: it shows Undo and Redo controls, a region labelled History state showing the current snapshot, a list of snapshots, and an Apply Scenario Change action. Undo and Redo restore the exact adjacent visible states
Feature: Campaign artifact (the app produces the player's portable campaign) —
- Export Campaign opens a centered artifact drawer with a live Campaign JSON preview regenerated from the shared store whenever campaign state changes, plus Copy and Download controls
- Campaign JSON is API-shaped like a real game-save / campaign-service payload — a single object whose field names and values are visible in the preview text and must conform to this field contract:
  - Required schemaVersion: exactly the string fandangofury.campaign.v1
  - Required fighter.displayName: trimmed string, length 2 to 20 inclusive
  - Required fighter.effectsIntensity: whole number from 0 to 100 inclusive
  - Required pesos: whole number greater than or equal to 0
  - Required upgrades.maxHealth, upgrades.attackPower, upgrades.furyGain: each a whole number greater than or equal to 0
  - Required masks.owned: an array of Mask id strings drawn only from the closed set sol-rojo, noche-azul, oro-vivo (unknown ids fail validation naming masks.owned)
  - Required masks.equipped: either null or one string that must also appear in masks.owned (equipped not in owned fails validation naming masks.equipped)
  - Required stages.unlocked: a non-empty array of whole numbers from the closed set 1, 2, 3, always including 1
  - Required stages.completed: an array of whole numbers from the closed set 1, 2, 3; every completed Stage id must also appear in stages.unlocked
  - Required checkpoint: either null, or an object with required stageId (1, 2, or 3 and must be in stages.unlocked), waveIndex (whole number greater than or equal to 1), phase (exactly one of wave or boss), fighterHealth (whole number greater than or equal to 1), furyMeter (whole number from 0 to 100 inclusive), pesosEarnedThisRun (whole number greater than or equal to 0), and comboCount (whole number greater than or equal to 0)
- The record Fighter Settings saves and the campaign mutations combat and meta screens produce IS that Campaign JSON object — same field names, bounds, and enums — and form validation plus Import validation enforce the same contracts the export shape declares, always naming the offending field inline
- Export content that omits the session's actual campaign mutations is invalid: after changing the fighter display name, buying a Cantina upgrade, unlocking a Stage, equipping a Mask, or saving a checkpoint, the open Campaign JSON preview must contain those exact values under the field contract keys
- Copy writes the preview text to the clipboard and shows a brief copied confirmation; Download triggers a real file download whose contents match the previewed Campaign JSON text
- Import Campaign accepts a Campaign JSON document validated against that same schema: a valid Import replaces the visible campaign so the Stage map, Pesos balance, owned-Masks count, Cantina levels, Masks screen, fighter display name, Resume Run availability, and Export preview all match the imported document without a reload; malformed JSON or a document that fails the field contract shows visible validation feedback naming the offending field and changes nothing
- All controls act through in-app state with no outbound navigation; the app never leaves /
</core_features>

<user_flows>
- Starting Stage 1 from the Stage-select map, clearing every wave, and defeating the Boss shows the Victory screen; pressing Continue returns to the Stage-select map where the Pesos balance has increased by exactly the amount the Victory screen reported, the owned-Masks count includes any Mask found in the run, and the next Stage node has changed from locked to unlocked and is now selectable — all without a reload
- Buying an upgrade in the Cantina decreases the Pesos balance shown in the Cantina and on the Stage-select map by exactly the shown cost, raises that upgrade's displayed level by one with a strictly higher next cost, and applies its effect in the next run (for example buying Max health raises the fighter's maximum Health capacity visible on the HUD)
- Equipping a Mask in the Masks screen moves the equipped treatment to that Mask's card, removes it from any previously equipped Mask in the same list, and changes the color of the next Fiesta Fury full-screen effect during combat
- Pause mid-run, note Health and the Wave indicator, Resume, and confirm combat continues with those same values and enemies still present; Pause again, Save Checkpoint, refresh the page, press Resume Run, and confirm the restored run matches the saved Stage, wave or boss phase, Health, and Fury
- Artifact end state: change the fighter display name, buy one Cantina upgrade, unlock or complete progress that changes Pesos, open Export Campaign, and confirm the Campaign JSON preview contains schemaVersion fandangofury.campaign.v1 plus the edited displayName, the raised upgrade level, and the current pesos; Copy shows a confirmation; Download then Import of that same document reconstructs the same visible name, upgrade level, Pesos, Masks, and Stage unlocks on the Stage-select map, Cantina, and Masks screen
- Unlocked Stages, the equipped Mask, owned Masks, the Peso balance, purchased Cantina upgrades, the saved fighter display name, and any mid-run checkpoint all survive a full page refresh and are restored exactly as they were
- Confirming Reset Progress returns the Stage-select map, the Masks screen, and the Cantina to Stage 1 defaults together without a reload, clears any checkpoint so Resume Run is gone, and the reset itself survives a refresh — reloading does not revive the old progress
- Undoing one or more steps in the History panel and then making a different change (Apply Scenario Change, or another progression change) creates a selectable alternate branch rather than silently discarding or flattening the abandoned states; the panel marks the alternate branch as distinct from a single flat chronological list, and selecting a branch restores the exact prior visible state that branch represents
</user_flows>

<edge_cases>
- Letting an attack chain lapse for 3 seconds resets the next combo counter back to 1 rather than continuing to climb
- Attempting another Dodge Roll while the cooldown indicator is still showing does not grant a second invulnerability window
- Activating the Fiesta Fury control while the meter is not full does nothing visible beyond its disabled treatment; illegal or currently unavailable actions during a run are rejected with specific visible feedback
- Input from an earlier phase is ignored: pressing the combat keys on the Victory, Derrota, Pause, or Stage-select screens does not mutate the current state
- Cancelling the Reset Progress confirmation leaves all progress unchanged; cancelling Abandon Run leaves the paused run and its checkpoint options unchanged
- An Undo or Redo control with no adjacent state to move to renders disabled and does nothing when activated
- Submitting the Fighter Settings form with an empty name, a name outside 2 to 20 characters, or an effects intensity outside 0 to 100 keeps Save disabled and shows the inline message naming the offending field; no partial save occurs
- Importing malformed Campaign JSON leaves Pesos, Masks, Stages, Fighter Settings, checkpoint, and Export preview unchanged and shows visible validation feedback
- Importing parseable JSON that fails the Campaign JSON field contract — wrong schemaVersion, displayName outside 2 to 20 characters, effectsIntensity outside 0 to 100, negative pesos or upgrade levels, masks.equipped not in masks.owned, unknown mask ids, stages.completed not subset of stages.unlocked, or a checkpoint with phase outside wave|boss — leaves all campaign surfaces unchanged and shows validation naming the offending field
- Resume Run is unavailable when checkpoint is null; Save Checkpoint while not in an active paused run does not create a checkpoint
</edge_cases>

<visual_design>
- A dark festival-night arena aesthetic: the Stage map and combat scene sit on deep near-black surfaces with warm fiesta accent hues (red, orange, gold, teal) for controls, meters, and highlights
- The combat HUD reads as a dense status bar: the fighter Health bar, the Fury meter, the "Wave X of Y" indicator, the combo counter, and the Peso balance are all legible at once without opening another screen
- Combo feedback is a popup that increments per hit; completing the Fiesta Combo shows a distinct celebratory flash and label clearly beyond the plain combo counter
- The Fury meter fills incrementally as hits land and takes on an unmistakable ready treatment (a glow or pulse) once full; the Fiesta Fury button's enabled look is visibly different from its disabled look
- Boss wind-up cues are visually distinct (for example a flashing outline or an icon) from the boss's normal attack animation, giving a clear tell before the strike lands
- Both the fighter's and each boss's health bars deplete smoothly as damage lands and switch to a clear danger color treatment below roughly 25 percent remaining
- In the Masks screen the three states — locked, unlocked-but-unequipped, and currently equipped — each use a visibly different card treatment; on the Stage map the locked, unlocked, and completed Stage nodes are each visually distinct
- The Cantina shows each upgrade's current level and its escalating cost with a clear hierarchy so the current tier and the next-tier cost are easy to tell apart
- The Victory screen uses a celebratory treatment distinct from the ordinary in-combat HUD, and the Derrota screen reads as a clear defeat state; the Pause overlay is visually distinct from both end screens
- The Cantina, Masks, History, Fighter Settings, Export Campaign, Import Campaign, Pause, and reset-confirmation surfaces share one consistent overlay chrome — panel surface, title treatment, and close control styled the same way across all of them
- The History panel presents the snapshot list, the labelled History state region, the Undo/Redo controls, the Apply Scenario Change action, and any alternate branch as distinguishable regions without overlapping the primary controls
- Export Campaign presents a scrollable Campaign JSON preview, Copy, and Download as distinguishable regions; Import Campaign presents a paste or file-driven input, a validate/apply control, and inline field-error space
- Menu and HUD controls use one consistent vector icon style throughout — the Cantina, Masks, Settings, History, Export, Import, Pause, and Reset controls each carry a recognizable icon alongside their label
</visual_design>

<motion>
- Light and Heavy attacks each play a distinct short attack animation on the fighter; landed hits flash the struck enemy
- The combo counter popup animates in as hits land, and the Fiesta Combo flash is a distinct celebratory burst
- The Fury meter animates as it fills and pulses/glows once full; the screen-wide Fiesta Fury special plays a brief full-screen effect whose color reflects the equipped Mask
- The boss telegraph is an animated wind-up cue (flashing outline or bouncing icon) that precedes the boss strike
- Defeating the Boss fires a celebratory particle burst over the Victory screen at the moment it appears, triggered by the real boss defeat through normal play rather than any menu action
- Health bars ease as they deplete and shift to the danger treatment below roughly 25 percent
- All combat and menu buttons show a visible hover state (background, border, or shadow change) and a slight press feedback on click (hover feedback is required and is a common false done; do not omit it)
- The dodge cooldown indicator counts down visibly after a Dodge Roll; equipping a Mask surfaces a brief transient confirmation rather than changing silently
- Buying a Cantina upgrade animates the Pesos balance change and the upgrade's level indicator rather than snapping instantly
- The Cantina, Masks, History, Fighter Settings, Export Campaign, Import Campaign, Pause, and reset-confirmation panels appear as overlays anchored above the scene with a brief enter transition and dismiss on their close control or Escape
- Undo, Redo, and branch selection in the History panel update the visible game state through the panel's real controls
- Copy and Download on Export Campaign show a short confirmation before resetting; Save Checkpoint shows a brief confirmation on the Stage-select map
</motion>

<responsiveness>
- Responsive down to about 375px wide: the combat stage and HUD render without horizontal scrolling, HUD text stays legible rather than clipping or truncating, and all action buttons remain reachable
- At narrow widths the on-screen action buttons (Strike, Smash, Block, Dodge, Fiesta Fury, Pause) stay large enough to tap and never overlap the combat scene's visible enemies or meters
- The Cantina, Masks, History, Fighter Settings, Export Campaign, Import Campaign, Pause, and reset-confirmation overlays fit within a 375px-wide viewport without horizontal scrolling
</responsiveness>

<accessibility>
- Every interactive control is reachable with the keyboard alone and shows a visible focus indicator when focused
- Every combat action is operable from the keyboard (Z, X, C, Space, F, P for Pause) as well as from its on-screen button
- The Cantina, Masks, History, Fighter Settings, Export Campaign, Import Campaign, Pause, and reset-confirmation overlays trap keyboard focus while open, close on Escape, and return focus to the control that opened them
- The Health bar and Fury meter expose their current values as visible text or accessible attributes so their state is readable without relying on color alone
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- Loading / renders the complete Stage-select map with no hydration errors or warnings in the console and no post-load content flash, and no console errors appear during a full exercise of the app including pause, save checkpoint, resume, export, and import
- Combat holds a smooth frame rate: sustained fighting through a full wave shows no visible hitching, and rapid repeated input causes no hangs or dropped interactions
</performance>

<requirements>
Shared application state must live in Svelte runes ($state / $derived) held in a shared game store (in-memory during a run): the fighter and enemy state, the current Stage and wave, the combat meters, the Peso balance, owned and equipped Masks, purchased upgrades, the fighter settings, the progression, the mid-run checkpoint, the live Campaign JSON export text, and the transition history with its branches. A change made through any control must flow through this shared state so every view that shows it updates together without a reload. The screen/run lifecycle is modelled as an explicit state machine (xstate) driven only by the visible controls, including pause, resume, checkpoint save, victory, derrota, and restart transitions.
Persistence is REQUIRED and overrides any default no-storage rule: unlocked Stages, the equipped Mask, owned Masks, the Peso balance, purchased Cantina upgrades, the saved fighter display name, and any mid-run checkpoint must persist to localStorage and be restored exactly on a full page refresh. Guard storage access so the production build does not crash when storage is unavailable. Progress and checkpoints must NOT be lost on a full refresh, and a reset committed before a refresh must not revive old progress after reload.
State contracts (behavioral, not storage keys):
- Landing Light/Heavy attacks damages the nearest in-range enemy and advances the combo counter; Light, Light, Heavy triggers the Fiesta Combo with bonus damage; an idle chain resets the next combo count to 1
- Blocking reduces incoming damage while held; Dodge Roll grants brief invulnerability then a cooldown that gates re-use until it clears
- Fury fills from landed hits, Fiesta Fury is gated until full, and activating it hits all enemies and empties the meter
- Clearing all of a Stage's waves advances to the Boss Duel; defeating the Boss shows Victory and unlocks the next Stage; reaching 0 Health shows Derrota with a Try Again that restarts the Stage with a clean run state
- Pause freezes combat; Resume continues from the frozen values; Save Checkpoint persists mid-run state that Resume Run restores exactly after refresh
- Equipping a Mask replaces any currently equipped Mask (one at a time) and applies its passive bonus; buying a Cantina upgrade deducts exactly the shown cost, applies the effect, and raises the next purchase's cost
- Saving the Fighter Settings form updates the display name shown on the Stage-select header from the same shared state and updates the Campaign JSON fighter fields
- Export Campaign compiles live Campaign JSON from the store under schemaVersion fandangofury.campaign.v1; Import Campaign validates against that same field contract and applies a full campaign replace on success
- Reset Progress is confirmation-guarded and returns all saved progress and checkpoints to Stage 1 defaults
- Edits to the run/progression are recorded as explicit history transitions; Undo and Redo restore exact adjacent snapshots, an invalid Undo or Redo is disabled, Apply Scenario Change or another change after an Undo creates a selectable branch instead of flattening history, and selecting a branch restores that branch's exact visible state
Robustness: during a run, reject illegal or currently unavailable actions with specific visible feedback, ignore stale input from an earlier phase so it cannot mutate the current run, and withstand at least 25 rapid deterministic repetitions of the primary action through its normal controls with an exact final state, no duplicated transitions, and no blank screen, uncaught error, or sustained freeze. In one session the app must cross at least five legal state transitions including start, an active-state change, a terminal or checkpoint state, restart, and a pause/return mode switch.
Build tooling: Astro 6 with hydrated Svelte 5 islands and the Tailwind CSS Vite plugin; Tailwind CSS 4.3.2 pinned as the styling base with design tokens in @theme; xstate for the screen/run state machine. Bits UI supplies the menu, dialog, and overlay chrome — the Cantina, Masks, History, Fighter Settings, Export Campaign, Import Campaign, Pause, and reset-confirmation surfaces — while the combat scene itself is a hand-driven canvas loop. tsparticles is allowed for the victory celebration particle effects; the canvas loop and CSS transitions drive all other animation; no other animation libraries. Phosphor icons only, via the phosphor-svelte package inside islands; no other icon sets and no pasted raw SVG icons. All forms — including the Fighter Settings form and Campaign Import — validate through a Zod schema driven by Felte, with inline per-field errors shown before submit and the submit control disabled until the form is valid. Schemas are API-shaped: Fighter Settings and Campaign JSON share the fandangofury.campaign.v1 field contract (schemaVersion, fighter.displayName 2–20, fighter.effectsIntensity 0–100, pesos and upgrade levels as non-negative integers, masks.owned from the closed Mask id set, masks.equipped null or in owned, stages.unlocked/completed from 1|2|3 with completed subset of unlocked, and checkpoint null or the required checkpoint object). All libraries installed via npm and bundled locally; no CDN imports. No backend and no authentication. All controls act in-app with no outbound navigation.
The useful end state is the campaign artifact: Export must produce Campaign JSON that contains the session's actual progress, settings, and checkpoint, with Copy and Download, and that document must round-trip through Import while conforming to the declared field contract.
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
- browse-query-v1
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
- Session operations: start; pause; resume; restart; advance; stop
- Destinations: stage-map; masks; cantina; export-campaign; import-campaign
- Entity: mask
- Entity operations: select; toggle
- Entity fields: name; bonus; equipped
- Artifact operations: export; import; copy
- Export formats: campaign-json
- Import modes: campaign-json
- Workflow completion: Campaign JSON preview reflects pesos, fighter.displayName, upgrades, masks, stages, and checkpoint after session mutations
- Workflow completion: Resume Run appears on stage-map when checkpoint is non-null after Save Checkpoint

Mechanics exclusions:
- All combat (light/heavy attacks, Fiesta Combo chain, block/dodge cooldown, Fury meter fill, Fiesta Fury, boss telegraph, health depletion) stays Playwright-driven
- Undo/Redo/branch selection and the History panel stay Playwright-driven via the real controls
- Cantina upgrade purchase (escalating cost) stays Playwright-driven via the real Buy control
- Reset Progress (confirmation-guarded) stays Playwright-driven
- Pause freeze timing, Save Checkpoint confirmation, and Resume Run restore of mid-fight enemies stay Playwright-observed
- File-picker Import, clipboard contents, and Download bytes stay Playwright-only per artifact-transfer restrictions; webmcp only drives export/import/copy without artifact payloads

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
