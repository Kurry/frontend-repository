import React, { useState } from 'react';
import { useStore, LaneType } from './store';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';

export default function App() {
  const store = useStore();
  const [exportOutput, setExportOutput] = useState('');

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && over.id.startsWith('lane-')) {
      const lane = over.id.replace('lane-', '') as LaneType;
      store.insertInstance(active.id, lane, 0); // Simplified insertion at start
    }
  };

  const DraggableSource = ({ source }: { source: any }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id: source.id,
    });
    const style = transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
      <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 mb-2">
        <div className="font-medium">{source.name} - {source.speaker}</div>
        <div className="text-sm text-gray-400 mt-1">Duration: {source.duration}ms</div>
        <div className={`text-xs mt-2 ${source.rightsState === 'allowed' ? 'text-green-400' : 'text-red-400'}`}>
          Rights: {source.rightsState}
        </div>
      </div>
    );
  };

  const DroppableLane = ({ lane }: { lane: LaneType }) => {
    const { isOver, setNodeRef } = useDroppable({ id: `lane-${lane}` });
    const instances = store.instances.filter(i => i.lane === lane);

    return (
      <div ref={setNodeRef} className={`flex border h-24 rounded relative ${isOver ? 'bg-gray-600 border-green-500' : 'bg-gray-800 border-gray-700'}`}>
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gray-900 border-r border-gray-700 p-2 flex items-center text-sm font-medium capitalize">
          {lane}
        </div>
        <div className="flex-1 relative ml-24 overflow-hidden">
          {instances.map(inst => (
            <div key={inst.id} className="absolute top-2 bottom-2 bg-blue-500 rounded flex items-center justify-center text-xs font-bold"
                 style={{ left: `${(inst.start / 300000) * 100}%`, width: `${((inst.end - inst.start) / 300000) * 100}%` }}>
              <div className="truncate px-1">{store.sources.find(s => s.id === inst.sourceId)?.name}</div>
              <button onClick={() => store.deleteInstance(inst.id)} className="absolute top-0 right-0 bg-red-600 text-white text-xs px-1 hover:bg-red-700">x</button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white font-sans lg:h-screen">
      <header className="flex flex-col gap-3 border-b border-gray-700 bg-gray-800 p-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl font-bold">Side Street Signals - Episode Assembly ({store.branch})</h1>
        <div className="flex flex-wrap items-center gap-2 lg:gap-4">
          <div className={`px-2 py-1 rounded text-sm ${store.rights.approved ? 'bg-green-800' : 'bg-red-800'}`}>
            {store.rights.approved ? 'Approved' : 'Unapproved'} {store.rights.stale && '(Stale)'}
          </div>
          <div className="text-sm">Render: {store.renderStatus}</div>
          <button onClick={() => store.branchCut('fork-1')} className="px-4 py-2 bg-blue-600 rounded">Branch</button>
          <button onClick={() => store.approve()} className="px-4 py-2 bg-green-600 rounded">Approve</button>
          <button onClick={() => store.render()} className="px-4 py-2 bg-purple-600 rounded">Render</button>
          <button onClick={() => setExportOutput(store.exportData())} className="px-4 py-2 bg-indigo-600 rounded">Export</button>
        </div>
      </header>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <aside className="flex w-full flex-col border-r border-gray-700 bg-gray-800 lg:w-80">
            <div className="p-4 border-b border-gray-700">
              <h2 className="font-semibold uppercase text-xs text-gray-400 tracking-wider">Source Bin</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {store.sources.map(s => <DraggableSource key={s.id} source={s} />)}
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col">
            <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between">
              <h2 className="font-semibold uppercase text-xs text-gray-400 tracking-wider">Timeline</h2>
              <div className="flex gap-2">
                <button onClick={() => store.rippleMove(store.instances[0]?.id, 5000)} className="text-xs bg-gray-700 px-2 rounded">Ripple Move +5s</button>
                <button onClick={() => store.splitInstance(store.instances[0]?.id, 5000)} className="text-xs bg-gray-700 px-2 rounded">Split 1st</button>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              <DroppableLane lane="dialogue" />
              <DroppableLane lane="music" />
              <DroppableLane lane="ambient" />
            </div>

            {exportOutput && (
              <div className="h-48 bg-black p-4 overflow-auto border-t border-gray-700">
                <div className="flex justify-between mb-2">
                  <h3 className="text-sm text-gray-400">Export Artifact</h3>
                  <button onClick={() => setExportOutput('')} className="text-xs text-red-400">Close</button>
                </div>
                <pre className="whitespace-pre-wrap break-all text-xs text-green-400">{exportOutput}</pre>
              </div>
            )}
          </main>

          <aside className="flex w-full flex-col border-l border-gray-700 bg-gray-800 lg:w-80">
            <div className="p-4 border-b border-gray-700">
              <h2 className="font-semibold uppercase text-xs text-gray-400 tracking-wider">Chapters, Cites & Mix</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <h3 className="text-sm mb-2 text-gray-400">Chapters</h3>
                {store.chapters.map(c => (
                  <div key={c.id} className="p-2 bg-gray-700 rounded mb-2 text-sm">
                    <div className="font-medium">{c.title}</div>
                    <div className="text-gray-400">{c.start} - {c.end}</div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm mb-2 text-gray-400">Citations</h3>
                {Object.entries(store.citations).map(([id, status]) => (
                  <div key={id} className="flex justify-between items-center p-2 bg-gray-700 rounded mb-2 text-sm">
                    <span>{id}</span>
                    {status === 'orphan' ? (
                      <button onClick={() => store.fixCitation(id)} className="text-xs bg-red-600 px-2 rounded hover:bg-red-500">Fix Orphan</button>
                    ) : (
                      <span className="text-green-400 text-xs">Bound</span>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm mb-2 text-gray-400">Mix Automation</h3>
                <div className="p-2 bg-gray-700 rounded text-sm flex justify-between items-center">
                  <span>Loudness (dB)</span>
                  <input type="range" min="-30" max="0" value={store.mix.loudness} onChange={(e) => store.updateMix('loudness', parseInt(e.target.value))} />
                  <span>{store.mix.loudness}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </DndContext>
    </div>
  );
}
