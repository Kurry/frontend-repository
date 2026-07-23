---
name: task-authoring
description: >-
  Author, upgrade, and backfill frontend eval tasks end-to-end. Use when asked
  to harden an existing task, raise its depth, apply advanced feature specs,
  or add an exportable and MCP-queryable useful end state; migrate, upgrade,
  rewrite, or bring any tasks/frontend-*/instruction.md to the extended-kit
  shape in docs/instructions.md and docs/distribution.md; harvest a finished
  Harbor trial's built app and reward-details.json into a task's solution
  oracle or dispatch per-task Jules fixes; create and package a brand-new
  frontend Harbor eval from a reference app or inspiration URL; or create a
  task from saved or captured HTML, a page capture, or screenshots. Covers the
  active hardening, instruction-migration, and oracle-harvest workflows plus
  the archived new-task and capture-sourced pipelines.
---

# Task authoring: harden, migrate instructions, harvest oracles

Three active workflows in one skill, plus two archived legacy pipelines at
the end. Route by request:

- "Harden <task>" / raise depth / apply advanced feature specs →
  **Part 1 — Harden a task**.
- Migrate/upgrade/rewrite an instruction.md to the extended-kit shape / apply
  the distribution plan → **Part 2 — Migrate an instruction**.
- Backfill oracles from a harbor trial / dispatch Jules oracle-fix sessions →
  **Part 3 — Harvest oracles + Jules fix-fleet**.
- Create a brand-new task or a task from an HTML capture → **Legacy
  pipeline** sections (archived authoring folder required — read the warning
  there first).

Sibling skills: the `rubrics` skill owns criterion authoring/alignment; the
`jules` skill owns the Jules session lifecycle and fleet sequencing.

---

# Part 1 — Harden a task to pro-app depth with a useful end state

You are upgrading ONE existing task (instruction.md + its 13 dimension rubrics
+ its webmcp assignment when bindings change) so a finished build would be a
tool a real operator could adopt — not a demo. Work within the task's existing
identity: extend, never rewrite wholesale; preserve every existing behavior and
criterion id.

## The useful-end-state contract (non-negotiable)

Every hardened task must make the user's session work product SURVIVE the
absence of a backend. The end state of the application must be useful:

1. **Exportable:** at least one end-to-end export producing a complete,
   structured artifact of the session's actual state — a downloadable JSON
   document (or domain format: ICS, CSV-shaped text, markdown report) compiled
   LIVE from the store, offered with copy-with-confirmation and/or a download
   control. Export content must reflect every mutation the session made;
   an export that omits session work is a rubric failure.
2. **MCP-queryable:** the task's `<webmcp_action_contract>` must expose the
   final state for extraction — bindings such that a caller can query the
   primary collection(s) and derived outcomes (an export/read surface, e.g.
   artifact-transfer export with a structured format, or entity/browse reads
   covering every collection the export contains). If the current assignment
   cannot express this, extend the assignment (corpuscheck schemas/webmcp-assignments.json
   → re-render via `uv run corpuscheck webmcp apply`) as part of the hardening.
3. **Persisted where the genre allows:** hard-browser and framework-rebuild
   genre tasks persist end state in localStorage per their PRD mandate;
   good-app genre tasks stay in-memory (their persistence IS the export + MCP
   surface) — never violate the genre storage rule to fake persistence.
4. **Round-trip where import exists:** if the task gains an import, exporting
   then re-importing must reconstruct the same visible state (behavioral probe
   material).
5. **API-shaped schemas even without a backend:** the data layer is modeled as
   if the backend existed — form schemas (Zod/Valibot) mirror the payload
   shapes the domain's real APIs define (a PR object, a chat-completions
   request, an ICS event, a PGN game, a dataset record), the record a form
   creates IS the would-be request body, and exports/imports conform to those
   same schemas. Instructions state the field contract observably (required
   fields, formats, bounds, enums, cross-field rules) so validation is
   judgeable against the modeled API. This is a core frontend skill the task
   must exercise, not plumbing to hide.

**Worked example — the daisyui-theme-generator standard.** A theme generator
whose sliders only recolor a preview is a demo. The useful version is explicit
about its job: it GENERATES the theme FOR the user. Every customization the
user makes (palette picks, radius, font choices, per-component overrides) is
tracked in the store as the theme definition; the app's centerpiece is the
produced artifact — the exportable files (the CSS custom-properties block, the
framework config snippet, a theme JSON) — regenerated live on every edit,
downloadable and copyable, and readable through the MCP export surface. The
instruction must say this outright ("the app produces the user's theme files"),
the flows must end at the files, and the rubric must fail an export that does
not contain the session's actual customizations. That is how a static,
backend-less app becomes actually useful: the user leaves with their work
product in hand. Apply the same reading to every task you harden: name the
artifact the user came for, make the whole app converge on producing it.

