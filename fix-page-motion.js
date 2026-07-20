const fs = require('fs');
const path = 'tasks/frontend-productivity-md-uy/solution/app/src/routes/[...path]/+page.svelte';
let content = fs.readFileSync(path, 'utf8');

// Use transitions in modal backgrounds and content
content = content.replace(/<Dialog\.Overlay class="fixed inset-0 z-50 bg-black\/50 transition-opacity" \/>/g,
  `<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" transition={fade} />`);
content = content.replace(/<Dialog\.Content class="bg-popover text-popover-foreground fixed left-\[50%\] top-\[50%\] z-50 w-full max-w-md translate-x-\[-50%\] translate-y-\[-50%\] rounded-lg border p-6 shadow-lg outline-none">/g,
  `<Dialog.Content class="bg-popover text-popover-foreground fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg outline-none" transition={fade} transitionConfig={{ duration: 150 }}>`);
content = content.replace(/<Dialog\.Content class="bg-popover text-popover-foreground fixed left-\[50%\] top-\[50%\] z-50 w-full max-w-sm translate-x-\[-50%\] translate-y-\[-50%\] rounded-lg border p-6 shadow-lg outline-none">/g,
  `<Dialog.Content class="bg-popover text-popover-foreground fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg outline-none" transition={fade} transitionConfig={{ duration: 150 }}>`);

fs.writeFileSync(path, content, 'utf8');
