# Grading Dimensions: Definitions, Positive & Negative Criteria (All App Genres)

This document defines the grading dimensions for browser-judged frontend eval tasks, with positive (high label evidence, HLI) and negative criteria per dimension. Positive criteria represent desirable evidence of quality practice. Negative criteria mark must-not-happen failures or anti-cheat guardrails. Used together, they guide both RLHF-style and agent/human judging for reproducibility and fairness.

The guidance here is **app-type-agnostic**: it applies to every genre and archetype in the corpus. Criteria are written as archetype-neutral statements; where a dimension needs illustration, short per-archetype example rows show how the neutral statement specializes.

Every criterion in this document — positive or negative — must be verifiable from **browser-observable evidence only**: the rendered DOM, computed styles, console output, network activity visible in devtools, and behavior driven through automated browser interaction. Criteria must never require repository access, build logs, or static source analysis. If a quality can only be proven with privileged access, it does not belong in a rubric.

---

## Scope: Genres and Archetypes

The corpus spans five genres:

| Genre | What it is | Persistence rule |
|---|---|---|
| Good-app | PRD-driven interactive app with client-side shared state | In-memory only — localStorage/sessionStorage forbidden |
| Landing page | Marketing/product page: hero, sections, nav, forms, scroll motion | No app state to persist; forms are demo-only |
| Website-fidelity | Pixel-accurate recreation of a live site | Per source PRD |
| Hard browser apps / games | Canvas, game-loop, and tool apps | localStorage allowed where the source PRD mandates it |
| Framework rebuild | Recreation of a real OSS app's frontend | localStorage allowed where the source PRD mandates it |

Within the interactive genres, choose tasks from a diverse set of archetypes:

| Archetype | Examples |
|---|---|
| Productivity | Habit tracker, task manager with priorities, Pomodoro timer with session log |
| Data tracking | Expense tracker, fitness log, reading list with progress |
| Planning | Trip planner, meal planner, event scheduler |
| Kanban / workflow | Project board, job application tracker, content pipeline |
| Creative tools | Color palette builder, recipe organizer, flashcard deck builder |
| Landing pages | Product landing page with hero, feature sections, pricing, signup form, scroll reveals |
| Games / canvas tools | Arcade game, drawing tool, physics or simulation toy |
| Fidelity rebuilds | Pixel-accurate recreation of a live site or OSS app frontend |

## Task Selection & Diversity

When authoring or selecting tasks, enforce these guardrails:

- **No trivially simple tasks.** A single counter, or a basic to-do list with no secondary features, does not exercise enough surface to grade. Every task must clear the minimum-complexity bar below.
- **No real authentication or external APIs.** Tasks are frontend-only and must be fully exercisable offline. Simulated login screens and mocked data are fine; real OAuth, network-backed APIs, or third-party services are not.
- **No single-flow apps.** A task with only one user flow (one form, one action, one outcome) cannot support a multi-dimensional rubric. Require at least two distinct flows or interaction modes.
- **No near-duplicates.** Choose a diverse spread across the archetype table. Two tasks sharing an archetype must differ in domain, layout shape, and primary interactions (e.g. a habit tracker with a calendar heatmap and a Pomodoro timer with a session log are both Productivity but distinct; two card-grid task managers are not).

**Minimum-complexity bar** (genre equivalents in parentheses):

| Bar | Interactive apps | Games / canvas tools | Landing pages |
|---|---|---|---|
| Primary stateful surface | A primary collection with create, edit, delete | A game loop with scoring and win/lose or progression state | At least 5 distinct content sections |
| Multiple views / modes | ≥2 distinct views or interaction modes | Play screen plus at least one meta screen (menu, pause, results) | Working nav (anchors or routes) plus at least one overlay/expandable |
| State beyond the basics | Domain state beyond CRUD: statuses, filters, priorities, bulk actions, derived totals | Difficulty, power-ups, high-score table, or settings that alter play | A validating form plus scroll-driven or interactive section behavior |

---

## 1\. Accessibility

**Definition:** The product is usable by people of all abilities, supports keyboard navigation and screen readers, and follows accessibility standards (WCAG AA).

**Positive HLI Verifiers:**

1. All interactive controls are keyboard accessible (Tab, Shift+Tab, Enter/Space).
2. Modal dialogs trap focus and return it to origin on close.
3. All images/icons have descriptive `alt` text.
4. Errors and notifications are conveyed both visually and via ARIA live regions.
5. All form elements use explicit `<label>` elements.
6. Headings follow logical order with no skips (e.g., H1 → H2 → H3).
7. Skip-to-content or landmark navigation is present.
8. Sufficient color contrast for all text and controls.
9. Uses semantic HTML roles (nav, main, button).
10. Respects `prefers-reduced-motion` in animations.

**Negative HLI Verifiers:**

1. Controls cannot be activated or reached via keyboard.
2. Focus indicators are missing or obscured.
3. Custom components use non-semantic tags and lack ARIA roles/labels.
4. Color-only indicators are used for error or state.
5. Modals do not trap keyboard focus.
6. Text is unreadable due to poor contrast.
7. Error feedback is visual only, not screen reader accessible.
8. Missing alt text on icon or image content.
9. Skipped or unordered headings (e.g., jumping H1→H3).
10. Animations ignore reduced motion settings.

**Archetype examples:** Game — canvas play is exempt from per-element semantics, but menus, pause screens, and score readouts must be keyboard-reachable and announced. Landing page — anchor nav must be operable by keyboard and the signup form fully labeled.

