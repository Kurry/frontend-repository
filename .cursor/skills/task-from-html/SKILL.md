---
name: task-from-html
description: >-
  Turn a saved/captured source HTML page (SavePage capture, e.g.
  ~/Downloads/Sunsama.html) into a complete frontend Harbor eval task without
  losing any visible detail: exhaustive UI inventory, strict visible-vs-chrome
  scoping, debranded oracle repair, detail-preserving PRD + instruction, and
  rubrics whose criteria cite the page's exact seeded content. Use whenever the
  user hands over an .html capture (or a folder of capture assets) and wants a
  task made from it, or says "make a task from this page/screenshot/capture".
---

# Create a task from a source HTML capture

Pipeline: capture → inventory → scope → oracle → PRD/instruction → rubrics →
package. Steps 5–7 delegate to the sibling skills `frontend-good-app-eval`
(content register, rubric conventions) and `create-task` (registration,
packaging, screenshots, validation). This skill owns what those don't: not
losing detail, and not inventing what the page doesn't show.

## Step 1 — Exhaustive inventory (the no-detail-lost contract)

Read the raw HTML (it will be large; work region by region) and write
`<Source>/INVENTORY.md` before any authoring. Enumerate, with exact strings:

- Layout regions and their order (e.g. left nav / central board / right rail).
- Every seeded record verbatim: titles, dates, times, counts, labels, badges
  ("Set up Sunsama", "Automatic Bill Payment - Sallie Mae", work-time totals
  "0:20" / "1:00", date range "Jul 6–26", zoom "1x"). These become rubric
  anchors — a criterion that can cite an exact string is a criterion a judge
  cannot misread.
- Every control, per region: label, kind (button/link/input/toggle), and
  whether the capture shows it doing anything.
- All states present in the DOM: checked/unchecked, expanded subtasks, active
  nav item, open panels, empty slots.
- Icons/connectors by name (GitHub etc.), help/chat widgets, footers.

Nothing visible on the page may be absent from the inventory. When in doubt,
inventory it — scoping (step 2) decides what to do with it, not omission.

## Step 2 — Scope: visible UI vs chrome-only vs absent

Classify every inventory item into exactly one bucket:

1. **Visible UI (full spec)** — rendered and populated on this page. Gets full
   behavioral treatment in the PRD and instruction. Sunsama example: the
   multi-day board (day columns Jul 6–26, Add task, Today/Filter/Board
   controls, work-time totals), the task model as far as shown (titles,
   checkboxes, #work channel, subtasks, planned time, fixed 9:00 am start),
   the calendar rail (Calendars panel, 1x zoom, the all-day event).
2. **Chrome-only (inert, specified as chrome)** — present as controls/labels
   but their screens or flows are NOT on this page. Spec them as visible,
   interactive-feeling, non-navigating chrome (demo toast or no-op), never as
   features. Sunsama example: Home/Today/Focus/Daily planning/shutdown/
   highlights/Weekly planning/review/Backlog nav links; Filter + Search;
   Add folder; Backlog · Archive · Objectives tabs; integration connector
   icons; the Intercom/chat button.
3. **Absent** — anything you know about the real product that the page does
   not show. It does not exist for this task. Do not spec it, do not rubric
   it, do not let "the real app does X" leak in.

The classification goes into the PRD explicitly (a "what this page is / is
not" section) so future editors don't promote chrome into features.

## Step 3 — Repair the capture into the oracle

Copy the capture into `<Source>/` as the reference implementation and fix the
standard capture defects (all seen in real captures in this repo):

- Replace entity-encoded attribute delimiters (`=&quot;` → `="`), scoped so
  legitimate `&quot;` inside CSS strings (font-family values) survives — this
  class alone caused 25+ console errors per page in past oracles.
- Remove or stub every external `<script src="https://…">` (analytics, chat
  widgets, CDNs); vendor genuinely needed libraries locally under `vendor/`.
- Neutralize all outbound `href`s: chrome controls become non-navigating
  buttons per the chrome-only spec.
- Debrand: generic product name, synthetic personal data. Keep seeded content
  strings that the rubric will cite (or replace them consistently in capture,
  PRD, checklist, and rubric together — never let them drift apart).
- Local assets only; no network at runtime.

Acceptance: `node scripts/capture_reference_screenshots.mjs <slug>` reports
`OK … consoleErr=0 pageErr=0` once packaged. The oracle must render the full
inventoried page.

## Step 4 — PRD (`<Source>/README.md`)

Write the PRD from the inventory, not from memory of the product. Include the
original page provenance/URL, the scope classification from step 2, exact
seeded data tables, and per-region specs. The bar: someone with only this PRD
recreates the page; someone with the page finds every visible detail in the
PRD.

## Step 5 — Instruction, checklist, rubric

Follow `frontend-good-app-eval` for register and conventions. Capture-specific
requirements on top:

- The good-app CRUD layer must grow out of a **visible** collection (Sunsama:
  tasks within day columns — create/edit/complete/delete tasks, planned-time
  totals recomputing per column), never out of a chrome-only feature.
- Chrome-only items get their own instruction lines ("clicking X shows a demo
  toast and never navigates") and at least one negative rubric criterion
  (outbound navigation from chrome = fail).
- Rubric criteria cite the inventory's exact strings and quantities wherever
  possible ("the Jul 6 column shows a work-time total of 0:20 that updates
  when a task's planned time changes"). Prefer one criterion per inventoried
  behavior over collapsed compound criteria.
- WebMCP bindings (destinations, filters, entity fields) must name only values
  that exist on the page — bindings drift is a known failure mode.

## Step 6 — Package and validate

Hand off to `create-task` steps 2–6 (register in TASK_SPECS + schemas,
package, capture/install screenshots, unit + schema validation, luna smoke
run). Final check unique to this skill: diff the packaged instruction against
`INVENTORY.md` — every inventory line must be traceable to an instruction
line, a chrome-only line, or an explicit "absent" entry in the PRD.
