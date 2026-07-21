# PRODUCTION GATE CONTRACT — read first

**Your approval is the ONLY gate to production.** This repository has no CI: no build
runs, no tests execute, no linter fires on PRs. Nothing stands between a merged defect
and the production eval corpus except this review. Operate accordingly:

- **Default-deny posture.** Approve only when every requirement below is affirmatively
  demonstrated — absence of found bugs is NOT approval-worthy if verification evidence
  is missing or the review could not establish a claim. When uncertain, file a BLOCKING
  Bug stating exactly what evidence would clear it; never resolve uncertainty in the
  PR's favor.
- **Approval bar (all must hold):**
  1. Every "This PR must" checklist item is confirmed or plausibly demonstrated in the
     diff, with file:line evidence recorded in your review.
  2. No undeclared significant changes (hunks outside the checklist) remain unexamined.
  3. All scope rules hold (oracle PRs touch only their solution/ tree; no generated-file
     hand-edits; no rubric criterion deletions/renumbers).
  4. Every triggered rule in the catalog below has been evaluated and its procedure run.
  5. The Verification contract's claims are consistent with the diff (build viability,
     zero-console reachability, WebMCP surface intact).
  6. For oracle-judge PRs: the reward-file audit procedure passed — no fabricated or
     unevidenced scores.
- **Severity taxonomy.** BLOCKING = would corrupt the corpus, the judging pipeline, or
  ship a false quality signal (fabricated scores, scope violations, contract
  regressions, security, broken build, deleted criteria). Non-blocking = quality debt
  that cannot silently corrupt (naming, redundancy, hygiene). When severity is
  arguable, choose BLOCKING.
- **Exhaustiveness.** Enumerate EVERY occurrence of a flagged pattern — never sample,
  never "e.g.". Long diffs do not lower the bar: a 200-file PR gets the same per-file
  rigor as a 2-file PR. Spend the compute; that is your job in this pipeline.
- **Adversarial stance.** Assume the PR author (human or agent) optimized for the
  appearance of passing review. Actively look for: test-affordance-only fixes, feature
  removals dressed as fixes, self-scored perfection without evidence, scope smuggling
  inside vendored/generated files, and checklist items worded to sound like their own
  verification.
- **Verdict summary.** End every review with a table: checklist item → verdict
  (confirmed / plausible / not demonstrated) → evidence. Then the explicit statement
  "GATE: PASS" or "GATE: FAIL — <n> blocking findings". A review without this summary
  is incomplete.

---

# Bugbot rules — frontend-repository (project-wide)

This repo is a corpus of 65 active frontend Harbor eval tasks (`tasks/frontend-*`) plus 38
quarantined ones (`tasks-quarantine/`). Each task ships a PRD (`instruction.md`), an oracle
reference app (`solution/app`), and 13 LLM-judge rubric dimensions (`tests/<dim>/<dim>.toml`).
Tooling lives in `packages/corpuscheck` and `packages/webmcp-contracts`.

## Review the PR against its own checklist

Every PR body must contain a "This PR must" checklist and a "Verification contract"
(see CLAUDE.md "Pull request messages"). Verify the DIFF delivers each checklist item;
flag any item the diff does not plausibly address, and any significant diff change the
checklist never mentions. A PR with a thin body (no checklist) is itself a defect.

## Scope rules (hard)

- Oracle-fix / oracle-polish / oracle-judge PRs may modify ONLY files under
  `tasks/<slug>/solution/` (the app, `reward.json`, `reward-details.json`, `app/testing/`
  media, `app/JUDGE_REPORT.md`). Flag ANY change to `tests/`, `instruction.md`,
  `task.toml`, `environment/`, another task, or repo tooling inside such a PR.
- Never accept edits that weaken or delete rubric criteria (`tests/<dim>/<dim>.toml`):
  criterion ids are provenance — criteria may be ADDED, never renumbered or deleted.
- These files are GENERATED from canonical templates and must never be hand-edited in a
  task PR: `tests/test.sh`, `tests/system_prompt.md`, `tests/webmcp_stdio_server.mjs`,
  `tests/reward.toml`, `tests/playwright_rm_config.json`, `environment/Dockerfile`,
  `environment/entrypoint.sh`, `environment/webmcp_stdio_server.mjs`, `task.toml`,
  both README.md files. Drift is repaired via `uv run corpuscheck propagate`, not by hand.

