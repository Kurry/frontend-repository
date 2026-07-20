const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/styles.css', 'utf-8');

// Ensure status badges colors
// Carbon's 'warm-gray' might not be amber, so let's style `.status-retrying` specifically.
// pending gray, running blue, retrying amber, failed red, complete green
code += `
.status-tag.status-pending { background-color: #e0e0e0; color: #161616; }
.status-tag.status-running { background-color: #edf5ff; color: #0f62fe; border: 1px solid #0f62fe; }
.status-tag.status-retrying { background-color: #fcf1cd; color: #8a6800; border: 1px solid #8a6800; }
.status-tag.status-failed { background-color: #fff1f1; color: #da1e28; border: 1px solid #da1e28; }
.status-tag.status-complete { background-color: #defbe6; color: #198038; border: 1px solid #198038; }
`;

fs.writeFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/styles.css', code);
