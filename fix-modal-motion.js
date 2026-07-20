const fs = require('fs');
const path = 'tasks/frontend-productivity-md-uy/solution/app/src/lib/components/DocumentPackageModal.svelte';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("<script lang=\"ts\">", "<script lang=\"ts\">\n  import { fade } from 'svelte/transition';");
content = content.replace(`<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50 transition-opacity" />`,
  `<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" transition={fade} />`);
content = content.replace(`<Dialog.Content class="bg-popover text-popover-foreground fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg">`,
  `<Dialog.Content class="bg-popover text-popover-foreground fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg" transition={fade} transitionConfig={{ duration: 150 }}>`);

fs.writeFileSync(path, content, 'utf8');
