# frontend-productivity-agora — conversion status: COMPLETE ✅

Source: `~/Downloads/zto-seed-tasks-2/browser_agora` (SolidJS, mini-productivity, oracle 0.9476).
Target shape: new-corpus `tasks/frontend-*`.

## Final state

`corpuscheck validate frontend-productivity-agora` → **1/1 passed** (all static tiers green).

`corpuscheck oracle-ci frontend-productivity-agora` → **all stages PASS**:
- static ✅
- build ✅ (`npm ci` + `verify:build`)
- serve-browser ✅ (non-empty page; zero console/page errors)
- webmcp ✅ (11 tools; read=browse.search, mutate=artifact.import; all 4 assigned modules covered)
- e2e ✅ (4 passed / 0 failed)
- judge-setup ✅ (3 servers; both CDP browsers live; reduced motion true)

`corpuscheck screenshots capture` → OK, 0 console/page errors.

## What was built

- Task dir scaffolded from the `frontend-productivity-repcadence` skeleton (canonical `[judge]` headers, environment/, solve.sh).
- `instruction.md` rewritten into the canonical tagged sections (`<summary>` … `<webmcp_action_contract>`), plain text, Tailwind 4.3.2 named, no-CDN rule stated.
- 13 dimension rubrics: 7 domain dims ported from source criteria (core_features, visual_design, user_flows, behavioral, technical, accessibility, writing) + edge_cases positives + `innovation.catchall`; every criterion has `id` + snake_case `name`; weights normalized to {0.5, 1.0}.
- `solution/app` = the SolidJS oracle (Tailwind 4.3.2), lockfile synced, plus a new **`src/webmcp.ts`** WebMCP bridge wired to the real store actions and registered in `index.tsx`.
- WebMCP contract: assignment-map + compiled `webmcp-assignments.json` entries; `<webmcp_action_contract>` rendered via `corpuscheck webmcp apply`.
- README.md + task.toml canonically rendered via `corpuscheck propagate frontend-productivity-agora`.
- Description registered in `schemas/webmcp-task-sources.json`.

## Recipe established (for scaling to the remaining browser_ tasks)

1. Copy a same-genre skeleton; swap in oracle `solution/app`; sync lockfile.
2. Port source dim criteria → 13 target dims (add `id`+`name`, weights {0.5,1.0}, edge_cases positive, `innovation.catchall`).
3. Rewrite instruction into canonical tagged sections (no markdown; name Tailwind 4.3.2 + no-CDN).
4. Register task: `webmcp-task-sources.json` (description) + `webmcp-assignment-map.json` + `webmcp-assignments.json` (modules + bindings).
5. `corpuscheck webmcp apply` (render contract) → author a `src/webmcp.ts` bridge wired to the app's real state actions.
6. `corpuscheck propagate <slug>` (README/task.toml) → `validate` + `oracle-ci` green; remove any `solution/app/node_modules` before validate.
