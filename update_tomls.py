import os

task_dir = "tasks/frontend-creative-tools-fictional-morton-cell-address-bit-interleave-repair-proof-studio"
tests_dir = os.path.join(task_dir, "tests")

# We map dimensions to AC descriptions.
criteria_to_add = {
    "core_features": [
        {"id": "ac-01", "description": "From clean Draft, complete and confirm the X1/Y1 zipper swap; exactly one event changes two positions and yields order, bits 100111, code 39, cell (5,3), path NE->SW->SE, exact intervals, zero violations/mismatch, and unchanged token values/provenance.", "weight": 1.0}
    ],
    "visual_design": [
        {"id": "ac-02", "description": "At 1440x900, bit zipper and spatial proof dominate a deliberate tile-card desk; source lanes, slots, significance, quadrants, curve direction, Draft/preview/Proof, selection, history, stale review, and approval remain legible without color alone.", "weight": 1.0}
    ],
    "motion": [
        {"id": "ac-03", "description": "Sample real chip lift, gap opening, adjacent displacement, cross, quadrant peel, cell travel, invalid return, and Proof early/late; reduced motion exposes equivalent slots, bits/codes, outlines, interval bars, cells, deltas, and announcements.", "weight": 1.0}
    ],
    "technical": [
        {"id": "ac-04", "description": "Execute pointer, exact UI, and WebMCP repairs after separate resets; zipper/grid/curve/tree/interval/history, reload, JSON, CSVs, NDJSON, SVG, and report agree exactly with no console or page errors.", "weight": 1.0}
    ],
    "user_flows": [
        {"id": "ac-05", "description": "Inspect Draft, preview label/value false repairs, preview/cancel correct swap, confirm, brush path/intervals, pin/compare, note, selectively undo, branch/restore, review, approve, export, diverge, import, and recover approved selected Proof.", "weight": 1.0}
    ],
    "edge_cases": [
        {"id": "ac-06", "description": "Try outside/prethreshold/same/nonadjacent/cross-depth release, wrong or locked token, changed value/source/anchor, reversed significance, y/x pair, LSB-first code, open interval, duplicate token, stale/double commit, bad curve permutation, and forged import; each preserves valid state/event count.", "weight": 1.0}
    ],
    "responsiveness": [
        {"id": "ac-07", "description": "At 390x844, complete the repair through the zipper sheet, inspect grid/path/interval/curve cards, compare, review, approve, and export with 44x44 targets, unclipped bit strings, and no page overflow.", "weight": 1.0}
    ],
    "accessibility": [
        {"id": "ac-08", "description": "Without pointer input, focus X1, lift, move left across Y1, cancel once, then confirm once; slot/code/cell/path/interval changes announce, dialog traps and returns focus, and durable/artifact state equals the chip gesture.", "weight": 1.0}
    ],
    "performance": [
        {"id": "ac-09", "description": "In a deterministic browser containing 1,024 independent Cedar-style cards, 6,144 tokens, 65,536 curve cells, 500 history events, and 100 replay frames, edit one selected card; acknowledge input within 100 ms, settle its linked state within 500 ms, brush 256 visible cells, and export/import that card within 2 seconds without recomputing unrelated cards, stale work, layout shift, or runaway resources.", "weight": 1.0}
    ],
    "writing": [
        {"id": "ac-10", "description": "Copy consistently distinguishes source token from slot role, value from provenance, significance from position, code from coordinate, prefix from interval, curve order from geometric adjacency, preview from event, and review from approval; diagnostics name ID/value/rule/recovery.", "weight": 1.0}
    ],
    "innovation": [
        {"id": "ac-11", "description": "One provenance-chip swap coherently reconciles address bits, decimal code, decoded cell, nested quadrants, interval arithmetic, curve position, causal replay, tool state, history, and standalone SVG/data proof (not covered by standard criteria, requires evidence).", "weight": 1.0}
    ],
    "design_fidelity": [
        {"id": "ac-12", "description": "Clean Draft, selected, lifted, gap-open, displaced, false-label, false-value, target-preview, rerouting, cancel-returned, Proof, selectively-undone, restored, reviewed, and approved states preserve the bit-to-space thesis.", "weight": 1.0}
    ],
    "behavioral": [
        {"id": "ac-13", "description": "Export approved Proof, mutate token order/note/view/history, import the original packet, and re-export; provenance/order/slots/code/cells/quadtree/intervals/curve/replay/branches/review/approval/artifacts/inspection restore except allowed regenerated metadata.", "weight": 1.0}
    ]
}

for dim, items in criteria_to_add.items():
    toml_path = os.path.join(tests_dir, dim, f"{dim}.toml")
    if not os.path.exists(toml_path):
        continue

    with open(toml_path, "r") as f:
        content = f.read()

    with open(toml_path, "a") as f:
        f.write("\n")
        for item in items:
            if f'id = "{item["id"]}"' in content:
                continue

            f.write(f'[[criterion]]\n')
            f.write(f'id = "{item["id"]}"\n')
            f.write(f'description = "{item["description"]}"\n')
            f.write(f'weight = {item["weight"]}\n\n')
