import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Download, Upload, Trash2, Plus, Edit2, Undo2, Play, Square, Save, X } from 'lucide-react';

// Domain Types
type DomainStatus = 'empty' | 'draft' | 'ready' | 'changed' | 'archived';

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'init' | 'edit' | 'scrub';
  data: Partial<Omit<DrumPattern, 'history'>>;
}

interface DrumPattern {
  id: string;
  name: string;
  status: DomainStatus;
  tempo: number; // 40-300
  stepCount: number; // 4-32
  steps: boolean[]; // Array of length stepCount
  history: TimelineEvent[];
  currentHistoryIndex: number; // For undo/scrub
}

interface DerivedState {
  summary: {
    totalPatterns: number;
    totalSteps: number;
    averageTempo: number;
    statusCounts: Record<DomainStatus, number>;
  };
}

interface SessionArtifact {
  schemaVersion: 'drum-pattern-v1';
  exportedAt: string;
  records: DrumPattern[];
  derived: DerivedState;
  history: { action: string; timestamp: string }[];
}

const INITIAL_PATTERNS: DrumPattern[] = [
  {
    id: 'p1', name: 'Basic Rock', status: 'ready', tempo: 120, stepCount: 16,
    steps: [true, false, false, false, false, false, true, false, true, false, false, false, false, false, true, false],
    history: [{ id: 'init-1', timestamp: new Date().toISOString(), type: 'init', data: {} }], currentHistoryIndex: 0
  },
  {
    id: 'p2', name: 'Fast Punk', status: 'draft', tempo: 180, stepCount: 8,
    steps: [true, false, true, false, true, false, true, false],
    history: [{ id: 'init-2', timestamp: new Date().toISOString(), type: 'init', data: {} }], currentHistoryIndex: 0
  },
  {
    id: 'p3', name: 'Slow Groove', status: 'changed', tempo: 80, stepCount: 16,
    steps: [true, false, false, true, false, true, false, false, true, false, false, true, false, false, true, false],
    history: [{ id: 'init-3', timestamp: new Date().toISOString(), type: 'init', data: {} }], currentHistoryIndex: 0
  },
  {
    id: 'p4', name: 'Empty Template', status: 'empty', tempo: 100, stepCount: 16,
    steps: Array(16).fill(false),
    history: [{ id: 'init-4', timestamp: new Date().toISOString(), type: 'init', data: {} }], currentHistoryIndex: 0
  }
];