**Second worked example — trip planning.** An itinerary app's artifact must be
portable to where the user actually lives: an ICS calendar payload every
calendar app can import, a structured trip JSON the app itself can re-import
(round-trip probe), and a printable/markdown day-by-day document. "Export"
always means an INTEROPERABLE format with a real downstream use — never a
screenshot-shaped dead end. When choosing artifact formats for any task, ask
"where would the user take this next?" and emit that format: themes → CSS/
config files, itineraries → ICS + JSON, ledgers → CSV, schemas → JSON-Schema
text, boards → structured JSON, palettes → CSS vars/Tailwind config/SCSS,
datasets → CSV + dataset card, prompts → markdown/package JSON.

**Third worked example — photo editing, with TRUE editing.** An image editor
must perform real pixel transformations: adjustments (exposure, color, crop,
masks) are applied to the actual bitmap client-side (canvas/WebGL image
processing), and the user downloads the FINISHED RESULT — a PNG/JPEG whose
pixels carry every edit — via a real download control. A CSS filter on a
preview element, an overlay trick, or a settings recipe alone is NOT editing:
the exported file must contain the edits when opened anywhere else. The edit
stack (a settings JSON enabling re-edit) is a worthy second artifact, but the
rendered image is the one the user came for; rubric probes must verify (a) two
different edit states produce two visibly different exported images, and (b)
the exported image matches what the on-screen preview showed.

