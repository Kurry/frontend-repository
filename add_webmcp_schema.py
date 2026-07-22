import json

with open('packages/corpuscheck/src/corpuscheck/schemas/webmcp-assignment-map.json', 'r') as f:
    data = json.load(f)

data.append({
    "task": "frontend-productivity-focus-soundscape-automation-mixer",
    "modules": [
        "structured-editor-v1",
        "entity-collection-v1",
        "artifact-transfer-v1"
    ],
    "bindings": {
        "editor_object_types": ["preset", "automation", "source"],
        "editor_properties": ["gain", "pan", "filter", "freq"],
        "collection_types": ["profiles", "sessions"],
        "collection_actions": ["list", "add", "remove", "update"],
        "transfer_formats": ["json", "wav"],
        "transfer_directions": ["import", "export"]
    }
})

with open('packages/corpuscheck/src/corpuscheck/schemas/webmcp-assignment-map.json', 'w') as f:
    json.dump(data, f, indent=2)