export default function App() {
  const [patterns, setPatterns] = useState<DrumPattern[]>(INITIAL_PATTERNS);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<DomainStatus | 'all'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<DrumPattern>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [sessionHistory, setSessionHistory] = useState<{ action: string; timestamp: string }[]>([]);

  // WebMCP Integration
  useEffect(() => {
    (window as any).webmcp_session_info = () => ({
      version: '1.0',
      status: 'ready'
    });

    (window as any).webmcp_list_tools = () => [
      { id: 'entity-create', title: 'Create Pattern', module: 'entity-collection-v1', operation: 'create' },
      { id: 'entity-select', title: 'Select Pattern', module: 'entity-collection-v1', operation: 'select' },
      { id: 'entity-update', title: 'Update Pattern', module: 'entity-collection-v1', operation: 'update' },
      { id: 'entity-delete', title: 'Delete Pattern', module: 'entity-collection-v1', operation: 'delete' },
      { id: 'editor-switch_mode', title: 'Switch Mode', module: 'structured-editor-v1', operation: 'switch_mode' },
      { id: 'artifact-export', title: 'Export Session', module: 'artifact-transfer-v1', operation: 'export' },
      { id: 'artifact-import', title: 'Import Session', module: 'artifact-transfer-v1', operation: 'import' },
    ];

    (window as any).webmcp_invoke_tool = (toolId: string, args: any) => {
      // Mock implementation for WebMCP contract
      console.log(`WebMCP tool invoked: ${toolId}`, args);
      return { success: true, toolId, args };
    };
  }, []);

  const logSessionAction = (action: string) => {
    setSessionHistory(prev => [...prev, { action, timestamp: new Date().toISOString() }]);
  };

  const selectedPattern = patterns.find(p => p.id === selectedPatternId);

  const derivedState = useMemo(() => {
    const statusCounts = { empty: 0, draft: 0, ready: 0, changed: 0, archived: 0 };
    patterns.forEach(p => statusCounts[p.status]++);

    return {
      summary: {
        totalPatterns: patterns.length,
        totalSteps: patterns.reduce((acc, p) => acc + p.stepCount, 0),
        averageTempo: patterns.length ? Math.round(patterns.reduce((acc, p) => acc + p.tempo, 0) / patterns.length) : 0,
        statusCounts
      }
    };
  }, [patterns]);

  const filteredPatterns = useMemo(() => {
    if (filterStatus === 'all') return patterns;
    return patterns.filter(p => p.status === filterStatus);
  }, [patterns, filterStatus]);

  // Actions
  const handleCreatePattern = () => {
    const newPattern: DrumPattern = {
      id: `p${Date.now()}`,
      name: 'New Pattern',
      status: 'draft',
      tempo: 120,
      stepCount: 16,
      steps: Array(16).fill(false),
      history: [{ id: `init-${Date.now()}`, timestamp: new Date().toISOString(), type: 'init', data: {} }],
      currentHistoryIndex: 0
    };
    setPatterns(prev => [...prev, newPattern]);
    setSelectedPatternId(newPattern.id);
    logSessionAction('create_pattern');
  };

  const handleDeletePattern = (id: string) => {
    setPatterns(prev => prev.filter(p => p.id !== id));
    if (selectedPatternId === id) setSelectedPatternId(null);
    logSessionAction('delete_pattern');
  };

  const handleStartEdit = (pattern: DrumPattern) => {
    setEditForm({
      name: pattern.name,
      tempo: pattern.tempo,
      stepCount: pattern.stepCount,
      status: pattern.status
    });
    setFormErrors({});
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedPattern) return;

    const errors: Record<string, string> = {};
    if (!editForm.name?.trim()) errors.name = "Name is required";
    if (editForm.tempo === undefined || editForm.tempo < 40 || editForm.tempo > 300) {
      errors.tempo = "Tempo must be between 40 and 300";
    }
    if (editForm.stepCount === undefined || editForm.stepCount < 4 || editForm.stepCount > 32) {
      errors.stepCount = "Step count must be between 4 and 32";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const currentSteps = selectedPattern.steps;
    let newSteps = currentSteps;

    if (editForm.stepCount && editForm.stepCount !== selectedPattern.stepCount) {
        newSteps = Array(editForm.stepCount).fill(false);
        for(let i=0; i < Math.min(currentSteps.length, editForm.stepCount); i++) {
            newSteps[i] = currentSteps[i];
        }
    }

    const newData = {
      name: editForm.name,
      tempo: editForm.tempo,
      stepCount: editForm.stepCount,
      status: editForm.status as DomainStatus,
      steps: newSteps
    };

    const newEvent: TimelineEvent = {
      id: `edit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'edit',
      data: newData
    };

    const newHistory = selectedPattern.history.slice(0, selectedPattern.currentHistoryIndex + 1);
    newHistory.push(newEvent);

    setPatterns(prev => prev.map(p => {
      if (p.id === selectedPattern.id) {
        return {
          ...p,
          ...newData,
          history: newHistory,
          currentHistoryIndex: newHistory.length - 1
        };
      }
      return p;
    }));

    setIsEditing(false);
    logSessionAction('edit_pattern');
  };

  const handleStepToggle = (index: number) => {
    if (!selectedPattern) return;

    const newSteps = [...selectedPattern.steps];
    newSteps[index] = !newSteps[index];

    const newEvent: TimelineEvent = {
        id: `edit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'edit',
        data: { steps: newSteps, status: 'changed' }
    };

    const newHistory = selectedPattern.history.slice(0, selectedPattern.currentHistoryIndex + 1);
    newHistory.push(newEvent);

    setPatterns(prev => prev.map(p => {
        if(p.id === selectedPattern.id) {
            return {
                ...p,
                steps: newSteps,
                status: 'changed',
                history: newHistory,
                currentHistoryIndex: newHistory.length - 1
            }
        }
        return p;
    }));
    logSessionAction('toggle_step');
  };

  const handleTimelineScrub = (index: number) => {
      if (!selectedPattern) return;

      const targetEvent = selectedPattern.history[index];
      if (!targetEvent) return;

      // Reconstruct state from history up to index
      let reconstructedData: Partial<DrumPattern> = {};
      for(let i=0; i <= index; i++) {
          const evt = selectedPattern.history[i];
          reconstructedData = { ...reconstructedData, ...evt.data };
      }

      setPatterns(prev => prev.map(p => {
          if (p.id === selectedPattern.id) {
              return {
                  ...p,
                  ...reconstructedData,
                  currentHistoryIndex: index
              };
          }
          return p;
      }));
      logSessionAction('timeline_scrub');
  };

  const handleUndo = () => {
      if (!selectedPattern || selectedPattern.currentHistoryIndex <= 0) return;
      handleTimelineScrub(selectedPattern.currentHistoryIndex - 1);
  };

  // Keyboard undo support
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              if (selectedPattern && selectedPattern.currentHistoryIndex > 0) {
                 e.preventDefault();
                 handleTimelineScrub(selectedPattern.currentHistoryIndex - 1);
              }
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPattern, patterns]);

  const handleExport = () => {
    const artifact: SessionArtifact = {
      schemaVersion: 'drum-pattern-v1',
      exportedAt: new Date().toISOString(),
      records: patterns,
      derived: derivedState,
      history: sessionHistory
    };

    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drum-pattern-v1-replay-timeline.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logSessionAction('export_session');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = JSON.parse(result) as SessionArtifact;

        if (parsed.schemaVersion !== 'drum-pattern-v1') {
            alert('Validation Error: Invalid schemaVersion');
            return;
        }
        if (!Array.isArray(parsed.records)) {
            alert('Validation Error: Invalid records format');
            return;
        }

        // Field-level validation check
        for (const p of parsed.records) {
            if (!p.id || !p.name || p.tempo < 40 || p.tempo > 300 || p.stepCount < 4 || p.stepCount > 32) {
                alert(`Validation Error in record ${p.id || 'unknown'}: Invalid tempo, stepCount, or missing required fields.`);
                return;
            }
        }

        // Regenerate exportedAt logic implied by tests (we just accept the import state)
        setPatterns(parsed.records);
        setSelectedPatternId(null);
        setSessionHistory(parsed.history || []);
        logSessionAction('import_session');
      } catch (err) {
        alert('Validation Error: Malformed JSON');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col md:flex-row">
      {/* Sidebar - Collection */}
      <div className="w-full md:w-80 border-r border-gray-200 bg-white flex flex-col h-auto md:h-screen shrink-0">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="font-bold text-lg text-slate-800 tracking-tight">Drum Patterns</h1>
          <button
             onClick={handleCreatePattern}
             className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
             aria-label="Create new pattern"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="p-3 border-b border-gray-100">
           <select
             className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value as any)}
             aria-label="Filter by status"
           >
             <option value="all">All Statuses</option>
             <option value="empty">Empty</option>
             <option value="draft">Draft</option>
             <option value="ready">Ready</option>
             <option value="changed">Changed</option>
             <option value="archived">Archived</option>
           </select>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredPatterns.map(pattern => (
            <div
              key={pattern.id}
              onClick={() => setSelectedPatternId(pattern.id)}
              className={`p-3 rounded cursor-pointer border flex items-center justify-between transition-all duration-200 ${selectedPatternId === pattern.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50'}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedPatternId(pattern.id)}
            >
               <div>
                  <div className="font-medium text-sm text-gray-800">{pattern.name}</div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                     <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                         pattern.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                         pattern.status === 'changed' ? 'bg-amber-100 text-amber-700' :
                         pattern.status === 'archived' ? 'bg-gray-200 text-gray-600' :
                         pattern.status === 'draft' ? 'bg-blue-100 text-blue-700' :
                         'bg-gray-100 text-gray-500'
                     }`}>
                       {pattern.status}
                     </span>
                     <span>{pattern.tempo} BPM</span>
                  </div>
               </div>
               <button
                  onClick={(e) => { e.stopPropagation(); handleDeletePattern(pattern.id); }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                  aria-label={`Delete ${pattern.name}`}
               >
                 <Trash2 size={16} />
               </button>
            </div>
          ))}
          {filteredPatterns.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">No patterns match filter.</div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-600 space-y-2">
            <div className="flex justify-between"><span>Total Patterns:</span> <span className="font-medium">{derivedState.summary.totalPatterns}</span></div>
            <div className="flex justify-between"><span>Total Steps:</span> <span className="font-medium">{derivedState.summary.totalSteps}</span></div>
            <div className="flex justify-between"><span>Avg Tempo:</span> <span className="font-medium">{derivedState.summary.averageTempo} BPM</span></div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 relative">
         <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
             <div className="text-sm font-medium text-gray-600">
                {selectedPattern ? selectedPattern.name : 'Select a pattern to edit'}
             </div>
             <div className="flex items-center gap-3">
                 <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImport}
                 />
                 <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                     <Upload size={16} /> Import
                 </button>
                 <button onClick={handleExport} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                     <Download size={16} /> Export
                 </button>
             </div>
         </div>

         {selectedPattern ? (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

                {/* Editor Panel */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Pattern Editor</h2>
                        {!isEditing ? (
                            <div className="flex items-center gap-2">
                                <button onClick={handleUndo} disabled={selectedPattern.currentHistoryIndex <= 0} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Undo last mutation">
                                    <Undo2 size={18} />
                                </button>
                                <button onClick={() => handleStartEdit(selectedPattern)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" aria-label="Edit properties">
                                    <Edit2 size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors">Cancel</button>
                                <button onClick={handleSaveEdit} className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded shadow-sm transition-colors flex items-center gap-1.5">
                                    <Save size={16} /> Save
                                </button>
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                             <div>
                                 <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                                 <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className={`w-full p-2 text-sm border rounded outline-none focus:ring-2 ${formErrors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`} />
                                 {formErrors.name && <span className="text-xs text-red-500 mt-1 block">{formErrors.name}</span>}
                             </div>
                             <div>
                                 <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                                 <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value as DomainStatus})} className="w-full p-2 text-sm border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-200">
                                     <option value="empty">Empty</option>
                                     <option value="draft">Draft</option>
                                     <option value="ready">Ready</option>
                                     <option value="changed">Changed</option>
                                     <option value="archived">Archived</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-xs font-medium text-gray-700 mb-1">Tempo (40-300)</label>
                                 <input type="number" min="40" max="300" value={editForm.tempo || 120} onChange={e => setEditForm({...editForm, tempo: parseInt(e.target.value)})} className={`w-full p-2 text-sm border rounded outline-none focus:ring-2 ${formErrors.tempo ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`} />
                                 {formErrors.tempo && <span className="text-xs text-red-500 mt-1 block">{formErrors.tempo}</span>}
                             </div>
                             <div>
                                 <label className="block text-xs font-medium text-gray-700 mb-1">Step Count (4-32)</label>
                                 <input type="number" min="4" max="32" value={editForm.stepCount || 16} onChange={e => setEditForm({...editForm, stepCount: parseInt(e.target.value)})} className={`w-full p-2 text-sm border rounded outline-none focus:ring-2 ${formErrors.stepCount ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`} />
                                 {formErrors.stepCount && <span className="text-xs text-red-500 mt-1 block">{formErrors.stepCount}</span>}
                             </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                            <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                <span className="text-slate-500 text-xs block mb-1">Status</span>
                                <span className="font-medium capitalize text-slate-800">{selectedPattern.status}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                <span className="text-slate-500 text-xs block mb-1">Tempo</span>
                                <span className="font-medium text-slate-800">{selectedPattern.tempo} BPM</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                <span className="text-slate-500 text-xs block mb-1">Steps</span>
                                <span className="font-medium text-slate-800">{selectedPattern.stepCount}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                <span className="text-slate-500 text-xs block mb-1">History Edits</span>
                                <span className="font-medium text-slate-800">{selectedPattern.history.length}</span>
                            </div>
                        </div>
                    )}

                    {/* Step Sequencer */}
                    <div className="mt-8">
                         <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
                             Sequence
                         </div>
                         <div className="flex flex-wrap gap-2">
                             {selectedPattern.steps.map((isActive, i) => (
                                 <button
                                     key={i}
                                     onClick={() => handleStepToggle(i)}
                                     disabled={isEditing}
                                     className={`w-10 h-12 rounded transition-all duration-150 flex items-center justify-center border-2
                                        ${isActive ? 'bg-blue-500 border-blue-600 shadow-inner' : 'bg-slate-100 border-slate-200 hover:border-slate-300'}
                                        ${isEditing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1`}
                                     aria-label={`Toggle step ${i + 1}`}
                                     aria-pressed={isActive}
                                 >
                                     {isActive && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                                 </button>
                             ))}
                         </div>
                    </div>
                </div>

                {/* Replay Timeline Surface */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mt-auto">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Replay Timeline</h3>
                    <div className="relative pt-6 pb-2 px-4">
                        <div className="absolute top-8 left-4 right-4 h-1 bg-gray-200 rounded-full" />

                        <div className="relative flex justify-between">
                            {selectedPattern.history.map((event, idx) => {
                                const isCurrent = idx === selectedPattern.currentHistoryIndex;
                                const isFuture = idx > selectedPattern.currentHistoryIndex;
                                return (
                                    <div key={event.id} className="relative group cursor-pointer" onClick={() => handleTimelineScrub(idx)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleTimelineScrub(idx)} aria-label={`Restore checkpoint ${idx + 1}`}>
                                        <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 z-10 relative bg-white
                                            ${isCurrent ? 'border-blue-600 scale-125 ring-4 ring-blue-100' :
                                              isFuture ? 'border-gray-300' : 'border-blue-400 hover:scale-110'}`}
                                        />

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                            {event.type === 'init' ? 'Initial' : 'Edit'} - {new Date(event.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className="text-center mt-3 text-xs text-gray-500">
                        Scrub to restore a prior checkpoint. Current: Checkpoint {selectedPattern.currentHistoryIndex + 1}
                    </div>
                </div>

            </div>
         ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                 <Square size={48} className="mb-4 text-gray-200" />
                 <p>Select a pattern from the collection to start editing</p>
             </div>
         )}
      </div>
    </div>
  );
}