**Fourth worked example — games play for real.** A game task must deliver the
complete competitive loop, not a board that shuffles pieces. Chess is the
standard: the user plays a REAL engine opponent end-to-end (an engine of
Stockfish's class compiled to WASM, shipped npm-local, running client-side),
with full rules enforcement (legal-move generation, check, checkmate,
stalemate, draw conditions), genuine WINNERS AND LOSERS (the game reaches a
decided end state — mate, resignation, draw — announced visibly with the
result), and a reset/new-game control that returns to a clean starting
position with no state leaking from the previous game. Depth follows: move
history in standard notation, undo/takeback, difficulty levels that observably
change engine strength, and the exportable artifact is the game itself — a PGN
the user can load into any chess tool. An in-progress game must also be
SAVEABLE and RESUMABLE: save the position/state (via the genre's persistence
rule, or an exportable state file the app can re-import) and resume later
exactly where it left off — same position, same side to move, same clock/
history. The same reading applies to every game genre: a real opponent/
challenge loop, decided outcomes, a clean restart, and save/resume.

## Hardening workflow

1. **Audit the task** against the too-easy signals: no import/export artifact,
   no undo/redo, no batch/multi-select, no live-derived recomputation, no
   simulated-run depth, single-surface CRUD, click-only interactions. List
   what is missing. (The two most common gaps corpus-wide are export artifacts
   and undo/redo.)
2. **Pick clusters from the bundled catalogs** in `references/` — apply WHERE
   APPROPRIATE to the task's domain, never bolt on inapplicable features:
   - `references/archetype-50.md` — 50 features across five archetypes
     (A1 productivity/time, A2 dense data logs, A3 planning hubs, A4 kanban/
     workflow, A5 creative suites) plus the Lightroom-grade imaging clusters
     L1–L10 (non-destructive slider stacks with live readouts, live histogram,
     HSL color engine, masking with per-mask adjustment sets, presets,
     copy-settings groups, versions/before-after, export depth).
   - `references/platform-50.md` — 50 enterprise workspace features (Cmd+K
     command palette, virtualized grids at 60fps, optimistic bulk macros,
     multi-model playground, ground-truth mapping dropzones, night-run
     scheduler, MCP-style status grids, terminal panes, token/pricing
     estimators, undo/redo timeline, coachmarks, factory reset).
   - `references/trip-platform.md` — collaborative-state simulation done right
     (conflict-merge modals, roles gating controls, voting that really
     promotes, presence/activity feeds) and the financial ledger cluster
     (multi-currency FX, minimum-transaction debt simplification, burn-rate
     vs ceiling).
   - `references/ai-element-patterns.md` — AI-product component vocabulary
     (streaming surfaces, reasoning disclosures, branch navigation, tool/step
     panels, attachments) and the frontend durability vocabulary (step
     statuses, retries with attempt counts, pause/resume from checkpoint,
     event timelines, live-derived rollups).
   Twin-pair rule: when the task has a domain twin in the corpus, choose
   non-overlapping clusters so the pair stays distinct.
3. **Write the features as observable behaviors** into the existing
   instruction sections (docs/instructions.md register: action → visible
   evidence, resolved quantifiers, no library names in behavioral sections,
   plain text). Every simulated capability is REAL client state — simulation
   refers to the absent backend/peers, never to faked outcomes (a vote really
   promotes; a merge really applies; FX math really computes).
4. **Add the end-state contract**: the export flow(s) in `<core_features>` /
   `<user_flows>` (flows must terminate at the produced artifact), the
   genre-appropriate persistence line in `<requirements>`, and — when bindings
   are needed — extend the task's webmcp assignment and re-render the contract
   block.
5. **Update ALL 13 rubrics** per the `rubrics` skill's
   pre-existing-vs-add rules and polarity-mix doctrine: new criteria for every
   added feature group; behavioral gains chained full-pipeline probes ending
   at the export text (mutate → derived surfaces track → export contains the
   session's actual work; import/export round-trip; undo round-trip); negatives
   from silent failures (export omitting session mutations, undo not
   restoring, derived surface identical after input change, vote that never
   promotes). Keep ids stable; descriptive
   snake_case names for new/rewritten criteria.
6. **Validate until clean**:

   ```bash
   python3 .claude/skills/rubrics/scripts/validate_dimensions.py tasks/<slug>
   python3 .claude/skills/rubrics/scripts/validate_rubric.py tasks/<slug>/tests
   uv run corpuscheck validate <slug>   # from the repo root
   ```

   If the webmcp assignment changed: `uv run corpuscheck webmcp apply` and
   `uv run pytest packages/corpuscheck/tests` must also pass.

## Hardening guardrails

- Oracle phasing: instruction/rubric hardening lands first; the solution
  oracle is rebuilt in the later oracle phase — note the mismatch in your
  report, never "fix" the oracle by softening the instruction.
- Do not break the kit: stack/summary/requirements allowlists stay intact;
  extend the allowlist only from docs/distribution.md menus when a new
  capability genuinely needs a domain library (e.g. local-tile maps).
- Judge cost awareness: prefer deepening existing dimensions' criteria over
  inventing new probe styles the judge cannot run in one session.

---

# Part 2 — Migrate a task instruction.md to the extended-kit shape

You are rewriting the builder-facing PRD of one eval task so it carries the
task's full assigned kit and the corpus mandates, without changing what the
app *is*. The product behaviors stay; the stack contract and the kit-driven
observable behaviors are what change.

## Inputs to read first (in this order)

1. `docs/distribution.md` — find the task's row (search the slug without the
   `frontend-` prefix). It gives you: post-migration framework (bold =
   framework changed), delivery mode (Next.js/Nuxt/SvelteKit/Astro, if any),
   component library, animation stack, domain libraries (rich text / data viz
   / calendar / table / virtual list), icons, and the per-framework defaults
   table for icons + forms. Also read the "Corpus-wide mandates" section —
   all nine apply to every task.
2. `docs/instructions.md` — the template contract: section order, plain-text
   rules, what belongs in each section. You mostly need "Global Authoring
   Rules", "Corpus-wide kit mandates", and the section definitions for
   `<summary>`, `<core_features>`, `<motion>`, `<requirements>`.
3. `docs/rubrics.md` — not just for verifiers: its dimension definitions and
   criterion patterns are the target vocabulary for instruction lines too.
   When you add an observable behavior, write it so a criterion could quote
   it — the behavioral flow patterns (§14: multi-facet reload round-trips,
   sort-reversal, derived-view sensitivity, cross-view echo, count deltas)
   are exactly the shapes your added flow lines should take, and the
   dimension definitions tell you which section a promise belongs in.
4. The task's current `instruction.md` — everything you keep, reshape, or
   extend.

If the task has no row in distribution.md, stop and report that instead of
inventing a kit.

## What changes and what must not

**Rewrite:**
- `<summary>` — one plain-text line: `Build a [same app] using [framework],
  [state library], Tailwind CSS 4.3.2, and [component library].` Keep the app
  identity verbatim from the old summary. If distribution assigns a delivery
  mode, name it as the framework flavor (e.g. "using Svelte 5 with SvelteKit
  static delivery, Svelte stores, Tailwind CSS 4.3.2, and Bits UI").
  Component library `none` rows (games): omit the component-library clause
  entirely.
- `<requirements>` — rewrite the stack/tooling bullets to the new kit; keep
  every behavioral state contract that still applies. The requirements must
  name: the state library and the in-memory rule (or the task's PRD-mandated
  localStorage rule — never flip a task's persistence genre), Tailwind CSS
  4.3.2, the component library and what it's used for (dialogs, tables,
  selects, toasts...), the animation allowlist ("X and Y allowed for
  animation; no other animation libraries"), the icon package ("Z icons
  only"), the forms contract ("all forms validate through a schema; inline
  per-field errors before submit"), any domain libraries, and "All libraries
  installed via npm and bundled locally; no CDN imports."

**Extend (add lines, keep existing ones):**
- **User flows with state tracking — the hardest part, do not shortcut it.**
  The instruction must carry at least two explicit end-to-end flows written
  as chains where every step names its state evidence: "After creating X, the
  list count increases by exactly one, the KPI strip updates, and switching
  to [other view] shows the same X without a reload." Each flow tracks state
  across three surfaces minimum (the acting view, a derived surface like
  counts/badges/charts, and a second view or a reload per the task's
  persistence genre). If the task uses the `<user_flows>` section, put them
  there; in the six-section shape, weave them into `<core_features>` as flow
  chains rather than isolated single-action lines. The state-tracking
  contract in `<requirements>` backs them: one shared store, cross-view echo
  without reload, reload returning to the genre's baseline (seeded for
  in-memory; persisted where the PRD mandates storage).
- `<core_features>` — add observable lines for each assigned domain library's
  ask, library-anonymously: table assigned → a column-sort round-trip line;
  virtual list → smooth scrolling through the seeded large collection;
  calendar → drag an event to a new slot; rich text → a formatting
  round-trip (bold on → rendered → toggled off) and working undo; charts →
  the chart's rendered output changes when its inputs change; forms → inline
  per-field validation naming the field, submit disabled until valid.
- `<motion>` — ensure the microinteraction mandate is expressed: list
  add/remove/reorder animates, toasts/feedback have motion, hover feedback
  stays explicit. Where the row assigns celebration effects, add one line
  tying the effect to the real winning action. Meta-framework rows: add the
  delivery-mode lines (no hydration errors in console on any route;
  deep-linking a route renders the same view as in-app navigation).

**Never touch:**
- `<integrity>`, `<delivery>`, `<webmcp_action_contract>` (including
  `<module_spec>` blocks) — byte-identical. These are generated/contract
  plumbing.
- `<reference_screenshots>` — keep as-is unless the framework changed;
  screenshots still describe the target UI.
- The app's identity, seed sizes, view inventory, and domain behaviors —
  migration adds a kit, it does not redesign the product.

## Fidelity-genre tasks (website-fidelity rows)

Fidelity tasks recreate a real site's composition and motion, which makes
them the one genre where copyright discipline is part of the migration. Two
extra rule sets apply:

**No copyrighted assets — substitute, never ship.** The builder must not be
asked to reproduce brand-owned assets. Sweep the instruction for these and
rewrite them as original stand-ins with the same visual role and metrics:
- Trademarked logos and wordmarks (the site's own mark, partner/client logo
  walls) → "an original placeholder wordmark/mark of the same size and
  placement"; logo marquees become "a marquee of N distinct original
  placeholder logos".
- Licensed fonts (Aeonik, Brier, Neue Montreal, and any face not under an
  open license) → "a bundled open-license display face with similar
  width/weight character", self-hosted. Open-license faces (Inter, and other
  OFL fonts) may stay by name.
- Brand photography, illustrations, and video layers → original or generated
  placeholder media at the same aspect ratios, dimensions, and layer counts.
  The *choreography* (how many layers, when they advance) is the fidelity
  target, not the footage.
- Real partner/brand color marks tied to logos can go; the site's own
  design-token palette (accent hexes, surface colors) is a design fact and
  stays.
Keep structural copy (section headings, nav labels, button text) — rubrics
already grade those exact strings — but never require shipping a third
party's media files. The reference screenshots remain advisory-only and
already carry the "do not copy into /app" rule; keep it.

**The kit still applies, gently.** Fidelity rows keep their mandated motion
runtime (GSAP/Lenis/Swiper pins etc.) as the animation stack; add only what
the row and mandates require: the Tailwind 4.3.2 pin, the assigned
base-chrome component library, Zod/Valibot schema validation behind the
page's existing forms, and the icon route (fidelity pages usually keep their
local SVG set — the mandate is npm-local or bundled-original, not a restyle).
Never redesign the page to fit the kit; the source site's look wins.

