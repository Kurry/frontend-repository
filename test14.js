const fs = require('fs');
const js = fs.readFileSync('tasks/frontend-landing-landonorris/solution/app/app.js', 'utf8');
const match = js.split('\n').findIndex(l => l.includes('function renderCounts()'));
console.log(js.split('\n').slice(Math.max(0, match - 5), match + 15).join('\n'));
