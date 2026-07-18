---
name: frontend-good-app-eval
description: >-
  Author and tighten frontend-only Harbor eval task folders into "good
  applications": instruction.md (plain-text XML sections), verifier_checklist.json
  (browser-observable After/On load/When checks), and rubric.json (positive/negative
  HLI verifiers). Use whenever the user edits instruction.md for UI apps, writes
  verifier checklists or HLI rubrics, mentions good applications, DaisyUI/dashboard
  task specs, stack A–L assignments, frontend Harbor evals, or asks to upgrade a
  static mock into CRUD + multi-view + domain state — even if they do not say
  "good application" or "Harbor."
---

# Frontend good-application eval authoring

Turn a frontend task folder into a fair, hard, browser-judgeable eval: product
behavior in `instruction.md`, observable outcomes in `verifier_checklist.json`,
and HLI criteria in `rubric.json`. Gold shape for instruction register:
`tasks/frontend-admin-analytics-dashboard/instruction.md`. Authoring source
folders are archived at `~/Documents/frontend-repository-authoring-backup-2026-07-18`
(restore them into the repo root before packaging or regenerating).

Lean checklist: [references/good-app-bar.md](references/good-app-bar.md)

## When to apply

- New or revised frontend Harbor task folders
- Stack A–L assignment or summary rewrite
- Upgrading title-only / static UIs into good applications
- Aligning checklist + rubric with instruction contracts

## Deliverables (per task folder)

Write or update all three:

1. `instruction.md`
2. `verifier_checklist.json`
3. `rubric.json`

Keep them mutually consistent: every checklist title must be implied by
instruction; every must-have rubric positive should map to instruction +
checklist coverage.

---

## Step 1 — Clear the good-application bar

Before drafting prose, confirm the app will stress client state without a
backend. Require all of:

| Bar | Why |
|-----|-----|
| Primary collection with create, edit, delete | Proves shared mutable state, not a static table |
| At least two distinct views / interaction modes | Forces view state + in-app switching |
| Domain state beyond CRUD (status, filters, roles, priority, bulk, etc.) | Separates real apps from form demos |
| No backend / no auth APIs | Keeps the eval frontend-only |
| No `localStorage` / `sessionStorage` / browser storage APIs | Persistence must live in the stack store (in-memory only) |

Adapt the primary collection to the domain (Users, presets, events, expenses,
palettes, etc.). Do not force a Users module onto every task.

---

## Step 2 — Pick stack A–L and write summary

`<summary>` is exactly one plain-text line:

```text
Build a [application name] using [framework], [state], and [styling].
```

| Stack | Framework | State | Styling |
|-------|-----------|-------|---------|
| A | React | Zustand | Tailwind CSS |
| B | Vue 3 | Pinia | Tailwind CSS |
| C | React | Redux Toolkit | Tailwind CSS |
| D | Svelte | Svelte stores | Tailwind CSS |
| E | React | Zustand | CSS Modules |
| F | Vue 3 | Pinia | UnoCSS |
| G | Solid.js | Solid stores | Tailwind CSS |
| H | React | Jotai | Tailwind CSS |
| I | Preact | Signals | Tailwind CSS |
| J | Angular | NgRx | Angular Material |
| K | React | Zustand | Styled Components |
| L | Qwik | Qwik stores | Tailwind CSS |

Name the state library only in `summary` and `requirements` (stack bullet +
contracts). Agents already know the stack from the summary line; repeating
library names in every feature bullet encourages name-dropping over shared state.

---

## Step 3 — Author `instruction.md`

### Section contract

Use these XML tags in order:

1. `summary`
2. `core_features`
3. `visual_design`
4. `motion`
5. `requirements`

**Plain text inside sections.** No markdown bold, italics, or backticks. XML
tags wrap the sections; body copy stays readable as plain sentences and dashes.

### `core_features`

Every line is an OBSERVABLE BEHAVIOR: an action or state plus the evidence a
browser judge can confirm ("Clicking X swaps Y without a full page reload"),
never a component inventory ("X view: A, B, C"). Resolve quantifiers
explicitly — "at least 8 seeded rows" must say where, when, and whether
pagination counts as reachable. Product behavior only:

- Shell / chrome / navigation density when browser-visible
- Primary CRUD collection and fields
- Additional views and what each shows
- Domain behaviors (filters, badges, bulk, empty states)
- Zero outbound navigation / no backend

