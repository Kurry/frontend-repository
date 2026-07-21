const fs = require('fs');
let path = 'tasks/frontend-productivity-scribblespace/solution/app/src/components/CanvasObject.vue';
let text = fs.readFileSync(path, 'utf8');
console.log(text.includes('0 2px 8px rgba(33, 29, 58, 0.12)'));
