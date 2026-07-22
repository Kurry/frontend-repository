import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { SoundLayer, SoundLayerStatus, SoundscapeSceneComposerSession, ScenarioWeaverState } from './types';
import { Download, Upload, Plus, Trash2, SplitSquareHorizontal, Undo2, Volume2 } from 'lucide-react';

// --- WebMCP Interface Types ---
declare global {
  interface Window {
    webmcp_session_info: any;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (toolName: string, args: any) => any;
  }
}

const generateId = () => Math.random().toString(36).substring(2, 9);
const clone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

export default function App() {
  const [records, setRecords] = useState<SoundLayer[]>([]);
  const [history, setHistory] = useState<{ records: SoundLayer[], weaverState: ScenarioWeaverState }[]>([]);
  const [weaverState, setWeaverState] = useState<ScenarioWeaverState>({ state: 'idle', sourceLayerId: null, scenarioLayerId: null });
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<SoundLayerStatus | 'all'>('all');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Expose WebMCP
  useEffect(() => {
    window.webmcp_session_info = {
      task: 'eval-intelligence/frontend-creative-tools-soundscape-scene-composer-scenario-weaver-rn-spotify-playlists',
      version: '1.0.0',
    };

    window.webmcp_list_tools = () => [
      { name: 'entity_create', description: 'Create a sound layer' },
      { name: 'entity_select', description: 'Select a sound layer' },
      { name: 'entity_update', description: 'Update a sound layer' },
      { name: 'entity_delete', description: 'Delete a sound layer' },
      { name: 'entity_reorder', description: 'Reorder sound layers' },
      { name: 'editor_select', description: 'Select in scenario weaver' },
      { name: 'editor_update_property', description: 'Update property in scenario weaver' },
      { name: 'command_start', description: 'Start scenario branch' },
      { name: 'command_undo', description: 'Undo last mutation' },
      { name: 'artifact_export', description: 'Export session' },
      { name: 'artifact_import', description: 'Import session' }
    ];

    window.webmcp_invoke_tool = (toolName: string, args: any) => {
       if (toolName === 'entity_create') {
         const newLayer: SoundLayer = {
           id: generateId(),
           name: args.name || 'New Layer',
           status: args.status || 'draft',
           volume: args.volume ?? 50,
           pan: args.pan ?? 0,
           effects: args.effects || [],
           order: records.length,
         };
         pushHistory();
         setRecords(prev => [...prev, newLayer]);
         return { success: true, id: newLayer.id };
       }
       if (toolName === 'entity_select') {
         setSelectedLayerId(args.id);
         return { success: true };
       }
       if (toolName === 'entity_update') {
         pushHistory();
         setRecords(prev => prev.map(r => r.id === args.id ? { ...r, ...args.updates } : r));
         return { success: true };
       }
       if (toolName === 'entity_delete') {
         if (!args.confirm) return { success: false, error: 'confirm=true required' };
         pushHistory();
         setRecords(prev => prev.filter(r => r.id !== args.id));
         return { success: true };
       }
       if (toolName === 'command_start' && args.workflow === 'branch-scenario') {
          handleBranchScenario(args.sourceId);
          return { success: true };
       }
       if (toolName === 'command_undo') {
          handleUndo();
          return { success: true };
       }
       if (toolName === 'artifact_export') {
          return { success: true, artifact: getSessionExport() };
       }
       if (toolName === 'artifact_import') {
          handleImportSession(args.artifact);
          return { success: true };
       }
       return { success: false, error: 'Unknown tool' };
    };
  }, [records, weaverState, history]);

  // Derived state
  const derived = useMemo(() => {
    const active = records.filter(r => r.status === 'ready' || r.status === 'changed');
    const totalVolume = active.reduce((acc, r) => acc + r.volume, 0);
    return {
      totalActiveLayers: active.length,
      averageVolume: active.length > 0 ? Math.round(totalVolume / active.length) : 0,
      weaverState
    };
  }, [records, weaverState]);

  const pushHistory = useCallback(() => {
    setHistory(prev => [...prev, { records: clone(records), weaverState: clone(weaverState) }]);
  }, [records, weaverState]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRecords(previous.records);
    setWeaverState(previous.weaverState);
    setHistory(prev => prev.slice(0, -1));
  }, [history]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  const handleCreateLayer = () => {
    pushHistory();
    const newLayer: SoundLayer = {
      id: generateId(),
      name: 'New Layer',
      status: 'draft',
      volume: 50,
      pan: 0,
      effects: [],
      order: records.length,
    };
    setRecords(prev => [...prev, newLayer]);
  };

  const handleUpdateLayer = (id: string, updates: Partial<SoundLayer>) => {
    // Validate bounds
    if (updates.volume !== undefined && (updates.volume < 0 || updates.volume > 100)) {
        setValidationError(`Invalid volume: ${updates.volume}. Must be between 0 and 100.`);
        return;
    }
    if (updates.pan !== undefined && (updates.pan < -100 || updates.pan > 100)) {
        setValidationError(`Invalid pan: ${updates.pan}. Must be between -100 and 100.`);
        return;
    }
    setValidationError(null);
    pushHistory();
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleDeleteLayer = (id: string) => {
    pushHistory();
    setRecords(prev => prev.filter(r => r.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
    if (weaverState.sourceLayerId === id || weaverState.scenarioLayerId === id) {
       setWeaverState({ state: 'idle', sourceLayerId: null, scenarioLayerId: null });
    }
  };

  const handleBranchScenario = (sourceId: string) => {
    const source = records.find(r => r.id === sourceId);
    if (!source) return;

    pushHistory();
    const scenarioId = generateId();
    const scenarioLayer: SoundLayer = {
      ...clone(source),
      id: scenarioId,
      name: `${source.name} (Scenario)`,
      status: 'changed',
      order: source.order + 0.5, // insert right after
    };

    const updatedRecords = [...records, scenarioLayer].sort((a, b) => a.order - b.order);
    // re-normalize order
    updatedRecords.forEach((r, i) => r.order = i);

    setRecords(updatedRecords);

    // update source status if needed
    setRecords(prev => prev.map(r => r.id === sourceId ? { ...r, status: 'archived' } : r));

    setWeaverState({
      state: 'selected',
      sourceLayerId: sourceId,
      scenarioLayerId: scenarioId,
    });
    setSelectedLayerId(scenarioId);
  };

  const getSessionExport = (): SoundscapeSceneComposerSession => {
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history: [] // we don't serialize deep history to keep payload sane, or we could.
    };
  };

  const handleExport = () => {
    const data = getSessionExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soundscape-scene-v1-scenario-weaver.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    pushHistory();
    setRecords([]);
    setWeaverState({ state: 'idle', sourceLayerId: null, scenarioLayerId: null });
    setSelectedLayerId(null);
  };

  const handleImportSession = (sessionData: any) => {
    if (!sessionData || sessionData.schemaVersion !== 'v1' || !Array.isArray(sessionData.records)) {
      setValidationError("Malformed schema: import rejected.");
      return;
    }
    // Check bounds on imported records
    for (const r of sessionData.records) {
      if (r.volume < 0 || r.volume > 100 || r.pan < -100 || r.pan > 100) {
        setValidationError(`Invalid bounds in import for record ${r.id}: import rejected.`);
        return;
      }
    }

    pushHistory();
    setValidationError(null);
    setRecords(sessionData.records);
    if (sessionData.derived?.weaverState) {
       setWeaverState(sessionData.derived.weaverState);
    } else {
       setWeaverState({ state: 'idle', sourceLayerId: null, scenarioLayerId: null });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        handleImportSession(json);
      } catch (err) {
        setValidationError("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = '';
  };

  const filteredRecords = records.filter(r => filterStatus === 'all' || r.status === filterStatus);

  return (
    <div className="flex h-screen w-full bg-neutral-900 text-neutral-100 overflow-hidden font-sans">

      {/* LEFT SIDEBAR - Collection */}
      <div className="w-80 flex flex-col border-r border-neutral-700 bg-neutral-800/50">
        <div className="p-4 border-b border-neutral-700 flex justify-between items-center">
          <h1 className="font-bold text-lg text-neutral-200">Sound Layers</h1>
          <button onClick={handleCreateLayer} className="p-1.5 hover:bg-neutral-700 rounded-md transition-colors" title="Add Layer">
            <Plus size={18} />
          </button>
        </div>

        <div className="px-4 py-2 flex gap-2 overflow-x-auto border-b border-neutral-700/50">
           {['all', 'empty', 'draft', 'ready', 'changed', 'archived'].map(s => (
             <button
               key={s}
               onClick={() => setFilterStatus(s as any)}
               className={`text-xs px-2 py-1 rounded-full whitespace-nowrap capitalize ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
             >
               {s}
             </button>
           ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredRecords.length === 0 && (
            <div className="text-center text-sm text-neutral-500 py-8">
              No layers match current filter.
            </div>
          )}
          {filteredRecords.map(layer => (
            <div
              key={layer.id}
              onClick={() => setSelectedLayerId(layer.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedLayerId === layer.id ? 'border-blue-500 bg-blue-900/20' : 'border-neutral-700/50 bg-neutral-800 hover:border-neutral-600'} ${layer.status === 'archived' ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm truncate">{layer.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${
                  layer.status === 'ready' ? 'bg-green-500/20 text-green-400' :
                  layer.status === 'changed' ? 'bg-amber-500/20 text-amber-400' :
                  layer.status === 'archived' ? 'bg-neutral-600/40 text-neutral-400' :
                  layer.status === 'draft' ? 'bg-blue-500/20 text-blue-400' : 'bg-neutral-700 text-neutral-400'
                }`}>
                  {layer.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-400">
                 <div className="flex items-center gap-1"><Volume2 size={12}/> {layer.volume}%</div>
                 <div>Pan: {layer.pan}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CANVAS - Scenario Weaver & Inspector */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Toolbar */}
        <div className="h-14 border-b border-neutral-700 bg-neutral-900 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={handleUndo} disabled={history.length === 0} className="p-2 hover:bg-neutral-800 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-neutral-400 hover:text-neutral-200" title="Undo (Ctrl+Z)">
               <Undo2 size={18} />
             </button>
             {validationError && (
               <span className="text-red-400 text-sm bg-red-400/10 px-3 py-1 rounded-md">{validationError}</span>
             )}
          </div>
          <div className="flex items-center gap-3">
             <button onClick={handleClear} className="text-sm px-3 py-1.5 text-neutral-400 hover:text-neutral-200 transition-colors">Clear</button>
             <label className="text-sm px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-md cursor-pointer flex items-center gap-2 transition-colors">
               <Upload size={14} /> Import
               <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
             </label>
             <button onClick={handleExport} className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-md text-white flex items-center gap-2 transition-colors">
               <Download size={14} /> Export
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* Scenario Weaver Canvas */}
          <div className="flex-1 p-6 flex flex-col overflow-y-auto">
             <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2"><SplitSquareHorizontal className="text-blue-400"/> Scenario Weaver</h2>
                <div className="text-sm px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 capitalize flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${weaverState.state === 'idle' ? 'bg-neutral-500' : 'bg-blue-500 animate-pulse'}`}></span>
                  {weaverState.state}
                </div>
             </div>

             {/* Signature Interaction Visualizer */}
             <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-8 flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                {weaverState.state === 'idle' ? (
                  <div className="text-center max-w-sm text-neutral-500">
                    <SplitSquareHorizontal size={48} className="mx-auto mb-4 opacity-30" />
                    <p>Select a sound layer from the collection and branch it into a scenario to compare outcomes.</p>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-8 w-full max-w-3xl">
                     {/* Source Node */}
                     <div className="flex-1 w-full bg-neutral-800 border border-neutral-600 rounded-xl p-4 shadow-lg relative opacity-60">
                        <div className="text-xs text-neutral-400 mb-2 uppercase tracking-wide">Source (Archived)</div>
                        {weaverState.sourceLayerId && (
                           <div className="font-medium truncate">{records.find(r => r.id === weaverState.sourceLayerId)?.name}</div>
                        )}
                     </div>

                     {/* Connection Line */}
                     <div className="h-8 md:h-1 w-1 md:w-16 bg-blue-500/50 relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-400/50 -translate-x-full animate-[slide_1.5s_ease-in-out_infinite]"></div>
                     </div>

                     {/* Scenario Node */}
                     <div className="flex-1 w-full bg-blue-900/20 border-2 border-blue-500/50 rounded-xl p-4 shadow-[0_0_20px_rgba(59,130,246,0.15)] relative transform transition-transform motion-reduce:transform-none hover:scale-105">
                        <div className="text-xs text-blue-400 mb-2 uppercase tracking-wide">Scenario Variant</div>
                        {weaverState.scenarioLayerId && (
                           <div className="font-bold truncate text-white">{records.find(r => r.id === weaverState.scenarioLayerId)?.name}</div>
                        )}
                     </div>
                  </div>
                )}
             </div>
          </div>

          {/* Right Sidebar - Inspector & Derived State */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-neutral-700 bg-neutral-900 flex flex-col shrink-0 max-h-[50vh] md:max-h-full">

            {/* Inspector */}
            <div className="flex-1 overflow-y-auto p-4 border-b border-neutral-700/50">
               <h3 className="text-sm font-semibold text-neutral-400 mb-4 uppercase tracking-wider">Properties</h3>

               {selectedLayerId ? (() => {
                  const layer = records.find(r => r.id === selectedLayerId);
                  if (!layer) return <div className="text-sm text-neutral-600">Layer not found.</div>;

                  return (
                    <div className="space-y-5">
                       <div>
                         <label className="block text-xs text-neutral-500 mb-1">Name</label>
                         <input
                           type="text"
                           value={layer.name}
                           onChange={e => handleUpdateLayer(layer.id, { name: e.target.value })}
                           className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                         />
                       </div>

                       <div>
                         <label className="block text-xs text-neutral-500 mb-1 flex justify-between">
                           Volume <span>{layer.volume}%</span>
                         </label>
                         <input
                           type="range" min="0" max="100"
                           value={layer.volume}
                           onChange={e => handleUpdateLayer(layer.id, { volume: parseInt(e.target.value, 10) })}
                           className="w-full accent-blue-500"
                         />
                       </div>

                       <div>
                         <label className="block text-xs text-neutral-500 mb-1 flex justify-between">
                           Pan (L/R) <span>{layer.pan > 0 ? `R${layer.pan}` : layer.pan < 0 ? `L${Math.abs(layer.pan)}` : 'C'}</span>
                         </label>
                         <input
                           type="range" min="-100" max="100"
                           value={layer.pan}
                           onChange={e => handleUpdateLayer(layer.id, { pan: parseInt(e.target.value, 10) })}
                           className="w-full accent-blue-500"
                         />
                       </div>

                       <div>
                         <label className="block text-xs text-neutral-500 mb-1">Status</label>
                         <select
                           value={layer.status}
                           onChange={e => handleUpdateLayer(layer.id, { status: e.target.value as SoundLayerStatus })}
                           className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 capitalize"
                         >
                           {['empty', 'draft', 'ready', 'changed', 'archived'].map(s => (
                             <option key={s} value={s}>{s}</option>
                           ))}
                         </select>
                       </div>

                       <div className="pt-4 border-t border-neutral-800 flex gap-2">
                          <button
                            onClick={() => handleBranchScenario(layer.id)}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 rounded font-medium transition-colors flex justify-center items-center gap-2"
                          >
                            <SplitSquareHorizontal size={14}/> Branch Scenario
                          </button>
                          <button
                            onClick={() => handleDeleteLayer(layer.id)}
                            className="px-3 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded transition-colors"
                            title="Delete Layer"
                          >
                            <Trash2 size={14}/>
                          </button>
                       </div>
                    </div>
                  );
               })() : (
                  <div className="text-sm text-neutral-600 text-center py-8">Select a layer to edit properties.</div>
               )}
            </div>

            {/* Derived Summary */}
            <div className="p-4 bg-neutral-800/30">
               <h3 className="text-sm font-semibold text-neutral-400 mb-3 uppercase tracking-wider">Derived Summary</h3>
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-neutral-800 p-3 rounded-lg border border-neutral-700/50">
                    <div className="text-xs text-neutral-500 mb-1">Active Layers</div>
                    <div className="text-xl font-bold">{derived.totalActiveLayers}</div>
                  </div>
                  <div className="bg-neutral-800 p-3 rounded-lg border border-neutral-700/50">
                    <div className="text-xs text-neutral-500 mb-1">Avg Volume</div>
                    <div className="text-xl font-bold">{derived.averageVolume}%</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
