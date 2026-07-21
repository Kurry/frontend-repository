const fs = require('fs');
const html = fs.readFileSync('tasks/frontend-landing-landonorris/solution/app/index.html', 'utf8');
console.log(html.includes('<nav'));
