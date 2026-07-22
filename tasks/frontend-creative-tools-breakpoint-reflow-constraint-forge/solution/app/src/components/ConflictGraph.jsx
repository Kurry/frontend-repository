import React from 'react';
import { useStore } from '../store';
import { resolveComponentState } from '../utils/layoutSolver';
import { COMPONENT_FIXTURES } from '../fixtures';
import { AlertTriangle, AlertCircle } from 'lucide-react';

export default function ConflictGraph() {
  const { viewportWidth, desktopLayout, setSelectedComponentId } = useStore();
  const storeState = useStore();

  const getConflicts = () => {
    const conflicts = [];
    const resolvedComps = desktopLayout.map(c => ({
      id: c.id,
      state: resolveComponentState(c.id, viewportWidth, storeState),
      fixture: COMPONENT_FIXTURES.find(f => f.id === c.id)
    }));

    // Check Grid Bounds & Overlap
    const gridMap = new Map();

    resolvedComps.forEach(({ id, state, fixture }) => {
      if (state.visibility === 'hidden') return;

      if (!state.colStart || !state.rowStart) {
        // Not placed, theoretically a conflict if it's supposed to be required
        if (!fixture.allowedCollapse) {
           conflicts.push({
             id: `${id}-unplaced`,
             componentId: id,
             type: 'hidden-required',
             message: `Required component ${id} is not placed on the grid.`
           });
        }
        return;
      }

      // Check out of bounds
      const colEnd = state.colStart + state.colSpan - 1;
      if (colEnd > 12) {
        conflicts.push({
          id: `${id}-overflow`,
          componentId: id,
          type: 'horizontal-overflow',
          message: `${id} exceeds 12-column grid bound.`
        });
      }

      // Check Overlap
      for (let r = state.rowStart; r < state.rowStart + state.rowSpan; r++) {
        for (let c = state.colStart; c < state.colStart + state.colSpan; c++) {
          const key = `${r},${c}`;
          if (gridMap.has(key)) {
            const existing = gridMap.get(key);
            if (!fixture.overlay && !existing.fixture.overlay) {
              conflicts.push({
                id: `${id}-overlap-${existing.id}`,
                componentId: id,
                type: 'overlap',
                message: `${id} overlaps with ${existing.id} at ${r},${c}`
              });
            }
          } else {
            gridMap.set(key, { id, fixture });
          }
        }
      }

      // Intrinsic Squeeze
      if (state.colSpan < fixture.minWidth && !fixture.allowedCollapse) {
        conflicts.push({
          id: `${id}-squeeze`,
          componentId: id,
          type: 'intrinsic-squeeze',
          message: `${id} colSpan (${state.colSpan}) is less than intrinsic minWidth (${fixture.minWidth})`
        });
      }

    });

    return conflicts;
  };

  const conflicts = getConflicts();

  if (conflicts.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 bg-[#252526] border border-[#333] shadow-lg rounded-md w-80 max-h-64 flex flex-col z-50">
      <div className="p-2 border-b border-[#333] bg-[#1e1e1e] flex items-center gap-2 text-sm font-bold text-white">
        <AlertTriangle size={16} className="text-yellow-500" />
        Conflict Graph ({conflicts.length})
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-2">
        {conflicts.map(c => (
          <div
            key={c.id}
            className="text-xs bg-[#1e1e1e] p-2 border border-[#333] rounded cursor-pointer hover:border-[#007acc]"
            onClick={() => setSelectedComponentId(c.componentId)}
          >
            <div className="font-bold text-red-400 flex items-center gap-1">
              <AlertCircle size={12} /> {c.type}
            </div>
            <div className="text-gray-400 mt-1">{c.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
