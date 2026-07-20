const fs = require('fs');

const fixMotion = (path) => {
  let content = fs.readFileSync(path, 'utf8');
  if (!content.includes("prefersReducedMotion")) {
	content = content.replace("import { fade } from 'svelte/transition';", "import { fade } from 'svelte/transition';\n\timport { prefersReducedMotion } from 'svelte/motion';");
  }

  content = content.replace(/in:fade\|global=\{\{ duration: 150 \}\} out:fade\|global=\{\{ duration: 150 \}\}/g,
  "in:fade|global={{ duration: prefersReducedMotion.current ? 0 : 150 }} out:fade|global={{ duration: prefersReducedMotion.current ? 0 : 150 }}");
  fs.writeFileSync(path, content, 'utf8');
}

fixMotion('tasks/frontend-productivity-md-uy/solution/app/src/lib/components/Editor.svelte');
fixMotion('tasks/frontend-productivity-md-uy/solution/app/src/lib/components/Preview.svelte');
fixMotion('tasks/frontend-productivity-md-uy/solution/app/src/lib/components/Presentation.svelte');

const pagePath = 'tasks/frontend-productivity-md-uy/solution/app/src/routes/[...path]/+page.svelte';
let pageContent = fs.readFileSync(pagePath, 'utf8');
pageContent = pageContent.replace(/transitionConfig=\{\{ duration: 150 \}\}/g, "transitionConfig={{ duration: prefersReducedMotion.current ? 0 : 150 }}");
pageContent = pageContent.replace(/transition=\{fade\}/g, "transition={fade} transitionConfig={{ duration: prefersReducedMotion.current ? 0 : 150 }}");
fs.writeFileSync(pagePath, pageContent, 'utf8');

const modalPath = 'tasks/frontend-productivity-md-uy/solution/app/src/lib/components/DocumentPackageModal.svelte';
let modalContent = fs.readFileSync(modalPath, 'utf8');
modalContent = modalContent.replace("import { fade } from 'svelte/transition';", "import { fade } from 'svelte/transition';\n\timport { prefersReducedMotion } from 'svelte/motion';");
modalContent = modalContent.replace(/transitionConfig=\{\{ duration: 150 \}\}/g, "transitionConfig={{ duration: prefersReducedMotion.current ? 0 : 150 }}");
modalContent = modalContent.replace(/transition=\{fade\} \/>/g, "transition={fade} transitionConfig={{ duration: prefersReducedMotion.current ? 0 : 150 }} />");
fs.writeFileSync(modalPath, modalContent, 'utf8');
