const fs = require('fs');
const path = 'tasks/frontend-productivity-md-uy/solution/app/src/routes/[...path]/+page.svelte';
let content = fs.readFileSync(path, 'utf8');

const imports = `import { fade, slide } from 'svelte/transition';
import { cubicInOut } from 'svelte/easing';
import { prefersReducedMotion } from 'svelte/motion';
import { derived } from 'svelte/store';`;
content = content.replace("import { superForm } from 'sveltekit-superforms';", imports + "\nimport { superForm } from 'sveltekit-superforms';");

content = content.replace("export const prerender = \"auto\";", "");

fs.writeFileSync(path, content, 'utf8');

const editorPath = 'tasks/frontend-productivity-md-uy/solution/app/src/lib/components/Editor.svelte';
let editorContent = fs.readFileSync(editorPath, 'utf8');
editorContent = editorContent.replace("class:hidden={!isVisible}>", "class:hidden={!isVisible} in:fade|global={{ duration: 150 }} out:fade|global={{ duration: 150 }}>");
fs.writeFileSync(editorPath, editorContent, 'utf8');

const previewPath = 'tasks/frontend-productivity-md-uy/solution/app/src/lib/components/Preview.svelte';
let previewContent = fs.readFileSync(previewPath, 'utf8');
previewContent = previewContent.replace("class:hidden={!isVisible}>", "class:hidden={!isVisible} in:fade|global={{ duration: 150 }} out:fade|global={{ duration: 150 }}>");
fs.writeFileSync(previewPath, previewContent, 'utf8');

const presentPath = 'tasks/frontend-productivity-md-uy/solution/app/src/lib/components/Presentation.svelte';
let presentContent = fs.readFileSync(presentPath, 'utf8');
presentContent = presentContent.replace("class:hidden={!isVisible}", "class:hidden={!isVisible} in:fade|global={{ duration: 150 }} out:fade|global={{ duration: 150 }}");
fs.writeFileSync(presentPath, presentContent, 'utf8');
