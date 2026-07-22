import re

with open("tasks/frontend-creative-tools-stack-trace-path-finder/instruction.md", "r") as f:
    content = f.read()

with open("expected_contract.txt", "r") as f:
    contract = f.read()

# Replace <delivery> and <webmcp_action_contract> blocks with the correct one
# Since our original had a different format, let's just do a string split and replace
prefix = content.split("<delivery>")[0]

with open("tasks/frontend-creative-tools-stack-trace-path-finder/instruction.md", "w") as f:
    f.write(prefix + contract.strip() + "\n")
