const fs = require('fs');
const file = 'tasks/frontend-game-mineclash/solution/app/src/components/RoundResultOverlay.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `import { component$, useContext, useVisibleTask$ } from '@builder.io/qwik';`,
  `import { component$, useContext, useVisibleTask$, useSignal } from '@builder.io/qwik';`
);

code = code.replace(
  `useVisibleTask$(() => {
    playRoundEnd(store.soundEnabled, playerWon);
  });`,
  `const ref = useSignal<HTMLElement>();

  useVisibleTask$(() => {
    playRoundEnd(store.soundEnabled, playerWon);

    // Focus trapping logic
    const prevActiveElement = document.activeElement as HTMLElement | null;

    if (ref.value) {
      const focusableElements = ref.value.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length) {
        focusableElements[0].focus();
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          startNextRound(store);
        } else if (e.key === 'Tab') {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        if (prevActiveElement) {
          prevActiveElement.focus();
        }
      };
    }
  });`
);

code = code.replace(
  `class="panel animate-slide-in"`,
  `class="panel animate-slide-in"
        ref={ref}`
);

fs.writeFileSync(file, code);
