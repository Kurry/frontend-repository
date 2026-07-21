"""Pinned toolchain versions for frontend Harbor tasks (m0 freeze).

Authors: keep these pins aligned across environment/Dockerfile, judge MCP
args, and any Chrome-for-Testing install steps. Do not weaken
existing instruction.md / authoring rubric.json / verifier_checklist.json
semantics when packaging — map authoring rubrics and checklists into Reward Kit
TOML without changing HLI ids or criterion meaning (packaged tasks keep TOMLs
only; authoring checklists are not copied into tasks/frontend-*).

Polarity hard gate (Reward Kit): every dimension (core_features, visual_design,
motion, technical) MUST include ≥1 positive criterion (negate=false or omit)
and ≥1 negate=true negative criterion phrased as a bad condition. Reward Kit
flips scores when negate=true (or annotations.type contains \"negative\").
See frontend-good-app-eval skill and harbor packages/rewardkit judges.py.
WebMCP never adds a scoring criterion.
"""

from __future__ import annotations

# Judge browser: the base image's Playwright chromium (playwright:v1.61.0-noble).
# Chrome for Testing is no longer downloaded — the judge MCP attaches over CDP
# to the shared chromium test.sh launches. Kept for provenance of older trials.
CHROME_FOR_TESTING = "151.0.7922.34"  # legacy; unused since CfT removal


# Playwright MCP used by Reward Kit agent judges
PLAYWRIGHT_MCP = "@playwright/mcp@0.0.76"

# harbor-rewardkit: single source of truth for tests/test.sh installs — NEVER
# the Dockerfile. The judge harness is installed at verify time, after the
# builder's turn, so the agent cannot inspect or tamper with it (reward-hacking
# surface). Bump the SHA -> regenerate test.sh copies via `corpuscheck propagate`.
# Same Kurry/harbor fork SHA as zto-phase2-prds (pyproject.toml).
# Do not vendor packages/rewardkit source into task environment/ trees.
HARBOR_REWARDKIT_GIT_SHA = "49ac88859e31cd5561f98249aaf4b9ca03c90f7e"
HARBOR_REWARDKIT_PACKAGE = (
    "harbor-rewardkit @ "
    f"git+https://github.com/Kurry/harbor@{HARBOR_REWARDKIT_GIT_SHA}"
    "#subdirectory=packages/rewardkit"
)

# Six-contract WebMCP catalog version for PRD H3 blocks.
# Module JSON SoT lives in packages/webmcp-contracts (authoring only); specs are
# inlined into instruction.md <webmcp_action_contract> — not installed in images.
WEBMCP_CONTRACT_VERSION = "zto-webmcp-v1"
