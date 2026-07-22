import os
import json

with open('packages/corpuscheck/src/corpuscheck/schemas/webmcp-assignment-map.json', 'r') as f:
    data = json.load(f)

for item in data:
    if item['task'] == 'frontend-productivity-focus-soundscape-automation-mixer':
        assignment = item
        break

from pathlib import Path
import sys

sys.path.append(os.path.abspath('packages/corpuscheck/src'))
from corpuscheck.validate import repository_sources

webmcp, _, _, _ = repository_sources()
expected_contract = webmcp.render_instruction_webmcp_section(assignment)

with open('tasks/frontend-productivity-focus-soundscape-automation-mixer/instruction.md', 'r') as f:
    instruction = f.read()

import re
instruction = re.sub(r'<webmcp_action_contract>.*?</webmcp_action_contract>', expected_contract, instruction, flags=re.DOTALL)

with open('tasks/frontend-productivity-focus-soundscape-automation-mixer/instruction.md', 'w') as f:
    f.write(instruction)
