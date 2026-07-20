const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/App.jsx', 'utf-8');

if (!code.includes('<ArtifactPanel />')) {
  console.log("Adding ArtifactPanel...");
  code = code.replace(
    '<SavedPanel />\n      </main>',
    '<SavedPanel />\n        <ArtifactPanel />\n      </main>'
  );
  fs.writeFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/App.jsx', code);
}
