import { h } from 'preact';
import {
  currentOpening, activeGame, selectedNodeId, exitPractice,
  clearBoardInteraction, practiceActive
} from '../store';

export function NotableGames() {
  const opening = currentOpening.value;
  if (!opening || !opening.notableGames?.length) return null;

  const game = activeGame.value;

  const loadGame = (g) => {
    if (practiceActive.value) exitPractice();
    selectedNodeId.value = 'root';
    clearBoardInteraction();
    activeGame.value = {
      title: `${g.white} vs ${g.black}`,
      moves: g.moves,
      index: -1
    };
  };

  return (
    <section class="card mb-4">
      <h3 class="mb-3">Notable games</h3>
      <ul class="space-y-2 list-none m-0 p-0">
        {opening.notableGames.map((g, i) => (
          <li key={i} class="border border-neutral-400 rounded-[10px] p-3 text-base">
            <div class="flex justify-between items-start gap-2 flex-wrap">
              <div>
                <span class="font-semibold">{g.white}</span>
                <span class="text-neutral-600 mx-1">vs</span>
                <span class="font-semibold">{g.black}</span>
              </div>
              <span class="text-neutral-700 whitespace-nowrap stat-figures">{g.result}</span>
            </div>
            <div class="text-sm text-neutral-600 mt-0.5">{g.event}, {g.year}</div>
            <div class="flex gap-2 mt-2">
              <button
                type="button"
                class="btn-secondary btn-compact"
                onClick={() => loadGame(g)}
              >
                Load
              </button>
            </div>
          </li>
        ))}
      </ul>
      {game && (
        <div class="mt-3 border-t border-neutral-400 pt-3">
          <div class="text-base font-semibold text-[var(--color-primary)] mb-1">
            Replaying {game.title}
          </div>
          <div class="text-base stat-figures mb-2" role="status">
            Move {game.index + 1} of {game.moves.length}
          </div>
          <p class="text-sm text-neutral-600 mb-2">Use Previous move and Next move beside the board to step through the game</p>
          <button
            type="button"
            class="btn-secondary btn-compact"
            onClick={() => { activeGame.value = null; }}
          >
            Close
          </button>
        </div>
      )}
    </section>
  );
}
