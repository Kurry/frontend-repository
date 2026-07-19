---
name: instruction-migrate
description: >-
  Migrate a frontend eval task's instruction.md to the extended-kit corpus shape
  defined in docs/instructions.md and docs/distribution.md — Tailwind 4.3.2,
  assigned component library, animation/icon/forms-with-schema mandates, domain
  libraries, and delivery modes. Use whenever asked to migrate, upgrade, rewrite,
  or "bring to the new shape" any tasks/frontend-*/instruction.md, apply the
  distribution plan to a task, or add the new kit (component library, motion
  stack, icons, forms) to an existing task instruction — even if the request
  only names the task slug.
---

# Migrate a task instruction.md to the extended-kit shape

You are rewriting the builder-facing PRD of one eval task so it carries the task's full assigned kit and the corpus mandates, without changing what the app *is*. The product behaviors stay; the stack contract and the kit-driven observable behaviors are what change.

## Inputs to read first (in this order)

1. `docs/distribution.md` — find the task's row (search the slug without the `frontend-` prefix). It gives you: post-migration framework (bold = framework changed), delivery mode (Next.js/Nuxt/SvelteKit/Astro, if any), component library, animation stack, domain libraries (rich text / data viz / calendar / table / virtual list), icons, and the per-framework defaults table for icons + forms. Also read the "Corpus-wide mandates" section — all nine apply to every task.
2. `docs/instructions.md` — the template contract: section order, plain-text rules, what belongs in each section. You mostly need "Global Authoring Rules", "Corpus-wide kit mandates", and the section definitions for `<summary>`, `<core_features>`, `<motion>`, `<requirements>`.
3. `docs/rubrics.md` — not just for verifiers: its dimension definitions and criterion patterns are the target vocabulary for instruction lines too. When you add an observable behavior, write it so a criterion could quote it — the behavioral flow patterns (§14: multi-facet reload round-trips, sort-reversal, derived-view sensitivity, cross-view echo, count deltas) are exactly the shapes your added flow lines should take, and the dimension definitions tell you which section a promise belongs in.
4. The task's current `instruction.md` — everything you keep, reshape, or extend.

If the task has no row in distribution.md, stop and report that instead of inventing a kit.

## What changes and what must not

**Rewrite:**
- `<summary>` — one plain-text line: `Build a [same app] using [framework], [state library], Tailwind CSS 4.3.2, and [component library].` Keep the app identity verbatim from the old summary. If distribution assigns a delivery mode, name it as the framework flavor (e.g. "using Svelte 5 with SvelteKit static delivery, Svelte stores, Tailwind CSS 4.3.2, and Bits UI"). Component library `none` rows (games): omit the component-library clause entirely.
- `<requirements>` — rewrite the stack/tooling bullets to the new kit; keep every behavioral state contract that still applies. The requirements must name: the state library and the in-memory rule (or the task's PRD-mandated localStorage rule — never flip a task's persistence genre), Tailwind CSS 4.3.2, the component library and what it's used for (dialogs, tables, selects, toasts...), the animation allowlist ("X and Y allowed for animation; no other animation libraries"), the icon package ("Z icons only"), the forms contract ("all forms validate through a schema; inline per-field errors before submit"), any domain libraries, and "All libraries installed via npm and bundled locally; no CDN imports."

**Extend (add lines, keep existing ones):**
- **User flows with state tracking — the hardest part, do not shortcut it.** The instruction must carry at least two explicit end-to-end flows written as chains where every step names its state evidence: "After creating X, the list count increases by exactly one, the KPI strip updates, and switching to [other view] shows the same X without a reload." Each flow tracks state across three surfaces minimum (the acting view, a derived surface like counts/badges/charts, and a second view or a reload per the task's persistence genre). If the task uses the `<user_flows>` section, put them there; in the six-section shape, weave them into `<core_features>` as flow chains rather than isolated single-action lines. The state-tracking contract in `<requirements>` backs them: one shared store, cross-view echo without reload, reload returning to the genre's baseline (seeded for in-memory; persisted where the PRD mandates storage).
- `<core_features>` — add observable lines for each assigned domain library's ask, library-anonymously: table assigned → a column-sort round-trip line; virtual list → smooth scrolling through the seeded large collection; calendar → drag an event to a new slot; rich text → a formatting round-trip (bold on → rendered → toggled off) and working undo; charts → the chart's rendered output changes when its inputs change; forms → inline per-field validation naming the field, submit disabled until valid.
- `<motion>` — ensure the microinteraction mandate is expressed: list add/remove/reorder animates, toasts/feedback have motion, hover feedback stays explicit. Where the row assigns celebration effects, add one line tying the effect to the real winning action. Meta-framework rows: add the delivery-mode lines (no hydration errors in console on any route; deep-linking a route renders the same view as in-app navigation).

**Never touch:**
- `<integrity>`, `<delivery>`, `<webmcp_action_contract>` (including `<module_spec>` blocks) — byte-identical. These are generated/contract plumbing.
- `<reference_screenshots>` — keep as-is unless the framework changed; screenshots still describe the target UI.
- The app's identity, seed sizes, view inventory, and domain behaviors — migration adds a kit, it does not redesign the product.

## Register rules (these are graded by the validator)

- Plain text inside sections: no `**`, no `#`/`##`, no backticks, no markdown links. Dash lists and plain sentences only.
- Library names appear ONLY in `<summary>` and `<requirements>`. Behavior lines in `<core_features>`/`<motion>`/`<visual_design>` describe observable results ("reordering a row animates it to its new position"), never tools ("AutoAnimate animates the list").
- Every added line is an observable behavior: action → browser-visible evidence, quantifiers resolved.
- All tags closed, canonical order preserved (summary, reference_screenshots, core_features, visual_design, motion, requirements, integrity, delivery, webmcp_action_contract — skip sections the task doesn't have).
- Framework-changed tasks (bold rows): update stack-specific phrasing everywhere it leaks (e.g. "Redux Toolkit slices" in requirements), but do not translate the product.

## Workflow

1. Read the three inputs. Write down the task's kit as a checklist before editing.
2. Rewrite/extend the instruction in place (or at the requested output path).
3. Run the validator and fix everything it reports:

```bash
python3 .claude/skills/instruction-migrate/scripts/validate_migration.py \
  <path/to/new/instruction.md> --original <path/to/original/instruction.md> --slug <task-slug>
```

The validator checks: tag closure and order, no markdown inside sections, protected sections byte-identical to the original, Tailwind 4.3.2 named in summary or requirements, no library names inside behavioral sections, and (informational) which kit terms from the distribution row appear. Treat FAIL lines as bugs in your edit, not in the validator.

4. Report: the kit you applied, the lines you added per section, and the validator output.