Also sweep `<motion>`/`<visual_design>` for runtime names that leaked in (the
smooth-scroll engine, the carousel library) and reword them
library-anonymously — the runtime belongs in `<requirements>`; the behavior
("smooth scrolling with eased anchor navigation above 1024px") belongs in the
behavioral sections.

## Register rules (these are graded by the validator)

- Plain text inside sections: no `**`, no `#`/`##`, no backticks, no markdown
  links. Dash lists and plain sentences only.
- Library names appear ONLY in `<summary>` and `<requirements>`. Behavior
  lines in `<core_features>`/`<motion>`/`<visual_design>` describe observable
  results ("reordering a row animates it to its new position"), never tools
  ("AutoAnimate animates the list").
- Every added line is an observable behavior: action → browser-visible
  evidence, quantifiers resolved.
- All tags closed, canonical order preserved. Migrations RESTRUCTURE to the
  full canonical shape from docs/instructions.md — summary,
  reference_screenshots, core_features, user_flows, edge_cases,
  visual_design, motion, responsiveness, accessibility, performance, writing,
  innovation, requirements, integrity, delivery, webmcp_action_contract —
  not just the legacy six sections. Concretely: end-to-end flow chains move
  OUT of core_features into `<user_flows>`; boundary/empty/error behaviors
  into `<edge_cases>`; breakpoint/reflow rules out of visual_design into
  `<responsiveness>`; keyboard/ARIA/focus/announcement behaviors into
  `<accessibility>`; load/console/frame-rate/layout-stability budgets into
  `<performance>`; copy-quality rules into `<writing>` when the app renders
  real copy (landing/fidelity pages: yes). Omit a section only when the app
  genuinely has nothing for it (a text-light game may skip writing) — never
  because the old file didn't have it. Content moves to its home section
  rather than being duplicated; requirements keeps contracts, behavioral
  sections keep evidence.
