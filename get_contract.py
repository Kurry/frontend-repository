import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path("packages/corpuscheck/src").resolve()))
from corpuscheck.webmcp_h3 import render_instruction_webmcp_section

with open("packages/corpuscheck/src/corpuscheck/schemas/webmcp-assignment-map.json") as f:
    assignments = json.load(f)
    if isinstance(assignments, dict):
        assignments = assignments["assignments"]

assignment = next((a for a in assignments if a["task"] == "frontend-creative-tools-stack-trace-path-finder"), None)
if assignment:
    print(render_instruction_webmcp_section(assignment))
else:
    print("Not found")
