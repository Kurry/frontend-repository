import re
import os

header = """[judge]
judge = "codex"
model = "gpt-5.6-sol"
prompt_template = "../system_prompt.md"
cwd = "/logs/verifier"
mode = "batched"
timeout = 3000

[[judge.mcp_servers]]
name = "webmcp"
transport = "stdio"
command = "node"
args = [
  "/tests/webmcp_stdio_server.mjs",
]
allowed_tools = [
  "webmcp_session_info",
  "webmcp_list_tools",
  "webmcp_invoke_tool",
]

[[judge.mcp_servers]]
name = "playwright"
transport = "stdio"
command = "npx"
args = [
  "-y",
  "@playwright/mcp@0.0.76",
  "--browser",
  "chromium",
  "--cdp-endpoint",
  "$WEBMCP_CDP_ENDPOINT",
  "--isolated",
  "--output-dir",
  "/logs/verifier/screenshots",
]
allowed_tools = [
  "browser_navigate",
  "browser_navigate_back",
  "browser_resize",
  "browser_tabs",
  "browser_click",
  "browser_close",
  "browser_console_messages",
  "browser_drag",
  "browser_evaluate",
  "browser_file_upload",
  "browser_fill_form",
  "browser_handle_dialog",
  "browser_hover",
  "browser_network_requests",
  "browser_press_key",
  "browser_select_option",
  "browser_snapshot",
  "browser_take_screenshot",
  "browser_type",
  "browser_wait_for",
]

# Observation browser with prefers-reduced-motion forced (the entrypoint's second
# Chrome, --force-prefers-reduced-motion, CDP $WEBMCP_RM_CDP_ENDPOINT). Use ONLY
# for reduced-motion criteria; every other criterion is graded on `playwright`.
[[judge.mcp_servers]]
name = "playwright_reduced_motion"
transport = "stdio"
command = "npx"
args = [
  "-y",
  "@playwright/mcp@0.0.76",
  "--browser",
  "chromium",
  "--cdp-endpoint",
  "$WEBMCP_RM_CDP_ENDPOINT",
  "--isolated",
  "--output-dir",
  "/logs/verifier/screenshots",
]
allowed_tools = [
  "browser_navigate",
  "browser_resize",
  "browser_snapshot",
  "browser_take_screenshot",
  "browser_evaluate",
  "browser_console_messages",
  "browser_wait_for",
  "browser_press_key",
  "browser_click",
  "browser_hover",
]

[scoring]
aggregation = "weighted_mean"
"""

def generate_toml(dim, base_id, criteria):
    filename = f"tasks/frontend-creative-tools-fictional-darkroom-test-strip-mask-composer/tests/{dim}/{dim}.toml"
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, "w") as f:
        f.write(header + "\n")

        for i, c in enumerate(criteria):
            f.write(f"[[criterion]]\n")
            f.write(f'id = "{base_id}.c{i+1}"\n')
            f.write(f'name = "{c["name"]}"\n')
            f.write(f'description = "{c["desc"]}"\n')
            f.write(f'type = "binary"\n')
            f.write(f'weight = 1.0\n\n')

        # Add catch-all
        f.write(f"[[criterion]]\n")
        f.write(f'id = "{dim}.catchall"\n')
        f.write(f'name = "{dim}_catchall"\n')
        f.write(f'description = "The app exhibits a significant, browser-observable defect in {dim} that is NOT covered by any other criterion in this file. \'Significant\' means it would plausibly matter to a real user, not a nitpick. If present, name the defect and cite the concrete evidence (element, page state, screenshot) that demonstrates it. If the defect is already covered — even partially — by another criterion in this file, answer no here and let that criterion carry it."\n')
        f.write(f'type = "binary"\n')
        f.write(f'negate = true\n')
        f.write(f'weight = 1.0\n')

