const fs = require('fs');
const content = fs.readFileSync('tasks/frontend-landing-landonorris/solution/app/app.js', 'utf8');
const lines = content.split('\n');
const match = lines.findIndex(l => l.includes('data-split-text'));
if (match !== -1) {
  console.log(lines.slice(Math.max(0, match - 10), match + 30).join('\n'));
} else {
  console.log('Not found in app.js');
}
