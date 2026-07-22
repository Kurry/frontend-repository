const fs = require('fs');
let content = fs.readFileSync('tasks/frontend-creative-tools-comic-panel-rhythm-board-spatial-composer-rn-harbor-artifact/instruction.md', 'utf8');
content = content.replace(/<webmcp_action_contract>[\s\S]*?<\/webmcp_action_contract>/, `<webmcp_action_contract>
<tool name="get_state">
<description>Get current session state</description>
<input_schema>
{
  "type": "object",
  "properties": {}
}
</input_schema>
</tool>
<tool name="import_state">
<description>Import session state</description>
<input_schema>
{
  "type": "object",
  "properties": {
    "session": { "type": "object" }
  },
  "required": ["session"]
}
</input_schema>
</tool>
<tool name="mutate_panel">
<description>Place a selected record in a spatial composer and rebalance capacity.</description>
<input_schema>
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "x": { "type": "number" },
    "y": { "type": "number" },
    "width": { "type": "number" },
    "height": { "type": "number" }
  },
  "required": ["id", "x", "y", "width", "height"]
}
</input_schema>
</tool>
</webmcp_action_contract>`);
fs.writeFileSync('tasks/frontend-creative-tools-comic-panel-rhythm-board-spatial-composer-rn-harbor-artifact/instruction.md', content);
