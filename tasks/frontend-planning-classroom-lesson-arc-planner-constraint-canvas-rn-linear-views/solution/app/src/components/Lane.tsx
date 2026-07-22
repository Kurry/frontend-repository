import { useDroppable } from '@dnd-kit/core';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import React from 'react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LaneProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isConflict?: boolean;
}

export function Lane({ id, title, children, isConflict }: LaneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col flex-1 min-w-[280px] p-4 rounded-xl border-2 transition-colors",
        isOver ? "bg-slate-100 border-blue-400" : "bg-white border-slate-200",
        isConflict ? "border-red-400 bg-red-50" : ""
      )}
    >
      <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          {isConflict && <span className="text-sm text-red-600 font-medium">Conflict!</span>}
      </div>
      <div className="flex flex-col gap-3 min-h-[150px]">
        {children}
      </div>
    </div>
  );
}
