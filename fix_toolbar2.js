const fs = require('fs');

let path = 'tasks/frontend-productivity-scribblespace/solution/app/src/components/Toolbar.vue';
let text = fs.readFileSync(path, 'utf8');
// Use index.css btn-primary instead of the local one for proper button styling (min-height, transition, shadow)
text = text.replace(/\.btn-primary \{\n.*text-sm;\n\}/g, '');
text = text.replace(/\.btn-secondary \{\n.*text-sm;\n\}/g, '');
fs.writeFileSync(path, text);
