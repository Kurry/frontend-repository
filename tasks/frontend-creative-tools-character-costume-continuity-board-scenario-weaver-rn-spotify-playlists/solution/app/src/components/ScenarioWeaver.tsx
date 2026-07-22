import React, { useState } from 'react';
import { useStore } from '../store';
import { StatusEnum } from '../schema';
import { GitBranch, GitMerge, Save, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ScenarioWeaver({ selectedId }: { selectedId: string | null }) {
  const records = useStore(state => state.records);
  const branchScenario = useStore(state => state.branchScenario);
  const resolveScenario = useStore(state => state.resolveScenario);
  const updateRecord = useStore(state => state.updateRecord);
  const deleteRecord = useStore(state => state.deleteRecord);

  const selected = records.find(r => r.id === selectedId);
  const isBranch = selected?.branchParentId != null;

  // Track local form state for editing
  const [editTitle, setEditTitle] = useState('');
  const [editChar, setEditChar] = useState('');
  const [editScene, setEditScene] = useState('');

  // Sync when selected changes
  React.useEffect(() => {
    if (selected) {
      setEditTitle(selected.title);
      setEditChar(selected.character);
      setEditScene(String(selected.scene));
    }
  }, [selected?.id]);

  if (!selectedId || !selected) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center text-text-muted border border-dashed border-border rounded-lg bg-surface/30">
        <GitBranch size={24} className="mb-2 opacity-50" />
        <p>Select a look to view scenario options.</p>
      </div>
    );
  }

  const handleSave = () => {
    const sceneNum = parseInt(editScene, 10);
    if (!editTitle || !editChar || isNaN(sceneNum) || sceneNum < 1 || sceneNum > 999) return;
    updateRecord(selectedId, {
      title: editTitle,
      character: editChar,
      scene: sceneNum
    });
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selected.id}
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
        className="space-y-6"
      >

        {/* Editor Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Title</label>
            <input
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={handleSave}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Character</label>
              <input
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                value={editChar}
                onChange={e => setEditChar(e.target.value)}
                onBlur={handleSave}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Scene</label>
              <input
                type="number"
                min={1}
                max={999}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                value={editScene}
                onChange={e => setEditScene(e.target.value)}
                onBlur={handleSave}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Status</label>
            <select
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
              value={selected.status}
              onChange={(e) => updateRecord(selected.id, { status: e.target.value as any })}
            >
              {StatusEnum.options.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-border space-y-3">
          {!isBranch && selected.scenarioState === 'idle' && (
            <button
              onClick={() => branchScenario(selected.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-full text-sm font-medium transition-colors"
            >
              <GitBranch size={16} />
              Branch into Scenario
            </button>
          )}

          {isBranch && (
            <div className="space-y-3">
              <div className="p-3 bg-surface-hover rounded-md border border-border">
                <p className="text-xs text-text-muted mb-3">
                  This is a branched scenario. Mutate its state and compare, then resolve back to the main flow.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => resolveScenario(selected.id, 'ready')}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-black rounded-md text-xs font-bold hover:bg-primary-hover transition-colors"
                  >
                    <GitMerge size={14} /> Keep (Ready)
                  </button>
                  <button
                    onClick={() => resolveScenario(selected.id, 'archived')}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-surface hover:bg-background border border-border rounded-md text-xs font-medium transition-colors"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => deleteRecord(selected.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-full text-sm font-medium transition-colors"
          >
            <Trash2 size={16} />
            Delete Look
          </button>
        </div>

      </motion.div>
    </AnimatePresence>
  );
}
