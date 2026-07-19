<summary>
Build a side-scrolling hack-and-slash festival combat game called FandangoFury using Astro with Svelte islands, Svelte runes, and Tailwind CSS.
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
- The app opens at / with no login into a FandangoFury Stage-select map: a title, a row of Stage nodes (Plaza del Sol, Mercado Nocturno, Fortaleza Roja), a Pesos balance, an owned-Masks count, and buttons to open the Cantina, open the Masks screen, and Reset progress. On first load with empty storage only Stage 1 is unlocked and playable; the later Stage nodes render locked
- Clicking an unlocked Stage node starts a combat run for that Stage: the fighter stands at the left of a town-square scene while bandit enemies approach from the right in successive waves, and a combat HUD with the fighter Health bar, the Fury meter, and a "Wave X of Y" indicator is always visible during the run
- Light Attack (Z key or the Strike button) and Heavy Attack (X key or the Smash button) each play a distinct attack animation and deal a different damage value to the nearest in-range enemy, whose own health bar drops; each landed hit advances an on-screen combo counter
- Chaining Light, Light, then Heavy triggers a named Fiesta Combo that deals bonus damage and shows a distinct celebratory flash and label beyond the plain combo counter; letting the chain lapse for a few seconds resets the next combo counter back to 1 rather than continuing to climb
- Holding Block (C key or the Block button) reduces the damage the fighter takes from enemy attacks while held compared with the same attack taken unblocked
- Dodge Roll (Space key or the Dodge button) grants a brief window of invulnerability and then starts a visible cooldown; attempting another Dodge Roll while the cooldown indicator is still showing does not grant a second invulnerability, and the dodge becomes available again only after the cooldown visibly clears
- Landing hits fills the Fury meter; the Fiesta Fury control is disabled until the meter is full and enabled only once full. Activating Fiesta Fury (F key or the Fiesta Fury button) fires a screen-wide special that hits every onscreen enemy, then empties the meter and disables the control again, and the meter begins refilling from empty as new hits land
- Defeating the enemies clears the current wave: the "Wave X of Y" indicator's total Y stays fixed while the current-wave number X increments by one after each wave clears, and once the final wave is cleared the Stage advances into a named Boss Duel instead of spawning another regular wave
- The Boss has its own labelled health bar and telegraphs its attacks with a brief visually distinct wind-up cue before it strikes; defeating the Boss awards a larger Pesos drop and can drop a collectible Mask, then shows a Victory screen summarizing the Pesos earned and Masks found this run with a Continue control that returns to the Stage map with the next Stage node now unlocked and selectable
- If the fighter's Health reaches 0 the run ends on a Derrota (defeated) screen showing the Pesos earned that attempt, with a Try Again control that restarts the current Stage from its first wave with Health restored to full
- Defeating certain enemies drops a collectible Mask; the Masks screen shows each Mask as locked, unlocked-but-unequipped, or currently equipped, and lets the player equip exactly one Mask at a time — equipping a second Mask unequips the first. Each equipped Mask grants one passive stat bonus (Speed, Damage, or Defense) and changes the Fiesta Fury visual effect
- The Cantina shop lets the player spend Pesos on permanent upgrades (Max health, Attack power, Fury gain rate). Each upgrade shows its cost before purchase; buying it decreases the Pesos balance by exactly that shown cost and applies the upgrade (for example buying Max health raises the fighter's maximum Health capacity). Each subsequent purchase of the same upgrade costs strictly more than the previous one
- Unlocked Stages, the equipped Mask, owned Masks, the Peso balance, and purchased Cantina upgrades all survive a full page refresh and are restored exactly as they were
- A Reset Progress control, guarded by a confirmation step, wipes all saved data back to Stage 1 defaults (only Stage 1 unlocked, no Mask equipped, no owned Masks, the starting Peso balance, and no upgrades); cancelling the confirmation leaves progress unchanged, and the reset itself survives a refresh
- A History panel, opened from a visible control, models changes to the run and its progression as explicit transitions: it shows Undo and Redo controls, a region labelled History state showing the current snapshot, a list of snapshots, and an Apply Scenario Change action. Undo and Redo restore the exact adjacent visible states, and an Undo or Redo control with no adjacent state to move to is disabled
- Undoing one or more steps and then making a different change (Apply Scenario Change, or another progression change) creates a selectable alternate branch rather than silently discarding or flattening the abandoned states; the panel marks the alternate branch as distinct from a single flat chronological list, and selecting a branch restores the exact prior visible state that branch represents
- All controls act through in-app state with no outbound navigation; the app never leaves /
</core_features>

<visual_design>
- A dark festival-night arena aesthetic: the Stage map and combat scene sit on deep near-black surfaces with warm fiesta accent hues (red, orange, gold, teal) for controls, meters, and highlights
- The combat HUD reads as a dense status bar: the fighter Health bar, the Fury meter, the "Wave X of Y" indicator, the combo counter, and the Peso balance are all legible at once without opening another screen
- Combo feedback is a popup that increments per hit; completing the Fiesta Combo shows a distinct celebratory flash and label clearly beyond the plain combo counter
- The Fury meter fills incrementally as hits land and takes on an unmistakable ready treatment (a glow or pulse) once full; the Fiesta Fury button's enabled look is visibly different from its disabled look
- Boss wind-up cues are visually distinct (for example a flashing outline or an icon) from the boss's normal attack animation, giving a clear tell before the strike lands
- Both the fighter's and each boss's health bars deplete smoothly as damage lands and switch to a clear danger color treatment below roughly 25 percent remaining
- In the Masks screen the three states — locked, unlocked-but-unequipped, and currently equipped — each use a visibly different card treatment; on the Stage map the locked, unlocked, and completed Stage nodes are each visually distinct
- The Cantina shows each upgrade's current level and its escalating cost with a clear hierarchy so the current tier and the next-tier cost are easy to tell apart
- The Victory screen uses a celebratory treatment distinct from the ordinary in-combat HUD, and the Derrota screen reads as a clear defeat state
- The History panel presents the snapshot list, the labelled History state region, the Undo/Redo controls, the Apply Scenario Change action, and any alternate branch as distinguishable regions without overlapping the primary controls
- Responsive down to about 375px wide: the combat stage and HUD render without horizontal scrolling, HUD text stays legible rather than clipping or truncating, and all action buttons remain reachable
</visual_design>

<motion>
- Light and Heavy attacks each play a distinct short attack animation on the fighter; landed hits flash the struck enemy
- The combo counter popup animates in as hits land, and the Fiesta Combo flash is a distinct celebratory burst
- The Fury meter animates as it fills and pulses/glows once full; the screen-wide Fiesta Fury special plays a brief full-screen effect whose color reflects the equipped Mask
- The boss telegraph is an animated wind-up cue (flashing outline or bouncing icon) that precedes the boss strike
- Health bars ease as they deplete and shift to the danger treatment below roughly 25 percent
- All combat and menu buttons show a visible hover state (background, border, or shadow change) and a slight press feedback on click; keyboard Tab focus is visibly indicated on every interactive control (hover and focus feedback are required and are a common false done; do not omit them)
- The dodge cooldown indicator counts down visibly after a Dodge Roll; equipping a Mask surfaces a brief transient confirmation rather than changing silently
- The Cantina, Masks, History, and reset-confirmation panels appear as overlays anchored above the scene and dismiss on their close control or Escape
- Undo, Redo, and branch selection in the History panel update the visible game state through the panel's real controls
</motion>

<requirements>
Shared application state must live in Svelte runes ($state / $derived) held in a shared game store (in-memory during a run): the fighter and enemy state, the current Stage and wave, the combat meters, the Peso balance, owned and equipped Masks, purchased upgrades, the progression, and the transition history with its branches. A change made through any control must flow through this shared state so every view that shows it updates together without a reload. The screen/run lifecycle is modelled as an explicit state machine (xstate) driven only by the visible controls.
Persistence is REQUIRED and overrides any default no-storage rule: unlocked Stages, the equipped Mask, owned Masks, the Peso balance, and purchased Cantina upgrades must persist to localStorage and be restored exactly on a full page refresh. Guard storage access so the production build does not crash when storage is unavailable. Progress must NOT be lost on a full refresh, and a reset committed before a refresh must not revive old progress after reload. Transient run state (in-progress enemies, current Health mid-fight) need not persist; the durable progression must.
State contracts (behavioral, not storage keys):
- Landing Light/Heavy attacks damages the nearest in-range enemy and advances the combo counter; Light, Light, Heavy triggers the Fiesta Combo with bonus damage; an idle chain resets the next combo count to 1
- Blocking reduces incoming damage while held; Dodge Roll grants brief invulnerability then a cooldown that gates re-use until it clears
- Fury fills from landed hits, Fiesta Fury is gated until full, and activating it hits all enemies and empties the meter
- Clearing all of a Stage's waves advances to the Boss Duel; defeating the Boss shows Victory and unlocks the next Stage; reaching 0 Health shows Derrota with a Try Again that restarts the Stage
- Equipping a Mask replaces any currently equipped Mask (one at a time) and applies its passive bonus; buying a Cantina upgrade deducts exactly the shown cost, applies the effect, and raises the next purchase's cost
- Reset Progress is confirmation-guarded and returns all saved progress to Stage 1 defaults
- Edits to the run/progression are recorded as explicit history transitions; Undo and Redo restore exact adjacent snapshots, an invalid Undo or Redo is disabled, Apply Scenario Change or another change after an Undo creates a selectable branch instead of flattening history, and selecting a branch restores that branch's exact visible state
Robustness: during a run, reject illegal or currently unavailable actions with specific visible feedback, ignore stale input from an earlier phase so it cannot mutate the current run, and withstand at least 25 rapid deterministic repetitions of the primary action through its normal controls with an exact final state, no duplicated transitions, and no blank screen, uncaught error, or sustained freeze. In one session the app must cross at least five legal state transitions including start, an active-state change, a terminal or checkpoint state, restart, and a pause/return mode switch.
Build tooling: Astro 6 with hydrated Svelte 5 islands and the Tailwind CSS Vite plugin; xstate for the screen/run state machine. No backend, no authentication, and no external UI component library; hand-rolled styling and CSS keyframe animations are expected. All controls act in-app with no outbound navigation.
Responsive: the combat stage and HUD reflow at about 375px wide with no horizontal scrolling, legible HUD text, and all action buttons reachable.
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
- browse-query-v1
- entity-collection-v1

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

Bindings:
- Session operations: start; restart; advance; stop
- Destinations: stage-map; masks; cantina
- Entity: mask
- Entity operations: select; toggle
- Entity fields: name; bonus; equipped

Mechanics exclusions:
- All combat (light/heavy attacks, Fiesta Combo chain, block/dodge cooldown, Fury meter fill, Fiesta Fury, boss telegraph, health depletion) stays Playwright-driven
- Undo/Redo/branch selection and the History panel stay Playwright-driven via the real controls
- Cantina upgrade purchase (escalating cost) stays Playwright-driven via the real Buy control
- Reset Progress (confirmation-guarded) stays Playwright-driven

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
