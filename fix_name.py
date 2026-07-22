import re

path = "tasks/frontend-creative-tools-palette-harmony-matrix-recovery-board-rn-canva-live-preview/task.toml"
with open(path, 'r') as f:
    content = f.read()

content = content.replace('name = "Kurry/frontend-creative-tools-palette-harmony-matrix-recovery-board-rn-canva-live-preview"', 'name = "Kurry/frontend-creative-tools-palette-harmony-matrix-recovery-board-rn-canva-live-preview"')

with open(path, 'w') as f:
    f.write(content)
