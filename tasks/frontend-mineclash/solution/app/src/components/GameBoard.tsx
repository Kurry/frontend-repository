import { component$, useContext } from '@builder.io/qwik';
import { AppCtx } from '../context';
import { TileCell } from './TileCell';

export const GameBoard = component$(() => {
  const store = useContext(AppCtx);
  const { rows, cols } = store;

  // Cap tile size at 56px on desktop, fluid on mobile
  const maxGridWidth = cols * 56 + (cols - 1) * 2;

  return (
    <div style={{ width: '100%', maxWidth: `${maxGridWidth}px`, margin: '0 auto' }}>
      <div
        class="game-grid"
        aria-label={`${rows} by ${cols} minefield`}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '2px',
          width: '100%',
        }}
      >
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => (
            <TileCell key={`${r}-${c}`} row={r} col={c} />
          ))
        )}
      </div>
    </div>
  );
});
