import React from 'react';
import { RestockTask, DomainState } from '../types';

interface TaskCardProps {
  task: RestockTask;
  isSelected: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export function TaskCard({ task, isSelected, onClick, onDragStart }: TaskCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`p-3 bg-white border rounded shadow-sm cursor-grab active:cursor-grabbing mb-2 ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <h4 className="font-semibold text-sm truncate">{task.title}</h4>
      {task.description && <p className="text-xs text-gray-500 mt-1 truncate">{task.description}</p>}
      <div className="mt-2 text-xs font-mono text-gray-400">Qty: {task.quantity}</div>
    </div>
  );
}
