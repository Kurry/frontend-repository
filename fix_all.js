const fs = require('fs');

// 1. Reduced Motion
const cssFile = 'tasks/frontend-creative-tools-material-theme-studio/solution/app/src/index.css';
let css = fs.readFileSync(cssFile, 'utf8');
if (!css.includes('@media (prefers-reduced-motion: reduce)')) {
    css += `\n
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}\n`;
    fs.writeFileSync(cssFile, css);
}

// 2. Undo/Redo & Import
const themeSliceFile = 'tasks/frontend-creative-tools-material-theme-studio/solution/app/src/store/themeSlice.ts';
let slice = fs.readFileSync(themeSliceFile, 'utf8');
slice = slice.replace(
  /importTheme: \(state, action: PayloadAction<ThemeOptions>\) => {/g,
  `importTheme: (state, action: PayloadAction<ThemeOptions & { name?: string }>) => {`
);
slice = slice.replace(
  /state\.activeOptions = JSON\.parse\(JSON\.stringify\(action\.payload\)\);\n        state\.dirty = true;\n    \},/g,
  `state.activeOptions = JSON.parse(JSON.stringify(action.payload));
        if (action.payload.name) {
            const theme = state.themes.find(t => t.id === state.activeId);
            if (theme) theme.name = action.payload.name;
        }
        state.dirty = true;
    },`
);
fs.writeFileSync(themeSliceFile, slice);

// 3. Import Util
const importThemeFile = 'tasks/frontend-creative-tools-material-theme-studio/solution/app/src/utils/importTheme.ts';
let importTheme = fs.readFileSync(importThemeFile, 'utf8');
importTheme = importTheme.replace(
  /return \{\n    palette: value\.palette,\n    typography: value\.typography,\n    shape: value\.shape,\n    spacing: value\.spacing,\n  \} as ThemeOptions;/g,
  `return {
    name: value.name,
    palette: value.palette,
    typography: value.typography,
    shape: value.shape,
    spacing: value.spacing,
  } as unknown as ThemeOptions & { name?: string };`
);
fs.writeFileSync(importThemeFile, importTheme);

// 4. MCP Bindings
const mcpFile = 'tasks/frontend-creative-tools-material-theme-studio/solution/app/src/mcpBindings.ts';
let mcp = fs.readFileSync(mcpFile, 'utf8');
mcp = mcp.replace(
  /store\.dispatch\(setTab\('saved'\)\);/g,
  `store.dispatch(setTab('saved'));\n        store.dispatch(closeThemeForm());`
);
fs.writeFileSync(mcpFile, mcp);

// 5. Toast
const toastFile = 'tasks/frontend-creative-tools-material-theme-studio/solution/app/src/components/Toast.tsx';
let toast = fs.readFileSync(toastFile, 'utf8');
toast = toast.replace(
  /transition-opacity duration-300 \$\{/g,
  `transition-all duration-300 transform \${`
);
toast = toast.replace(
  /toast\.leaving \? 'opacity-0' : 'opacity-100'/g,
  `toast.leaving ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'`
);
fs.writeFileSync(toastFile, toast);

// 6. Shell
const shellFile = 'tasks/frontend-creative-tools-material-theme-studio/solution/app/src/components/Shell.tsx';
let shell = fs.readFileSync(shellFile, 'utf8');
shell = shell.replace(
  /className="text-xs font-medium uppercase tracking-wide text-blue-600"/g,
  `className="text-xs font-medium uppercase tracking-wide text-blue-600 hover:underline"`
);
shell = shell.replace(
  /className="px-3 py-1\.5 text-sm font-medium text-blue-400 hover:bg-blue-400\/10 rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-h-11"/g,
  `className="px-3 py-1.5 text-sm font-medium text-blue-400 hover:bg-blue-400/10 hover:underline rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-h-11"`
);
shell = shell.replace(
  /<main className="flex-1 overflow-hidden relative">\{children\}<\/main>/g,
  `<main className="flex-1 overflow-hidden lg:overflow-hidden relative flex flex-col">{children}</main>`
);
fs.writeFileSync(shellFile, shell);

// 7. CommandPalette
const cpFile = 'tasks/frontend-creative-tools-material-theme-studio/solution/app/src/components/CommandPalette.tsx';
let cp = fs.readFileSync(cpFile, 'utf8');
cp = cp.replace(
  /\} else if \(event\.key === 'Escape'\) \{\n              event\.preventDefault\(\);\n              onClose\(\);\n            \}/g,
  `} else if (event.key === 'Escape') {
              // Let Overlay capture handle it
            }`
);
fs.writeFileSync(cpFile, cp);