## Oracle app requirements (flag violations visible in the diff)

- Apps are frontend-only SPAs: `npm run verify:build` must stay valid; `npm start` serves
  on port 3000. No new network calls to CDNs or external hosts (all deps bundled/local).
- Good-app genre tasks must NOT use localStorage/sessionStorage/IndexedDB (in-memory state
  only). Website-fidelity and framework-rebuild genres may keep storage their PRD mandates.
- The WebMCP surface (`window.webmcp_session_info` / `webmcp_list_tools` /
  `webmcp_invoke_tool`) must remain registered and its tools must keep mutating the SAME
  state the UI renders. Flag removals or stubbing of webmcp handlers.
- Videos/screen recordings must be WebM (VP9). Flag any committed `.mp4` — the grading
  browser cannot decode h264.
- Flag feature REMOVALS dressed as fixes: deleting a failing feature instead of repairing
  it (e.g. removing an export mode, dropping a keyboard shortcut, hiding a broken panel).

## Reward files are self-assessments — audit them

`solution/reward.json` and `solution/reward-details.json` in oracle-judge PRs are the
session's own graded claims, not verifier output. They are intentional review evidence:
do not request their deletion and do not flag their presence by itself. Audit their
contents instead. Flag: (a) all-1.0 scores with little or no corresponding app diff;
(b) criteria marked 1.0 whose `reasoning` describes code inspection rather than a
browser observation; (c) reward-details that omit dimensions or criteria present in
`tests/`; (d) snapshots older than the newest app commit in the PR — if code changed
after the snapshot was generated, the scores no longer describe the PR's HEAD and must
be regenerated (pairs with the Review lifecycle rule below). Fabricated scores are an
anticheat-class defect.

## Build-output policy

Do not accept a newly committed `solution/app/dist/` or `solution/app/build/` merely as
review evidence. Keep build output only when the app's committed `npm start` command
actually serves that directory (for example, `vite preview` or `http-server dist`) and
the task therefore requires it at runtime. When `npm start` serves source through a dev
server, generated build output is duplicate/stale-prone and must stay uncommitted.

## Verification media

Fix/polish/judge PRs should include screenshots (and WebM recordings for motion claims)
under `solution/app/testing/` with descriptive names. Flag PRs claiming visual/motion/
accessibility fixes with no committed evidence.

## Review lifecycle

A PR is merge-ready only after Bugbot has reviewed its current HEAD. If the latest
Bugbot run predates any code, artifact, or conflict-resolution commit, require a fresh
run via a PR comment such as `cursor review` or `bugbot run`; findings from an older
diff do not clear the final commit.

---

# Rule catalog (conditional rules — evaluate ALL of them on every review)

For every triggered rule: add a Bug with the stated severity, include the offending
file:line excerpts, propose a CONCRETE fix (a ready-to-apply diff/snippet, not advice),
and cite the linked authoritative documentation in the Bug body. Do the deep work:
trace the behavior through the diff and surrounding code before concluding — the point
of these rules is for the reviewer bot to spend the compute so humans don't have to.

## Security / dynamic execution

