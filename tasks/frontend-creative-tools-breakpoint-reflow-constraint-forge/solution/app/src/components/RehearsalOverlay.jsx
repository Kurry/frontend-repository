import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { resolveComponentState } from '../utils/layoutSolver';

export default function RehearsalOverlay() {
  const { semanticOrder, activeMode, viewportWidth } = useStore();
  const storeState = useStore();
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    if (activeMode !== 'rehearsal') {
      setFocusedIndex(-1);
      return;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = e.shiftKey ? prev - 1 : prev + 1;
          if (next >= semanticOrder.length) return 0;
          if (next < 0) return semanticOrder.length - 1;
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMode, semanticOrder.length]);

  if (activeMode !== 'rehearsal') return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      <svg className="w-full h-full">
         {/* Draw paths between semantic components (simplified conceptual drawing) */}
      </svg>
      {semanticOrder.map((id, idx) => {
        const resolved = resolveComponentState(id, viewportWidth, storeState);
        if (resolved.visibility === 'hidden' || !resolved.colStart || !resolved.rowStart) return null;

        const isFocused = focusedIndex === idx;

        return (
          <div
            key={id}
            className={`absolute border-2 transition-all duration-200 flex items-center justify-center font-bold text-xl
              ${isFocused ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400 z-30' : 'border-blue-500/50 bg-blue-500/10 text-blue-500/50'}
            `}
            style={{
              // Extremely hacky coordinate mapping for the overlay to align with CSS Grid visually.
              // Assumes a rigid 8px row and equal fractional columns. We'll simplify this by just letting the Canvas render it,
              // but for now, we'll render floating badges inside the Canvas directly instead of here.
            }}
          >
            {idx + 1}
          </div>
        );
      })}

      {/* Floating Panel for Rehearsal */}
      <div className="absolute top-4 right-4 bg-[#252526] border border-[#333] shadow-lg rounded-md w-64 p-4 pointer-events-auto">
        <h3 className="text-white font-bold mb-2 text-sm">Semantic Order Rehearsal</h3>
        <div className="text-xs text-gray-400 mb-4">Press TAB to navigate focus path.</div>
        <div className="space-y-1">
          {semanticOrder.map((id, idx) => (
             <div key={id} className={`text-xs p-1 rounded flex items-center gap-2 ${focusedIndex === idx ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-300'}`}>
                <span className="w-4 inline-block text-gray-500">{idx + 1}.</span> {id}
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
