import json

# Add to webmcp-task-sources.json
with open("packages/corpuscheck/src/corpuscheck/schemas/webmcp-task-sources.json", "r") as f:
    data = json.load(f)

data["frontend-planning-museum-visit-route-composer"] = {
    "source": "feature",
    "instruction": "tasks/frontend-planning-museum-visit-route-composer/instruction.md",
    "description": "Museum Visit Route Composer good-app eval."
}
with open("packages/corpuscheck/src/corpuscheck/schemas/webmcp-task-sources.json", "w") as f:
    json.dump(data, f, indent=2)
