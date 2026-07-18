A web app is running at http://localhost:3000. Grade it ONLY by what you observe in a real
browser — do NOT read or rely on the source code. Two tool surfaces are connected, with
distinct jobs: the webmcp tools (webmcp_session_info / webmcp_list_tools /
webmcp_invoke_tool) DRIVE state-changing setup steps through the app's own registered
actions, and the Playwright MCP browser OBSERVES results (snapshots, screenshots, DOM
checks) and performs any interaction a criterion grades mechanically. Your FIRST tool
call after the app loads must be webmcp_list_tools; from then on, whenever a setup step
(navigate views, create/edit/delete records, filter/sort) matches a registered tool,
invoke that tool instead of clicking through the UI. Use your judgment on when visual
verification is needed: a criterion's verdict must rest on something you observed
(PASS rule), but intermediate setup steps do not each need a snapshot — trust the
tool's return value, run a whole setup sequence, and observe once at the point the
criterion is actually decided. Prefer a targeted browser_evaluate over a full
snapshot when you only need one element's state. NEVER use a WebMCP tool for a step whose gesture, animation, or
transition the criterion itself grades — a state tool bypasses the animating control
(e.g., a criterion grading the theme toggle's swap animation requires clicking the
toggle; invoking a theme tool would snap the state and falsely show no animation).
Section 9 has the full policy.

What you are grading: the app under test was rebuilt from scratch by an agent that could
only observe an opaque reference application through its browser UI. That reference
application is NOT available during grading — do not look for it, and do not treat its
absence as missing evidence. Each criterion below encodes behavior that was observed in
the reference; the criterion text is the full specification. Grade the rebuilt app
against the criterion text alone.

Behavioral equivalence (implementation-agnostic grading): judge only externally
observable behavior in the browser. Never penalize internal structure, code
organization, or chosen component patterns; never penalize divergence from any imagined
"original" beyond what the criterion states; and never demand pixel-perfection a
criterion does not ask for. Do not penalize harmless differences in decorative copy,
placeholder imagery, icon glyphs, minor spacing, or debranded names/logos unless the
criterion makes those exact details material.

PASS rule (applies to every criterion, so individual criteria need not repeat it): Score a
criterion "yes" ONLY if you directly observe it fully satisfied in the browser; when unsure
or unable to observe it, score "no".

Negated criteria (anti-cheat and similar checks phrased as a bad condition to detect, e.g.
"the DOM contains a hidden element that leaks state"): "satisfied" means the described bad
condition IS present. Answer "yes" only if you directly observed that condition; answer
"no" if you did not find it. Before finalizing a negated criterion's answer, re-read the
reasoning you just wrote and confirm the yes/no you are about to output matches that
reasoning's conclusion exactly — if your reasoning concludes the app is clean of the
described condition, the answer is "no", never "yes".

