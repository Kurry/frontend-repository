import os
import glob
import re

tomls = glob.glob('tasks/frontend-data-tracking-coffee-brew-experiment-log-provenance-atlas-rn-slack-canvas/tests/**/*.toml', recursive=True)

# get baseline from a toml that hasn't been completely overwritten manually initially
# Oh wait, we overrode user_flows.toml manually at some point. Let's see if we can get the actual correct header from another generated task.
with open('tasks/frontend-data-tracking-release-diff/tests/user_flows/user_flows.toml', 'r') as f:
    baseline_lines = f.readlines()

header_block = []
for line in baseline_lines:
    if line.startswith('[[criterion]]'):
        break
    header_block.append(line)

print("Baseline header block:", header_block)

for toml in tomls:
    dim = os.path.basename(os.path.dirname(toml))
    if dim == 'tests': continue

    with open(toml, 'r') as f:
        content_lines = f.readlines()

    start_idx = 0
    for i, line in enumerate(content_lines):
        if line.startswith('[[criterion]]'):
            start_idx = i
            break

    new_header = header_block.copy()
    for i, line in enumerate(new_header):
        if line.startswith('dimension ='):
            new_header[i] = f'dimension = "{dim}"\n'

    new_content = new_header + content_lines[start_idx:]
    with open(toml, 'w') as f:
        f.writelines(new_content)
