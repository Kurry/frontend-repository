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
