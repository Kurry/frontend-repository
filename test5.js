const fs = require('fs');
const html = fs.readFileSync('tasks/frontend-landing-landonorris/solution/app/index.html', 'utf8');
const match = html.split('\n').findIndex(l => l.includes('data-newsletter-form'));
console.log(html.split('\n').slice(Math.max(0, match - 5), match + 15).join('\n'));
