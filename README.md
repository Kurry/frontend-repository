# frontend-repository

103 frontend-only Harbor eval tasks (`tasks/frontend-*`).

Each task asks a builder agent to recreate a reference web application from an
observable-behavior PRD (`instruction.md`). An LLM judge then grades the built
app in a real browser across thirteen dimensions:

```
core_features    visual_design    motion           technical        user_flows
edge_cases       responsiveness   accessibility    performance      writing
innovation       design_fidelity  behavioral
```

A trial passes at `reward >= 0.7`.

Task slugs carry their category as a prefix (`frontend-<category>-<name>`) —
see the distribution below.

## Quick start

```bash
# run a task end-to-end (builder + verifier)
harbor run -p tasks/frontend-data-tracking-admin-analytics-dashboard -a claude-code -m sonnet
```

Environment variables:

- `CLAUDE_CODE_OAUTH_TOKEN` — builder agent
- `OPENAI_API_KEY` — judge
- `REWARDKIT_MODEL=gpt-5.6-luna` — optional; switches judging to the cheap dev
  tier (production default is `gpt-5.6-sol`)

## Task shape

Every `tasks/frontend-<slug>/` directory has the same file tree:

```
tasks/frontend-<slug>/
├── task.toml                      # Harbor task manifest
├── instruction.md                 # the PRD the builder sees
├── README.md
├── environment/                   # builder container
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── webmcp_stdio_server.mjs    # WebMCP bridge for builder self-tests
│   ├── reference-screenshots/     # advisory images; instruction text wins
│   └── assets/                    # website-fidelity tasks only
├── solution/
│   ├── solve.sh
│   ├── reward-details.json
│   └── app/                       # the working oracle (zero console/page errors)
└── tests/                         # the verifier
    ├── test.sh                    # entry point
    ├── system_prompt.md           # judge prompt
    ├── webmcp_stdio_server.mjs    # judge-side WebMCP bridge
    ├── reward.toml                # aggregation
    └── <dimension>/
        └── <dimension>.toml       # rubric criteria, one dir per dimension (13)
```

## Corpus distribution

Archetype categories, from slug prefixes (`frontend-<category>-<name>`):

- `creative-tools` — 27
- `workflow` — 21
- `productivity` — 19
- `data-tracking` — 17
- `landing` — 8
- `game` — 6
- `planning` — 4
- unprefixed (`frontend-mosbyfiles`) — 1

Frameworks, as mandated by each task's `instruction.md` (meta-frameworks such
as Next.js, Nuxt, and SvelteKit count within their base framework):

- React — 35
- Svelte — 17
- Vue — 17
- Astro — 11
- Solid — 7
- Qwik — 7
- Preact — 5
- Angular — 4

## How judging works

- `tests/test.sh` serves the app on port 3000, launches a shared headless
  Chrome with a CDP endpoint, and runs rewardkit.
- The judge grades only what it observes, using Playwright MCP for observation
  and gestures.
- A task-local WebMCP bridge invokes the app's contract-mandated
  `window.webmcp_*` tools on the same page. It accelerates judging but is
  never itself a scoring criterion.
- Criteria live in `tests/<dimension>/<dimension>.toml`.
- Results, including per-dimension `cost_usd`, land in `reward.json` and
  `reward-details.json`.

## Corpus sweeps

`configs/*.yaml` are ready-made Harbor job configs for corpus-wide runs. Each
file's header comment documents its own setup, credentials, and gotchas.

```bash
# confirm setup works across every task × agent — no trial execution
uv run harbor run -y -c configs/install-only-all-tasks.yaml --yes

# run each task's reference solution through the real verifier
uv run harbor run -y -c configs/oracle-validate-all-tasks.yaml --yes

# full-corpus builder runs: claude-code on Sonnet 5, codex judge
uv run harbor run -y -c configs/sonnet5-codex-oauth.yaml --yes      # subscription OAuth
uv run harbor run -y -c configs/sonnet5-codex-api-key.yaml --yes    # API keys

# Modal fleet sweeps with real coding-agent builders, codex judge
uv run harbor run -c configs/trial-codex-sol-pro.yaml --yes         # codex on gpt-5.6-sol (xhigh)
uv run harbor run -c configs/trial-kimi3.yaml --yes                 # kimi-cli on kimi-k3, Kimi API
uv run harbor run -c configs/trial-kimi3-openrouter.yaml --yes      # kimi-cli on kimi-k3, OpenRouter

# smoke a single task before any full sweep
uv run harbor run -y -c configs/<file>.yaml -i <slug> --job-name smoke --yes
```

## Layout and pointers

- `tasks/frontend-*/` — the 103 packaged tasks; generated, never hand-edit
  shared files
- `scripts/` — source of truth for everything replicated across tasks
- `configs/` — sweep job configs
- `schemas/`, `packages/webmcp-contracts/` — WebMCP assignments and module
  specs
- `docs/rubrics.md` — criterion authoring conventions
- `CONTRIBUTING.md` — task category distribution and quality tracking
  (`tools/corpuscheck/`)
- `CLAUDE.md` / `AGENTS.md` — full development guide and the non-negotiable
  corpus invariants
