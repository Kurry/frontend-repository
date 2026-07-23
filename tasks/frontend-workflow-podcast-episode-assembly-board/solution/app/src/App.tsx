import React, { useState, useEffect } from 'react';
import { runValidation }
from './validator';
import { useStore, LaneType, Source, Instance, Chapter } from './store';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { Trash, Split, Move, Copy, Check, AlertTriangle, Play, RefreshCw, Download, FileJson, FileText, Settings, HelpCircle, FastForward, Loader } from 'lucide-react';
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from 'framer-motion';

// Helpers
const formatMs = (ms: number) => (ms / 1000).toFixed(2) + 's';

export default function App() {
  const store = useStore();
  const [exportOutput, setExportOutput] = useState('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'validator' | 'forks' | 'export'>('timeline');
  const [sortAsc, setSortAsc] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);

  // Innovation: Onboarding
  const [showOnboarding, setShowOnboarding] = useState(true);


  // Innovation: Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedInstance) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        store.deleteInstance(selectedInstance);
      } else if (e.key === 'ArrowRight') {
        store.updateInstance(selectedInstance, { start: store.instances.find(i => i.id === selectedInstance)!.start + 1000, end: store.instances.find(i => i.id === selectedInstance)!.end + 1000 });
      } else if (e.key === 'ArrowLeft') {
        store.updateInstance(selectedInstance, { start: Math.max(0, store.instances.find(i => i.id === selectedInstance)!.start - 1000), end: Math.max(1000, store.instances.find(i => i.id === selectedInstance)!.end - 1000) });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInstance, store]);

  // Trim functionality
  const handleTrimStart = (id: string, delta: number) => {
    const inst = store.instances.find(i => i.id === id);
    if (inst) store.updateInstance(id, { start: Math.max(0, inst.start + delta), sourceStart: Math.max(0, inst.sourceStart + delta) });
  };
  const handleTrimEnd = (id: string, delta: number) => {
    const inst = store.instances.find(i => i.id === id);
    if (inst) store.updateInstance(id, { end: Math.max(inst.start + 1000, inst.end + delta), sourceEnd: Math.max(inst.sourceStart + 1000, inst.sourceEnd + delta) });
  };


  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && over.id.startsWith('lane-')) {
      const lane = over.id.replace('lane-', '') as LaneType;
      store.insertInstance(String(active.id), lane, 0);
    }
  };

  const sortedSources = [...store.sources].sort((a, b) => {
    if (a.name < b.name) return sortAsc ? -1 : 1;
    if (a.name > b.name) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleApprove = (cat: string) => {
    setLoadingAction(`approve-${cat}`);
    setTimeout(() => {
      store.approveCategory(cat as any);
      setLoadingAction(null);
    }, 500);
  };

  const handleRender = () => {
    setLoadingAction('render');
    setTimeout(() => {
      store.render();
      setLoadingAction(null);
    }, 1000);
  };

  const handleRetryRender = () => {
    setLoadingAction('retry');
    setTimeout(() => {
      store.retryRender();
      setLoadingAction(null);
    }, 1000);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      store.deleteInstance(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="flex min-h-screen flex-col bg-gray-900 text-gray-100 font-sans md:h-screen overflow-hidden">

      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0 }}
            className="bg-gray-800 p-8 rounded-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Welcome to Side Street Signals</h2>
            <p className="mb-6 text-gray-300">This is your assembly board. Drag clips to the timeline, edit chapters, and approve your mix. We've enhanced it with dynamic rendering and branch management.</p>
            <button onClick={() => setShowOnboarding(false)} className="w-full py-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 transition-colors">Get Started</button>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-gray-700 bg-gray-800 p-4 md:flex-row md:items-center md:justify-between shrink-0">
        <h1 className="text-xl md:text-2xl font-bold capitalize">Side Street Signals - Episode Assembly ({store.branch})</h1>

        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(store.approvals).map(([cat, val]) => (
            <div key={cat} className="flex items-center gap-1">
              <span className="text-xs uppercase text-gray-400">{cat}</span>
              <button
                onClick={() => handleApprove(cat)}
                className={`px-3 md:px-4 py-2 md:py-3 min-h-[44px] min-w-[44px] rounded transition-all duration-300 text-sm font-medium flex items-center gap-2
                  ${val.status === 'approved' ? 'bg-green-700 hover:bg-green-600' : val.status === 'stale' ? 'bg-yellow-700 hover:bg-yellow-600' : 'bg-red-700 hover:bg-red-600'}`}
              >
                {loadingAction === `approve-${cat}` ? <Loader className="w-4 h-4 animate-spin" /> : null}
                {val.status === 'stale' ? 'Stale' : val.status === 'approved' ? 'Approved' : 'Unapproved'}
              </button>
            </div>
          ))}

          <div className="h-8 w-px bg-gray-700 mx-2 hidden md:block"></div>

          <button onClick={() => store.branchCut(`fork-${Object.keys(store.forks).length + 1}`)} className="px-4 py-3 min-h-[44px] min-w-[44px] bg-blue-600 hover:bg-blue-500 transition-colors rounded text-sm font-medium">Branch</button>
          <button onClick={handleRender} className="px-4 py-3 min-h-[44px] min-w-[44px] bg-purple-600 hover:bg-purple-500 transition-colors rounded text-sm font-medium flex items-center gap-2">
            {loadingAction === 'render' ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Render ({store.renderPipeline.status})
          </button>
          {store.renderPipeline.status === 'failed' && (
            <button onClick={handleRetryRender} className="px-4 py-3 min-h-[44px] min-w-[44px] bg-orange-600 hover:bg-orange-500 transition-colors rounded text-sm font-medium flex items-center gap-2">
               {loadingAction === 'retry' ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Retry Failed
            </button>
          )}
          <button onClick={() => { setActiveTab('export'); store.generateExportOutputs(); }} className="px-4 py-3 min-h-[44px] min-w-[44px] bg-indigo-600 hover:bg-indigo-500 transition-colors rounded text-sm font-medium">Export</button>
        </div>
      </header>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden relative">

          {/* Source Bin Sidebar */}
          <aside className="flex w-full flex-col border-r border-gray-700 bg-gray-800 md:w-[350px] shrink-0">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold text-sm uppercase text-gray-400 tracking-wider">Source Bin</h2>
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="text-xs bg-gray-700 px-3 py-2 min-h-[44px] min-w-[44px] rounded hover:bg-gray-600 transition-colors"
                title="Toggle Sort Ascending/Descending"
              >
                Sort: {sortAsc ? 'Asc' : 'Desc'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sortedSources.length === 0 ? (
                <div className="text-gray-500 text-sm italic text-center p-4">Source bin is empty</div>
              ) : (
                <AnimatePresence>
                  {sortedSources.map(s => (
                    <SourceCard key={s.id} source={s} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </aside>

          {/* Main Board */}
          <main className="flex min-w-0 flex-1 flex-col bg-gray-900">
            <div className="p-4 border-b border-gray-700 bg-gray-800 flex gap-4 overflow-x-auto">
              <button onClick={() => setActiveTab('timeline')} className={`px-4 py-3 min-h-[44px] rounded text-sm font-medium transition-colors ${activeTab === 'timeline' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Timeline</button>
              <button onClick={() => setActiveTab('validator')} className={`px-4 py-3 min-h-[44px] rounded text-sm font-medium transition-colors ${activeTab === 'validator' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Validation</button>
              <button onClick={() => setActiveTab('forks')} className={`px-4 py-3 min-h-[44px] rounded text-sm font-medium transition-colors ${activeTab === 'forks' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Forks</button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 relative">
              {activeTab === 'timeline' && (
                <>
                  <div className="flex justify-between items-center bg-gray-800 p-3 rounded mb-4">
                    <span className="text-sm font-medium text-gray-300">Keyboard shortcuts enabled. Select clip to highlight provenance.</span>
                    <div className="flex gap-2">
                      <button onClick={() => store.instances[0] && store.rippleMove(store.instances[0].id, 5000)} className="text-xs bg-gray-700 px-3 py-2 min-h-[44px] min-w-[44px] rounded hover:bg-gray-600 transition-colors" title="Ripple Move +5s">Ripple +5s</button>
                      <button onClick={() => store.instances[0] && store.splitInstance(store.instances[0].id, 5000)} className="text-xs bg-gray-700 px-3 py-2 min-h-[44px] min-w-[44px] rounded hover:bg-gray-600 transition-colors" title="Split at 5s">Split</button>
                    </div>
                  </div>

                  {['dialogue', 'crosstalk', 'music', 'ambient', 'marker'].map(lane => (
                    <TimelineLane key={lane} lane={lane as LaneType} store={store} selected={selectedInstance} onSelect={setSelectedInstance} onDelete={handleDelete} deleteConfirm={deleteConfirm} />
                  ))}

                  {store.instances.length === 0 && (
                    <div className="text-gray-500 text-sm italic text-center p-12 border-2 border-dashed border-gray-700 rounded">Timeline is empty. Drag clips here.</div>
                  )}
                </>
              )}

              {activeTab === 'validator' && (
                <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                  <h3 className="text-lg font-bold">Validation Findings</h3>
                  <ul className="space-y-3">
                    {runValidation(store).map((finding, idx) => (
                      <li key={idx} className={`flex items-center gap-3 p-3 rounded border ${finding.type === 'error' ? 'bg-red-900/30 border-red-800 text-red-200' : 'bg-green-900/30 border-green-800 text-green-200'}`}>
                        {finding.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                        {finding.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === 'forks' && (
                <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                  <h3 className="text-lg font-bold">Branch Comparisons</h3>
                  {Object.keys(store.forks).length === 0 ? (
                    <p className="text-gray-400">No branches available. Create a branch to compare.</p>
                  ) : (
                    Object.keys(store.forks).map(f => (
                      <div key={f} className="p-4 border border-gray-700 rounded flex justify-between items-center">
                        <div>
                          <h4 className="font-bold">{f}</h4>
                          <p className="text-sm text-gray-400">Instances: {store.forks[f].instances.length}</p>
                        </div>
                        <button onClick={store.mergeCut} className="px-4 py-2 min-h-[44px] bg-blue-600 rounded text-sm hover:bg-blue-500">Merge</button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'export' && (
                <div className="bg-gray-800 p-6 rounded-lg space-y-6">
                  <h3 className="text-lg font-bold">Export Artifacts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(store.exportDataOutputs).map(([format, data]) => (
                      <div key={format} className="p-4 bg-gray-700 rounded flex flex-col gap-3">
                        <span className="font-mono text-sm font-bold uppercase">{format}</span>
                        <a
                          href={`data:text/plain;charset=utf-8,${encodeURIComponent(data)}`}
                          download={`episode-export.${format === 'json' ? 'json' : format === 'csv' ? 'csv' : format === 'vtt' ? 'vtt' : format === 'rss' ? 'xml' : format === 'md' ? 'md' : 'svg'}`}
                          className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-blue-600 hover:bg-blue-500 rounded font-medium text-sm transition-colors"
                        >
                          <Download className="w-4 h-4" /> Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* Chapters & Mix Sidebar */}
          <aside className="flex w-full flex-col border-l border-gray-700 bg-gray-800 md:w-[350px] shrink-0">
            <div className="p-4 border-b border-gray-700">
              <h2 className="font-semibold text-sm uppercase text-gray-400 tracking-wider">Chapters, Citations & Mix</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

              <section>
                <h3 className="text-sm font-bold mb-3 text-gray-300">Chapters Outline</h3>
                <div className="space-y-2">
                  {store.chapters.map((c, i) => (
                    <div key={c.id} className="p-3 bg-gray-700 rounded text-sm hover:bg-gray-600 transition-colors flex gap-2">
                      <div className="flex flex-col gap-1 w-6 items-center border-r border-gray-600 pr-2">
                        <button onClick={() => store.reorderChapters(c.id, -1)} disabled={i === 0} className="hover:text-blue-400 disabled:opacity-30"><FastForward className="w-3 h-3 -rotate-90"/></button>
                        <button onClick={() => store.reorderChapters(c.id, 1)} disabled={i === store.chapters.length - 1} className="hover:text-blue-400 disabled:opacity-30"><FastForward className="w-3 h-3 rotate-90"/></button>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold">{c.title} <span className="text-xs font-normal text-blue-400 ml-1">({c.role})</span></div>
                        <div className="text-gray-400 text-xs mt-1">{formatMs(c.start)} - {formatMs(c.end)}</div>
                        <div className="text-xs text-gray-300 mt-1 line-clamp-1">{c.summary}</div>
                        <div className="text-[10px] text-purple-400 mt-1">Speakers: {c.speakers.join(', ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold mb-3 text-gray-300">Citations</h3>
                <div className="space-y-2">
                  {Object.entries(store.citations).map(([id, status]) => (
                    <div key={id} className="flex justify-between items-center p-3 bg-gray-700 rounded text-sm">
                      <span className="font-mono">{id}</span>
                      {status === 'orphan' ? (
                        <button onClick={() => store.fixCitation(id)} className="text-xs bg-red-600 px-3 py-2 min-h-[44px] rounded hover:bg-red-500 font-medium">Fix Orphan</button>
                      ) : (
                        <span className="text-green-400 text-xs font-bold px-2 flex items-center gap-1"><Check className="w-3 h-3" /> Bound</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold mb-3 text-gray-300">Mix Automation</h3>
                <div className="p-4 bg-gray-700 rounded space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <label htmlFor="loudness-slider" className="text-sm font-medium">Loudness Curve</label>
                      <span className="text-xs bg-black px-2 py-1 rounded font-mono">{store.mix.loudness} dB</span>
                    </div>
                    <input
                      id="loudness-slider"
                      type="range" min="-30" max="0"
                      value={store.mix.loudness}
                      onChange={(e) => store.updateMix('loudness', parseInt(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                  <p className="text-xs text-gray-400">Draggable time/value curves interpolate linearly.</p>
                </div>
              </section>

              {selectedInstance && (
                <section>
                  <h3 className="text-sm font-bold mb-3 text-blue-400">Selected Source Provenance</h3>
                  <div className="p-3 bg-gray-800 border border-blue-900 rounded text-xs space-y-2">
                    {(() => {
                      const inst = store.instances.find(i => i.id === selectedInstance);
                      const src = store.sources.find(s => s.id === inst?.sourceId);
                      if (!src || !inst) return <div>Not found</div>;
                      return (
                        <>
                          <div className="font-bold text-sm">{src.name}</div>
                          <div><span className="text-gray-400">Hash:</span> <span className="font-mono">{src.mediaHash}</span></div>
                          <div><span className="text-gray-400">Range:</span> {formatMs(inst.sourceStart)} - {formatMs(inst.sourceEnd)}</div>
                          <div><span className="text-gray-400">Tokens:</span> "{src.transcriptSnippet}"</div>
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => store.updateInstance(inst.id, { included: !inst.included })} className="px-2 py-2 min-h-[44px] bg-blue-700 rounded">
                              {inst.included ? 'Exclude Tokens' : 'Include Tokens'}
                            </button>
                            <button className="px-2 py-2 min-h-[44px] bg-gray-700 rounded">Bind Span to Note</button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </section>
              )}

            </div>
          </aside>
        </div>
      </DndContext>
    </div>
    </MotionConfig>
  );
}

const SourceCard = ({ source }: { source: Source }) => {
  const shouldReduceMotion = useReducedMotion();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: source.id,
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
      ref={setNodeRef} style={style} {...listeners} {...attributes}
      role="button" tabIndex={0}
      className="p-3 bg-gray-700 rounded-lg cursor-grab active:cursor-grabbing hover:bg-gray-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="font-bold text-sm">{source.name}</div>
        <div className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider ${source.rightsState === 'allowed' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
          {source.rightsState}
        </div>
      </div>
      <div className="text-xs text-gray-300 mb-2">{source.speaker} <span className="text-gray-500">|</span> {source.type}</div>
      <div className="text-[10px] text-gray-400 font-mono mb-2 truncate" title={source.mediaHash}>{source.mediaHash}</div>
      <div className="text-[10px] text-gray-400 italic mb-2">"{source.transcriptSnippet}"</div>

      <div className="grid grid-cols-2 gap-1 text-[9px] text-gray-500 mt-2 border-t border-gray-600 pt-2">
        <div><span className="font-medium text-gray-400">Duration:</span> {formatMs(source.duration)}</div>
        <div><span className="font-medium text-gray-400">Territory:</span> {source.territory}</div>
        <div><span className="font-medium text-gray-400">Usage:</span> {source.allowedUsage}</div>
        <div><span className="font-medium text-gray-400">Expires:</span> {source.expiryAfterPublish}</div>
      </div>
    </motion.div>
  );
};

const TimelineLane = ({ lane, store, selected, onSelect, onDelete, deleteConfirm }: { lane: LaneType, store: any, selected: string | null, onSelect: (id: string) => void, onDelete: (id: string) => void, deleteConfirm: string | null }) => {
  const { isOver, setNodeRef } = useDroppable({ id: `lane-${lane}` });
  const instances = store.instances.filter((i: Instance) => i.lane === lane);

  const shouldReduceMotion = useReducedMotion();
  const colors = {
    dialogue: 'bg-blue-500',
    crosstalk: 'bg-indigo-500',
    music: 'bg-pink-500',
    ambient: 'bg-teal-500',
    marker: 'bg-yellow-500'
  };

  return (
    <div className="flex flex-col mb-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs uppercase font-bold text-gray-400 w-20">{lane}</span>
        <div className="flex gap-1">
           <button className="text-[10px] px-2 py-1 min-h-[44px] min-w-[44px] bg-gray-800 rounded text-gray-400 hover:text-white" title="Mute Lane">Mute</button>
           <button className="text-[10px] px-2 py-1 min-h-[44px] min-w-[44px] bg-gray-800 rounded text-gray-400 hover:text-white" title="Solo Lane">Solo</button>
        </div>
      </div>
      <div ref={setNodeRef} className={`relative h-20 rounded-lg border-2 transition-colors overflow-x-auto flex ${isOver ? 'bg-gray-700 border-green-500' : 'bg-gray-800 border-gray-700'}`}>
        {/* Background Grid */}
        <div className="absolute inset-0 flex" style={{ backgroundSize: '10% 100%', backgroundImage: 'linear-gradient(to right, #374151 1px, transparent 1px)', minWidth: '1000px' }}></div>

        {instances.map((inst: Instance) => (
          <motion.div
            layout
            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
            initial={false}
            key={inst.id}
            onClick={() => onSelect(inst.id)}
            role="button" tabIndex={0}
            className={`absolute top-1 bottom-1 ${colors[lane] || 'bg-gray-500'} rounded shadow-sm border ${selected === inst.id ? 'border-white ring-2 ring-white/50 z-20' : 'border-transparent z-10'} group`}
            style={{ left: `${(inst.start / 300000) * 100}%`, width: `${((inst.end - inst.start) / 300000) * 100}%`, minWidth: '40px' }}
          >
            <div className="px-2 py-1 h-full flex flex-col justify-between">
              <div className="text-[10px] font-bold truncate text-white drop-shadow-md">
                {store.sources.find((s: Source) => s.id === inst.sourceId)?.name || 'Unknown'}
              </div>
              <div className="text-[9px] text-white/80 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {formatMs(inst.start)} - {formatMs(inst.end)}
              </div>
            </div>

            {/* Trim handles */}
            <div
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-black/20 hover:bg-black/40"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const startX = e.clientX;
                const onMove = (moveEvent: PointerEvent) => {
                  const delta = (moveEvent.clientX - startX) * 100; // approximate ms mapping
                  store.updateInstance(inst.id, { start: Math.max(0, inst.start + delta) });
                };
                const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
                window.addEventListener('pointermove', onMove);
                window.addEventListener('pointerup', onUp);
              }}
            ></div>
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-black/20 hover:bg-black/40"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const startX = e.clientX;
                const onMove = (moveEvent: PointerEvent) => {
                  const delta = (moveEvent.clientX - startX) * 100; // approximate ms mapping
                  store.updateInstance(inst.id, { end: Math.max(inst.start + 100, inst.end + delta) });
                };
                const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
                window.addEventListener('pointermove', onMove);
                window.addEventListener('pointerup', onUp);
              }}
            ></div>
            <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-black/20 hover:bg-black/40"></div>

            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
               <button
                 onClick={(e) => { e.stopPropagation(); onDelete(inst.id); }}
                 className={`text-[10px] min-h-[44px] min-w-[44px] rounded flex items-center justify-center font-bold shadow ${deleteConfirm === inst.id ? 'bg-red-500 text-white' : 'bg-white text-gray-900 hover:bg-red-100'}`}
                 title="Delete Clip (Press again to confirm)"
               >
                 {deleteConfirm === inst.id ? 'Confirm' : 'Del'}
               </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
