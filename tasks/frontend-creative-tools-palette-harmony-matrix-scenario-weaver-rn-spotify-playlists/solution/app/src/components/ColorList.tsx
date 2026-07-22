import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';
import type { ColorRecord, ColorStatus } from '../schema';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function ColorList() {
  const { records, branchToScenario, scenarioColorId, deleteRecord, undo } = useStore();

  const [filter, setFilter] = useState<ColorStatus | 'all'>('all');

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);

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
    <div className="flex flex-col h-full overflow-hidden bg-bg-elevated rounded-lg">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-title">Colors Collection</h2>
        <div className="flex gap-2">
          {['all', 'draft', 'ready', 'changed', 'archived'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as ColorStatus | 'all')}
              className={cn(
                "px-3 py-1 text-sm rounded-full transition-colors",
                filter === f ? "bg-primary text-black font-semibold" : "bg-white/5 hover:bg-white/10 text-text-base"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-10 text-white/50">No records found.</div>
        ) : (
          filteredRecords.map(record => (
            <ColorItem
              key={record.id}
              record={record}
              isScenario={scenarioColorId === record.id}
              onBranch={() => branchToScenario(record.id)}
              onDelete={() => deleteRecord(record.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ColorItem({ record, isScenario, onBranch, onDelete }: { record: ColorRecord, isScenario: boolean, onBranch: () => void, onDelete: () => void }) {
  const isReducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  return (
    <motion.div
      layout={!isReducedMotion}
      className={cn(
        "group flex items-center gap-4 p-3 rounded-md transition-colors cursor-pointer",
        isScenario ? "bg-primary/20 ring-1 ring-primary" : "bg-white/5 hover:bg-white/10 focus-within:bg-white/10"
      )}
      onClick={onBranch}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onBranch();
        }
      }}
    >
      <div
        className="w-10 h-10 rounded shadow-sm border border-white/10"
        style={{ backgroundColor: record.hex }}
      />
      <div className="flex-1">
        <h3 className="text-text-title font-medium">{record.name}</h3>
        <p className="text-sm text-text-base font-mono">{record.hex}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={cn(
          "text-xs px-2 py-1 rounded uppercase tracking-wider font-semibold",
          record.status === 'ready' ? "bg-primary/20 text-primary" :
          record.status === 'archived' ? "bg-white/10 text-white/50" :
          record.status === 'changed' ? "bg-yellow-500/20 text-yellow-500" :
          "bg-blue-500/20 text-blue-400"
        )}>
          {record.status}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 hover:bg-white/10 rounded text-red-400 transition-opacity"
          aria-label={`Delete ${record.name}`}
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}
