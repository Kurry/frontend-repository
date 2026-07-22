import { useEffect } from 'react';
import { useAppStore } from '../store';
import { Undo2 } from 'lucide-react';

export default function UndoControl() {
  const undo = useAppStore(state => state.undo);
  const hasHistory = useAppStore(state => state.history.length > 0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return (
    <button
      onClick={undo}
      disabled={!hasHistory}
      className="flex items-center space-x-1 px-3 py-1.5 rounded bg-indigo-800 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      title="Undo (Ctrl/Cmd+Z)"
    >
      <Undo2 size={16} />
      <span className="text-sm font-medium">Undo</span>
    </button>
  );
}
