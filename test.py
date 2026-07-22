import json

with open("packages/corpuscheck/src/corpuscheck/schemas/webmcp-assignment-map.json", "r") as f:
    data = json.load(f)

for item in data:
    if item["task"] == "frontend-creative-tools-session-compression-loom":
        print(json.dumps(item["mechanics_exclusions"], indent=2))
