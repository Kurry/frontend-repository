const fs = require('fs');

let path = 'tasks/frontend-productivity-scribblespace/solution/app/src/components/CanvasObject.vue';
let text = fs.readFileSync(path, 'utf8');
// Fix Flip icon - we can use an SVG icon for flip
let replacement = `<button v-if="obj.type === 'flashcard'" @click.stop="store.updateObject({id: obj.id, updates: { flipped: !obj.flipped }})" class="flex items-center gap-1 text-xs text-[#6D5BD0] bg-[#6D5BD0]/10 px-2 py-1 rounded border border-[#6D5BD0] hover:bg-[#6D5BD0]/20">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
           Flip
        </button>`;

text = text.replace(/<button v-if="obj\.type === 'flashcard'" @click\.stop="store\.updateObject\(\{id: obj\.id, updates: \{ flipped: !obj\.flipped \}\}\)" class="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-600 hover:bg-purple-100">\s*Flip\s*<\/button>/g, replacement);

fs.writeFileSync(path, text);
