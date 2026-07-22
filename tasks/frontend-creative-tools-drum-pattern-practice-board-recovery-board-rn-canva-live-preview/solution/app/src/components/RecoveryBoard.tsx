import React from 'react';
import { useDrumStore } from '../store/useDrumStore';
import { Undo, Redo, RotateCcw } from 'lucide-react';

export const RecoveryBoard: React.FC = () => {
  const { history, undo, redo, reset } = useDrumStore();

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return (
    <div className="flex gap-2 bg-gray-800 p-2 rounded items-center">
      <button
        onClick={undo}
        disabled={!canUndo}
        className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
          canUndo
            ? 'bg-gray-700 hover:bg-gray-600 text-white'
            : 'bg-gray-900 text-gray-500 cursor-not-allowed'
        }`}
        aria-label="Undo"
      >
        <Undo size={16} /> Undo ({history.past.length})
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
          canRedo
            ? 'bg-gray-700 hover:bg-gray-600 text-white'
            : 'bg-gray-900 text-gray-500 cursor-not-allowed'
        }`}
        aria-label="Redo"
      >
        <Redo size={16} /> Redo ({history.future.length})
      </button>
      <div className="w-px h-6 bg-gray-700 mx-2" />
      <button
        onClick={reset}
        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm bg-red-900/50 hover:bg-red-800/50 text-red-200 transition-colors"
        aria-label="Reset Pattern"
      >
        <RotateCcw size={16} /> Reset
      </button>
    </div>
  );
};
