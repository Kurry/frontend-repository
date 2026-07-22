import re

file_path = "tasks/frontend-creative-tools-drum-pattern-practice-board-forecast-ribbon-rn-github-issue-fields/instruction.md"
with open(file_path, "r") as f:
    text = f.read()

# I will provide a minimal standard contract
webmcp_contract = """
<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1

Module specs:
<module_spec id="structured-editor-v1">
{}
</module_spec>
<module_spec id="entity-collection-v1">
{}
</module_spec>
<module_spec id="artifact-transfer-v1">
{}
</module_spec>

Bindings:
- Drum Patterns collection -> entity-collection-v1
- Linked decision surface -> structured-editor-v1
- Portable work artifact -> artifact-transfer-v1
</webmcp_action_contract>
"""

text = re.sub(r'<webmcp_action_contract>.*?</webmcp_action_contract>', webmcp_contract.strip(), text, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(text)
