const fs = require('fs');
const path = 'packages/corpuscheck/src/corpuscheck/schemas/webmcp-task-sources.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

data["frontend-creative-tools-weaving-draft-constraint-studio"] = {
  "source": "Task proposal: Weaving Draft Constraint Studio",
  "instruction": "tasks/frontend-creative-tools-weaving-draft-constraint-studio/instruction.md",
  "description": "Weaving draft constraint studio good-app eval."
};

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log("Updated task sources");
