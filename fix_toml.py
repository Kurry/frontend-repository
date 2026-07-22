import os
import glob
import re

task_dir = "tasks/frontend-creative-tools-palette-harmony-matrix-recovery-board-rn-canva-live-preview"
tests_dir = os.path.join(task_dir, "tests")

# Read the header from user_flows.toml
user_flows_path = os.path.join(tests_dir, "user_flows/user_flows.toml")
with open(user_flows_path, 'r') as f:
    content = f.read()

# Extract header
header_match = re.match(r'(.*?\n\[dimension\]\n.*?\n)\n\[\[criterion\]\]', content, re.DOTALL)
if header_match:
    header = header_match.group(1)
else:
    print("Could not find header in user_flows.toml")
    exit(1)

# Apply header to all toml files
for dim in ["core_features", "visual_design", "motion", "technical"]:
    toml_path = os.path.join(tests_dir, f"{dim}/{dim}.toml")

    with open(toml_path, 'r') as f:
        toml_content = f.read()

    # Extract criteria
    criteria_match = re.search(r'\[\[criterion\]\].*', toml_content, re.DOTALL)
    if criteria_match:
        criteria = criteria_match.group(0)
    else:
        continue

    new_header = header.replace('id = "user_flows"', f'id = "{dim}"')
    new_header = new_header.replace('name = "User flows"', f'name = "{dim.replace("_", " ").capitalize()}"')

    # Replace weight and description
    criteria = re.sub(r'prompt = "(.*)"', r'description = "\1"\nprompt = "\1"\nweight = 1.0', criteria)

    with open(toml_path, 'w') as f:
        f.write(new_header + "\n" + criteria)

for dim in ["user_flows", "edge_cases", "responsiveness", "accessibility", "performance", "writing", "innovation", "design_fidelity", "behavioral"]:
    toml_path = os.path.join(tests_dir, f"{dim}/{dim}.toml")

    with open(toml_path, 'r') as f:
        toml_content = f.read()

    # Replace weight and description in appended criteria
    toml_content = re.sub(r'prompt = "(.*)"', r'description = "\1"\nprompt = "\1"\nweight = 1.0', toml_content)

    with open(toml_path, 'w') as f:
        f.write(toml_content)
