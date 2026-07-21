const fs = require('fs');
const content = fs.readFileSync('tasks/frontend-landing-landonorris/solution/app/app.js', 'utf8');
const lines = content.split('\n');
const match = lines.findIndex(l => l.includes('text-impact') || l.includes('footer-statement'));
if (match !== -1) {
  console.log(lines.slice(Math.max(0, match - 20), match + 40).join('\n'));
} else {
  console.log('Not found in app.js');
}
