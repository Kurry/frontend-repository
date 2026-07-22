import os
import glob

# Get the canonical header from scaffolded TOMLs
with open("tasks/frontend-creative-tools-session-compression-loom/tests/behavioral/behavioral.toml", "r") as f:
    lines = f.readlines()

header = ""
for line in lines:
    if line.startswith("[[criterion]]"):
        break
    header += line

# Fix all tomls
tomls = glob.glob("tasks/frontend-creative-tools-session-compression-loom/tests/**/*.toml", recursive=True)
for toml_path in tomls:
    with open(toml_path, "r") as f:
        content = f.read()

    criteria_part = ""
    parts = content.split("[[criterion]]")
    if len(parts) > 1:
        criteria_part = "[[criterion]]" + "[[criterion]]".join(parts[1:])

    with open(toml_path, "w") as f:
        f.write(header + criteria_part)
