import json

with open('packages/corpuscheck/src/corpuscheck/schemas/webmcp-task-sources.json', 'r') as f:
    data = json.load(f)

data["frontend-workflow-opportunity-evidence-pipeline"] = {
    "source": "https://github.com/Kurry/harbor/issues/123",
    "description": "An evidence-bound job application tracker."
}

with open('packages/corpuscheck/src/corpuscheck/schemas/webmcp-task-sources.json', 'w') as f:
    json.dump(data, f, indent=2)
