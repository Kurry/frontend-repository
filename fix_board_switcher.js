const fs = require('fs');
let path = 'tasks/frontend-productivity-scribblespace/solution/app/src/components/BoardSwitcher.vue';
let text = fs.readFileSync(path, 'utf8');

text = text.replace(/:class="\{'border-b-0 border-\[#6D5BD0\] shadow-sm z-10': board\.id === store\.activeBoardId\}"/g, ':class="{\'border-b-0 border-[#6D5BD0] shadow-sm z-10 bg-[#6D5BD0] text-white\': board.id === store.activeBoardId}"');

text = text.replace(/:class="board\.id === store\.activeBoardId \? 'font-semibold text-gray-900' : 'text-gray-600'"/g, ':class="board.id === store.activeBoardId ? \'font-semibold text-white\' : \'text-gray-600\'"');

// The active Connect tool and the active board tab are visually highlighted in the accent color so mode and board are always clear.
// Let's also check if hovering the active board changes text-white to text-gray-900 due to hover:bg-gray-50
text = text.replace(/hover:bg-gray-50/g, ''); // we can manage hover differently if needed, or just let it inherit

fs.writeFileSync(path, text);
