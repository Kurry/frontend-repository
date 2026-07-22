import { useStore } from '../store';
import { clsx } from 'clsx';
import { useState, useRef } from 'react';
import type { MouseEvent } from 'react';

export function Proof() {
  const poster = useStore(state => state.poster);
  const cells = useStore(state => state.cells);
  const selectedCells = useStore(state => state.selectedCells);
  const selectCells = useStore(state => state.selectCells);

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = () => {
    setIsDragging(true);
    selectCells([]);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handlePointerMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate cell under pointer
    const cellW = rect.width / poster.columns;
    const cellH = rect.height / poster.rows;
    const col = Math.floor(x / cellW);
    const row = Math.floor(y / cellH);

    if (row >= 0 && row < poster.rows && col >= 0 && col < poster.columns) {
      const cellId = `c-r${row}-c${col}`;
      if (!selectedCells.has(cellId)) {
        const next = new Set(selectedCells);
        next.add(cellId);
        selectCells(Array.from(next));
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">Composite Proof</h2>
      <div
        ref={containerRef}
        className="relative border border-gray-300 touch-none cursor-crosshair overflow-hidden"
        style={{ width: '400px', height: '300px' }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        {cells.map(cell => {
          const isSelected = selectedCells.has(cell.cellId);
          return (
            <div
              key={cell.cellId}
              className={clsx(
                "absolute transition-colors",
                isSelected && "ring-1 ring-inset ring-white z-10"
              )}
              style={{
                left: `${(cell.col / poster.columns) * 100}%`,
                top: `${(cell.row / poster.rows) * 100}%`,
                width: `${(1 / poster.columns) * 100}%`,
                height: `${(1 / poster.rows) * 100}%`,
                backgroundColor: `rgb(${cell.rgb[0]}, ${cell.rgb[1]}, ${cell.rgb[2]})`
              }}
            >
                {/* Hatching for changed cells feed-forward would go here during drag */}
            </div>
          );
        })}
      </div>
      <div className="text-sm text-gray-500" aria-live="polite">
        {selectedCells.size} cells brushed.
      </div>
    </div>
  );
}
