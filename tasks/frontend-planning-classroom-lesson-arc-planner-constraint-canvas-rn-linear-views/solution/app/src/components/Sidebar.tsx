import React, { useState, useEffect } from 'react';
import { useAppStore, LANES } from '../store';
import type { LessonBlock } from '../types';
import { Plus, X, Search, FileJson, Upload, Trash2, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  editingBlock: LessonBlock | null;
  onCloseEdit: () => void;
}

export function Sidebar({ editingBlock, onCloseEdit }: SidebarProps) {
  const { addRecord, updateRecord, deleteRecord, filter, setFilter, exportSession, importSession, clearSession, undo, redo, history } = useAppStore();

  const [formData, setFormData] = useState<Partial<LessonBlock>>({
    title: '',
    description: '',
    duration: 30,
    lane: 'Backlog',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [importError, setImportError] = useState('');

  useEffect(() => {
    if (editingBlock) {
      setFormData({
        title: editingBlock.title,
        description: editingBlock.description,
        duration: editingBlock.duration,
        lane: editingBlock.lane,
      });
      setErrors({});
    }
  }, [editingBlock]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title?.trim()) {
      newErrors.title = "Title is required. Please enter a title.";
    }
    if (!formData.duration || formData.duration < 10 || formData.duration > 120) {
      newErrors.duration = "Duration must be between 10 and 120 minutes. Adjust block duration.";
    }
    if (!formData.lane || !LANES.includes(formData.lane)) {
        newErrors.lane = "Invalid lane selection.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (editingBlock) {
      updateRecord(editingBlock.id, formData);
      onCloseEdit();
    } else {
      addRecord(formData as Omit<LessonBlock, "id" | "status">);
      setFormData({ title: '', description: '', duration: 30, lane: 'Backlog' });
    }
  };

  const handleExport = () => {
    const data = exportSession();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lesson-arc-v1-constraint-canvas.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.schemaVersion !== "v1" || !Array.isArray(json.records)) {
          throw new Error("Malformed schema");
        }

        // Basic uniqueness and bounds check
        const ids = new Set();
        for (const r of json.records) {
            if (ids.has(r.id)) throw new Error("Duplicate IDs");
            if (r.duration < 10 || r.duration > 120) throw new Error("Invalid bounds");
            ids.add(r.id);
        }

        importSession(json);
        setImportError('');
      } catch (err) {
        setImportError("Import failed: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  // Ensure undo relies on actual history length, using a stable store selector
  const canUndo = history.length > 0;

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          Lesson Planner
        </h1>
        <p className="text-sm text-slate-500 mt-1">Constraint Canvas</p>
      </div>

      {/* Editor Form */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-slate-700">{editingBlock ? 'Edit Block' : 'New Block'}</h2>
          {editingBlock && (
            <button onClick={onCloseEdit} className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1" aria-label="Cancel editing">
              <X size={16} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label htmlFor="title" className="block text-xs font-medium text-slate-700 mb-1">Title</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className={cn("w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", errors.title ? "border-red-500" : "border-slate-300")}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title && <p id="title-error" className="text-xs text-red-600 mt-1" aria-live="polite">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="duration" className="block text-xs font-medium text-slate-700 mb-1">Duration (min)</label>
              <input
                id="duration"
                type="number"
                min="10" max="120"
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                className={cn("w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", errors.duration ? "border-red-500" : "border-slate-300")}
                aria-invalid={!!errors.duration}
                aria-describedby={errors.duration ? "duration-error" : undefined}
              />
            </div>

            <div className="flex-1">
              <label htmlFor="lane" className="block text-xs font-medium text-slate-700 mb-1">Lane</label>
              <select
                id="lane"
                value={formData.lane}
                onChange={e => setFormData({...formData, lane: e.target.value})}
                className={cn("w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white", errors.lane ? "border-red-500" : "border-slate-300")}
                aria-invalid={!!errors.lane}
                aria-describedby={errors.lane ? "lane-error" : undefined}
              >
                {LANES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          {(errors.duration || errors.lane) && (
             <div aria-live="polite">
                 {errors.duration && <p id="duration-error" className="text-xs text-red-600 mt-1">{errors.duration}</p>}
                 {errors.lane && <p id="lane-error" className="text-xs text-red-600 mt-1">{errors.lane}</p>}
             </div>
          )}

          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              {editingBlock ? 'Update' : <><Plus size={16} /> Add Block</>}
            </button>
            {editingBlock && (
              <button
                type="button"
                onClick={() => { deleteRecord(editingBlock.id); onCloseEdit(); }}
                className="p-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Delete block"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tools & Artifact */}
      <div className="p-4 mt-auto border-t border-slate-200 bg-slate-50 flex flex-col gap-3">
        <h3 className="font-semibold text-slate-700 text-sm">Artifact & Tools</h3>

        <div className="flex gap-2">
            <button
                onClick={undo}
                disabled={!canUndo}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 border border-slate-300 rounded text-sm bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <RotateCcw size={14} /> Undo
            </button>
            <button
                onClick={clearSession}
                className="flex items-center justify-center gap-1 py-1.5 px-3 border border-red-200 text-red-600 rounded text-sm bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
                Clear
            </button>
        </div>

        <div className="flex gap-2">
            <button
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1"
            >
                <FileJson size={14} /> Export
            </button>

            <label className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 border border-slate-300 hover:bg-slate-100 rounded text-sm cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                <Upload size={14} /> Import
                <input
                    type="file"
                    accept=".json"
                    className="sr-only"
                    onChange={handleImport}
                />
            </label>
        </div>

        {importError && (
             <p className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded" aria-live="polite">
                 {importError}
             </p>
        )}
      </div>
    </div>
  );
}