**Catch-all (see [Open-Ended Judge Catch-All](#open-ended-judge-catch-all-criterion)):** The app exhibits a significant accessibility barrier not covered by any other criterion in this dimension.

---

## 2\. UI Design (Visual Craft)

**Definition:** The interface uses a coherent, branded visual language, including consistent use of type, color, layout, and whitespace to support legibility and appeal.

**Positive HLI Verifiers:**

1. A coherent color palette is used throughout the UI, matching any palette the task specifies.
2. Consistent font choices and hierarchical size differences for headings, labels, and body.
3. Spacing and padding follow a consistent scale.
4. UI aligns to a regular grid or layout system.
5. Consistent use of iconography.
6. Clear separation between interactive and passive elements.
7. Visual focus and hover states align to the app's visual language.
8. Logical grouping with whitespace/borders.
9. Responsive scaling of typography.
10. High-res imagery/icons used with no visible blurring or pixelation.

**Negative HLI Verifiers:**

1. Random or inconsistent color choices unrelated to the specified palette.
2. Visual clutter—no spacing/padding discipline.
3. Mixed, inconsistent use of fonts or weights.
4. Crooked, misaligned components.
5. Buttons look similar to plain text or vice versa.
6. Overlapping or cut-off text/images.
7. Pixelated, artifact-ridden images or icons.
8. Hover/focus states are missing or generic.
9. Arbitrary shadow/border choices unrelated to spec.
10. Visual density is too high or too sparse versus the reference or spec.

**Archetype examples:** Kanban — columns share identical card anatomy and spacing rhythm. Landing page — hero, section, and footer typography form one clear scale. Game — HUD elements (score, lives, timer) share one visual treatment and never collide with the play area.

**Catch-all:** The app exhibits a significant visual-design defect not covered by any other criterion in this dimension.

---

## 3\. Design Fidelity (Spec Implementation)

**Definition:** How accurately the UI implements the approved designs/spec, including sizing, spacing, breakpoints, and interaction states. For **website-fidelity** tasks this dimension dominates: pixel-match against the reference screenshots is the primary signal.

**Positive HLI Verifiers:**

1. Spacing and sizing follow the design system's scale — no arbitrary one-off values visible in computed styles.
2. Typography matches the spec for all headings and body copy.
3. Layout matches reference screenshots to within a small tolerance at all specified breakpoints (fidelity tasks: near pixel-parity).
4. Transitions or animations are applied to the state changes the spec calls out (add, delete, filter, view switch).
5. Responsive behavior matches reference patterns.
6. Button and form radii, padding, and shadows conform to spec.
7. Typography has clear hierarchy (distinct for section vs. body).
8. Component states (default, hover, active, disabled) match the spec where specified.
9. Color, depth, and border treatments are precise per design.
10. Microinteraction feedback (hover/press) follows spec in duration and motion.

**Negative HLI Verifiers:**

1. Visible sizing/spacing values contradict the specified scale.
2. Colors outside the specified palette.
3. Sizing mismatches with spec.
4. Missing or incorrect animations where the spec requires them.
5. Form or button controls use browser default styles when the spec styles them.
6. Misaligned grid/layout at reference breakpoints.
7. Elements rendered off-screen or clipped.
8. Section order, content, or structure deviates from the reference (fidelity tasks).
9. No distinction between heading/body text.
10. Microinteractions missing or deviating from the provided reference.

**Archetype examples:** Fidelity rebuild — the rebuilt nav, hero, and footer match the live site's layout and type at desktop width. Habit tracker — the streak calendar uses exactly the cell size, gap, and state colors the instruction describes.

**Catch-all:** The app exhibits a significant deviation from the spec or reference not covered by any other criterion in this dimension.

---

## 4\. UX & Accessibility

**Definition:** The product's user experience is logical, inclusive, and delivers feedback for user actions, errors, and edge conditions.

**Positive HLI Verifiers:**

1. Empty state UI is present and renders when a collection is empty.
2. Inline validation on all forms, before submit.
3. Clear error messages with actionable text (not just "Invalid").
4. Success/confirmation appears after actions.
5. Loading spinners or indicators shown for async or simulated-async work.
6. Undo or cancel options where destructive actions exist.
7. Help/tooltips for non-obvious controls.
8. Semantic tag use for buttons, inputs, labels.
9. Modal close and background click both close overlay.
10. Long task flows provide progress or feedback steps.

**Negative HLI Verifiers:**

1. Empty collection shows nothing (no UI feedback).
2. Errors only surfaced in browser console.
3. Actions lack visible feedback (silent success/failure).
4. Destructive actions have no warnings.
5. Non-semantic tags (div/span) wrap interactive elements.
6. Modal overlays cannot be dismissed via keyboard.
7. Validation feedback is missing or delayed with no UI indication.
8. Button text is ambiguous or missing.
9. Non-obvious flows have no in-app guidance at all.
10. Interactive affordances are visually hidden/inaccessible.

**Archetype examples:** Expense tracker — submitting an entry with an empty amount shows an inline message naming the field. Kanban — deleting a column with cards warns about the cards. Game — a first-run screen explains controls before play starts. Landing page — the signup form confirms success without navigating away.

**Catch-all:** The app exhibits a significant UX failure not covered by any other criterion in this dimension.

---

## 5\. Functional & Core Features

**Definition:** All must-have product functionality is implemented, discoverable, and works as described: CRUD, search, filtering, or special domain behaviors — or their genre equivalents (game mechanics, section behaviors).

**Positive HLI Verifiers:**

1. Users can create a new item in the primary collection entirely from the UI.
2. Edits to an item reflect immediately in every view that shows it.
3. Deleting an item removes it from all views on the first try.
4. Switching between the app's views/modes updates the visible context correctly.
5. Filters, search, or sorting affect all relevant views predictably.
6. Detail surfaces (panels, modals, tabs) show the full specified content for a selected item.
7. Demo-only affordances give visible simulated feedback (e.g. a toast) rather than doing nothing.
8. Editable metadata surfaces (titles, cover images, settings) are visible and editable as specified.
9. Derived/aggregate modules (totals, budgets, progress, scores) update as their inputs change.
10. Initial seed data matches the specified size and distribution.

**Negative HLI Verifiers:**

1. Primary actions cause a full page reload.
2. Edits/deletes don't update all views showing the item.
3. A modal/dialog opens but cannot be closed.
4. Add or edit forms allow empty or invalid entry.
5. View/mode switching is nonfunctional or loses state.
6. Filtering breaks or resets unrelated UI.
7. Seed data is missing, wrong-sized, or misdistributed.
8. Specified feedback affordances never appear or throw errors.
9. Specified metadata surfaces are missing.
10. Aggregate modules are static, never updating with their inputs.

**Archetype examples:** Kanban — dragging a card between columns updates both column counts. Habit tracker — marking today complete extends the visible streak. Pomodoro — a finished session appends to the session log. Landing page — each nav anchor scrolls to its section; the pricing toggle swaps monthly/annual figures. Game — the scoring event increments the score; losing all lives shows the game-over screen with the final score.

**Catch-all:** A specified core behavior is broken or missing in a way not covered by any other criterion in this dimension.

---

## 6\. User Flow Verification

**Definition:** Full, observable evidence that all critical end-to-end usage flows are implemented in the running app.

**Positive HLI Verifiers:**

1. Create flow: a new item can be created via the UI and appears everywhere it should.
2. Create flow: invalid submission triggers immediate inline validation.
3. Edit flow: edits save and update all related displays.
4. Delete flow: the item is removed from all lists/panes after deletion.
5. View/mode switch: the view changes properly, with state retained.
6. Edge: after the last delete, the empty state is clear and visible.
7. Edge: filtering reveals/hides items everywhere as expected.
8. Collapsible chrome (sidebar, panel) can be hidden and reopened with workflow continuity.
9. Overlays behave as expected for details, edits, confirmations.
10. Recovery: navigation loss or error can be corrected without a reload (no dead ends).

**Negative HLI Verifiers:**

1. Create/edit/delete (or genre-equivalent primary flows) not enabled from the UI.
2. New items fail to show up or duplicate.
3. State changes not synced across displays.
4. View/mode switching breaks layout or loses selection.
5. Emptying the collection produces broken or missing UI.
6. Filtered views disagree with each other about what is visible.
7. Collapsed chrome can't be re-opened.
8. Overlays block navigation with no exit option.
9. No user feedback on a failed flow.
10. Navigation dead ends or requires reload for recovery.

**Archetype examples:** Job application tracker — add application → move through stages → archive, all reflected in the pipeline counts. Game — start → play → pause → resume → game over → restart, with no state leakage between runs. Landing page — land → scroll all sections → open FAQ item → submit form → see confirmation.

**Catch-all:** A critical end-to-end flow fails in a way not covered by any other criterion in this dimension.

---

## 7\. Responsiveness & Adaptivity

**Definition:** Application layout, controls, and features respond fluidly from desktop to mobile breakpoints.

**Positive HLI Verifiers:**

1. Layout adapts gracefully from 1440px desktop to 375px mobile.
2. UI controls are tap targets ≥44px on mobile.
3. Typography resizes for both mobile/desktop.
4. Content never clips or overflows the viewport.
5. Collapsible chrome (sidebars, menus) adapts for smaller screens.
6. Layout stacking order reflows logically at narrow widths.
7. Touch gestures (swipe, tap) work on mobile where present.
8. No horizontal scrolling on small screens.
9. Images, grids, and canvases size responsively to fit the layout.
10. Fixed controls remain accessible on all devices.

**Negative HLI Verifiers:**

1. Layout breaks or overflows at common breakpoints.
2. Controls are too small or misaligned on mobile.
3. Text is too small to read on some devices.
4. Content is cropped or scrollbars appear unnecessarily.
5. Sidebar/menu is unresponsive or missing at some widths.
6. Fixed positions obscure content.
7. Stacking/overlap issues at any size.
8. Touch actions are not available on mobile where the spec requires them.
9. Images, charts, or canvases are static size and overflow the viewport.
10. Controls disappear at specific sizes.

**Archetype examples:** Game — the canvas scales to the viewport and controls fall back to touch/on-screen buttons on mobile. Kanban — columns become horizontally scrollable or stacked at narrow widths without losing drag. Landing page — the nav collapses to a working mobile menu.

**Catch-all:** The app exhibits a significant responsive-layout failure not covered by any other criterion in this dimension.

---

## 8\. Motion & Microinteractions

**Definition:** Interactive feedback for user actions, state changes, and navigation uses subtle, efficient animation.

Criteria that grade an animation or gesture must be verified through the **real UI control path** (click the toggle, drag the card, hover the row) — never through a state shortcut (e.g. a WebMCP tool call), which snaps the state and falsely shows no animation.

**Positive HLI Verifiers:**

1. Hover/focus/press transitions are visible (not just default states).
2. Toasts slide/fade in, then auto-dismiss per the spec.
3. View/mode changes animate panels without a full reload.
4. Overlay opening/closing animates smoothly.
5. Specified demo affordances show animated feedback.
6. Selection and state indicators animate their changes.
7. Loading/empty states gracefully animate transitions.
8. Reduced-motion preference is obeyed (no animation if set).
9. Microinteractions enhance, never detract from, usability.
10. Transition duration matches reference (e.g., 150–300ms).

**Negative HLI Verifiers:**

1. No hover, focus, or press feedback for buttons/interactions.
2. Animations are jarring or distract from content.
3. Overlay panels snap open/closed (no transition).
4. Toasts don't appear or are abrupt/never dismiss.
5. Specified interactive affordances give no feedback at all.
6. Reduced motion is ignored.
7. Animations introduce accessibility issues.
8. Too-long or inconsistent transition timing.
9. Animation causes layout jank or flicker.
10. Microinteractions are generic (browser default only).

**Archetype examples:** Kanban — a dropped card settles into its column with a short transition. Landing page — sections reveal on scroll; re-checking requires a fresh page load since scroll state pollutes reveal state. Game — hit/score events give immediate visual feedback (flash, particle, count-up).

**Catch-all:** The app exhibits a significant motion/microinteraction defect not covered by any other criterion in this dimension.

---

## 9\. Performance & Load Experience

**Definition:** App loads and interacts quickly, even under simulated real-world conditions, with no UI delay, error, or instability.

**Positive HLI Verifiers:**

1. Cold start to interactive is <2s on local render.
2. No errors/warnings in browser dev tools console.
3. UI transitions respond in under 100ms.
4. Loading indicators shown for async/simulated delays.
5. Large collections render without perceived lag.
6. UI remains interactive during state changes.
7. Animations maintain smooth 60fps (games: a stable frame rate during play).
8. App does not hang or freeze, even under rapid user input.
9. No memory leaks or runaway resource use over an extended session.
10. Simulated poor conditions show graceful loading/fallback.

**Negative HLI Verifiers:**

1. More than 2s load before interaction on local.
2. Errors/warnings are present in the console during flows.
3. Transitions block or lag.
4. Async or simulated-async work causes UI hang/freeze.
5. Large data sets kill frame rate.
6. Unresponsive input during animation.
7. UI blocks rendering while loading resources.
8. Memory leaks or runaway browser resource usage.
9. Nothing displayed while data is loading.
10. App crashes under rapid or edge-case use.

**Archetype examples:** Game — frame rate stays stable while many entities are on screen; rapid input never desyncs the game state. Data tracking — a list seeded with hundreds of rows scrolls and filters without jank.

**Catch-all:** The app exhibits a significant performance or stability defect not covered by any other criterion in this dimension.

---

## 10\. Technical Quality (Code & Implementation)

**Definition:** Stack correctness and technical hygiene, judged **solely from browser-executable, observable evidence**: browser evaluation scripts, console inspection, network traces, storage inspection, and runtime behavior. Rubric scoring must never require privileged access to source code, build artifacts, or static analysis. If a criterion cannot be validated from the browser/runtime alone, mark it unverifiable rather than guessing.

Internal-implementation claims ("uses Redux Toolkit", "implemented with React") are **banned as criteria** — a browser judge cannot verify them. Stack enforcement belongs in the builder-facing requirements, not in judge criteria. The browser-observable proxy for correct shared state is **coherence**: a change made in one view is immediately reflected everywhere it appears, without reload.

**Positive HLI Verifiers:**

1. The app serves and runs via its documented start path with no errors.
2. Shared-state coherence: a change made in one view is immediately reflected in every other view showing that data, without reload.
3. No forbidden storage or network APIs are exercised (verify per genre — see storage rule below).
4. Reload returns the app to its specified baseline (seeded state for in-memory genres; persisted state for persistence genres).
5. No console errors or unhandled promise rejections during a full exercise of the app.
6. Only same-origin (or explicitly allowed) network requests appear in devtools.
7. No debug artifacts (console.log spam, debug overlays) in the running app.
8. UI state survives rapid interaction without desyncing between views.
9. All documented routes/views are reachable and render.
10. Interactive behavior is consistent with a single coherent state source (no view showing stale data another view already updated).

**Negative HLI Verifiers:**

1. **Genre-conditional storage violation:** in good-app genre tasks, localStorage/sessionStorage/other browser storage is non-empty after exercising the app. (Hard-browser and framework-rebuild genre tasks keep localStorage where their source PRD mandates it — there, absence of mandated persistence is the failure instead.)
2. Outbound network requests other than allowed demo data.
3. Views desync: the same datum shows different values in two places.
4. Console errors or unhandled rejections during normal flows.
5. Visible debug output or leftover placeholder scaffolding in the running app.
6. The app fails to serve or renders a blank/broken page from its documented start path.
7. Reload produces a state inconsistent with the genre's persistence rule.
8. External `<a href>` chrome navigates away from the app.
9. Runtime exceptions thrown by specific interactions (observable in console) even if the UI limps on.
10. Behavior differs between two loads of the same state in ways the spec doesn't allow (nondeterministic rendering of deterministic state).

**Catch-all:** The app exhibits a significant, browser-observable technical defect not covered by any other criterion in this dimension.

---

## 11\. Innovation & Creativity

**Definition:** Evidence of advanced, original UI, UX, or implementation—goes significantly beyond the minimum spec (bonus/award criteria).

**Positive HLI Verifiers:**

1. Unique, delightful microinteractions.
2. Advanced animation or transition mechanics (e.g., parallax, scroll storytelling).
3. Narrative or guided onboarding flows.
4. Data visualizations or interactive graphics with extra usability.
5. Voice, gesture, or alternative input support.
6. Personalization features for user preferences.
7. Polished storytelling or branding narrative.
8. Dynamic theming or color mode beyond requirements.
9. Use of web platform features (e.g., PWA, offline, etc.) where the genre allows.
10. Competition-level innovation visible to users.

**Negative HLI Verifiers:**

1. Demo is purely spec-compliant (barebones/unenhanced).
2. Interactions and visuals are generic, template, or copied.
3. No polish, guidance, or story.
4. No extra visual or interactive polish.
5. Flat, static UI—no immersion.
6. Modern platform capabilities ignored where they would clearly help.
7. Personalization impossible.
8. No new or delightful user moments.
9. Repeats well-trod design without twist.
10. Minimal effort beyond MVP/deliverable.

Note: for **fidelity** tasks this dimension is scored against execution quality (how faithfully and smoothly the recreation behaves), not against novel design — inventing beyond the reference is a fidelity failure, not innovation.

**Catch-all:** *(positive form here)* The app demonstrates a noteworthy, browser-observable enhancement beyond the spec not captured by any other criterion in this dimension.

---

## 12\. MCP Contract Implementation (if required)

**Definition:** The build implements all required MCP interfaces per the task's webmcp contract block, with correct bindings and exposed automation. This dimension applies **only** when the task declares a webmcp action contract.

**Positive HLI Verifiers:**

1. All contract-mandated modules are initialized and bound.
2. Exposed tool handlers match visible UI command logic.
3. Only documented operations/routes are available.
4. The contract can be fully exercised via automation.
5. Entity operations declared in the contract (create, update, delete, reorder) all work.
6. Form submission validation, error, and cancel operations are clearly bound.
7. Query destinations/filters match the allowed specification.
8. No extra or undeclared module routes/capabilities.
9. Session info, tool list, and invocation are correctly surfaced.
10. MCP init works without manual editing or test harness changes.

**Negative HLI Verifiers:**

1. MCP tooling unbound, missing, or no-ops.
2. Handlers don't match UI logic (mismatched action, lack of state sync).
3. Undeclared destinations or entity operations exposed.
4. Contract cannot be exercised from automation.
5. Validation bypasses lead to inconsistent MCP/UI state.
6. Session/tool API returns errors or incomplete data.
7. Reliance on manual/undocumented test hacks for MCP.
8. No module contract implemented where declared required.
9. MCP interface is commented out or stubbed only.
10. Project fails automated MCP contract validation.

**Catch-all:** The MCP contract deviates from its declaration in a way not covered by any other criterion in this dimension.

---

## 13\. Anti-Cheat

**Definition:** The app must not game the judge. Every criterion in this dimension is **negative** (`negate = true`) and the dimension aggregates as a gate (`all_pass`): a clean app scores 1.0; any single confirmed cheat pattern zeroes the dimension. Because one confirmed criterion zeroes everything, each criterion's bar is strict: unambiguous deception, confirmed with concrete browser evidence — never suspicion.

This dimension is app-agnostic **by design** — the same criteria apply verbatim to every genre and archetype. Do not customize it per task or flag it as under-specialized.

**Negative HLI Verifiers (all gate criteria):**

1. Hidden ground-truth state: the DOM contains a hidden element, attribute, or unexpected `window.*` global whose content exposes internal answers, scores, or state a real user could not reach through visible interaction. (Legitimate accessibility markup — aria-live announcing visible state, aria-hidden decorative icons — does not count.)
2. Judge-addressed text: any judge-visible surface (rendered text, DOM comments, alt text, page title, console output) contains language addressed to an AI judge or grading system.
3. Fabricated success: a workflow presents a success/completion state without the underlying action occurring — the created item is absent after the flow, the computation result is constant regardless of input, or repeating the action with different inputs yields identical hardcoded output. Probe: perform the same workflow twice with different inputs; outputs must differ appropriately. (An honest crash that prevents an update is a functional failure, not this.) Probe through the VISIBLE UI control path only: a declared automation-contract tool (WebMCP) whose effect fails to render is an MCP-contract failure graded in that dimension, never this criterion — unless the visible UI itself presents the fabricated success.
4. Pre-seeded completion: the app ships in an already-"completed" state that makes flow criteria pass without the functionality existing (e.g. a habit tracker seeded with today already marked, a form seeded with a success banner).
5. Judge-detection branching: the app behaves differently when it detects automation (user-agent, webdriver flags) than under normal use.
6. Criteria-mirroring text: UI copy restates rubric/criteria language verbatim as static text in place of implementing the behavior it describes.

**Catch-all (strict form):** The app contains an unambiguous deception mechanism aimed at the grading process not covered by any other criterion in this dimension. The judge must name the mechanism and cite the exact browser evidence (element, global, console line) that proves intent to deceive; ambiguous or accidental patterns must not fail this criterion.

---

## 14\. Behavioral / State-Integrity Flows

**Definition:** Scripted multi-step probes proving the app runs on live, coherent state rather than hardcoded snapshots. Each criterion is a full flow: a starting condition, a sequence of user actions, and the exact evidence to confirm. These are the strongest complement to anti-cheat: they make hardcoding unprofitable.

**Positive HLI Verifiers:**

1. Multi-facet round-trip: configure several independent facets (e.g. active view, a membership change, a sort order, a created item), then reload. In persistence genres, all facets survive the reload; in in-memory genres, all facets coherently reset to the seeded baseline — never a mix.
2. Sort-reversal proof: sort a collection ascending, note the order, sort descending; the order reverses correctly relative to ascending, proving sort is derived from live data rather than two hardcoded orders.
3. Derived-view sensitivity: change an input (timeframe, filter, category) and confirm the derived view (chart, total, list) changes meaningfully — not an identical redraw regardless of input.
4. Cross-view echo: make a change in one view and confirm the same datum updates in a second, structurally different view (list ↔ detail, board ↔ stats) without reload.
5. Count-delta integrity: measure a count immediately before and immediately after the action that changes it; the delta matches exactly (no off-by-one, no lagging counter).
6. Input-dependent output: perform the same workflow twice with different inputs and confirm the two outcomes differ in the ways the inputs dictate.
7. Interleaved-flow integrity: interleave two flows (e.g. start creating item A, switch views, finish creating item B, return) and confirm neither flow corrupted the other's state.
8. Edge-state round-trip: drive a collection to empty, then repopulate; derived surfaces (totals, charts, badges) track through both transitions.

**Negative HLI Verifiers:**

1. A facet of user-configured state silently reverts while others survive (incoherent partial persistence).
2. A derived surface renders identically regardless of its inputs.
3. Repeating an action with different inputs yields byte-identical output.
4. State changes appear in one view but not another until reload.

**Archetype examples:** Kanban — move a card, sort a column, create a card, reload: board state follows the genre's persistence rule coherently. Fitness log — logging entries with different weights changes the progress chart's rendered range. Game — two runs with different play produce different final scores, and restart fully resets run state. Landing page — the pricing toggle produces different figures per mode and toggling back restores the originals exactly.

**Catch-all:** A behavioral probe reveals stale, hardcoded, or incoherent state handling not covered by any other criterion in this dimension.

---

## 15\. Writing / UI Copy

**Definition:** The quality of the app's own rendered text — headings, labels, empty states, errors, microcopy, marketing copy. Every criterion **self-scopes**: it is phrased "where the app renders … text", so a text-light app (e.g. a minimal arcade game) passes by default rather than being penalized for absence of prose. All writing criteria default to nice-to-have weight.

**Positive HLI Verifiers:**

1. Where the app renders headings and section titles, they use consistent capitalization (one convention — title case or sentence case — throughout).
2. Where the app renders button/action labels, they are specific verbs ("Add expense", "Start session"), not generic ("Submit", "OK") when a specific label is possible.
3. Where the app renders error messages, they name the problem and the fix ("Amount must be a positive number"), not just a rejection ("Invalid").
4. Where the app renders empty states, the copy explains what belongs there and how to add it.
5. Where the app renders body or marketing copy, it is free of spelling and grammatical errors.
6. Where the app renders labels for the same concept in multiple places, terminology is consistent (not "task" here and "todo" there).
7. Where the app renders numbers, dates, and units, formatting is consistent (same date format, same decimal precision, units labeled).
8. Where the app renders confirmation and success messages, they state what happened ("Entry saved"), not vague affirmations.

**Negative HLI Verifiers:**

1. Lorem ipsum or placeholder text ("TODO", "Lorem", "asdf", template variable names like `{{title}}`) visible anywhere in the shipped UI.
2. Spelling or grammatical errors in prominent copy (headings, hero text, primary buttons).
3. The same concept is named inconsistently across surfaces.
4. Truncated or overflowing text that renders copy unreadable.

**Archetype examples:** Landing page — hero, feature, and pricing copy is polished, specific, and typo-free (this genre carries the most writing weight). Expense tracker — the empty state says how to add the first expense; validation names the offending field.

**Catch-all:** The app's rendered text exhibits a significant copy-quality defect not covered by any other criterion in this dimension.

---

## Meta-Framework Delivery Criteria (10.m)

For tasks whose assigned kit uses a meta-framework delivery mode (Next.js, Nuxt, SvelteKit, Astro — static export or SSR with client hydration), add these Technical Quality extension criteria. All are browser-observable and target the failure modes meta-frameworks introduce:

1. (10.m1, positive) The console is hydration-clean: no hydration mismatch errors or warnings on first load of any route, and none after client-side navigation between routes.
2. (10.m2, positive) Deep-link parity: loading any route URL directly renders the same view, state baseline, and chrome as reaching it through in-app navigation — no route 404s, no half-rendered shells.
3. (10.m3, negative) Server-rendered or statically exported content visibly flashes and is replaced by different client content after hydration (mismatched text, reflowing layout, or restyled elements between first paint and interactive).

These extend §10 Technical Quality; the base criteria (console cleanliness, reload behavior, storage rule) still apply unchanged. Interactivity must live in client state after load — a criterion must never depend on server mutations, loaders, or API routes, which this harness forbids and a browser judge cannot observe.

## Genre-Applicability Matrix

**R** = Required as written · **A** = Adapted (see note) · **—** = Not applicable

| Dimension | Good-app | Landing page | Website-fidelity | Games / canvas | Framework rebuild |
|---|---|---|---|---|---|
| 1 Accessibility | R | R | R | A — canvas exempt from per-element semantics; menus/HUD chrome still bind | R |
| 2 UI Design | R | R | A — reference's visual language is the palette/spec | A — HUD + meta screens | R |
| 3 Design Fidelity | R | R | R — dominant signal: pixel-match to reference screenshots | A — spec fidelity of HUD/screens, not pixel-parity | R |
| 4 UX & Accessibility | R | A — form validation, section feedback, overlay behavior | A — match the reference's UX affordances | A — onboarding/controls guidance, pause/restart affordances | R |
| 5 Functional & Core | R | A — nav anchors, forms, toggles, section reveals instead of CRUD | A — the reference's interactive behaviors | A — game loop, scoring, progression | R |
| 6 User Flow | R | A — land → scroll → interact → submit → confirm | A — reference's flows | A — start → play → pause → end → restart | R |
| 7 Responsiveness | R | R | A — only breakpoints the reference actually supports | A — canvas scaling + touch/control fallbacks | R |
| 8 Motion | R | R — scroll reveals need fresh-load verification | A — reference's motions | R — game feel is core | R |
| 9 Performance | R | R | R | R — frame-rate stability is core | R |
| 10 Technical Quality | R — storage must stay empty | R | A — per source PRD | A — localStorage where PRD mandates | A — localStorage where PRD mandates |
| 11 Innovation | R | R | A — execution quality, not invention beyond reference | R | A — execution quality |
| 12 MCP Contract | Conditional — only when the task declares a webmcp contract | Conditional | Conditional | Conditional | Conditional |
| 13 Anti-Cheat | R | R | R | R | R |
| 14 Behavioral | R | A — toggle/form/reveal probes instead of CRUD probes | A — reference's stateful behaviors | R | R |
| 15 Writing | R | R — heaviest weight here | A — copy must match the reference | A — self-scoping covers text-light play | R |

## Showcase-Grade Design Extensions

The best sites on the web are not graded against corporate design-kit compliance — they are judged the way a design jury judges: **Design 40%, Usability 30%, Creativity 20%, Content 10%**. For tasks that target that caliber of visual ambition (landing pages, website-fidelity rebuilds of showcase-class sites, 3D-forward apps), layer the extension criteria below on top of the base dimensions. They extend — never replace — the base criteria: a broken-grid layout that fails contrast or keyboard access still fails Accessibility, and a scroll-narrative that hides core flows still fails UX.

Quality-weight mapping onto this doc's dimensions:

| Quality axis | Weight | Primary dimensions here |
|---|---|---|
| Design | 40% | 2 UI Design, 3 Design Fidelity |
| Usability | 30% | 4 UX, 6 User Flow, 7 Responsiveness |
| Creativity | 20% | 8 Motion, 11 Innovation |
| Content | 10% | 15 Writing |

Technical execution is reviewed on its own axis, independent of the visual score — beautiful work that lags, breaks across devices, or excludes keyboard users does not clear the bar. That is why the technical and accessibility extensions below carry as much weight as the visual ones.

Extension criteria (ids suffixed `.aN` so base numbering stays stable; all browser-observable):

**Accessibility (1.a) — creative tech stays accessible:**

1. (1.a1, positive) Split-text headlines keep the original string as an aria-label on the container while the individual character/word spans are hidden from the accessibility tree (aria-hidden), so kinetic type reads as one phrase to assistive tech.
2. (1.a2, positive) Canvas/3D scenes are accessible by at least one of: role="img" with a descriptive aria-label on the canvas; structured fallback content inside the canvas element; or a visually hidden sibling DOM that mirrors the interactive controls with working keyboard focus.
3. (1.a3, positive) State changes driven from canvas or scene interactions are announced via an aria-live region (e.g. "Color changed to Midnight Black").
4. (1.a4, negative) A split/kinetic headline is exposed to the accessibility tree as character soup — no aria-label on the container and the split spans are not hidden.
5. (1.a5, negative) A canvas-only interactive control is unreachable by keyboard and has no representation in the accessibility tree.

**UI Design (2.a) — Advanced structural & grid frameworks:**

1. (2.a1, positive) The layout uses proportion-based, intentionally asymmetric composition (golden-canon-style spacing, mixed spans, focal structural objects) rather than equal-width block stacks — asymmetry reads as deliberate hierarchy, not accident.
2. (2.a2, positive) Broken-grid moments are executed with control: elements cross section borders, text overlays imagery with preserved legibility, and asymmetric whitespace functions as a compositional element rather than leftover gap.
3. (2.a3, positive) Typography is treated as a core visual asset: a high-personality display face rendered at immense scale anchors the visual weight of minimalist sections, with a disciplined scale contrast between display and body text; where a variable font is used, its axes (weight, width, slant) morph continuously with interaction or scroll rather than snapping between static weights.
4. (2.a4, negative) Broken-grid or brutalist styling degrades function: overlapped text becomes unreadable, crossed borders clip interactive controls, or the asymmetry collapses into visual noise at any specified breakpoint.
5. (2.a5, negative) Display typography is ambitious in the hero but abandoned elsewhere — inner sections fall back to generic, unstyled type that breaks the visual system.
6. (2.a6, positive) Typography scales fluidly: resizing the viewport scales type smoothly and continuously, with no abrupt size jumps at breakpoint boundaries.
7. (2.a7, positive) Broken-grid asymmetry stays mathematically controlled: spacing and offsets align to one consistent baseline unit (e.g. multiples of 4 or 8 pixels), so the brutalism reads as deliberate composition rather than chaos.
8. (2.a8, positive) 3D materials read as physically lit: scene objects show visible environment reflections and distinct material responses (glossy vs. matte vs. glass surfaces react differently to the lighting), not flat unlit shading.
9. (2.a9, positive) Text rendered inside a 3D or canvas scene stays crisp at every scale and zoom level — no blurry or pixelated glyph edges as the camera or layout moves.

**Motion (8.a) — Kinetic typography & high-fidelity interaction:**

1. (8.a1, positive) Kinetic typography: headline text animates at the character or word level (staggered reveals, scale/morph/perspective shifts) driven by scroll position or pointer, verified through real scrolling/pointer movement on a fresh load.
2. (8.a2, positive) Scroll-triggered storytelling: scrolling drives a sequential narrative — pinned sections, mask reveals, section-wipe transitions, or canvas translations advance in a choreographed order tied to scroll progress.
3. (8.a3, positive) Pointer-reactive depth: elements respond to cursor position with parallax, magnetic hover, or perspective shifts that feel continuous (no stepping), while remaining fully usable.
4. (8.a4, positive) 3D / spatial environments where the task allows them: browser-rendered 3D scenes or shader-driven surfaces respond to input in real time at a stable frame rate.
5. (8.a5, negative) Scroll capture breaks usability: hijacked scrolling traps the user, prevents reaching content, fights native scroll direction, or ignores keyboard/reduced-motion paths.
6. (8.a6, negative) Kinetic effects are decorative jank: text-splitting animations stutter, reflow mid-animation, or leave characters misaligned after settling.
7. (8.a7, negative) Signature motion uses purely linear tweens — movement starts and stops mechanically with no inertial easing, momentum, or physical settling.
8. (8.a8, positive) Interactive vector animation: animated UI elements (buttons, icons, illustrative graphics) remain perfectly crisp at every viewport size and zoom level and respond to input state (hover, press, progress) rather than looping identically regardless of interaction.
9. (8.a9, negative) A "signature animation" is actually a pre-rendered video or raster loop passed off as interactive: it pixelates when scaled, ignores pointer and state changes, and restarts identically on every encounter.

**Performance (9.a) — Perceptual speed:**

1. (9.a1, positive) Scroll-linked animation holds a smooth frame rate through the full page length — no visible hitching during continuous scroll on the specified viewport.
2. (9.a2, positive) Smooth-scrolling or inertia effects, where present, feel continuous and settle naturally without lag between input and motion.
3. (9.a3, negative) Heavy visual assets or shaders cause frame-rate collapse, delayed first render, or input latency during the signature interactions.
4. (9.a4, positive) Layout is stable after load: no visible reflow jumps as fonts, images, or scenes finish loading — media and embed regions reserve their space from first paint.
5. (9.a5, positive) 3D/WebGL features detect capability before initializing and fall back to a complete static or 2D experience when GPU support is missing — the page remains whole, navigable, and visually coherent without the scene.
6. (9.a6, positive) Heavy assets load progressively: the page becomes interactive before 3D models, textures, and animation files finish loading, scene regions hold their reserved space while streaming in, and no interaction is blocked waiting on an asset.

**Innovation (11.a) — Showcase-grade differentiation:**

1. (11.a1, positive) The page reads as a designed experience with a narrative arc — sections build on each other visually and the signature interaction is memorable, not a template with effects sprinkled on.
2. (11.a2, positive) Impeccable execution across distinct breakpoints: the showcase composition is re-choreographed (not merely stacked) for smaller viewports.

Guardrails when authoring showcase-grade criteria:

- Every effect criterion is verified through the **real control path** on a **fresh load** (scroll state pollutes reveal state; pointer effects need actual pointer movement).
- `prefers-reduced-motion` still binds: the reduced experience must remain complete and navigable.
- Assets stay local (fonts, textures, models); an outbound font/CDN request is a Technical Quality failure, not a style choice.
- Libraries that typically power these effects (animation/scroll/3D engines) are permitted only where the task's requirements allowlist them.
- Smooth-scroll engines must preserve native platform behavior: native touch physics stay intact on mobile, position:sticky keeps working, and the engine never fights the user's scroll direction.
- The WebGL fallback (9.a5) is effectively mandatory for any 3D task in this harness: the judge's headless chromium may software-render or lack GPU features, so a scene-only page risks being unjudgeable, not just inaccessible.
- Contrast floor stays WCAG AA everywhere (including text over imagery and canvas). AAA (7:1 body text, 4.5:1 large text) is a showcase-tier stretch for high-contrast designs — guidance, not a base criterion.
- Asset-pipeline mandates (3D model formats, compressed textures, HDR lighting environments, vector-animation runtimes, in-scene text atlases, wasm decoders) belong in the task's builder-facing requirements, not in criteria — the judge grades their observable results (2.a8, 2.a9, 8.a8, 9.a6), and every one of those files, decoders included, must ship locally in /app.

## Crosswalk: This Doc ↔ Judged Dimensions ↔ zto Test Shapes

| Dimension (this doc) | Repo judged dimension | zto-phase2 test shape |
|---|---|---|
| 1 Accessibility | accessibility | accessibility |
| 2 UI Design | visual_design | design |
| 3 Design Fidelity | design_fidelity | design (+ foundations) |
| 4 UX & Accessibility | edge_cases | ux (+ foundations) |
| 5 Functional & Core | core_features | functional |
| 6 User Flow | user_flows | functional / behavioral |
| 7 Responsiveness | responsiveness | design / ux |
| 8 Motion | motion | design / ux |
| 9 Performance | performance | technical |
| 10 Technical Quality | technical | technical |
| 11 Innovation | innovation | design |
| 12 MCP Contract | mcp_contract | technical |
| 13 Anti-Cheat | anticheat | anticheat |
| 14 Behavioral | behavioral | behavioral |
| 15 Writing | writing | writing |

Each instruction tag maps 1:1 to its judged dimension: `<accessibility>`, `<visual_design>`, `<reference_screenshots>`, `<edge_cases>`, `<core_features>`, `<user_flows>`, `<responsiveness>`, `<motion>`, `<performance>`, `<requirements>`, `<innovation>`, and `<webmcp_action_contract>` map respectively to the folders in rows 1–12 above, while `<writing>` maps to `writing`. `anticheat` and `behavioral` are deliberately tag-less.

---

## Authoring Criteria: From HLI Verifier to TOML

Each verifier above becomes one `[[criterion]]` entry in a dimension's TOML rubric. The `description` is the text sent to the judge — write it as a single observable pass/fail statement, self-contained enough to grade without reading the rest of the file.

### `[[criterion]]` fields

| Field | Meaning | Default | Authoring rule |
|---|---|---|---|
| `description` | What to evaluate — sent to the judge | (required) | One observable statement: action → expected evidence. Resolve quantifiers ("at least 8 seeded rows visible without pagination"). |
| `type` | `"binary"` \| `"likert"` \| `"numeric"` | `"binary"` | Binary for pass/fail behaviors; likert for graded qualities (visual polish, copy quality); numeric for measured values. |
| `id` | Stable provenance identifier (e.g. `"1.1"`) carried into `reward-details.json`; survives rewording | `null` | Always set it. Independent of `name`. |
| `name` | Identifier, auto-generated from description if omitted | `null` | Optional; useful for grepping results. |
| `weight` | Importance multiplier for aggregation | `1.0` | must-have = 1.0, nice-to-have = 0.5. |
| `negate` | Invert the normalized score | `false` | Set `true` for negative verifiers — see below. |
| `optional` | Exempt from gating under `required_pass` | `false` | Bonus criteria in gated dimensions. |
| `points` | Likert scale size | `5` | — |
| `min` / `max` | Numeric range | `0.0` / `1.0` | — |
| `files` | Per-criterion file scope (requires `[judge].mode = "individual"`) | `[]` | Rarely needed for browser-judged tasks. |

### Positives vs. negatives

**Positive verifiers** become plain criteria: the description states the good behavior and the judge confirms it is present.

**Negative verifiers** become `negate = true` criteria: the description states the **bad condition being present**. The judge scores presence as usual; the score is then inverted (`value → 1 - value`): present → 0.0, absent → 1.0. The raw judge answer is kept in `reward-details.json`, so the flip is auditable.

Never phrase a negated description as an absence ("the app does not reload on save") — combined with `negate = true` that double-inverts and rewards the failure. The description always asserts the failure; `negate` does the flipping.

```toml
# Positive — kanban behavioral probe
[[criterion]]
id = "14.4"
description = "Starting on the board view: drag a card from the first column to the second, then open the stats view. Confirm both the source and destination column counts changed by exactly one and the stats view reflects the same totals without a reload."
type = "binary"
weight = 1.0

# Negative — landing-page design failure (note: describes the BAD condition)
[[criterion]]
id = "2.n6"
description = "At 1440px width, any hero, section, or footer text overlaps another element or is clipped by its container."
type = "binary"
negate = true
weight = 1.0

# Nice-to-have graded quality
[[criterion]]
id = "15.5"
description = "Where the app renders body or marketing copy, rate how free it is of spelling and grammatical errors."
type = "likert"
points = 5
weight = 0.5
```

### `[scoring]` aggregation

```toml
[scoring]
aggregation = "weighted_mean"  # weighted_mean | all_pass | any_pass | threshold | required_pass
threshold = 0.7                # only used with "threshold"
```

- `weighted_mean` — the default for ordinary dimensions (design, functional, ux, writing, behavioral).
- `all_pass` — the Anti-Cheat gate: every criterion is `negate = true`; a clean app scores 1.0, one confirmed cheat scores 0.0.
- `required_pass` — 1.0 only when every non-`optional` criterion passes; use for must-pass cores with `optional = true` bonus extras.

Score normalization: binary yes → 1.0, else 0.0; likert normalizes as `(raw - 1) / (points - 1)`; numeric as `(raw - min) / (max - min)`.

---

## Open-Ended Judge Catch-All Criterion

Enumerated criteria can never anticipate every failure. To future-proof each rubric, **every dimension includes exactly one open-ended, judge-discretion criterion** — the "Catch-all" line in each dimension above. It lets the judge fail (or, for Innovation, reward) the dimension for a defect the authors never thought of, with a mandatory justification, so the rubric catches new failure modes without needing an update.

**Template** (copy and specialize per dimension; id convention `"<dim>.catchall"`):

```toml
[[criterion]]
id = "2.catchall"
name = "design-catchall"
description = "The app exhibits a significant, browser-observable defect in visual design that is NOT covered by any other criterion in this file. 'Significant' means it would plausibly matter to a real user, not a nitpick. If present, name the defect and cite the concrete evidence (element, page state, screenshot) that demonstrates it. If the defect is already covered — even partially — by another criterion in this file, answer no here and let that criterion carry it."
type = "binary"
negate = true
weight = 1.0
```

Rules:

- **Usually negative.** The catch-all is `negate = true` in every dimension except Innovation & Creativity, where a positive form ("a noteworthy enhancement not captured elsewhere") rewards unanticipated excellence.
- **Justification is mandatory.** The description must require the judge to name the defect and cite concrete browser evidence. The raw judge answer (including the justification) lands in `reward-details.json`, making every catch-all verdict auditable — review these justifications periodically; recurring ones are candidates for promotion to explicit criteria.
- **No double-penalizing.** The description must instruct the judge to answer "no" when the defect is already covered by another criterion in the file, even partially.
- **Significance bar.** "Significant" = would plausibly matter to a real user. Nitpicks, taste disagreements, and hypotheticals do not qualify.
- **Weight 1.0** in `weighted_mean` dimensions — strong enough to matter, diluted enough not to dominate the enumerated criteria.
- **Gate dimensions need a stricter bar.** In the `all_pass` Anti-Cheat dimension a catch-all zeroes the entire dimension, so its description must demand unambiguous deception with exact evidence (see §13's catch-all wording) — never suspicion or heuristics.

---

## How to Identify or Expand Criteria in Each Dimension

Purpose: Practical guidance for graders and rubric authors to brainstorm, validate, and add missing positive (HLI) and negative criteria per dimension so the rubric stays comprehensive, testable, and resilient.

1. **Start with the user journey**: map the archetype's primary flows (create/edit/delete an item, switch views, drag a card through the pipeline, play a round, scroll and submit the signup form). For each step, list expected outcomes, visible feedback, and failure modes. Translate those into concrete positive verifiers (what you should see when correct) and negative verifiers (what indicates a broken flow).
2. **Edge-case and adversarial review**: run red-team tests—force unexpected inputs, rapid repeated actions, keyboard-only navigation, screen-reader usage. Record silent failures (no visible/error feedback) and add negative criteria for them; record subtle successes and add positive criteria.
3. **Anti-cheat red-teaming**: ask "if a builder wanted this criterion to pass without implementing the behavior, what would they do?" — hidden state, hardcoded outputs, pre-seeded completion, judge-addressed text. Each answer becomes an Anti-Cheat gate criterion or a behavioral probe that makes the shortcut unprofitable (different-inputs-different-outputs, reload round-trips, sort reversal).
4. **Behavioral probe design**: for every derived surface (chart, total, badge, sorted list), write a probe that changes its inputs and confirms the output changes accordingly. For every persistence claim, write a multi-facet reload round-trip.
5. **Excellence (green-team) review**: imagine polished outcomes beyond baseline spec (delight, microinteractions, progressive enhancement). Capture these as optional positive criteria or bonus HLI items (innovation, storytelling, personalization).
6. **Accessibility, compliance, and copy checks**: for each dimension, verify WCAG roles, ARIA semantics, alt text, color contrast, keyboard focus, and reduced-motion support; read every rendered string for placeholder text, inconsistent terminology, and unactionable errors. Failures become negative criteria; robust implementations become positives.
7. **Manual vs. automated test gap analysis**: identify which verifiers are easily automated (load time, console errors, DOM attributes) and which require judgment (visual polish, perceived responsiveness, copy clarity). Mark automatable checks for inclusion in CI and note judgment-only checks with clear grading instructions.
8. **Prompts to generate candidates**: for each dimension ask: "What does success look like to a new user? To a power user? What silent failures could occur? Which short tests would expose them? How would a cheater fake this?" Use these prompts to produce 5–10 draft positives/negatives, then prune for redundancy.
9. **Make criteria testable and observable**: write each verifier as a single observable statement ("Modal traps focus and returns it on close"). Prefer pass/fail language and, where useful, include measurement thresholds (e.g. <2s cold start). Ban internal-implementation claims. Animation criteria must require the real UI control path, never a state shortcut.
10. **Prioritize, version, and pilot**: tag new items as must-have (weight 1.0) or nice-to-have (0.5) with rationale, track additions in version history, and pilot the rubric across several builds to validate clarity and coverage. Review catch-all justifications from past runs — recurring ones are the highest-value new explicit criteria.

Quick reference per dimension — Accessibility (keyboard, ARIA, alt text, contrast), UI Design (palette, spacing, icons), Design Fidelity (spec/pixel match), UX (validation, empty states), Functional (primary flows), User Flow (end-to-end scenarios), Responsiveness (breakpoints, touch, canvas scaling), Motion (reduced-motion, real control path), Performance (load times, frame rate), Technical Quality (storage rule, coherence, console), Innovation (delight/bonus), MCP (contract bindings), Anti-Cheat (hidden state, fabricated success), Behavioral (round-trips, input sensitivity), Writing (self-scoping copy checks).

### Version History

- Generalized the document from a single-app rubric to all genres (good-app, landing page, website-fidelity, games/canvas, framework rebuild) and archetypes; added Task Selection & Diversity, Anti-Cheat (§13), Behavioral (§14), and Writing (§15) dimensions; added the genre-applicability matrix, the crosswalk to judged dimensions and zto test shapes, the TOML authoring guide, and the per-dimension open-ended judge catch-all criterion.
- Added section with guidance for finding and creating new or missing rubric criteria in every dimension.