- Framework-changed tasks (bold rows): update stack-specific phrasing
  everywhere it leaks (e.g. "Redux Toolkit slices" in requirements), but do
  not translate the product.

## Migration workflow

1. Read the three inputs. Write down the task's kit as a checklist before
   editing.
2. Rewrite/extend the instruction in place (or at the requested output path).
3. Run the validator and fix everything it reports:

```bash
python3 .claude/skills/task-authoring/scripts/validate_migration.py \
  <path/to/new/instruction.md> --original <path/to/original/instruction.md> --slug <task-slug>
```

The validator checks: tag closure and order, no markdown inside sections,
protected sections byte-identical to the original, Tailwind 4.3.2 named in
summary or requirements, no library names inside behavioral sections, and
(informational) which kit terms from the distribution row appear. Treat FAIL
lines as bugs in your edit, not in the validator.

4. Report: the kit you applied, the lines you added per section, and the
   validator output.

---

# Part 3 — Harvest oracles from a running trial + drive a Jules fix-fleet

A harbor trial builds each task's app under
`jobs/<job>/<task>__<id>/artifacts/app/` and grades it into
`jobs/<job>/<task>__<id>/verifier/reward-details.json`. The full task slug is in
that trial dir's `config.json` (`task.path`). This workflow turns those finished
builds into committed `solution/app` oracles for tasks that lack one, then
dispatches one Jules session per task to fix the oracle against its graded
failures — keeping a fixed number of Jules sessions in flight.

## Pieces

- `scripts/harvest_oracle.py` — copy `artifacts/app/` → `tasks/<slug>/solution/app`
  (minus `node_modules`/`.git`) and `verifier/reward-details.json` →
  `tasks/<slug>/solution/reward-details.json`, ONLY for tasks with no oracle
  (unless `--force`). Prints one JSON line per harvested task. Optional score
  gate: `--min-reward`.
- `scripts/jules_fleet_driver.py` — ONE idempotent reconcile pass: count our
  live Jules sessions, and for each finished-but-undispatched task, fill open
  slots up to `--target` by (harvest if oracle-less → `git commit` per app →
  one `git push`) then `jules create` with a fix prompt built from that task's
  `reward-details.json`. State in a JSONL so passes never double-dispatch.

## The loop

Jules only sees **pushed** `main`, so every harvested oracle must be committed
and pushed before its session launches. One reconcile pass:

1. Count live sessions (state ∉ {COMPLETED, FAILED}) among ids in the state file.
2. Slots = `target - live`. Scan the job dir for finished tasks
   (`artifacts/app` + `verifier/reward-details.json`) not already in state.
3. For up to `slots` of them: harvest if the task has no oracle, `git add
   tasks/<slug>/solution`, commit `oracle(<slug>): …`. After all commits in the
   pass, ONE `git push`. Then `jules create --source Kurry/frontend-repository`
   per task (auto-PR, **no** `--require-plan-approval` → plans and proceeds).
4. Append `{slug, session_id}` to state.

Re-run the pass on a timer (~90s) until the trial app is gone and the queue is
empty. Because harvest skips tasks that already have an oracle and the state
file records dispatched slugs, re-runs are safe.

## Jules prompt contract (per task)

The fix prompt names the task, points Jules at `tasks/<slug>/solution/app` ONLY
(never `tests/`, never other tasks — disjoint file surface per the `jules`
skill's fleet-sequencing rules), pastes the failing criteria (value 0 /
`BLOCKED:` / `FAIL:`) grouped by dimension from `reward-details.json`, and cites
`tasks/<slug>/instruction.md` as the spec. It ends with the finish-line rule:
**commit is the deliverable; do not `git push`; AUTO_CREATE_PR opens the PR;
conclude at a clean commit** (per the `jules` skill — the push-block is by
design, not an error).

## Harvest guardrails

- Never overwrite an existing oracle without `--force`.
- One Jules session per task; tasks own disjoint files (`tasks/<slug>/solution/app`)
  so the fleet is merge-order-free.
- Leave PRs for review (no auto-merge) unless told otherwise.
- The `jules` skill (in-project) owns the Jules lifecycle and fleet-sequencing
  rules; this workflow is the harbor-artifact glue.

---

# Legacy pipeline (archived authoring folder required)

