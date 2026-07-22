---
name: Oracle validation checklist
about: File every failing/blocked criterion from a harbor oracle-validation run as a checklist, with the judge's full justification per item.
title: "oracle-fix: frontend-<slug> (reward <X.XXX>, <judge-model> sweep <YYYY-MM-DD>)"
labels: oracle-fix
assignees: ""
---

<!--
HOW TO FILL THIS OUT

1. Run oracle validation for the task:
     export CODEX_AUTH_JSON="$(cat ~/.codex/auth.json)"   # or whatever judge auth the config needs
     uv run harbor run -c configs/<your-config>.yaml -a oracle --yes -p tasks/frontend-<slug>

2. Find the job's reward-details.json:
     jobs/<job-id>/<trial-dir>/verifier/reward-details.json

3. Extract every criterion scoring below 1.0, with its full spec description and the judge's
   reasoning, using this one-liner (edit the path, then paste the output into the dimension
   sections below — one checklist item per criterion, grouped by dimension):

     python3 -c "
     import json
     d = json.load(open('jobs/<job-id>/<trial-dir>/verifier/reward-details.json'))
     for dimname, dim in d.items():
         for c in dim.get('criteria', []):
             v = c.get('value')
             if v is None or v < 1.0:
                 verdict = 'FAIL' if str(c.get('reasoning','')).strip().upper().startswith('FAIL') else 'BLOCKED'
                 print(f\"- [ ] **{c.get('id')} {c.get('name')}** ({verdict})\")
                 print(f\"  Requires: {c.get('description','').strip()}\")
                 print(f\"  Judge finding: {c.get('reasoning','').strip()}\")
     "

4. Fill in the dimension score table below from the job's summary table (or
   `jobs/<job-id>/result.json`).

5. Delete this comment block before submitting.

CONVENTIONS
- FAIL = the judge directly observed the defect. BLOCKED = the judge didn't complete the
  interaction needed to verify the criterion — could be a real gap or a judge-exploration
  limitation. Keep both, but don't conflate them: BLOCKED items need reproduction before
  assuming a code bug.
- Every criterion gets its own checkbox — never bundle multiple criteria into one line.
- Include "Requires:" (the criterion's spec, so the item is actionable without opening the
  toml) and "Judge finding:" (verbatim reasoning + evidence filename) for every item.
- If several failures trace back to one root cause (e.g. one broken gesture blocking many
  downstream criteria), call that out in a "Suggested triage order" section — fixing the root
  cause first often clears several checkboxes at once.
- Do not weaken, skip, or delete rubric criteria to make a score look better. Fix the app.
-->

## Evidence

Oracle validation run (`harbor run -c configs/<config>.yaml -a oracle -p tasks/frontend-<slug>`, judge `<model>`), `<YYYY-MM-DD>`, `jobs/<job-id>`.

| Dimension | Score |
|---|---|
| accessibility | |
| behavioral | |
| core_features | |
| design_fidelity | |
| edge_cases | |
| innovation | |
| motion | |
| performance | |
| responsiveness | |
| technical | |
| user_flows | |
| visual_design | |
| writing | |
| **reward (overall)** | |

Note: `FAIL` items are judge-confirmed defects. `BLOCKED` items are interactions the judge
didn't complete — reproduce against the live app before assuming a code bug; some may be
judge-exploration gaps rather than real defects.

Each item below carries **Requires:** (the criterion's spec — what the app must do to pass)
and **Judge finding:** (why it didn't, verbatim from the reward-details evidence).

## Required fix

Reproduce each item against `tasks/frontend-<slug>/solution/app`, fix genuine app bugs (do not
weaken or skip tests to make these pass), and attach passing rerun evidence.

### accessibility (<score>)

- [ ] **<id> <name>** (FAIL|BLOCKED)
  Requires: <criterion description>
  Judge finding: <reasoning + evidence file>

<!-- repeat per dimension: behavioral, core_features, design_fidelity, edge_cases,
     innovation, motion, performance, responsiveness, technical, user_flows,
     visual_design, writing -->

## Suggested triage order

<!-- Call out any single root cause that blocks/fails multiple criteria at once, so whoever
     picks this up fixes the highest-leverage thing first. -->

## Verification

- [ ] Reproduce every FAIL item against the live app; fix genuine defects.
- [ ] Re-run each BLOCKED item's interaction manually to confirm whether it's a real gap or a
      judge-exploration limitation; fix genuine gaps.
- [ ] Full build (`verify:build`) + port-3000 startup clean.
- [ ] Full canonical + task-owned Playwright/e2e suite passing.
- [ ] Re-run oracle validation and attach the passing reward-details breakdown.
