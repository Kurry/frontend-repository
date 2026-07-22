import { useDraggable } from '@dnd-kit/core';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { LessonBlock } from '../types';
import { GripVertical } from 'lucide-react';
import React, { KeyboardEvent, useEffect, useRef } from 'react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LessonBlockItemProps {
  block: LessonBlock;
  onEdit: (block: LessonBlock) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>, block: LessonBlock) => void;
  isActive?: boolean; // When dragging, this represents the active overlay item
}

export function LessonBlockItem({ block, onEdit, onKeyDown, isActive }: LessonBlockItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    data: block,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800 border-gray-200',
    ready: 'bg-green-100 text-green-800 border-green-200',
    changed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    archived: 'bg-slate-200 text-slate-500 border-slate-300',
    conflict: 'bg-red-100 text-red-800 border-red-300',
    resolved: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex flex-col p-3 rounded-lg border shadow-sm bg-white hover:border-blue-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-shadow",
        isDragging ? "opacity-50" : "opacity-100",
        isActive ? "shadow-xl border-blue-500 scale-105 z-50 cursor-grabbing" : ""
      )}
      onClick={() => onEdit(block)}
      tabIndex={0}
      onKeyDown={(e) => onKeyDown?.(e, block)}
      aria-label={`${block.title}, status: ${block.status}. Press Enter to edit. Use Arrow Keys with modifier to move lanes.`}
    >
        <div className="flex items-center gap-2 mb-2">
            <div
                className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
                {...listeners}
                {...attributes}
                tabIndex={0}
                aria-label={`Drag handle for ${block.title}`}
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical size={16} />
            </div>
            <h3 className="font-medium text-slate-800 truncate">{block.title}</h3>
        </div>

        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{block.description}</p>

        <div className="flex items-center justify-between mt-auto">
            <span className={cn("text-xs px-2 py-1 rounded-full font-medium border", statusColors[block.status])}>
                {block.status.charAt(0).toUpperCase() + block.status.slice(1)}
            </span>
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                {block.duration} min
            </span>
        </div>
    </div>
  );
}
