const fs = require('fs');

let path = 'tasks/frontend-productivity-scribblespace/solution/app/src/components/Toolbar.vue';
let text = fs.readFileSync(path, 'utf8');
// Use the CSS classes defined in index.css instead of overriding them locally, since index.css matches the criteria of Active Tool accent: background-color: var(--color-primary); color: #FFFFFF;
text = text.replace(/\.btn-tool \{\n.*aria-pressed:text-\[#6D5BD0\];\n\}/g, '');
fs.writeFileSync(path, text);
