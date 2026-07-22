import { h } from 'preact';
import { useSignal } from '@preact/signals';
import { currentOpening, activeGame, moveEntryError, practiceActive } from '../store';
import { tryNotation } from '../boardPlay';

// Keyboard move entry (beyond-spec): type SAN, UCI or a target square to play a
// move on the board, complementing click-only piece movement.
export function MoveEntry() {
  const text = useSignal('');
  const open = currentOpening.value;
  const replaying = !!activeGame.value;
  const err = moveEntryError.value;

  const submit = (e) => {
    e.preventDefault();
    if (replaying) return;
    const value = text.value;
    if (!value.trim()) return;
    const res = tryNotation(value);
    if (res.ok) {
      text.value = '';
      moveEntryError.value = '';
    } else {
      moveEntryError.value = res.error;
    }
  };

  if (!open) return null;

  return (
    <form class="move-entry mt-3" onSubmit={submit}>
      <label class="block text-sm font-medium mb-1" for="move-entry">Enter a move (SAN or UCI)</label>
      <div class="flex gap-2 flex-wrap items-stretch">
        <input
          id="move-entry"
          type="text"
          class="text-input flex-1 min-w-[140px]"
          placeholder={practiceActive.value ? 'e.g. Nf3 or e2e4' : 'e.g. Nf3, exd5, e2e4 or e4'}
          value={text.value}
          onInput={e => { text.value = e.target.value; if (moveEntryError.value) moveEntryError.value = ''; }}
          aria-describedby="move-entry-help move-entry-error"
          aria-invalid={err ? 'true' : undefined}
          disabled={replaying}
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" class="btn-secondary" disabled={replaying || !text.value.trim()}>
          Play move
        </button>
      </div>
      <p id="move-entry-help" class="text-sm text-neutral-600 mt-1">
        Type algebraic notation (Nf3), coordinates (e2e4), or a destination square (e4) and press Play move or Enter.
      </p>
      <p id="move-entry-error" aria-live="polite" class="field-error mt-1">{err}</p>
    </form>
  );
}
