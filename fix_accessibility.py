import re

path = "tasks/frontend-creative-tools-palette-harmony-matrix-recovery-board-rn-canva-live-preview/tests/accessibility/accessibility.toml"
with open(path, 'r') as f:
    content = f.read()

# Fix accessibility.toml possible double-inverted negation
content = re.sub(r'prompt = "(.*)not(.*)un(.*)"', r'prompt = "\1\2\3"', content)

with open(path, 'w') as f:
    f.write(content)
