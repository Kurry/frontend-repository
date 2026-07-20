const fs = require('fs');

const fixMotion = (path) => {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace("<script lang=\"ts\">", "<script lang=\"ts\">\n\timport { fade } from 'svelte/transition';");
  fs.writeFileSync(path, content, 'utf8');
}

fixMotion('tasks/frontend-productivity-md-uy/solution/app/src/lib/components/Editor.svelte');
fixMotion('tasks/frontend-productivity-md-uy/solution/app/src/lib/components/Preview.svelte');
fixMotion('tasks/frontend-productivity-md-uy/solution/app/src/lib/components/Presentation.svelte');
