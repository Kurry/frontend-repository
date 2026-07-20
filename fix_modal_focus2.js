const fs = require('fs');
let code = fs.readFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/App.jsx', 'utf8');

// I'll add a simple focus restorer hook and apply it to each modal.
const hookCode = `
function useFocusRestorer(isOpen) {
  const previous = useRef(null)
  useEffect(() => {
    if (isOpen) previous.current = document.activeElement
    else if (previous.current) { const el = previous.current; setTimeout(() => el.focus(), 10) }
  }, [isOpen])
}
`;

if (!code.includes('useFocusRestorer')) {
  code = code.replace(/function SaveSearchModal\(\) \{/, hookCode + 'function SaveSearchModal() {');
  code = code.replace(/function SaveSearchModal\(\) \{\n  const state = useAppStore\(\)/, 'function SaveSearchModal() {\n  const state = useAppStore()\n  useFocusRestorer(state.saveOpen)');
  code = code.replace(/function AddDocumentModal\(\) \{\n  const state = useAppStore\(\)/, 'function AddDocumentModal() {\n  const state = useAppStore()\n  useFocusRestorer(state.addOpen)');
  code = code.replace(/function ImportModal\(\) \{\n  const state = useAppStore\(\)/, 'function ImportModal() {\n  const state = useAppStore()\n  useFocusRestorer(state.importOpen)');
  code = code.replace(/function ExportModal\(\) \{\n  const state = useAppStore\(\)/, 'function ExportModal() {\n  const state = useAppStore()\n  useFocusRestorer(state.exportOpen)');
}

fs.writeFileSync('tasks/frontend-productivity-semantic-search/solution/app/src/App.jsx', code);
