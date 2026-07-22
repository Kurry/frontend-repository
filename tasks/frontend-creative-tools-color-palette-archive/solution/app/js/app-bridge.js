// Bridges editor/tray delete requests through the shared confirmation dialog
// and the card-exit animation, without creating an editor↔overlays cycle.
import { deletePalettes, ui } from './store.js';
import { confirmDialog } from './overlays.js';
import { announce, prefersReducedMotion } from './lib.js';

export function requestDelete(ids, onDone) {
  const valid = ids.filter(Boolean);
  if (valid.length === 0) return;
  const n = valid.length;
  confirmDialog({
    title: n === 1 ? 'Delete this palette?' : `Delete ${n} palettes?`,
    body:
      n === 1
        ? 'It is removed from every layout and from the export previews. Undo restores it.'
        : `All ${n} are removed from every layout and from the export previews. Undo restores them.`,
    confirmLabel: n === 1 ? 'Delete palette' : `Delete ${n} palettes`,
    onConfirm: () => animatedDelete(valid, onDone),
  });
}

export function animatedDelete(ids, onDone) {
  const n = ids.length;
  deletePalettes(ids);
  announce(
    n === 1
      ? 'Palette deleted — Undo restores it.'
      : `${n} palettes deleted — Undo restores them.`
  );
  onDone?.();
}
