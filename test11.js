const fs = require('fs');
const css = fs.readFileSync('tasks/frontend-landing-landonorris/solution/app/app.css', 'utf8');
const match = css.split('\n').findIndex(l => l.includes('.nav {'));
console.log(css.split('\n').slice(Math.max(0, match - 5), match + 15).join('\n'));
