const fs = require('fs');

let path = 'tasks/frontend-productivity-scribblespace/solution/app/src/components/CanvasObject.vue';
let text = fs.readFileSync(path, 'utf8');

text = text.replace(/boxShadow: isSearchHighlight \? '0 0 0 4px #E0A030' :\s*isConnectSource \? '0 0 0 3px #3F9E6E' :\s*isSelected \? undefined : '0 2px 8px rgba\(0,0,0,0\.12\)'/g, "boxShadow: isSearchHighlight ? '0 0 0 4px #E0A030' : isConnectSource ? '0 0 0 3px #3F9E6E' : isSelected ? undefined : (obj.type === 'note' || obj.type === 'flashcard') ? '0 2px 8px rgba(33, 29, 58, 0.12)' : 'none'");

fs.writeFileSync(path, text);
