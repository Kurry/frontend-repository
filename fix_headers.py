from pathlib import Path

# Get exact header from user_flows.toml
user_flows = Path("tasks/frontend-creative-tools-stack-trace-path-finder/tests/user_flows/user_flows.toml").read_text()
header = user_flows.split("\n\n[[criterion]]")[0]

dims = ["core_features", "visual_design", "motion", "technical"]
for dim in dims:
    path = Path(f"tasks/frontend-creative-tools-stack-trace-path-finder/tests/{dim}/{dim}.toml")
    if not path.exists():
        continue
    content = path.read_text()
    if "\n\n[[criterion]]" in content:
        rest = "\n\n[[criterion]]" + content.split("\n\n[[criterion]]", 1)[1]
    else:
        rest = "\n\n[[criterion]]\n" + content.split("[[criterion]]")[1]

    path.write_text(header + rest)
