import os
import shutil

task_dir = "tasks/frontend-creative-tools-escape-room-puzzle-studio/tests"
shapeshift_dir = "tasks/frontend-creative-tools-shapeshift-grid/tests"

dimensions = ["core_features", "visual_design", "motion", "technical"]

for dim in dimensions:
    src_file = os.path.join(shapeshift_dir, dim, f"{dim}.toml")
    dst_file = os.path.join(task_dir, dim, f"{dim}.toml")
    shutil.copy2(src_file, dst_file)
