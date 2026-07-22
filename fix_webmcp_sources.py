import json

with open('packages/corpuscheck/src/corpuscheck/schemas/webmcp-task-sources.json', 'r') as f:
    data = json.load(f)

data["frontend-productivity-focus-soundscape-automation-mixer"] = {
    "source": "frontend-productivity-focus-soundscape-automation-mixer",
    "instruction": "tasks/frontend-productivity-focus-soundscape-automation-mixer/instruction.md",
    "description": "Focus Soundscape Automation Mixer eval."
}

with open('packages/corpuscheck/src/corpuscheck/schemas/webmcp-task-sources.json', 'w') as f:
    json.dump(data, f, indent=2)
