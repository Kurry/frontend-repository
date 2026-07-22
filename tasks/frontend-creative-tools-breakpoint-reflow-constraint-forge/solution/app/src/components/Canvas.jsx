import React from 'react';
import { useStore } from '../store';
import { resolveComponentState } from '../utils/layoutSolver';

export default function Canvas() {
  const { viewportWidth, activeMode, desktopLayout, selectedComponentId, setSelectedComponentId } = useStore();
  const storeState = useStore();

  return (
    <div className="flex-1 bg-[#1e1e1e] flex flex-col items-center overflow-auto p-8 relative">
      {/* Simulation Wrapper */}
      <div
        className="relative bg-white transition-all duration-200 border border-[#333] shadow-2xl"
        style={{ width: viewportWidth, minHeight: 600 }}
      >
        {/* CSS Grid Canvas */}
        <div
          className="absolute inset-0 grid gap-4 p-4"
          style={{
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridAutoRows: '8px'
          }}
        >
          {/* Background Hairlines */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r border-dashed border-gray-200 h-full w-full" style={{ gridColumn: i + 1, gridRow: '1 / -1' }}></div>
          ))}

          {/* Render Components */}
          {desktopLayout.map(comp => {
            const resolved = resolveComponentState(comp.id, viewportWidth, storeState);

            if (resolved.visibility === 'hidden') return null;

            const isSelected = selectedComponentId === comp.id;

            return (
              <div
                key={comp.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedComponentId(comp.id);
                }}
                className={`relative border-2 flex items-center justify-center p-2 cursor-pointer transition-all ${
                  isSelected ? 'border-[#007acc] z-10 shadow-[0_0_0_4px_rgba(0,122,204,0.3)]' : 'border-gray-800 hover:border-gray-500'
                }`}
                style={{
                  gridColumn: resolved.colStart ? `${resolved.colStart} / span ${resolved.colSpan}` : `span ${resolved.colSpan}`,
                  gridRow: resolved.rowStart ? `${resolved.rowStart} / span ${resolved.rowSpan}` : `span ${resolved.rowSpan}`,
                  backgroundColor: '#f3f4f6', // light gray filler
                  minWidth: resolved.widthBehavior === 'min-content' ? 'min-content' : 'auto',
                }}
              >
                <div className="absolute top-1 left-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {comp.id}
                </div>
                {/* Visualizer for intrinsic bounds */}
                <div className="text-gray-400 text-xs text-center leading-tight">
                  <div>w:{resolved.colSpan}</div>
                  <div>h:{resolved.rowSpan}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Previewing at {viewportWidth}px width (active mode: {activeMode})
      </div>
    </div>
  );
}
