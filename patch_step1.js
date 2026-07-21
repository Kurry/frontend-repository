const fs = require('fs');

// 1. src/App.jsx: CreateTaskDialog changes
let appContent = fs.readFileSync('src/App.jsx', 'utf8');

// modal={false} -> modal={true}
appContent = appContent.replace('<Dialog.Root open={open} modal={false} onOpenChange={(next) => setOpen(next)}>', '<Dialog.Root open={open} modal={true} onOpenChange={(next) => setOpen(next)}>');

// remove onPointerDownOutside and onInteractOutside
appContent = appContent.replace(/onPointerDownOutside=\{\(event\) => event\.preventDefault\(\)\}\s+onInteractOutside=\{\(event\) => event\.preventDefault\(\)\}/g, '');

// Select label fix
appContent = appContent.replace('<label htmlFor="repository">Repository</label><Controller control={control} name="repository" render={({ field }) => <Select id="repository"', '<label htmlFor="repository-trigger">Repository</label><Controller control={control} name="repository" render={({ field }) => <Select id="repository-trigger"');

fs.writeFileSync('src/App.jsx', appContent);

// 2. ui.jsx: Select id pass-through
// Actually ui.jsx already passes id: <SelectPrimitive.Trigger id={id} className="select-trigger" aria-label={ariaLabel}>
// So no change needed in ui.jsx since id is mapped properly.

// 3. index.css: Reduced motion fix
let cssContent = fs.readFileSync('src/index.css', 'utf8');

cssContent = cssContent.replace(
  /@media\s+\(prefers-reduced-motion:\s+reduce\)\s*\{\s*\*\,\s*\*\:\:before\,\s*\*\:\:after\s*\{\s*animation-duration:\s*\.01ms\s*!important;\s*animation-iteration-count:\s*1\s*!important;\s*scroll-behavior:\s*auto\s*!important;\s*transition-duration:\s*\.01ms\s*!important;\s*\}\s*\}/g,
  `@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}`
);

fs.writeFileSync('src/index.css', cssContent);

console.log('Step 1 patches applied');