This same discipline applies to every criterion, not just negated ones: before finalizing
ANY criterion's answer, re-read the reasoning you just wrote and confirm the yes/no you
are about to output actually follows from it. Two shapes of this mismatch are common
enough to name explicitly. Self-scoping / conditional criteria (phrased "Where the app
offers/supports/renders X...") pass vacuously when X is genuinely absent — if your own
reasoning concludes X is absent, score "yes" unless the criterion's own text states an
explicit fail branch for that case; do not score it "no" merely because the described
content class doesn't exist. And the render gate below is a whole-app judgment, not a
per-feature one — if your reasoning affirms a specific criterion is satisfied on its own
terms, only let the render gate override that to "no" when the app is globally unusable,
not because of an unrelated broken feature elsewhere.

Render gate (overrides every "pass by default" / not-applicable fallback in any
criterion): if the app fails to serve, renders a blank or error page, or is so
broken that NO meaningful UI can be reached and interacted with AT ALL, score
EVERY criterion "no". This is a whole-app judgment, not a per-feature one: a
crash or dead control confined to one workflow path does not trigger the
render gate for criteria that don't depend on that path and that your own
trajectory already reached and observed working — score those on their own
merits instead of zeroing them by association with an unrelated failure.
Pass-by-default clauses apply whenever the app is otherwise rendering and
usable but genuinely lacks the content class in question, render-gate or not.

Completion / anti-cheat rule: A criterion passes only after you complete the requested
workflow end-to-end in the live browser. Static mockups, pre-seeded demo states, hardcoded
"success" labels, screenshots without live interaction, source-code claims, partial flows,
and behavior that only works for the first click/input are failures. If the requested
control, edge case, persistence check, or end state cannot be reached and verified, score
"no". A criterion's precondition must be satisfied via the visible UI a real user would
use — using `browser_evaluate` to write directly into a hidden duplicate DOM element
(rather than operating the actual broken visible control) does not satisfy it; if the
only way to reach a precondition is such a workaround, the precondition was not met and
the criterion should fail. The app must also be self-contained at http://localhost:3000:
an app that proxies, iframes, embeds, redirects to, or fetches implementation data from
another origin is not a reconstruction. Content that fails to render because it depends
on an unreachable external host is graded as the failure you observe — a self-containment
failure of the app, not a network hiccup to excuse.

How to grade reliably (shared judge policy):

1. Silent planning
Before the first interaction, silently classify the criteria in this batch by:
- initial state or precondition;
- current page, view, tab, or dialog;
- data that must be created before evaluation;
- destructive actions such as delete, reset, clear, or undo;
- reload or persistence requirements;
- desktop, tablet, or compact viewport;
- transient states such as toast, validation, animation, loading, or timer;
- pointer, keyboard, drag, upload, or canvas interaction; and
- visual-pixel evidence versus DOM/state evidence.
"Silently" is normative: do not emit a prose work plan. Organize actions in reasoning
without adding progress text to the persistent context.

2. Default execution order
Unless criterion dependencies require a different order, use:
1. Navigate, wait, and establish that the app renders.
2. Grade static initial-view criteria.
3. Grade criteria that share the primary creation or interaction workflow.
4. Grade criteria about the resulting state.
5. Extend that state into reload and persistence checks.
6. Perform edit, delete, reset, undo, and other destructive checks.
7. Group exact-viewport criteria by viewport and resize once per group.
8. Restore state or viewport only if an ungraded criterion requires it.
This ordering is a default, not a scoring heuristic. The criterion text remains the
authority. Prefer `browser_evaluate` for objective DOM/style/state checks when visual
pixels are not decisive. Observe transient / auto-dismissing UI (toasts, banners,
validation flashes) immediately after the triggering action — before extra round-trips
that let it expire.
Viewport discipline: before judging ANY layout, composition, or density criterion,
resize to a desktop viewport (at least 1280x800) and confirm the size with
`browser_evaluate` (window.innerWidth) — a narrow default viewport legitimately
collapses responsive layouts into single-column stacks and will produce false
failures. Judge compact-viewport behavior only for criteria that explicitly ask
for it.
Delta isolation: when a criterion asserts a count or state change ("adds exactly
one row", "does not increase the total"), measure the baseline IMMEDIATELY before
the triggering action and re-measure immediately after it. Never compare against
page-load state or totals remembered from earlier criteria — records you yourself
created while grading other criteria will otherwise contaminate the delta and
produce false failures.

3. Snapshot policy
Use an action-returned snapshot when it already describes the current page. Request an
explicit `browser_snapshot` only when:
- the previous tool response did not contain a usable current snapshot;
- an element reference is stale;
- the next action requires a reference that is not present; or
- the page structure itself is decisive evidence.
Do not take another snapshot merely because an action occurred. In particular:
- `browser_click` returns a current snapshot → use it; do not immediately call
  `browser_snapshot`
- `browser_evaluate` only reads styles or state → do not call `browser_snapshot`
- `browser_click` returns no structure and the next click needs a new ref → call
  `browser_snapshot`

4. Screenshot policy
Every verdict must retain reviewable screenshot evidence. At least one decisive artifact
must be referenced by each criterion — not necessarily one new file per criterion.
A screenshot may support more than one criterion only when all of the following are true:
- the application state did not change between the observations;
- the viewport is the same;
- every cited fact is visible or corroborated in that state;
- no criterion requires a before/after comparison; and
- transient evidence has not disappeared.
Use the first criterion ID plus `-shared` as the filename (e.g. `TASK-FUNC-001-shared.png`).
Each applicable reasoning entry cites the same exact filename. Do not share a screenshot
across different viewport sizes, materially different states, or criteria whose decisive
evidence is not represented in the image.

5. Image read-back policy
Taking a screenshot and reading its pixels back into context are separate decisions.
Read the image when the criterion depends on visual pixels, including hierarchy,
composition, spacing, alignment, clipping, color, contrast, typography, visual-state
distinctions, canvas/chart appearance, responsive composition not established by
objective bounds, or a mismatch between DOM evidence and visible rendering.
Do not read the screenshot when the verdict is already established through browser state
and the image exists only for audit (element presence/text in a snapshot; disabled/
selected/checked/expanded state; numeric counters or field values; persistence before/
after reload; console or network results; computed properties from `browser_evaluate`).
Never read the same image twice. Reuse the existing visual observation when several
criteria cite the same screenshot.

6. Retry and recovery policy
Permit one retry only for:
- a stale element reference after taking a fresh snapshot;
- an explicit Playwright transport/tool error; or
- a documented transient load wait that has not yet reached its allowed timeout.
Do not retry or route around: an application-level crash; a dead documented control; a
validation failure produced by the app; a genuinely missing feature; or a path that only
works after reload when the criterion does not ask for reload. When evidence remains
ambiguous after the allowed observation, score the criterion "no".

7. Render-gate procedure
For a globally unusable app:
1. Navigate to http://localhost:3000.
2. Wait once for normal load completion.
3. Take one confirming snapshot.
4. If no meaningful UI is reachable, stop exploration and return "no" for all criteria
   with the shared render-gate evidence.
This does not apply to one broken workflow inside an otherwise usable app. If the browser
cannot be launched or the app cannot be reached, score conservatively ("no").

8. Compact communication
Avoid progress narration between tools. Final criterion reasoning remains specific but
compact:
```text
<yes/no> — <action and decisive observed result>.
Evidence: <screenshot filename>
```
One to three sentences are expected. Longer reasoning is allowed only when a criterion
needs multiple observations or an ambiguity must be explained.

9. WebMCP-first workflow driving
The app under test registers in-page WebMCP tools per the instruction's
`<webmcp_action_contract>`. Discover them once after the app loads: if the
webmcp MCP tools are connected, call `webmcp_session_info` and
`webmcp_list_tools`; otherwise — including when no webmcp tools appear in your
tool list — discover and invoke
the same surface through Playwright `browser_evaluate` against the page:
`window.webmcp_session_info()`, `window.webmcp_list_tools()`, and
`window.webmcp_invoke_tool(<name>, <args>)` (equivalently `window.webmcp.*`).
An absent surface after one probe means the app skipped the contract — fall back
to UI interaction for everything and do not probe again.
For every state-changing SETUP step a criterion needs —
navigating between views, creating/editing/deleting records, applying filters or
sort — first check the registered tools; when one covers the
step, drive it with a single invoke (`webmcp_invoke_tool`, or one
`browser_evaluate` of `window.webmcp_invoke_tool(...)`) instead of a multi-step
Playwright click/type/submit cycle. One invoke replacing a whole form workflow is
the intended efficiency path — prefer it whenever the criterion only cares about
the resulting state, not the gesture. Batch your verification: trust invoke
return values while setting state up, and observe visually once where the
criterion is decided (snapshot, screenshot, or a targeted browser_evaluate —
whichever is the cheapest sufficient evidence).
Use direct Playwright interaction for a step only when (a) no registered tool
covers it, (b) the criterion grades the UI interaction mechanics themselves
(form validation feedback, hover states, drag, keyboard handling, animations), or
(c) you are double-checking a failure first seen through WebMCP.
Hover and pointer-feedback criteria have a fixed evidence method: hover the real
element (browser_hover), then read getComputedStyle on it while the pointer is
still over it, and compare against its resting computed style. Never decide a
hover criterion from screenshots alone — captures may not preserve the transient
hover state, and a missing wash in a screenshot is not evidence of a missing
hover style.
WebMCP output never replaces visible browser evidence and never independently
changes a verdict; evidence still comes from Playwright observation. WebMCP is
not a scoring criterion, and missing or failed WebMCP is not a scoring failure —
fall back to Playwright and grade from the UI.

Judged criteria are tiered: `must_have` criteria are backed by the task's product
requirements, which encode observed reference behavior, while `nice_to_have` criteria
(weight ≤ 0.5) capture generic professional-quality expectations
(accessibility, feedback states, empty states, responsiveness, and similar polish) that
are legitimately not spelled out in the PRD. Grade a `nice_to_have` criterion against
general UI/UX quality conventions, not against the PRD text — do not fail it merely
because the PRD never mentions it.

{criteria}
