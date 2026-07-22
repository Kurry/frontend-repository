import os

task_dir = "tasks/frontend-creative-tools-escape-room-puzzle-studio/tests"

criteria = {
    "core_features": [
        ("CF-01", "Canvas Prop Placement", "Props can be placed on the canvas and cannot overlap.", "behavioral"),
        ("CF-02", "Graph Node Connection", "Nodes can be connected, and cycles are rejected.", "behavioral"),
        ("CF-03", "Playtest Simulation", "Playtest simulator enforces dependencies and records events.", "behavioral"),
        ("CF-04", "Static Analysis", "Evaluator identifies unreachable nodes.", "behavioral"),
        ("CF-05", "Artifact Export", "Export produces JSON, SVG, CSV, and Markdown.", "behavioral")
    ],
    "visual_design": [
        ("VD-01", "Visual State Indication", "Nodes and props have clear visual states (e.g. selected, locked, unlocked).", "behavioral")
    ],
    "motion": [
        ("MO-01", "State Transitions", "Transitions between graph states have basic feedback.", "behavioral")
    ],
    "technical": [
        ("TE-01", "State Consistency", "In-memory state remains consistent across canvas, graph, and simulator.", "behavioral")
    ]
}

for dim, crit_list in criteria.items():
    file_path = os.path.join(task_dir, dim, f"{dim}.toml")
    with open(file_path, "a") as f:
        for c in crit_list:
            f.write(f'''
[[criterion]]
id = "{c[0]}"
title = "{c[1]}"
description = "{c[2]}"
type = "{c[3]}"
weight = 1.0
''')
