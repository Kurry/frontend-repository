from pathlib import Path
import subprocess

# We need the real expected webmcp section to insert.
result = subprocess.run(["uv", "run", "python3", "-c", """
import sys
sys.path.append('../../packages/corpuscheck/src')
from corpuscheck.validate import assignments_by_slug, repository_sources
webmcp, _, _, _ = repository_sources()
assignment = {
  "task": "frontend-data-tracking-reading-velocity-backlog-observatory",
  "modules": [
    "structured-editor-v1",
    "entity-collection-v1",
    "artifact-transfer-v1"
  ],
  "bindings": {
    "editor_object_types": ["book"],
    "editor_properties": ["priority", "track"],
    "editor_modes": ["shelf", "focus"],
    "editor_operations": ["select", "update_property", "switch_mode"],
    "entity": ["plan"],
    "entity_operations": ["select", "update", "toggle"],
    "entity_fields": ["velocity"],
    "artifact_operations": ["export", "import", "copy"],
    "export_formats": ["csv", "ics", "json"],
    "import_modes": ["json"]
  }
}
expected = webmcp.render_instruction_webmcp_section(assignment)
print(expected)
"""], capture_output=True, text=True)

with open('instruction.md', 'r') as f:
    content = f.read()

import re
content = re.sub(r'<delivery>.*', result.stdout, content, flags=re.DOTALL)

with open('instruction.md', 'w') as f:
    f.write(content)
