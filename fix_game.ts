import * as fs from 'fs';

let content = fs.readFileSync('tasks/frontend-game-dare-night/solution/app/src/components/GameScreen.svelte', 'utf-8');

// 1. Add new props
const newProps = `
    onStreamDeliverOutOfOrder: () => void;
    onExportJSON: () => void;
    onCopyJSON: () => void;
    onSaveProgress: () => void;
    winner: string | null;
    turnLogLength: number;
`;
content = content.replace("    onStreamDeliverOutOfOrder: () => void;", newProps);

const destructuredProps = `
    onStreamDeliverOutOfOrder,
    onExportJSON,
    onCopyJSON,
    onSaveProgress,
    winner,
    turnLogLength,
`;
content = content.replace("    onStreamDeliverOutOfOrder,", destructuredProps);

// 2. Add Export / Save Progress buttons to the header or below it
// The spec says: the play screen shows whose turn it is above the card area, a Draw card control, a Start new game control, a View scores control, a Save Progress control, and Export Session and Copy Session JSON controls
const newControls = `
  <!-- Session Controls -->
  <div class="flex flex-wrap items-center justify-center gap-2 mb-4 max-w-lg mx-auto w-full">
    <button
      class="px-4 py-2 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
      style="background-color: #222; color: white;"
      onclick={onSaveProgress}
      disabled={turnLogLength === 0 || winner !== null}
    >
      Save Progress
    </button>
    <button
      class="px-4 py-2 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md"
      style="background-color: #222; color: white;"
      onclick={onExportJSON}
    >
      Export Session
    </button>
    <button
      class="px-4 py-2 rounded-full bg-white text-sm font-medium border-2 border-black hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
      onclick={onCopyJSON}
    >
      Copy Session JSON
    </button>
  </div>
`;

content = content.replace("<!-- Current Player -->", newControls + "\n  <!-- Current Player -->");

// 3. Add Winner Banner and disable controls if winner is declared
const currentTurnReplacement = `
  <!-- Current Player / Winner -->
  <div class="text-center mb-4 max-w-lg mx-auto w-full" aria-live="polite">
    {#if winner}
      <div class="bg-yellow-200 border-2 border-yellow-500 rounded-xl p-4 mb-2 shadow-lg">
        <h2 class="text-3xl font-bold text-yellow-900 mb-1">🎉 Winner! 🎉</h2>
        <p class="text-xl font-bold text-yellow-800">{winner} reached 10 points!</p>
      </div>
    {:else}
      <p class="text-black text-sm mb-1">Current turn</p>
      <h2 class="text-2xl font-bold" style="color: var(--color-accent);">{currentPlayer}'s turn</h2>
    {/if}
  </div>
`;
content = content.replace(/<!-- Current Player -->[\s\S]*?<\/div>/, currentTurnReplacement);

// 4. Disable Done / Skip / Draw Card when winner is present
content = content.replace(
  "onclick={onSkip}",
  "onclick={onSkip}\n          disabled={winner !== null}"
);
content = content.replace(
  "onclick={onDone}",
  "onclick={onDone}\n          disabled={winner !== null}"
);
content = content.replace(
  "onclick={onDrawCard}",
  "onclick={onDrawCard}\n          disabled={winner !== null}"
);

// 5. Update Undo last turn button disabling
content = content.replace(
  "{#if canUndo}",
  "{#if canUndo && winner === null}"
);


fs.writeFileSync('tasks/frontend-game-dare-night/solution/app/src/components/GameScreen.svelte', content);
