import * as fs from 'fs';
let content = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/components/App.svelte', 'utf-8');

// The reviewer mentioned focus traps missing.
// We need to implement a simple focus trap for the dialog.
// In App.svelte, there's a new-game dialog.

const trapScript = `
  function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (showNewGameConfirm) showNewGameConfirm = false;
      if (showDeleteConfirm) showDeleteConfirm = null;
    }

    // Simple focus trap logic for dialogs
    if (event.key === 'Tab' && (showNewGameConfirm || showDeleteConfirm)) {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return;
      const focusableElements = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    }
  }
`;

content = content.replace(/function handleGlobalKeydown\(event: KeyboardEvent\) \{[\s\S]*?\}\n  \}/, trapScript);


fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/components/App.svelte', content);
