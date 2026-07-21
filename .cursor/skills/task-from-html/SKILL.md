---
name: task-from-html
description: >-
  Turn a saved/captured source HTML page (SavePage capture, e.g.
  ~/Downloads/Sunsama.html) into a complete frontend Harbor eval task: exhaustive
  detail inventory, strict visible-vs-chrome-vs-absent scoping, capture repair,
  a fully WORKING oracle solution (CRUD + WebMCP surface, self-tested in a real
  browser), detail-preserving PRD + instruction, rubrics that cite the page's
  exact seeded strings, registration/packaging, and validation. Use whenever the
  user hands over an .html capture (or capture folder) and wants a task made
  from it — "make a task from this page/capture/screenshot".
---

# Create a task from a source HTML capture

Nine stages. The sibling skills own the generics — `frontend-good-app-eval`
(instruction register and rubric conventions per docs/instructions.md + docs/rubrics.md) and `create-task`
(registration, packaging, validation mechanics). This skill owns what only a
capture-sourced task needs: losing zero detail, refusing to invent unshown
product, and turning a dead capture into a living oracle.

Two invariants run through every stage:

- **No detail lost.** Every visible element ends up in the inventory, and every
  inventory line ends up traceable to the instruction, a chrome-only line, or
  an explicit "absent" entry (stage 9 enforces this with a diff).
- **Nothing invented.** Knowledge of the real product is inadmissible. If the
  page doesn't show it, the task doesn't have it.

## Stage 1 — Inventory (`<Source>/INVENTORY.md`)

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

## Stage 2 — Scope every inventory line into one bucket

1. **Visible UI (full spec):** rendered AND populated on this page → full
   behavioral treatment.
2. **Chrome-only:** a control or nav label exists but its screen/flow is not
   on this page → spec as visible, interactive-feeling, non-navigating chrome
   (demo toast or no-op). Never promote chrome to a feature.
3. **Absent:** everything else the real product has → does not exist for this
   task. Not specced, not rubriced, not implemented.

Record the classification in the PRD as a "what this page is / is not"
section so later editors can't silently promote buckets.

## Stage 3 — Repair the capture

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

## Stage 4 — Build the WORKING oracle solution

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

## Stage 5 — PRD (`<Source>/README.md`)

Written from the inventory, not from product memory: provenance/URL, the
stage-2 scope classification, exact seed tables, per-region specs. Bar: the
PRD alone recreates the page; the page alone finds every detail in the PRD.

## Stage 6 — Instruction and rubrics

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

## Stage 7 — Register and package (NON-SKIPPABLE: the WebMCP contract ships WITH authoring)

**A task without a `<webmcp_action_contract>` is not a task** — the judge's webmcp
bridge discovers its tool surface from the contract, and the unit suite fails any
task dir whose instruction lacks the rendered block. Never defer the contract or
tell a subagent to skip it. Per-feature-group coverage: every `Feature:` group in
`<core_features>` is reachable through the assigned modules' bindings or listed in
`mechanics_exclusions` with a reason (judge-observation-only mechanics only).

Per `create-task`: add the slug to `TASK_SPECS` mirroring the existing entry
archetype (source, house-style description "<Brand> <domain> good-app eval.",
modules, bindings, mechanics_exclusions), plus corpuscheck `schemas/webmcp-task-sources.json`
and `schemas/webmcp-assignments.json` (package data under
`packages/corpuscheck/src/corpuscheck/schemas/`). Package ONLY the new slug (call
`package_task(slug, spec)` directly — full `main()` requires every archived
authoring source). Check `copy_solution_app`/`should_skip` so INVENTORY.md,
README.md, and rubric files stay out of `solution/app`.

Growing the corpus breaks count assertions: update
`test_assignment_map_covers_23`-style hard counts in
`packages/corpuscheck/tests/test_webmcp_h3.py`.

## Stage 8 — Screenshots + validation

```bash
uv run corpuscheck screenshots capture <slug>   # must be OK consoleErr=0 pageErr=0
uv run corpuscheck screenshots install <slug>
uv run pytest packages/corpuscheck/tests        # from repo root
uv run corpuscheck scaffold <slug> --check      # dimension tomls parse
cd ~/harbor && uv run python -c "import tomllib; from harbor.models.task.config import TaskConfig; TaskConfig.model_validate(tomllib.load(open('<abs task.toml>','rb'))); print('ok')"
```

Screenshots now show the working oracle — they double as the builder's visual
reference and the oracle's rendered proof.

## Stage 9 — Traceability + smoke

- Diff INVENTORY.md against the packaged instruction: every line traceable to
  an instruction line, a chrome-only line, or a PRD "absent" entry. Report any
  orphans.
- Smoke-score the oracle with the dev tier
  (`REWARDKIT_MODEL=gpt-5.6-luna`, `harbor score` from the ~/harbor fork —
  see `create-task`). The oracle should score near-ceiling; hand-adjudicate
  every failed criterion against the running app before blaming rubric or
  judge — a failed criterion here means either an oracle bug or a rubric bug,
  and both must be fixed before the task ships.
