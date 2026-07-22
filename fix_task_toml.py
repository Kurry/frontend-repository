with open("tasks/frontend-creative-tools-fictional-morton-cell-address-bit-interleave-repair-proof-studio/task.toml", "r") as f:
    content = f.read()
content = content.replace('name = "kurry/frontend-creative-tools-fictional-morton-cell-address-bit-interleave-repair-proof-studio"', 'name = "mercor-intelligence/frontend-creative-tools-fictional-morton-cell-address-bit-interleave-repair-proof-studio"')
with open("tasks/frontend-creative-tools-fictional-morton-cell-address-bit-interleave-repair-proof-studio/task.toml", "w") as f:
    f.write(content)
