---
name: harden-task
description: >-
  Harden an existing frontend eval task to the functionality depth of the
  productivity apps everyone uses today (Lightroom/Notion/Linear class):
  audit its gaps, layer the appropriate advanced-feature clusters from the
  bundled catalogs, and enforce the useful-end-state contract (exportable +
  MCP-queryable final state). Use whenever asked to "harden <task>", "make
  <task> harder / less easy", "raise task depth", or to apply the advanced
  feature specs to an existing task.
---

# Harden a task to pro-app depth with a useful end state

You are upgrading ONE existing task (instruction.md + its 15 dimension rubrics
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
   cannot express this, extend the assignment (schemas/webmcp-assignments.json
   → re-render via scripts/webmcp_h3.py apply) as part of the hardening.
3. **Persisted where the genre allows:** hard-browser and framework-rebuild
   genre tasks persist end state in localStorage per their PRD mandate;
   good-app genre tasks stay in-memory (their persistence IS the export + MCP
   surface) — never violate the genre storage rule to fake persistence.
4. **Round-trip where import exists:** if the task gains an import, exporting
   then re-importing must reconstruct the same visible state (behavioral probe
   material).

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

## Workflow

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
5. **Update ALL 15 rubrics** per the create-rubrics skill's
   pre-existing-vs-add rules and polarity-mix doctrine: new criteria for every
   added feature group; behavioral gains chained full-pipeline probes ending
   at the export text (mutate → derived surfaces track → export contains the
   session's actual work; import/export round-trip; undo round-trip); negatives
   from silent failures (export omitting session mutations, undo not
   restoring, derived surface identical after input change, vote that never
   promotes). anticheat stays verbatim. Keep ids stable; descriptive
   snake_case names for new/rewritten criteria.
6. **Validate until clean**:

   ```bash
   python3 .claude/skills/create-rubrics/scripts/validate_dimensions.py tasks/<slug>
   python3 .claude/skills/rubric-align/scripts/validate_rubric.py tasks/<slug>/tests
   cd tools/corpuscheck && .venv/bin/python -m corpuscheck.cli validate <slug>
   ```

   If the webmcp assignment changed: `python3 scripts/webmcp_h3.py apply` and
   `python3 -m unittest scripts.tests.test_webmcp_h3` must also pass.

## Guardrails

- Oracle phasing: instruction/rubric hardening lands first; the solution
  oracle is rebuilt in the later oracle phase — note the mismatch in your
  report, never "fix" the oracle by softening the instruction.
- Do not break the kit: stack/summary/requirements allowlists stay intact;
  extend the allowlist only from docs/distribution.md menus when a new
  capability genuinely needs a domain library (e.g. local-tile maps).
- Judge cost awareness: prefer deepening existing dimensions' criteria over
  inventing new probe styles the judge cannot run in one session.
