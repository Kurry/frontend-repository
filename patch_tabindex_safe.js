const fs = require('fs');
let app = fs.readFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', 'utf8');

app = app.replace(
  'useKeyboardPalette(setPaletteOpen)',
  `useKeyboardPalette(setPaletteOpen)
  useEffect(() => {
    const interval = setInterval(() => {
      document.querySelectorAll('button.mantine-NumberInput-control, button.mantine-Pill-remove, button.mantine-InputClearButton-root, button.mantine-CloseButton-root').forEach(b => {
        if (b.getAttribute('tabindex') === '-1' && !b.hasAttribute('disabled')) {
          b.setAttribute('tabindex', '0');
        }
      });
    }, 500);
    return () => clearInterval(interval);
  }, [])`
);

fs.writeFileSync('tasks/frontend-data-tracking-judge-ab-lab/solution/app/src/App.jsx', app);
