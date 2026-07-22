import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useStore } from '../store';

export const DroppableGapArea: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'GAP-04',
    data: { type: 'gap', id: 'GAP-04', benchId: 'BENCH-B' }
  });

  return (
    <div ref={setNodeRef} className={`relative flex-1 ${isOver ? 'bg-indigo-50/20' : ''}`}>
      {children}
    </div>
  );
};
