const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-data-tracking-admin-analytics-dashboard/solution/app/src/App.tsx', 'utf8');
const viewMatch = code.match(/const view = \(\) => {[\s\S]*?};/);
if (viewMatch) {
  console.log("Found view function:", viewMatch[0]);
} else {
  console.log("Could not find view function!");
}