> **WARNING — archived path.** The two workflows below route through the
> historic per-task authoring folders, which were moved to
> `~/Documents/frontend-repository-authoring-backup-2026-07-18`, and through
> full `package_frontend_tasks.py` runs. Do not route NEW work through this
> pipeline — edit instruction.md and the dimension tomls directly (Parts 1–2
> above and the `rubrics` skill). They are preserved verbatim for when the
> archive is restored or the legacy path must be reconstructed.

## Legacy: create a brand-new frontend Harbor eval task

End-to-end recipe for adding `tasks/frontend-<slug>/`. Authoring content rules
(instruction register, rubric conventions) live in docs/instructions.md and docs/rubrics.md
`frontend-good-app-eval` — this workflow is the pipeline around them.

### Prerequisite: restore archived authoring sources

The authoring folders were moved out of the repo. Restore before packaging:

```bash
cp -R ~/Documents/frontend-repository-authoring-backup-2026-07-18/<Source> ./
# (or restore all of them if running full packaging)
```

### Step 1 — Authoring folder `<Source>/`

Create at repo root (e.g. `MyNewApp/` or `variants/MyNewApp/`):

- `instruction.md` — content sections only (`<summary>` … `<requirements>`),
  written per `frontend-good-app-eval`. No delivery/integrity/webmcp blocks —
  packaging adds those.
- Dimension tomls (`tests/<dim>/<dim>.toml`) — criteria authored directly per
  docs/rubrics.md: the outcome/walkthrough list (~10–14 browser-observable
  On load/After/When behaviors) leads `core_features` (or `behavioral` when the
  task ships it); ≥1 positive and ≥1 negative per dimension; one catch-all each.
- `README.md` — PRD naming the inspiration URL and specifying the reference
  exactly (node labels, seeded counts, motion params).
- The reference implementation files (static HTML/CSS/JS or built app) — these
  become the oracle.

### Step 2 — Register the task (NON-SKIPPABLE: the WebMCP contract ships WITH authoring)

**A task without a `<webmcp_action_contract>` is not a task.** The judge's webmcp
bridge discovers its tool surface from the contract; a contract-less instruction is
untestable, and the unit suite fails any `tasks/frontend-*` dir whose instruction
lacks the rendered block. Never defer this step "to registration later" and never
tell an authoring agent to skip the webmcp block — the assignment + rendered
contract is part of the authoring deliverable itself.

**Per-feature-group coverage rule:** every `Feature:` group in `<core_features>`
must be either reachable through the assigned modules' bindings or listed in
`mechanics_exclusions` with a reason (only for judge-observation-only mechanics —
chart hover, drag gesture fidelity, streaming visuals). No unmapped groups.

Three places, kept consistent:

1. `TASK_SPECS` in `corpuscheck/package_frontend_tasks.py` — slug → source,
   description, webmcp `modules`, `bindings`, `mechanics_exclusions`.
2. corpuscheck `schemas/webmcp-task-sources.json` — slug → source/instruction paths.
3. corpuscheck `schemas/webmcp-assignments.json` — the webmcp assignment (modules from
   `packages/webmcp-contracts` specs; bindings MUST name real product values —
   a filter binding like `artist` when the UI filters by `period` breaks
   builders). `uv run corpuscheck webmcp apply` renders the instruction contract block
   from this file; `test_assignment_map_covers_23` asserts the count, so bump
   its expectation when adding a 24th task.

### Step 3 — Package

```bash
uv run python -c "from corpuscheck import package_frontend_tasks as pft; pft.main()"   # full pipeline, rebuilds task dirs
```

This writes: `instruction.md` (content + delivery + webmcp contract),
`task.toml` (canonical template: codex judge env, artifact excludes),
`environment/Dockerfile`, `solution/` (oracle copy + `solve.sh`),
`tests/` (test.sh, system_prompt.md, `webmcp_stdio_server.mjs`, four
dimension tomls). For criterion changes later, edit the dimension tomls
directly (full packaging wipes hand-curated task files).

### Step 4 — Oracle validation + reference screenshots

```bash
uv run corpuscheck screenshots capture <slug>
```

Must report `OK ... consoleErr=0 pageErr=0` — fix the oracle app until it does
(common defects: entity-encoded `&quot;` attributes in captured HTML, missing
vendor chunks, unguarded optional libs). Then install for the builder:

```bash
uv run corpuscheck screenshots install <slug>
```

(Adds `environment/reference-screenshots/` + Dockerfile COPY + the
`<reference_screenshots>` instruction note. Screenshots are advisory; the
instruction text wins.)

### Step 5 — Validate

```bash
uv run pytest packages/corpuscheck/tests                # from repo root
cd ~/harbor && uv run python -c "
import tomllib
from harbor.models.task.config import TaskConfig
TaskConfig.model_validate(tomllib.load(open('/Users/kurrytran/frontend-repository/tasks/<slug>/task.toml','rb')))
print('schema ok')"
```

### Step 6 — Smoke run

Cheap dev-tier scoring against the oracle (or a trial) before any full run:

