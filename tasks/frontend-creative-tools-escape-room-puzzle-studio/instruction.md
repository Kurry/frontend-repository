<summary>
Build a frontend-only escape room puzzle studio using React with Next.js static-export delivery, Redux Toolkit, Tailwind CSS 4.3.2, and DaisyUI. The app produces the operator's session artifacts: a canonical JSON, SVG room/dependency maps, CSV playtest event/state ledger, and Markdown build/reset/hint runbook compiled live.
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
Feature: Room and prop layout —
- Props drag/rotate/resize on a 0.1-meter grid within allowed room/furniture anchors. Items can be visible, hidden-in, mounted-on, or carried. Bounds, overlap, reach height, aisle clearance, and declared accessibility rules are exact. Keyboard placement and mobile coordinate/container sheets equal pointer gestures.
Feature: Puzzle dependency graph —
- Nodes represent actions, clues, facts, items, lock states, mechanisms, and exit. Edges are requires-all, requires-any group, produces, consumes, reveals, hides, resets, or excludes. Typed endpoints and group semantics are validated. Unintentional dependency cycles and orphan required nodes reject; intentional reset loops use a separate declared edge class.
Feature: Clue, solution, and reveal contract —
- Each clue has source prop/region, observed text or pattern, prerequisite visibility/knowledge, derived fact, ambiguity alternatives, and solution evidence. A lock defines accepted fixture input(s), attempt policy, result, and reset. Users bind exact clue spans/images placeholders to facts. A fact cannot become known before all active prerequisite semantics are satisfied.
Feature: Hint ladder —
- Each puzzle has 1–4 ordered hints with trigger elapsed time, failed-attempt count, prerequisite state, specificity, and cost points. Hints may reveal a source, relationship, method, or answer under exact ordering rules. A hint preview shows knowledge/inventory consequences but never mutates playtest state until requested.
Feature: Playtest simulation —
- The user controls one or two fictional player tokens, logical clock, position, observed facts, inventory, lock attempts, hints, and mechanism states. Actions validate spatial reach plus knowledge/item/state requirements. Events are append-only; undo creates a rewind branch from a checkpoint rather than deleting history. Completed state requires a reachable exit under canonical rules.
Feature: Static analysis and evaluator —
- The evaluator explores the bounded state graph to find unreachable required nodes, item-consumption softlocks, premature reveals, multiple ambiguous terminal paths, unused clues, hint dead ends, reset omissions, and minimum/maximum fixture solution time. Findings cite exact nodes/edges/states and replayable counterexample paths.
Feature: Pacing, playtest comparison, and repair —
- Timeline lanes show puzzle solve intervals, idle/search time, failed attempts, hints, and parallel player activity. Users compare two playtest traces and branch design variants, then merge property-level changes. Editing a tested node/edge marks affected traces and certification stale. A repair can preserve completed prefix when rerun from an explicit checkpoint.
Feature: Responsive studio and artifacts —
- Desktop shows room canvas, dependency graph, clue/hint inspector, and playtest/evaluator timeline. Mobile becomes room mini-map, prop/node cards, source-target edge sheets, vertical state/trace lineage, and simulation controls. Export produces canonical JSON, SVG room/dependency maps, CSV playtest event/state ledger, and Markdown build/reset/hint runbook; import reconstructs state exactly.
</core_features>

<visual_design>
- Desktop shows room canvas, dependency graph, clue/hint inspector, and playtest/evaluator timeline. Mobile becomes room mini-map, prop/node cards, source-target edge sheets, vertical state/trace lineage, and simulation controls.
- Inspect visible/hidden/carried, unmet/met/produced/consumed, locked/open/reset, hint eligible/used, player/run/finding/cert states -> topology stays legible.
</visual_design>

<motion>
- Move/reveal, propagate facts/items/locks, request hint, simulate/rewind, repair finding, then repeat reduced -> causal endpoints/state agree.
</motion>

<requirements>
Shared application state must live in Redux Toolkit (in-memory only). Do not use localStorage, sessionStorage, or other browser storage APIs. Persistence for this genre is the exportable Session JSON / SVG / CSV / Markdown plus the MCP query surface.
State contracts (behavioral, not storage keys):
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit; report every file/record/field diagnostic together; reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
- Make the useful end state an interoperable downloadable artifact of the session's actual work. Specify exact filenames, schemas, required keys/columns, units, precision, stable sort order, relationship integrity, and regenerated generatedAt/exportedAt values. A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
- Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions/import attempts must not silently share or overwrite state.
- Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules. Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
Build tooling: Next.js with static export (or SSR with client hydration); all interactivity lives in client state after load — no server actions, API routes, or data loaders. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication.
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
</webmcp_action_contract>
