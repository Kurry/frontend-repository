const fs = require('fs');
const path = 'packages/corpuscheck/src/corpuscheck/schemas/webmcp-assignments.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// Filter out if already exists
data.assignments = data.assignments.filter(a => a.task !== "frontend-creative-tools-weaving-draft-constraint-studio");

const newTask = {
  "task": "frontend-creative-tools-weaving-draft-constraint-studio",
  "modules": [
    "structured-editor-v1",
    "entity-collection-v1",
    "artifact-transfer-v1"
  ],
  "bindings": {
    "editor_object_types": [
      "grid-cell",
      "range"
    ],
    "editor_properties": [
      "color",
      "brush",
      "repeat"
    ],
    "editor_modes": [
      "paint",
      "erase"
    ],
    "editor_operations": [
      "select",
      "update_property",
      "switch_mode",
      "preview",
      "set_content"
    ],
    "entity": "variant",
    "entity_operations": [
      "create",
      "select",
      "update",
      "delete",
      "toggle"
    ],
    "entity_fields": [
      "name",
      "cells"
    ],
    "artifact_operations": [
      "export",
      "import",
      "copy"
    ],
    "export_formats": [
      "session-json",
      "png"
    ],
    "import_modes": [
      "session-json"
    ]
  },
  "mechanics_exclusions": [
    "Drag-paint / brush stroke geometry stays Playwright (gesture mechanics)",
    "Mirror-partner cell painting during continuous drag stays Playwright-observed",
    "Raw file paths/blobs forbidden in WebMCP args",
    "PNG rasterization fidelity and clipboard copy stay Playwright-observed"
  ]
};

data.assignments.push(newTask);
fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log("Updated assignments");
