const fs = require('fs');
const file = 'tasks/frontend-game-mineclash/solution/app/src/components/MatchCompleteScreen.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `import { component$, useContext } from '@builder.io/qwik';`,
  `import { component$, useContext, useSignal, useVisibleTask$ } from '@builder.io/qwik';`
);

code = code.replace(
  `export const MatchCompleteScreen = component$(() => {
  const store = useContext(AppCtx);
  const playerWon = store.playerMatchWins >= 2;`,
  `export const MatchCompleteScreen = component$(() => {
  const store = useContext(AppCtx);
  const playerWon = store.playerMatchWins >= 2;
  const ref = useSignal<HTMLElement>();

  useVisibleTask$(() => {
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
          store.phase = 'setup';
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
  `return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>`,
  `return (
    <div class="overlay" style={{ zIndex: 200 }}>
      <div
        ref={ref}
        class="panel animate-slide-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-complete-title"
        style={{ width: '90%', maxWidth: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      >`
);

code = code.replace(
  `<h1 style={{ fontSize: '30px', fontWeight: '800', margin: '0 0 8px', textAlign: 'center', color: playerWon ? '#4ADE80' : '#EF4444' }}>`,
  `<h1 id="match-complete-title" style={{ fontSize: '30px', fontWeight: '800', margin: '0 0 8px', textAlign: 'center', color: playerWon ? '#4ADE80' : '#EF4444' }}>`
);

code = code.replace(
  `</button>
      </div>
    </div>
  );`,
  `</button>
      </div>
    </div>
    </div>
  );`
);

fs.writeFileSync(file, code);