// 8. ComponentsTab
const compFile = 'tasks/frontend-creative-tools-material-theme-studio/solution/app/src/components/ComponentsTab.tsx';
let comp = fs.readFileSync(compFile, 'utf8');
comp = comp.replace(
  /className="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded transition-colors"/g,
  `className="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white hover:underline rounded transition-colors"`
);
fs.writeFileSync(compFile, comp);

// 9. ThemeTools
const toolsFile = 'tasks/frontend-creative-tools-material-theme-studio/solution/app/src/components/ThemeTools.tsx';
let tools = fs.readFileSync(toolsFile, 'utf8');
tools = tools.replace(
  /const deriveHarmonics = \(kind: 'complementary' \| 'analogous' \| 'triadic'\) => \{/g,
  `const deriveHarmonics = (kind: 'complementary' | 'analogous' | 'triadic') => {
    const btn = document.getElementById('swatch-secondary');
    if (btn) {
      btn.classList.add('ring-4', 'ring-white', 'transition-all', 'duration-300');
      setTimeout(() => btn.classList.remove('ring-4', 'ring-white', 'transition-all', 'duration-300'), 500);
    }`
);
tools = tools.replace(
  /className="w-full h-8 rounded border border-gray-600 mb-1"/g,
  `id={"swatch-" + intent} className="w-full h-8 rounded border border-gray-600 mb-1"`
);
tools = tools.replace(
  /<input\n                    type="color"\n                    value=\{color\[ch\]\}\n                    aria-label=\{`\$\{intent\} \$\{ch\} color picker`\}\n                    onChange=\{\(e\) => updateIntent\(intent, ch, e\.target\.value\)\}\n                    className="bg-transparent border-0 w-8 h-8 cursor-pointer p-0 rounded-full shrink-0"\n                  \/>/g,
  `<input
                    type="color"
                    defaultValue={color[ch]}
                    aria-label={\`\${intent} \${ch} color picker\`}
                    onBlur={(e) => updateIntent(intent, ch, e.target.value)}
                    className="bg-transparent border-0 w-8 h-8 cursor-pointer p-0 rounded-full shrink-0"
                  />`
);
if (!tools.includes('setIntentDrafts({});')) {
  tools = tools.replace(
    /const p = activeOptions\.palette;/g,
    `const p = activeOptions.palette;

  useEffect(() => {
    setIntentDrafts({});
    setIntentErrors({});
  }, [activeOptions]);`
  );
  tools = tools.replace(
    /const t = activeOptions\.typography;/g,
    `const t = activeOptions.typography;

  useEffect(() => {
    setFontSizeDraft(null);
    setFontSizeError('');
    setBorderRadiusDraft(null);
    setBorderRadiusError('');
  }, [activeOptions]);`
  );
}
fs.writeFileSync(toolsFile, tools);

// 10. SavedThemes
const savedThemesFile = 'tasks/frontend-creative-tools-material-theme-studio/solution/app/src/components/SavedThemes.tsx';
let savedThemes = fs.readFileSync(savedThemesFile, 'utf8');
savedThemes = savedThemes.replace(
  /className="flex flex-col lg:flex-row h-full bg-\[\#121212\] text-white overflow-hidden p-4 lg:p-8 gap-6 lg:gap-8"/g,
  `className="flex flex-col lg:flex-row h-full bg-[#121212] text-white overflow-auto lg:overflow-hidden p-4 lg:p-8 gap-6 lg:gap-8"`
);
savedThemes = savedThemes.replace(
  /className="flex flex-col h-full bg-\[\#121212\] text-white overflow-hidden p-4 lg:p-8"/g,
  `className="flex flex-col h-full bg-[#121212] text-white overflow-auto p-4 lg:p-8"`
);
savedThemes = savedThemes.replace(
  /exiting \? 'card-exiting' : 'animate-card-in'/g,
  "exiting ? 'animate-card-out' : 'animate-card-in'"
);
savedThemes = savedThemes.replace(
  /onClick=\{\(\) => \{ dispatch\(openThemeForm\(\{ mode: 'rename', themeId: t\.id \}\)\); \}\}/g,
  `onClick={() => { dispatch(openThemeForm({ mode: 'rename', themeId: t.id })); }}\n                      className="focus-visible:ring-2 focus-visible:ring-blue-400 outline-none"`
);
savedThemes = savedThemes.replace(
  /onClick=\{\(\) => setConfirmDeleteId\(t\.id\)\}/g,
  `onClick={() => setConfirmDeleteId(t.id)}\n                      className="focus-visible:ring-2 focus-visible:ring-blue-400 outline-none"`
);
savedThemes = savedThemes.replace(
  /<Button variant="contained" onClick=\{saveVersion\} sx=\{\{ minHeight: 44 \}\}>/g,
  `<Button variant="contained" onClick={saveVersion} sx={{ minHeight: 44 }} className="focus-visible:ring-2 focus-visible:ring-blue-400 outline-none">`
);
fs.writeFileSync(savedThemesFile, savedThemes);

// 11. EditorSidebar
const editorSidebarFile = 'tasks/frontend-creative-tools-material-theme-studio/solution/app/src/components/EditorSidebar.tsx';
let editorSidebar = fs.readFileSync(editorSidebarFile, 'utf8');
editorSidebar = editorSidebar.replace(
  /onClick=\{\(\) => dispatch\(saveTheme\(\)\)\}/g,
  `onClick={() => dispatch(saveTheme())} className="focus-visible:ring-2 focus-visible:ring-blue-400 outline-none"`
);
editorSidebar = editorSidebar.replace(
  /onClick=\{handleUndo\}/g,
  `onClick={handleUndo} className="focus-visible:ring-2 focus-visible:ring-blue-400 outline-none"`
);
editorSidebar = editorSidebar.replace(
  /onClick=\{handleRedo\}/g,
  `onClick={handleRedo} className="focus-visible:ring-2 focus-visible:ring-blue-400 outline-none"`
);
editorSidebar = editorSidebar.replace(
  /onClick=\{handleCopy\}/g,
  `onClick={handleCopy} className="focus-visible:ring-2 focus-visible:ring-blue-400 outline-none"`
);
fs.writeFileSync(editorSidebarFile, editorSidebar);

// 12. Overlay
const overlayFile = 'tasks/frontend-creative-tools-material-theme-studio/solution/app/src/components/Overlay.tsx';
let overlay = fs.readFileSync(overlayFile, 'utf8');
overlay = overlay.replace(
  /if \(overlayStack\[overlayStack\.length - 1\] === id\) \{\n          event\.preventDefault\(\);\n          event\.stopPropagation\(\);\n          onCloseRef\.current\(\);\n        \}/g,
  `if (overlayStack.includes(id)) {
          event.preventDefault();
          event.stopPropagation();
          onCloseRef.current();
        }`
);
overlay = overlay.replace(
  /aria-modal="true"/g,
  `aria-modal={backdrop ? "true" : "false"}`
);
fs.writeFileSync(overlayFile, overlay);
