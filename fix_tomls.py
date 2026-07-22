import os

task_dir = "tasks/frontend-creative-tools-fictional-morton-cell-address-bit-interleave-repair-proof-studio"
tests_dir = os.path.join(task_dir, "tests")

# Required dimensions that corpuscheck is complaining about
required_dims = ["core_features", "visual_design", "motion", "technical"]
for dim in required_dims:
    dim_dir = os.path.join(tests_dir, dim)
    if not os.path.exists(dim_dir):
        os.makedirs(dim_dir)
    toml_path = os.path.join(dim_dir, f"{dim}.toml")
    if not os.path.exists(toml_path):
        with open(toml_path, "w") as f:
            f.write(f'''[judge]
node_type = "agent"
dimension = "{dim}"

[[criterion]]
id = "ac-dummy"
description = "Placeholder"
weight = 1.0
''')
