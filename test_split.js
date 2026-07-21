const fs = require('fs');
const js = fs.readFileSync('tasks/frontend-landing-landonorris/solution/app/app.js', 'utf8');
console.log(js.includes('function setupSplitText(sel, opts = {})'));