Never name Zustand, Pinia, Redux, Jotai, NgRx, Signals, etc. here.

Capture composition density (asymmetric mosaics, table anatomy, nav group
counts, panel contents) — not title-only inventories. Browser-only judges cannot
infer mosaic asymmetry from “KPI cards” alone.

### `visual_design`

Layout composition, density, theme surfaces, badge treatments, responsive shell.
Describe what must be visible, not CSS class names.

### `motion`

Include required hover feedback on interactive chrome (buttons, rows, nav).
Add other short motions that match the product (theme swap, popovers, drawer).
Hover omission is a common false “done” — call it out explicitly.

### `requirements`

Put stack + behavioral state contracts here:

- Shared state must use the stack state library named in summary (in-memory only)
- Explicit contracts for create / edit / delete / domain updates / filters / view / theme
- Forbid localStorage, sessionStorage, and other browser storage APIs
- Seed sizes, validation, empty states, library allowlists, responsive rules

---

## Step 4 — Write `verifier_checklist.json`

Shape:

```json
[
  { "id": "1", "title": "On load, ..." },
  { "id": "2", "title": "After ..., ..." }
]
```

Rules:

- Browser-observable only (text, counts, badges, views, theme flip, hover wash)
- Prefer titles starting with `On load`, `After`, or `When`
- Target ~10–14 items covering: seed, create, count delta, domain state change,
  edit, delete, empty state, invalid create, filter (or equivalent), multi-view
  switch, chrome (e.g. theme), hover
- No implementation details (`Zustand store key`, file paths) unless the outcome
  is literally visible in the page (e.g. `data-theme`)

---

## Step 5 — Write `rubric.json`

Each item:

```json
{
  "id": "1.1",
  "title": "...",
  "annotations": {
    "type": "positive hli verifier",
    "importance": "must have",
    "criterion": "Core Features"
  }
}
```

`annotations.criterion` must be exactly one of:

- `Core Features`
- `Visual Design`
- `Motion`
- `Technical Implementation`

`annotations.type` is `positive hli verifier` or `negative hli verifier`.
`importance` is `must have` or `nice to have`.

Include at least:

Every dimension must keep at least one positive AND one negative criterion —
packaging enforces this (`verify_polarity`).

**Positives:** checklist pass; no `console.error` / unhandled rejections; CRUD
works; ≥2 views; domain state beyond CRUD; shared-state coherence (a change made
in one view is immediately reflected everywhere it appears, without reload); no
browser storage (localStorage/sessionStorage stay empty after exercising the
app — this IS browser-observable); hover present; distinctive visual contract
for the domain.

**Negatives:** static HTML list with no working CRUD; outbound `<a href>` chrome;
`localStorage` / `sessionStorage`; collection only in component-local state;
missing hover washes; domain-specific layout fails (e.g. equal-width stack when
asymmetric mosaic is required).

NEVER write criteria that assert internal implementation ("uses Redux Toolkit",
"Implemented with React + Tailwind") — a browser judge cannot verify them and
they were purged repo-wide. Technical Implementation rows must stay observable:
shared-state coherence across views, empty browser storage, reload returning to
seeded state. Stack enforcement lives in `requirements` (builder-facing), not in
judge criteria.

Criteria that grade an animation, transition, or gesture must require the REAL
UI control path (click the theme toggle, press-and-hold the button) — judges
with WebMCP state tools would otherwise snap the state and falsely observe no
animation.

---

## Step 6 — Consistency pass

1. Summary stack matches requirements stack bullet
2. No state-library names in `core_features`
3. No localStorage / sessionStorage anywhere in the three files
4. Every checklist title is grounded in instruction
5. Rubric criteria use the four exact strings above
6. Instruction stays plain text (no `` ` `` or `**`)

---

## Anti-patterns

- Title-only feature lists without panel/layout anatomy
- Putting Zustand/Pinia in every `core_features` bullet
- Persistence via browser storage “for convenience”
- Checklists that inspect source files instead of the running UI
- Rubric criteria typos (`core features`, `Tech Implementation`)
- Markdown formatting inside instruction sections
- Stack-identity criteria ("uses Zustand") — unobservable, banned
- Animation criteria satisfiable via a state shortcut instead of the gesture
- Ambiguous quantifiers ("8 rows visible") that judges can read two ways
