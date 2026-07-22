import os

task_dir = "tasks/frontend-creative-tools-fictional-morton-cell-address-bit-interleave-repair-proof-studio"
tests_dir = os.path.join(task_dir, "tests")

dimensions = [
    ("core_features", "ac-01", "From clean Draft, complete and confirm the X1/Y1 zipper swap; exactly one event changes two positions and yields order, bits 100111, code 39, cell (5,3), path NE->SW->SE, exact intervals, zero violations/mismatch, and unchanged token values/provenance.", 1.0),
    ("visual_design", "ac-02", "At 1440x900, bit zipper and spatial proof dominate a deliberate tile-card desk; source lanes, slots, significance, quadrants, curve direction, Draft/preview/Proof, selection, history, stale review, and approval remain legible without color alone.", 1.0),
    ("motion", "ac-03", "Sample real chip lift, gap opening, adjacent displacement, cross, quadrant peel, cell travel, invalid return, and Proof early/late; reduced motion exposes equivalent slots, bits/codes, outlines, interval bars, cells, deltas, and announcements.", 1.0),
    ("technical", "ac-04", "Execute pointer, exact UI, and WebMCP repairs after separate resets; zipper/grid/curve/tree/interval/history, reload, JSON, CSVs, NDJSON, SVG, and report agree exactly with no console or page errors.", 1.0),
]

header = """[judge]
node_type = "agent"
dimension = "{}"

"""

for dim, dim_id, desc, weight in dimensions:
    dim_dir = os.path.join(tests_dir, dim)
    if not os.path.exists(dim_dir):
        os.makedirs(dim_dir)
    toml_path = os.path.join(dim_dir, f"{dim}.toml")

    with open(toml_path, "w") as f:
        f.write(header.format(dim))
        f.write(f'[[criterion]]\n')
        f.write(f'id = "{dim_id}"\n')
        f.write(f'description = "{desc}"\n')
        f.write(f'weight = {weight}\n')