```bash
# full run (builder + verifier):
harbor run -p tasks/<slug> -a claude-code -m sonnet
# re-score an existing trial with the dev-tier judge (fork-only command):
cd ~/harbor && REWARDKIT_MODEL=gpt-5.6-luna uv run harbor score <trial-dir> \
  --task /Users/kurrytran/frontend-repository/tasks/<slug> --label smoke --action append
```

Needs `OPENAI_API_KEY` (verifier) and `CLAUDE_CODE_OAUTH_TOKEN` (builder) in the
host env. Expect the oracle to score high; read `reward-details.json` (includes
per-dimension `cost_usd`) and adjudicate any failed criterion by hand-testing
the app before blaming the rubric or the judge.

### Gotchas

- Never hand-edit the 23 generated copies of `test.sh` / `task.toml` /
  dimension tomls — edit the generator templates in
  `corpuscheck/package_frontend_tasks.py` + corpuscheck `canonical/` and regenerate.
- The app under test must expose `window.webmcp_session_info/list_tools/
  invoke_tool` (contract Implementation section) — the judge's webmcp bridge
  discovers exactly that surface.
- `package.json` must define scripts named exactly `start` (port 3000) and
  `verify:build`; the artifact excludes are enforced by a unit test.

## Legacy: create a task from a source HTML capture

Turn a saved/captured source HTML page (SavePage capture, e.g.
`~/Downloads/Sunsama.html`) into a complete frontend Harbor eval task:
exhaustive detail inventory, strict visible-vs-chrome-vs-absent scoping,
capture repair, a fully WORKING oracle solution (CRUD + WebMCP surface,
self-tested in a real browser), detail-preserving PRD + instruction, rubrics
that cite the page's exact seeded strings, registration/packaging, and
validation.

Nine stages. The sibling workflows own the generics — `frontend-good-app-eval`
(instruction register and rubric conventions per docs/instructions.md +
docs/rubrics.md) and the legacy create-task pipeline above (registration,
packaging, validation mechanics). This workflow owns what only a
capture-sourced task needs: losing zero detail, refusing to invent unshown
product, and turning a dead capture into a living oracle.

Two invariants run through every stage:

- **No detail lost.** Every visible element ends up in the inventory, and every
  inventory line ends up traceable to the instruction, a chrome-only line, or
  an explicit "absent" entry (stage 9 enforces this with a diff).
- **Nothing invented.** Knowledge of the real product is inadmissible. If the
  page doesn't show it, the task doesn't have it.

### Stage 1 — Inventory (`<Source>/INVENTORY.md`)

Read the raw HTML region by region (captures run to megabytes — work in
slices) and write the inventory BEFORE any authoring:

