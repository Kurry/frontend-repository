import os
import shutil

task_slug = "frontend-creative-tools-drum-pattern-practice-board-forecast-ribbon-rn-github-issue-fields"
task_dir = f"tasks/{task_slug}"

source_file = f"{task_dir}/tests/user_flows/user_flows.toml"
with open(source_file, "r") as f:
    lines = f.readlines()

# Extract header (everything up to the first [[criterion]])
header_lines = []
for line in lines:
    if line.strip() == "[[criterion]]":
        break
    header_lines.append(line)

header = "".join(header_lines)

criteria = {
    "core_features": """[[criterion]]
id = "AC-01"
name = "signature_mutation"
type = "browser-observable"
description = "The forecast ribbon mutation changes the primary record, linked view, and status together."
weight = 1.0

[[criterion]]
id = "AC-core-1"
name = "drum_pattern_crud"
type = "browser-observable"
description = "Create, edit, archive, and filter drum patterns with explicit domain statuses."
weight = 1.0

[[criterion]]
id = "AC-core-2"
name = "forecast_undo"
type = "browser-observable"
description = "Undo the last mutation and inspect the linked representation."
weight = 1.0

[[criterion]]
id = "AC-core-3"
name = "portable_artifact"
type = "browser-observable"
description = "Export and restore the actual session work in a fresh state."
weight = 1.0
""",
    "visual_design": """[[criterion]]
id = "AC-02"
name = "visual_hierarchy"
type = "browser-observable"
description = "The visual hierarchy makes current state and next action clear."
weight = 1.0

[[criterion]]
id = "AC-visual-1"
name = "domain_utility"
type = "browser-observable"
description = "Linked views provide domain utility beyond CRUD."
weight = 1.0

[[criterion]]
id = "AC-visual-2"
name = "layout"
type = "browser-observable"
description = "Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps."
weight = 1.0
""",
    "motion": """[[criterion]]
id = "AC-03"
name = "causal_motion"
type = "browser-observable"
description = "Motion connects the acted-on item to its new state and has a reduced-motion equivalent."
weight = 1.0
""",
    "technical": """[[criterion]]
id = "AC-04"
name = "schema_contract"
type = "browser-observable"
description = "The tool result and artifact contain the declared API-shaped fields."
weight = 1.0

[[criterion]]
id = "AC-tech-1"
name = "schema_validation"
type = "browser-observable"
description = "schemaVersion is a task-specific v1 enum and exportedAt is RFC3339."
weight = 1.0
"""
}

for dim, crit in criteria.items():
    os.makedirs(f"{task_dir}/tests/{dim}", exist_ok=True)
    with open(f"{task_dir}/tests/{dim}/{dim}.toml", "wb") as f:
        f.write(header.encode('utf-8'))
        f.write(crit.encode('utf-8'))