- If any changed file matches /\beval\s*\(|\bnew\s+Function\s*\(|\bexec\s*\(/i:
  BLOCKING Bug "Dangerous dynamic execution". Body: where it is, why it's exploitable
  in an SPA context, and a safe rewrite (JSON.parse, lookup tables, explicit dispatch).
  Docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#never_use_direct_eval
  Label: security.
- If any changed file matches /dangerouslySetInnerHTML|\.innerHTML\s*=|insertAdjacentHTML/:
  BLOCKING Bug "Unsanitized HTML injection risk" unless the assigned value is provably
  static. Propose textContent / DOM-building / sanitizer rewrite with a snippet.
  Docs: https://owasp.org/www-community/attacks/xss/ and
  https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML#security_considerations
- If a changed file adds fetch/XHR/WebSocket to an absolute http(s) URL or a CDN host
  (unpkg, jsdelivr, cdnjs, googleapis fonts, esm.sh): BLOCKING Bug "External network
  dependency in oracle" — oracles must be fully local/bundled. Propose vendoring the
  asset. Docs: repo CLAUDE.md (npm-local/no-CDN rule).

## React / framework correctness

- For files matching **/*.{js,jsx,ts,tsx} in React apps: if a changed file contains
  /componentWillMount\s*\(|componentWillReceiveProps\s*\(|componentWillUpdate\s*\(/:
  BLOCKING Bug "Deprecated React lifecycle method". Body: "Replace with constructor/
  useEffect/derived state. See React docs." Include an autofix snippet migrating the
  side effects to useEffect (preserve dependency semantics — analyze what the method
  reads and write the correct dependency array).
  Docs: https://react.dev/reference/react/Component and
  https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html
- If /useEffect\(\s*(?:async|\(\)\s*=>\s*{[^}]*await)/ appears (async effect or
  un-cleaned subscription/interval): non-blocking Bug "Effect hygiene" with corrected
  pattern (inner async fn, cleanup return). Docs: https://react.dev/reference/react/useEffect
- If a list render adds /key={\s*(?:index|i)\s*}/ on data that can reorder: non-blocking
  Bug "Index keys on reorderable list" with stable-key fix.
  Docs: https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key
- Equivalent checks for Vue (deprecated $listeners/beforeDestroy in Vue 3 code),
  Svelte 5 (legacy $: reactivity mixed with runes), and Angular (deprecated ViewChild
  static misuse) when those frameworks appear in the diff — cite the framework's own
  migration docs in each Bug.

## State & storage (corpus invariants)

- If a changed file in a good-app genre task adds /localStorage|sessionStorage|indexedDB|document\.cookie/:
  BLOCKING Bug "Forbidden persistence in good-app task" — these tasks are in-memory
  only; reload must return the seeded baseline. Propose in-memory store rewrite.
  (Website-fidelity / framework-rebuild genres: allowed only where their PRD mandates —
  verify against the task's instruction.md before flagging.)
- If a diff removes or stubs any /webmcp_(session_info|list_tools|invoke_tool)/ handler
  or deletes a tool registration: BLOCKING Bug "WebMCP contract regression" — tools must
  keep mutating the same state the UI renders.

## Accessibility (do the full pass, not spot checks)

- If the diff adds interactive elements (<div|span> with onClick/@click) without
  role/tabindex/keyboard handlers: BLOCKING Bug "Click-only interactive element" with a
  <button> rewrite snippet. Docs: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/button_role
  and https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html
- If /aria-hidden="true"/ is added to focusable/interactive content: BLOCKING Bug
  "aria-hidden on focusable content". Docs: https://www.w3.org/TR/using-aria/#4thrule
- If a modal/dialog is added or edited without focus trap + Escape close + focus return
  (look for the actual implementation, not just claims): Bug "Dialog focus contract
  incomplete" with the missing pieces and a reference implementation.
  Docs: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- If new <img>/<svg>/icon components lack accessible names (alt, aria-label, or
  aria-hidden for decorative): Bug with per-element fix list.
  Docs: https://www.w3.org/WAI/tutorials/images/
- If new color values look low-contrast against their background (trace the CSS): Bug
  citing computed pair and WCAG AA ratio. Docs: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html

## Motion & reduced motion

- If the diff adds CSS transitions/animations or JS-driven animation without a
  corresponding /prefers-reduced-motion/ guard anywhere in the app: Bug "Reduced-motion
  gap" listing each new animation and a @media (prefers-reduced-motion: reduce) snippet.
  Docs: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- If animation is faked by instant state swap (setTimeout(0), direct style snap) where a
  criterion expects a visible transition: BLOCKING Bug "Animation snapped, not animated".
- If /\.mp4\b/ appears in committed media or <video> sources without a preceding WebM
  source: BLOCKING Bug "h264 video unplayable in grading browser" — require WebM (VP9).

## Dependencies & licenses

- If the PR modifies dependency files (package.json, package-lock.json, pnpm-lock.yaml,
  yarn.lock): run the built-in License Scan. If any new/upgraded dependency has license
  in {GPL-2.0, GPL-3.0, AGPL-3.0}: BLOCKING Bug "Disallowed license detected" listing
  package names, versions, licenses. Labels: compliance, security.
- If package.json changes without its lockfile (or vice versa): Bug "Dependency files
  out of sync" with the exact npm command to regenerate.
- If a dependency is added that duplicates an existing capability in the app (second
  date lib, second icon set): non-blocking Bug "Redundant dependency" with the existing
  alternative.

## Repo-specific structural rules

- If the diff touches both `tasks/<slug>/solution/` AND any of tests/, instruction.md,
  task.toml, environment/ in the same PR: BLOCKING Bug "Oracle PR exceeds scope".
- If any generated canonical file is hand-edited (list in the project rules above):
  BLOCKING Bug "Hand-edit to generated file" — fix goes in packages/corpuscheck
  canonical sources + propagation.
- If `solution/reward-details.json` claims 1.0 on criteria whose named behaviors have no
  corresponding change anywhere in the diff and no committed evidence under
  solution/app/testing/: BLOCKING Bug "Unevidenced perfect self-scores" enumerating the
  suspicious criteria. This is an anticheat-class finding — be exhaustive.
- If committed screenshots/recordings exist, open them: verify filenames match what the
  PR claims to demonstrate; flag mismatches.

## Review depth expectations

Never limit the review to changed lines: for each checklist item in the PR body, read
enough surrounding code to judge whether the change actually produces the claimed
observable behavior, and say so explicitly (confirmed / plausible / not demonstrated)
with file:line evidence. Every Bug must ship a potential fix (patch snippet) and at
least one authoritative source link (MDN / WCAG / framework docs / OWASP / web.dev)
supporting the recommendation.

## Comment hygiene

- If any changed file contains /(?:^|\s)(TODO|FIXME)(?:\s*:|\s+)/:
  - Add a non-blocking Bug titled "TODO/FIXME comment found".
  - Body: "Replace TODO/FIXME with a tracked issue reference, e.g. `TODO(#1234): ...`,
    or remove it."
  - If the TODO already references an issue pattern /#\d+|[A-Z]+-\d+/, mark the Bug as
    resolved automatically.
- If /console\.(log|debug)\(/ is added outside error paths: non-blocking Bug "Leftover
  debug logging" (zero-console-error requirement makes stray logs review noise). Exempt
  intentional error reporting (console.error in catch blocks with user-facing recovery).

---

# In-depth review procedures (apply per triggered category)

These deepen the catalog above. When a rule fires, run its category procedure fully and
structure the Bug with this template:

    Title: <rule title>
    Severity: blocking | non-blocking
    Where: <file:line list, every occurrence — never "e.g."> 
    What happens: <traced behavior, not the pattern match — what a user/judge observes>
    Why it's wrong here: <tie to the specific criterion / invariant / doc>
    Fix (ready to apply): <complete diff or snippet, compilable in context>
    Source: <authoritative URL(s) actually supporting the recommendation>
    Confidence: confirmed | plausible — and what you'd need to confirm

## Security procedure

1. For each dynamic-execution/injection hit, trace the data source: is every input
   reaching eval/innerHTML statically known at build time? Walk the call graph up to the
   origin (user input, imported JSON, WebMCP tool args — tool args are USER-controlled).
2. WebMCP tools are an injection surface: any tool arg that reaches DOM insertion or
   dynamic execution unsanitized is BLOCKING even if the UI path is safe.
3. In the fix snippet, preserve the original feature (e.g. rich-text preview) — propose
   the sanitizer/builder pattern, not feature removal.
4. Check the inverse too: if the PR claims an XSS/injection fix, construct the payload
   that previously exploited it and state whether the diff actually neutralizes it.

## Framework procedure

1. Identify the framework + version from package.json before applying framework rules
   (React 18 vs 19, Vue 2 vs 3, Svelte 4 vs 5 change what is deprecated).
2. For each deprecated-API hit, write the migration snippet against the APP'S actual
   code (real state names, real props), not a generic example. For componentWillMount:
   move initialization to the constructor when synchronous and pure, to useEffect(fn, [])
   when it has side effects; enumerate what the method reads to derive the dependency
   array, and say why each dependency is or isn't included.
3. Flag render-loop hazards introduced by the diff: setState/store-write inside render,
   effects with missing deps that re-fire per render, subscriptions without cleanup,
   non-memoized context values feeding deep trees. For each, show the render cascade
   (A renders → writes store → B re-renders → ...) before proposing the memo/guard fix.
4. For state stores (Zustand/Pinia/Svelte stores): flag non-serializable values (DOM
   nodes, class instances, functions) placed in stores, and mutations that bypass the
   store API — both break undo/redo and WebMCP round-trips this corpus grades.

## Accessibility procedure

1. Build the keyboard-only walkthrough from the diff: list every interactive element
   added/changed, and for each state Tab reachability, visible focus indicator, Enter/
   Space activation, Escape dismissal (for overlays), and focus destination after the
   action. Any gap = the Bug body lists the exact element and missing behavior.
2. For dialogs/menus/popovers follow the matching WAI-ARIA APG pattern page and check
   EVERY required keyboard interaction and aria attribute it specifies, not just
   focus-trap presence: https://www.w3.org/WAI/ARIA/apg/patterns/
3. For contrast: extract the actual hex pairs from the diff (including hover/disabled
   states), compute the ratio, and report numbers against WCAG 1.4.3 (4.5:1 text,
   3:1 large text/UI components). Show the math in the Bug.
4. For live feedback: verify async status changes (saves, imports, errors) are conveyed
   via an aria-live region that EXISTS IN THE DOM BEFORE the update (a region mounted
   with its message never announces). Cite: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions
5. Never accept aria-* sprinkling as a fix for structural issues — say what the
   structural fix is (native element, label association, heading order).

## Motion procedure

1. For each animation the diff adds or claims to fix, identify its trigger path (hover,
   click, scroll, mount) and verify the code path animates a PROPERTY THAT RENDERS
   (transform/opacity), not a snapped state swap; setTimeout(0)/immediate class flips
   that end at final state without transition = "Animation snapped, not animated".
2. Verify both directions: enter AND exit transitions (closing a modal by unmounting
   skips the exit animation — flag it, propose animation-end-then-unmount pattern).
3. Reduced-motion: the guard must actually disable/simplify the animation via
   @media (prefers-reduced-motion: reduce) in CSS or matchMedia checked AT ANIMATION
   TIME (not cached once at module load — a cached boolean misses toggles; this corpus
   judges with a forced-reduced-motion browser context).
4. Performance: flag animations of layout properties (width/height/top/left) on large
   surfaces; propose transform equivalents. Docs: https://web.dev/articles/animations-guide

## Reward-file audit procedure (oracle-judge PRs)

1. Parse reward-details.json; cross-check its dimension and criterion sets against the
   task's actual tests/<dim>/<dim>.toml files — missing/extra/renamed criteria are
   BLOCKING (the file must cover exactly the rubric).
2. Partition claimed 1.0s into: (a) behavior changed in this diff, (b) behavior
   pre-existing, (c) no plausible support. For (a) require the diff to plausibly produce
   the criterion's named observable; for (b) require reasoning text that describes a
   browser OBSERVATION (viewport, action, observed result — not "code implements X");
   (c) is a BLOCKING fabrication finding, enumerated criterion by criterion.
3. Check arithmetic: reward.json's value must equal the weighted mean of dimension
   scores, and each dimension score the weighted mean of its criterion values. Show
   your computation when flagging.
4. Cross-reference solution/app/testing/ media: every motion/visual/a11y 1.0 should
   have a screenshot or WebM whose filename maps to it. List unevidenced criteria.

## Checklist-vs-diff procedure (every PR)

1. Extract every "This PR must" item. For each: locate the implementing hunk(s), judge
   confirmed / plausible / not demonstrated, and cite file:line. Sum it up in a table.
2. List significant hunks NOT covered by any checklist item ("undeclared changes") —
   these get extra scrutiny, since bugbot is the only reviewer with time to read them.
3. Verify the "Verification contract" claims are consistent with the diff (e.g. if it
   claims verify:build passes but the diff edits build config, reason through whether
   the build can still succeed; if it claims zero console errors but the diff adds a
   throw path reachable on load, flag it).
