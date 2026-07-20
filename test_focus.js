const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/App.jsx', 'utf8');

// Carbon's Modal by default does not trap focus correctly sometimes unless `hasScrollingContent` or similar is used, or maybe we need to manage focus manually or simply use `preventCloseOnClickOutside` and rely on Carbon, BUT Carbon has `preventCloseOnClickOutside` property which we added. The issue says "Tab moved focus to background... Escape did not restore focus".
// Let's add a focus lock component or use `ref` to restore focus.
