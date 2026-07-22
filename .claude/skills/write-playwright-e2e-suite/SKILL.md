---
name: write-playwright-e2e-suite
description: The canonical, mandatory protocol for authoring a Playwright e2e criterion suite for any tasks/<slug>/ in this repo. Use this BEFORE writing any e2e.spec.mjs — whether you are Jules, Codex, Cursor, a human, or any other agent. Following it prevents the exact scope violations, stale-branch corruption, and fabrication patterns that have been rejected/reworked repeatedly tonight (see: frontend-game-fandangofury branch, which touched three unrelated tasks plus shared maintainer infrastructure while claiming to only add tests for one task).
---

# Writing a Playwright e2e criterion suite

This is the single source of truth. If you are about to hand-write assertions,
invent a file layout, or "fix" something outside your task's own directory —
stop and read this first. Every rule here exists because an agent violated it
and the PR was rejected or sent back for rework.

## 0. Sync with main BEFORE you start (mandatory)

Cut your branch from, or merge into, the CURRENT `origin/main` before writing
anything. A stale branch produces a diff that appears to delete files other
PRs have since added (missing `tests/playwright_rm_config.json`, deleted
`dist/` assets from a task someone else just reinstated, reverted fixes on an
unrelated task) — this reads as active sabotage even when it's just staleness,
and it WILL be rejected. If you're resuming an old branch: `git merge
origin/main` (or rebase) first, resolve any conflicts, and re-verify before
touching anything else.

## 1. Scope: your task's `solution/app/` and NOTHING else

Touch only `tasks/<slug>/solution/app/**`. That is the entire allowed surface
for an e2e-authoring session. Specifically banned, no exceptions:

- **Any other task's files.** Not even a "drive-by fix," not even a stale
  file that looks wrong. If another task's oracle has a bug, that's a
  separate PR by a separate session.
- **`packages/corpuscheck/**` or any shared tooling/generator/CI asset.**
  These are maintainer-owned. A live example of what NOT to do: a branch
  claiming to "add Playwright tests for frontend-game-fandangofury" also
  modified `packages/corpuscheck/src/corpuscheck/assets/oracle_ci_e2e.mjs`
  and its test file — instant scope-violation rejection, regardless of how
  good the actual test content was.
- **`packages/corpuscheck/src/corpuscheck/schemas/webmcp-*.json`** (task
  registries). If a command complains your task isn't registered, that is
  EXPECTED for a task not yet accepted by a maintainer — ignore the warning,
  do not silence it by hand-editing the registry. Editing it corrupts other
  tasks' entries (observed live: an em-dash rewrite that touched ~11
  unrelated tasks) and is an instant rework-request every single time.
- **The repo root.** No helper scripts, no `fix_*.py`/`generate_*.js`, no
  loose `.txt`/`config` files, no screenshots/videos outside your task's own
  `environment/reference-screenshots/` or the one WebM inside
  `solution/app/`.

## 2. File layout: copy the canonical harness, never hand-write it

The canonical suite lives in THIS repo, already in your checkout — never
fetch, download, or ask someone to paste its contents:

```
packages/corpuscheck/src/corpuscheck/canonical/e2e/oracle.e2e.mjs
packages/corpuscheck/src/corpuscheck/canonical/e2e/e2e.playwright.config.mjs
```

Copy both **verbatim** into your task:

```
tasks/<slug>/solution/app/e2e.spec.mjs                 <- from oracle.e2e.mjs
tasks/<slug>/solution/app/e2e.playwright.config.mjs     <- from e2e.playwright.config.mjs
```

These exact filenames, this exact location. Do NOT invent your own layout
(`e2e/oracle.spec.ts` + `playwright.config.ts` is wrong — that was the
fandangofury branch's mistake and it breaks the discovery pinning oracle-ci
and the "Playwright Tests" CI workflow both rely on).

`e2e.spec.mjs` has a marker:

```js
// ==== END CANONICAL REGION — add task-specific criterion tests below. ====
```

Everything **above** the marker must stay byte-identical to the canonical
source — it provides the console-error-enforcing test fixture and the
`listTools`/`invokeTool` WebMCP helpers. Never hand-approximate this region
with your own mocked helpers; the real fixture's console-error enforcement is
exactly what a mock silently drops. Append your criterion tests **below** the
marker only.

## 3. One test per deterministic criterion, named exactly

Read every `tests/<dim>/<dim>.toml` in your task. For each deterministic
criterion, write one test:

```js
test('<criterion_id> <criterion_name>', async ({ page }) => {
  // real UI interaction, then real assertions on the criterion's
  // specific named observable
});
```

Subjective/visual criteria you genuinely cannot automate: do NOT write a test
for them at all. List their ids under a "not automatable" section in your PR
description instead. A criterion with no test and an honest note beats a
criterion with a fake test.

## 4. The ten banned patterns — checked before you commit, not after

Every one of these has been caught by review tonight, sometimes after a full
mirror round-trip that could have been avoided. Check your own suite against
this list before committing:

1. **`test.skip` / `test.fixme`** on a criterion-named test. A skipped test
   is not coverage — it's a stub presented as a pass. (One suite tonight
   shipped 139 of 140 tests as `test.fixme(true, ...)` TODO stubs with a PR
   body falsely claiming "42 passing.")
2. **Visibility-guarded assertions**: `if (await x.isVisible()) { expect(...) }`.
   If the element is missing, the test passes vacuously — exactly backwards.
   Assert directly: `await expect(x).toBeVisible()` first, unconditionally.
3. **Navigation without assertion.** A test that clicks around and asserts
   nothing proves nothing.
4. **Templated-vacuity dominance.** The same boilerplate block —
   `expect(mainCount).toBeGreaterThan(0)`, `expect(bodyText.length).toBeGreaterThan(0)`,
   `expect(x).toBeVisible()` on the page shell — repeated under many distinct
   criterion titles. A test named `images_and_icons_have_alt_text` must
   actually check `alt` attributes, not just that the page has content. A
   100% pass rate is NOT evidence this pattern is absent — vacuous tests
   always pass.
5. **Dead assertion branches.** An assertion inside a conditional the app's
   own constraints make unreachable (e.g. asserting a validation error for a
   200-character input when the field has `maxlength="160"` — that branch can
   never execute). Check what you're asserting can actually happen.
6. **Always-true negative assertions.** `expect(x).not.toHaveAttribute('data-missing-test', id)`
   where nothing in the app ever sets that attribute — always passes,
   proves nothing. A negative assertion only counts if there's a real code
   path that could produce the state you're asserting is absent.
7. **API-shape-only assertions.** `expect(locatorOrHandle).not.toBeNull()` on
   a Playwright locator/handle wrapper — the wrapper object is NEVER null
   regardless of whether the underlying element exists. Assert the actual
   DOM/focus state instead (`toBeVisible()`, `toHaveAttribute(...)`,
   `page.evaluate(() => document.activeElement === ...)` for focus).
8. **Static-attribute-instead-of-effect.** After interacting with a control
   (e.g. filling a slider to a new value), asserting a STATIC attribute that
   never changes (the slider's `max`) instead of its current VALUE or the
   interaction's downstream effect. The assertion must target what the
   interaction actually changes.
9. **Duplicate tests under different criterion ids.** The identical
   interaction block copy-pasted under two distinct criterion titles — only
   one criterion is actually exercised no matter how many ids you attach.
10. **Fabricated evidence.** A `.webm`/screenshot that is placeholder/dummy
    bytes (one rejected PR's "evidence.webm" was literally a 12-byte text
    file containing the string "dummy video"; another had a script whose only
    job was `touch dummy.webm`). Media must be a real recording of the real
    app or you don't include media at all. This is treated as fraud, not
    incompleteness — it is never acceptable, partial-work policy or not.

## 5. Dependencies and version pin

Add `@playwright/test` to the app's own `devDependencies` if missing — pin to
**`1.61.0`**, matching `tasks/_pins.py` (the judge's baked browser image is
`playwright:v1.61.0-noble`). Do not resolve to a newer patch version (`^1.61.1`
has been mistakenly used tonight and flagged by review — fix any suite you
find using it). Regenerate the app's own `package-lock.json`
(`npm install --package-lock-only`) — never touch the repo-root
`package.json`/lockfile. Add the script:

```json
"test:e2e": "playwright test -c e2e.playwright.config.mjs"
```

## 6. Serve, run, and verify — honestly

Port 3000 may be held by another agent's server; check before assuming it's
free, and if you need a scratch port for local iteration pick one
dynamically (`node -e "require('net').createServer().listen(0,()=>{console.log(this.address().port)})"`).
The canonical config hardcodes `:3000` for the FINAL verification run, so
retry with backoff or wait for it to free rather than editing the committed
config to point elsewhere.

Run the real suite against the real served app:

```bash
npm start &            # or your app's serve script
npx playwright test -c e2e.playwright.config.mjs
```

Fix failures by correcting the TEST when your locator/flow was wrong against
the real DOM. If a test correctly identifies a genuine oracle defect, KEEP IT
FAILING and name it explicitly in your PR description under "oracle defects
found" — a deliberately-failing test documenting a real bug is valuable
signal, never something to paper over with a weaker assertion.

Paste the full, real command output into your PR description. If the PR body
claims a pass/fail count, it must match what the suite actually produced —
fabricated run-output narratives are caught and rejected on sight.

## 7. Commit is the finish line

Never push manually and never open the PR yourself — automation does both
from your committed changeset. If your environment blocks a large commit
(a "diff too large" guard on a big `dist/` payload, for example), commit in
smaller batches (`git add -f <subset>`, commit, repeat) rather than trying to
bypass or silence the guard.

## Quick pre-commit checklist

- [ ] Branch merged/rebased onto current `origin/main`
- [ ] Every changed/added file is under `tasks/<slug>/solution/app/**`
- [ ] `e2e.spec.mjs` + `e2e.playwright.config.mjs` copied verbatim from canonical, region above marker untouched
- [ ] One real test per deterministic criterion; subjective ones listed as not-automatable in the PR body, not stubbed
- [ ] Scanned against all ten banned patterns above
- [ ] `@playwright/test` pinned to `1.61.0`, lockfile regenerated, `test:e2e` script added
- [ ] Suite actually run against the served app; PR body's claimed output matches the real run
- [ ] No fabricated media
- [ ] No manual `git push`, no self-opened PR