- Layout regions in order (left nav / board / right rail, etc.).
- Every seeded record verbatim, with exact strings: task titles, dates, times,
  totals, badges, counts ("Set up Sunsama", "Automatic Bill Payment - Sallie
  Mae", "0:20", "Jul 6–26", zoom "1x"). Exact strings become rubric anchors —
  a criterion citing a literal string cannot be misread by a judge.
- Every control per region: label, kind, and whether the capture shows any
  behavior for it.
- Every state present in the DOM: checked/unchecked, expanded/collapsed,
  active nav item, open panels, empty slots.
- Named icons/connectors, help/chat widgets, footers, version strings.

When unsure whether something matters: inventory it. Scoping decides its fate.

### Stage 2 — Scope every inventory line into one bucket

1. **Visible UI (full spec):** rendered AND populated on this page → full
   behavioral treatment.
2. **Chrome-only:** a control or nav label exists but its screen/flow is not
   on this page → spec as visible, interactive-feeling, non-navigating chrome
   (demo toast or no-op). Never promote chrome to a feature.
3. **Absent:** everything else the real product has → does not exist for this
   task. Not specced, not rubriced, not implemented.

Record the classification in the PRD as a "what this page is / is not"
section so later editors can't silently promote buckets.

### Stage 3 — Repair the capture

Copy the capture into `<Source>/` and fix the standard defect classes (all
observed in this repo's real captures):

- `=&quot;` entity-encoded attribute delimiters → `="`, protecting legitimate
  `&quot;` inside CSS strings (font-family). Unfixed, this class alone throws
  20+ console errors per page.
- Remove/stub every external `<script src>` (analytics, chat widgets, CDNs);
  vendor genuinely needed libraries under `vendor/`.
- Neutralize outbound `href`s into non-navigating controls.
- Debrand product strings to the assigned brand, consistently across capture,
  PRD, instruction, and dimension rubrics (they must never drift apart).
  Synthetic personal/billing seed strings may stay.
- Local assets only; the page must render fully offline.

### Stage 4 — Build the WORKING oracle solution

The repaired capture is a screenshot that happens to be HTML. The oracle must
be a working application. Corpus precedent: oracles are static, self-contained
apps (plain HTML+JS, in-memory state) — the instruction's framework stack
binds only the BUILDER; the oracle is never stack-judged, only observed.

Enhance the repaired capture with a JS layer implementing EVERY behavior the
instruction will demand:

- Full CRUD on the visible primary collection (create/edit/complete/delete),
  with derived values recomputing live — inventory anchors like per-column
  totals must be real computed values, not baked strings.
- Domain state beyond CRUD as specced (filters, states, badges, empty states,
  validation on invalid create).
- Chrome-only controls wired to demo toasts; zero navigation.
- In-memory state only — no localStorage/sessionStorage.
- **The WebMCP surface**: `window.webmcp_session_info()`,
  `window.webmcp_list_tools()`, `window.webmcp_invoke_tool(name, args)`, one
  tool per permitted operation in the task's module specs, bound to the
  Bindings values, handlers calling the same logic as the visible UI.
- `package.json` with scripts named exactly `start` (port 3000; the
  `npx serve` pattern is fine for static) and `verify:build`.

**Self-test in a real browser before calling it done** (playwright is in repo
`node_modules`): exercise create/edit/complete/delete, watch derived totals
recompute, invoke at least one `webmcp_invoke_tool` and confirm the UI
reflects it, and verify zero console errors DURING the workflows — not just
on load. An oracle bug becomes a permanent false signal in every future
scoring run; this repo has shipped four of those and paid to find them later.

### Stage 5 — PRD (`<Source>/README.md`)

Written from the inventory, not from product memory: provenance/URL, the
stage-2 scope classification, exact seed tables, per-region specs. Bar: the
PRD alone recreates the page; the page alone finds every detail in the PRD.

### Stage 6 — Instruction and rubrics

Follow `frontend-good-app-eval` for register and conventions. Capture-specific
additions:

- The CRUD layer grows from a **visible** collection only.
- Chrome-only items get instruction lines (demo-toast contract) AND at least
  one negative criterion (outbound navigation from chrome = fail).
- Criteria cite exact inventoried strings and quantities ("the Jul 6 column
  shows a work-time total of 0:20 that updates when a task's planned time
  changes"). One criterion per inventoried behavior; no compound collapses.
- WebMCP bindings name only values that exist on the page. A chrome-only
  Filter control does NOT justify a filter binding.

### Stage 7 — Register and package (NON-SKIPPABLE: the WebMCP contract ships WITH authoring)

**A task without a `<webmcp_action_contract>` is not a task** — the judge's webmcp
bridge discovers its tool surface from the contract, and the unit suite fails any
task dir whose instruction lacks the rendered block. Never defer the contract or
tell a subagent to skip it. Per-feature-group coverage: every `Feature:` group in
`<core_features>` is reachable through the assigned modules' bindings or listed in
`mechanics_exclusions` with a reason (judge-observation-only mechanics only).

Per the legacy create-task pipeline above: add the slug to `TASK_SPECS`
mirroring the existing entry archetype (source, house-style description
"<Brand> <domain> good-app eval.", modules, bindings, mechanics_exclusions),
plus corpuscheck `schemas/webmcp-task-sources.json`
and `schemas/webmcp-assignments.json` (package data under
`packages/corpuscheck/src/corpuscheck/schemas/`). Package ONLY the new slug (call
`package_task(slug, spec)` directly — full `main()` requires every archived
authoring source). Check `copy_solution_app`/`should_skip` so INVENTORY.md,
README.md, and rubric files stay out of `solution/app`.

Growing the corpus breaks count assertions: update
`test_assignment_map_covers_23`-style hard counts in
`packages/corpuscheck/tests/test_webmcp_h3.py`.

### Stage 8 — Screenshots + validation

```bash
uv run corpuscheck screenshots capture <slug>   # must be OK consoleErr=0 pageErr=0
uv run corpuscheck screenshots install <slug>
uv run pytest packages/corpuscheck/tests        # from repo root
uv run corpuscheck scaffold <slug> --check      # dimension tomls parse
cd ~/harbor && uv run python -c "import tomllib; from harbor.models.task.config import TaskConfig; TaskConfig.model_validate(tomllib.load(open('<abs task.toml>','rb'))); print('ok')"
```

Screenshots now show the working oracle — they double as the builder's visual
reference and the oracle's rendered proof.

### Stage 9 — Traceability + smoke

- Diff INVENTORY.md against the packaged instruction: every line traceable to
  an instruction line, a chrome-only line, or a PRD "absent" entry. Report any
  orphans.
- Smoke-score the oracle with the dev tier
  (`REWARDKIT_MODEL=gpt-5.6-luna`, `harbor score` from the ~/harbor fork —
  see the legacy create-task pipeline above). The oracle should score
  near-ceiling; hand-adjudicate every failed criterion against the running
  app before blaming rubric or judge — a failed criterion here means either
  an oracle bug or a rubric bug, and both must be fixed before the task ships.
