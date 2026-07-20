const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/store.js', 'utf-8');

// Add toggleArtifactPanel and ui.artifactPanelOpen
code = code.replace(
  'paletteOpen: true,\n    artifactMode: \'json\',',
  'paletteOpen: true,\n    artifactPanelOpen: false,\n    artifactMode: \'json\','
);

code = code.replace(
  'togglePalette: () => set((state) => ({ ui: { ...state.ui, paletteOpen: !state.ui.paletteOpen } })),',
  'togglePalette: () => set((state) => ({ ui: { ...state.ui, paletteOpen: !state.ui.paletteOpen } })),\n  toggleArtifactPanel: () => set((state) => ({ ui: { ...state.ui, artifactPanelOpen: !state.ui.artifactPanelOpen } })),'
);

code = code.replace(
  'paletteOpen: width <= 768 ? false : state.ui.paletteOpen,',
  'paletteOpen: width <= 768 ? false : state.ui.paletteOpen,\n      artifactPanelOpen: width <= 768 ? false : state.ui.artifactPanelOpen,'
);

fs.writeFileSync('tasks/frontend-workflow-workflow-builder/solution/app/src/store.js', code);
