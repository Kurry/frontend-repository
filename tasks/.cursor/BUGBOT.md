# Bugbot rules — tasks/ (per-task eval content)

Included when a PR touches any `tasks/frontend-<slug>/` path.

## Task anatomy (what belongs where)

- `instruction.md` — the builder-facing PRD. Content sections (`<summary>`,
  `<core_features>`, `<visual_design>`, `<motion>`, `<requirements>`) must be observable
  behaviors; protected sections (`<integrity>`, `<delivery>`, `<webmcp_action_contract>`,
  `<reference_screenshots>`) are contract/plumbing. Flag: markdown formatting inside
  `<reference_screenshots>`; library/brand names or unresolved quantifiers ("many",
  "several") in behavioral sections; any mention of judge/verifier/probe/grading;
  denied brands (Anthropic, OpenAI, OpenRouter, Harbor, Mercor, ProgramBench).
- `solution/app` — the oracle. Must build (`verify:build`), serve on port 3000 with ZERO
  console/page errors, and register the WebMCP tools its instruction contract mandates.
- `tests/<dim>/<dim>.toml` — 13 dimensions exactly (core_features, visual_design, motion,
  technical, user_flows, edge_cases, responsiveness, accessibility, performance, writing,
  innovation, design_fidelity, behavioral). Criterion descriptions must be
  browser-observable; internal-implementation claims ("uses Redux") are banned. A
  `negate = true` criterion states the bad condition as PRESENT. Only ADD criteria.
- `environment/reference-screenshots/` — capture-harness output; never hand-edited,
  never deleted in a fix PR.

## Oracle-fix review focus

- Cross-check each claimed criterion fix against the actual code change: does the diff
  plausibly change the observable behavior the criterion names? Flag fixes that only
  touch test-adjacent affordances (data-testids, timing hacks, autocomplete=off) without
  changing user-visible behavior — unless the PR body justifies why the affordance IS the fix.
- Motion/animation criteria require the real UI control path; flag "fixes" that snap
  state via WebMCP or JS shortcuts instead of animating.
- Accessibility fixes should be structural (labels, roles, focus management), not
  aria-hidden sprinkled to silence checks.
- Seed/demo data must stay brand-clean (no Anthropic/OpenAI/Harbor/etc. — use invented
  vendor names) and consistent with any rubric criteria that quote it.

---

# Deep-review protocol for task PRs (mandatory — a review without these outputs is incomplete)

1. **Load the ground truth first.** Before judging any fix claim, read the task's actual
   rubric text: every `tests/<dim>/<dim>.toml` criterion the PR references (and the whole
   dimension when a claim is vague), plus the relevant `instruction.md` sections. Judge
   claims against the criterion's literal wording — not the PR's paraphrase of it. A fix
   that satisfies the paraphrase but not the criterion text is NOT a fix (e.g. a
   criterion expecting a regenerated `exportedAt` stamp is violated, not satisfied, by
   making the stamp stable).
2. **Determine the genre before applying rules.** good-app (no storage), website-fidelity
   (pixel/brand fidelity is itself the spec), hard browser app/game, or framework rebuild
   — the README genre list + instruction.md tell you. Several rules invert by genre.
3. **Trace, don't trust.** For each claimed fix: locate the hunk; walk the code path from
   user action to observable result; state what a user would now see. For WebMCP-adjacent
   changes: trace tool handler → store mutation → rendered view to confirm same-state.
4. **Criterion-coverage table.** Output a table of every criterion the PR claims
   (rows) × columns: criterion's literal requirement, implementing hunk (file:line),
   traced observable outcome, verdict (confirmed/plausible/not-demonstrated/contradicts).
5. **Reward-file cross-check (judge PRs).** Parse the committed reward-details.json and
   diff its criterion list against the toml files IN THIS PR's HEAD; recompute the
   weighted means; partition all 1.0s (diff-supported / observation-reasoned /
   unsupported); list unsupported ones individually.
6. **Media audit.** Open every file under solution/app/testing/ touched or referenced:
   state what each actually shows and which criterion it evidences; flag mismatches,
   mp4s, and auto-generated filenames.
7. **Full-diff sweep last.** After the claimed items, list every remaining hunk and
   classify it: supporting change / undeclared behavior change / scope violation.
