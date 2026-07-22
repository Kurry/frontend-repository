import { useState } from 'react';
import { useStore } from '../store';
import type { StoryBeat, BeatStatus } from '../store';
import { motion } from 'framer-motion';
import { Edit2, Archive, CheckCircle2, Circle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function CollectionList() {
  const { records, selectedIds, toggleSelection, updateBeat, archiveBeat, createBeat } = useStore();
  const [filter, setFilter] = useState<BeatStatus | 'all'>('all');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStatus, setNewStatus] = useState<BeatStatus>('draft');

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);

  const startEdit = (beat: StoryBeat) => {
    setIsEditing(beat.id);
    setEditTitle(beat.title);
    setEditDesc(beat.description);
  };

  const saveEdit = (id: string) => {
    if (editTitle.trim()) {
      updateBeat(id, { title: editTitle, description: editDesc });
      setIsEditing(null);
    }
  };

  const handleCreate = () => {
    if (newTitle.trim()) {
      createBeat({ title: newTitle, description: newDesc, status: newStatus });
      setIsCreating(false);
      setNewTitle('');
      setNewDesc('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Story Beats</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
          aria-label="Create new beat"
        >
          New Beat
        </button>
      </div>

      <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-b border-zinc-200 dark:border-zinc-800">
        {(['all', 'draft', 'ready', 'changed', 'archived'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors",
              filter === status
                ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            )}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isCreating && (
          <div className="p-3 border border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg shadow-sm">
            <input
              autoFocus
              className="w-full mb-2 p-1 border rounded text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
              placeholder="Title (required)"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
            <textarea
              className="w-full mb-2 p-1 border rounded text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
              placeholder="Description"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
            <select
              className="w-full mb-2 p-1 border rounded text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
              value={newStatus}
              onChange={e => setNewStatus(e.target.value as BeatStatus)}
            >
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setIsCreating(false)} className="px-2 py-1 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">Cancel</button>
              <button onClick={handleCreate} disabled={!newTitle.trim()} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">Save</button>
            </div>
          </div>
        )}

        {filteredRecords.length === 0 && !isCreating && (
          <div className="text-center py-8 text-sm text-zinc-500 dark:text-zinc-400">
            No story beats found.
          </div>
        )}

        {filteredRecords.map(beat => {
          const isSelected = selectedIds.includes(beat.id);
          const editing = isEditing === beat.id;

          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={beat.id}
              className={cn(
                "group p-3 rounded-lg border transition-all duration-200 relative overflow-hidden cursor-pointer",
                isSelected
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-500/50"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              )}
              onClick={() => {
                if (!editing) toggleSelection(beat.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!editing) toggleSelection(beat.id);
                }
              }}
              tabIndex={0}
              role="checkbox"
              aria-checked={isSelected}
            >
              {editing ? (
                <div className="space-y-2" onClick={e => e.stopPropagation()}>
                  <input
                    autoFocus
                    className="w-full p-1 border rounded text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 focus:ring-1 focus:ring-blue-500 outline-none"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                  />
                  <textarea
                    className="w-full p-1 border rounded text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                    rows={2}
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => setIsEditing(null)} className="px-3 py-1 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">Cancel</button>
                    <button onClick={() => saveEdit(beat.id)} disabled={!editTitle.trim()} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors">Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                      {isSelected ? <CheckCircle2 className="w-5 h-5 text-blue-500" /> : <Circle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{beat.title}</h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider",
                          beat.status === 'draft' ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" :
                          beat.status === 'ready' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          beat.status === 'changed' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                          {beat.status}
                        </span>
                      </div>
                      {beat.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{beat.description}</p>
                      )}
                      {beat.batchReconcilerState === 'reconciled' && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Reconciled Batch</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex bg-white/90 dark:bg-zinc-900/90 rounded shadow-sm backdrop-blur-sm" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => startEdit(beat)}
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      aria-label="Edit beat"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {beat.status !== 'archived' && (
                      <button
                        onClick={() => archiveBeat(beat.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        aria-label="Archive beat"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
