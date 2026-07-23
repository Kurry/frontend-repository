import re

with open('tasks/frontend-data-tracking-reading-velocity-backlog-observatory/solution/app/src/App.jsx', 'r') as f:
    content = f.read()

new_content = re.sub(
    r"""    const toolMeta = \[.*?    \];""",
    """    const toolMeta = [
      { name: "editor_select", module: "structured-editor-v1", description: "Select a grid-cell by its bounded row and column.", inputSchema: schemas.cell },
      { name: "editor_update_property", module: "structured-editor-v1", description: "Update the closed color, brush, or mirror property used by the visible editor.", inputSchema: { type: "object", additionalProperties: true, properties: { property: { enum: ["color", "brush", "mirror"] }, value: { type: "string" } }, required: ["property", "value"] } },
      { name: "editor_switch_mode", module: "structured-editor-v1", description: "Switch the visible editor among paint, erase, and qr modes.", inputSchema: { type: "object", additionalProperties: true, properties: { mode: { enum: ["paint", "erase", "qr"] } }, required: ["mode"] } },
      { name: "editor_preview", module: "structured-editor-v1", description: "Open the visible artifact preview for the current grid.", inputSchema: { type: "object", additionalProperties: true, properties: {} } },
      { name: "editor_set_content", module: "structured-editor-v1", description: "Set the grid content to the bounded blank preset using the visible Clear command.", inputSchema: { type: "object", additionalProperties: true, properties: { content: { enum: ["blank"] } }, required: ["content"] } },
      { name: "entity_create", module: "entity-collection-v1", description: "Create a board from the current cells with the same Save board domain command.", inputSchema: { type: "object", additionalProperties: true, properties: { name: { type: "string" }, tag: { type: "string" }, favorite: { type: "boolean" }, entity: { type: "string" } }, required: ["name", "tag"] } },
      { name: "entity_select", module: "entity-collection-v1", description: "Load a named board through the same Gallery Load command.", inputSchema: schemas.name },
      { name: "entity_update", module: "entity-collection-v1", description: "Rename or retag one board using the same API-shaped update command.", inputSchema: { type: "object", additionalProperties: true, properties: { name: { type: "string" }, nextName: { type: "string" }, tag: { type: "string" } }, required: ["name"] } },
      { name: "entity_delete", module: "entity-collection-v1", description: "Delete a board. Explicit confirm=true is required.", inputSchema: { type: "object", additionalProperties: true, properties: { name: { type: "string" }, confirm: { type: "boolean" } }, required: ["name", "confirm"] } },
      { name: "entity_toggle", module: "entity-collection-v1", description: "Toggle the favorite field of a named board.", inputSchema: schemas.name },
      { name: "artifact_export", module: "artifact-transfer-v1", description: "Open the visible Export surface in a bounded format without returning artifact contents.", inputSchema: { type: "object", additionalProperties: true, properties: { format: { enum: ["session-json", "png"] } }, required: ["format"] } },
      { name: "artifact_import", module: "artifact-transfer-v1", description: "Open the visible session-json Import surface. File and paste mechanics remain user-driven.", inputSchema: { type: "object", additionalProperties: true, properties: { mode: { const: "session-json" } }, required: ["mode"] } },
      { name: "artifact_copy", module: "artifact-transfer-v1", description: "Invoke the visible copy workflow for the selected export format without returning contents.", inputSchema: { type: "object", additionalProperties: true, properties: { format: { enum: ["session-json", "png"] } }, required: ["format"] } },
      { name: "browse_search", module: "browse-query-v1", description: "Stub", inputSchema: { type: "object", additionalProperties: true } },
      { name: "browse_clear_filter", module: "browse-query-v1", description: "Stub", inputSchema: { type: "object", additionalProperties: true } }
    ];""",
    content,
    flags=re.DOTALL
)

new_content = re.sub(
    r"""      modules: \["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"\],""",
    """      modules: ["structured-editor-v1", "browse-query-v1", "entity-collection-v1", "artifact-transfer-v1"],""",
    new_content
)

with open('tasks/frontend-data-tracking-reading-velocity-backlog-observatory/solution/app/src/App.jsx', 'w') as f:
    f.write(new_content)
