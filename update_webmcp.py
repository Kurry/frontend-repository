import json
import copy

with open('packages/corpuscheck/src/corpuscheck/schemas/webmcp-assignments.json', 'r') as f:
    data = json.load(f)

new_task = {
    "task": "frontend-workflow-opportunity-evidence-pipeline",
    "modules": [
        "structured-editor-v1",
        "entity-collection-v1",
        "artifact-transfer-v1"
    ],
    "bindings": {
        "editor_object_types": [
            "requirement-span",
            "evidence-binding",
            "packet-block"
        ],
        "editor_properties": [
            "classification",
            "binding_type",
            "content"
        ],
        "editor_modes": [
            "edit",
            "review",
            "snapshot"
        ],
        "entity": [
            "opportunity",
            "task"
        ],
        "entity_fields": [
            "stage",
            "name",
            "deadline",
            "status"
        ],
        "export_formats": [
            "dossier-json",
            "resume-json",
            "cover-md",
            "timeline-ics",
            "ledger-csv"
        ],
        "import_modes": [
            "dossier-json"
        ]
    },
    "mechanics_exclusions": [
        "Drag-and-drop card physics and invalid snap-backs stay Playwright-driven",
        "Raw file paths/blobs forbidden in WebMCP args",
        "Clipboard contents and downloaded file bytes remain Playwright responsibilities",
        "Inline validation visual styles (e.g., red underlines) stay Playwright-observed"
    ]
}

data['assignments'].append(new_task)

with open('packages/corpuscheck/src/corpuscheck/schemas/webmcp-assignments.json', 'w') as f:
    json.dump(data, f, indent=2)