# Core features
core_features = [
    {"name": "renders_canvas", "desc": "The application visually displays the essential elements for the negative stage and mask canvas: a synthetic negative, the 160x40 paper strip, zone dividers (z-00 to z-07), pass masks, selected mask handles, cell grid at inspection zoom, and live millimeter rulers."},
    {"name": "supports_dragging", "desc": "Users can drag a mask edge (e.g., pass-04 left edge from 80 to 100). During the drag, a transient preview shows old/new outlines, exact bounds, changed cell patterns, and derived data before commitment."},
    {"name": "invalid_drag_snaps_back", "desc": "If the user drags a mask boundary out of bounds or to an invalid configuration, the preview visibly resists and upon release snaps back to the original geometry without triggering a canonical mutation event."},
    {"name": "keyboard_traversal", "desc": "Keyboard interactions (Alt+Arrow and Alt+Shift+Arrow) successfully move and resize the focused mask edge in exact millimeter increments."},
    {"name": "pass_stack", "desc": "The pass stack correctly shows the pass order, authored and effective duration, exact mask dimensions, calibration source/revision, and the zones/cells covered."},
    {"name": "intersection_matrix", "desc": "An intersection matrix accurately displays the crosses between passes and zones. Edge-touching passes yield zero-area overlaps without counting as covered cells."},
    {"name": "zones_update", "desc": "Upon confirming the pass-04 mutation, exactly 192 cells are removed from its coverage, zone z-04 drops from 100 to 80 deciseconds, and the density curve, histogram, and contact sheet update correctly."},
    {"name": "linked_evidence", "desc": "Brushing a strip range (e.g., z-03...z-05) selects the intersecting cells, which highlights the identical selection on the density curve, histogram, contact sheet, cell inspector, and rank table."},
    {"name": "preferred_zone_decision", "desc": "Selecting z-04 as the preferred zone creates a decision event with correct metrics, rationale, and sources. A subsequent pass mutation correctly marks this decision as stale, requiring reconfirmation while preserving the parent."},
    {"name": "calibration_rebase", "desc": "A correction (e.g., output factor 1.0 to 0.9 for pass-04) changes the effective exposure (e.g., z-05 drops to 118.0) but does not alter the authored duration or mask bounds, and appending a rebase event preserves the original decision lineage."},
    {"name": "selective_undo", "desc": "The event DAG accurately displays history. Selectively undoing a view-filter event leaves the structural pass mutation, zone decision, correction, and notes intact."},
    {"name": "approval_process", "desc": "The review and approval step blocks completion until a valid pass edit, fresh zone decision, correction rebase, note, and zero dangling records exist, freezing the state hashes upon successful approval."},
    {"name": "export_artifact", "desc": "Upon successful approval, exporting generates a valid ZIP file with manifest.json, darkroom-project.json, passes.csv, zone-samples.csv, test-strip-proof.svg, mask-plan.svg, events.ndjson, print-recipe.txt, and darkroom-project.schema.json."},
    {"name": "json_import", "desc": "Importing a valid project JSON reliably regenerates all derived visual evidence deterministically and correctly restores the session without changing the state incrementally on failure."}
]

# Visual design
visual_design = [
    {"name": "hierarchy_legible", "desc": "The interface organizes the negative canvas, pass stack, curves, and history clearly, supporting a complex creative environment without relying solely on color (e.g., valid vs invalid states are differentiated by shape, pattern, or explicit markers)."},
    {"name": "drag_states_visible", "desc": "Elements display clear distinctions between idle, hover, dragging, resized, invalid-return, and confirmed states. Overlapping bounds and removed cells show appropriate hashing or patterning."}
]

# Motion
motion = [
    {"name": "causal_animations", "desc": "Mask dragging provides smooth, immediate feed-forward animations for old and new bounds, snapping gracefully into place or snapping back correctly upon invalid drop."},
    {"name": "reduced_motion", "desc": "When reduced motion is enabled, immediate spatial updates, exact deltas, patterns, and focus states remain visible and correct, replacing tweened transitions."}
]

# Technical
technical = [
    {"name": "deterministic_execution", "desc": "The application loads and handles all complex interactions (drag, intersection math, zip export) with zero console or page errors."},
    {"name": "webmcp_tools", "desc": "Using WebMCP tools (e.g., `commit_mask`, `commit_zone_decision`, `commit_recipe_rebase`) mutates the same canonical state, yields the identical counts, hashes, and files as the visual direct-manipulation equivalents."}
]

generate_toml("core_features", "cf", core_features)
generate_toml("visual_design", "vd", visual_design)
generate_toml("motion", "mt", motion)
generate_toml("technical", "tc", technical)
