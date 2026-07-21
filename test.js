const fs = require('fs');

function assertContains(file, str) {
  const content = fs.readFileSync(file, 'utf8');
  if(!content.includes(str)) {
     console.error("Missing in " + file + ": " + str);
  }
}
assertContains('tasks/frontend-productivity-scribblespace/solution/app/src/components/Toolbar.vue', 'rounded-[12px]');
assertContains('tasks/frontend-productivity-scribblespace/solution/app/src/components/MiniMap.vue', 'border-radius: 12px;');
assertContains('tasks/frontend-productivity-scribblespace/solution/app/src/components/CanvasObject.vue', "0 2px 8px rgba(33, 29, 58, 0.12)");
