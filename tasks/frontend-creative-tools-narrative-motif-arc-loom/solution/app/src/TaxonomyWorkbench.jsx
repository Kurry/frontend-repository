import React, { useState } from 'react';
import { useStore } from './store.js';
import { PALETTE } from './fixture.js';
import { v4 as uuidv4 } from 'uuid';

export function TaxonomyWorkbench() {
  const motifs = useStore(state => state.motifs);
  const updateMotif = useStore(state => state.updateMotif);
  const spans = useStore(state => state.spans);
  const classifySpan = useStore(state => state.classifySpan);
  const setMotifs = useStore(state => (newMotifs) => useStore.setState({ motifs: newMotifs }));
  const setSpans = useStore(state => (newSpans) => useStore.setState({ spans: newSpans }));
  const store = useStore();

  const handleSpanDragStart = (e, spanId) => {
    e.dataTransfer.setData('spanId', spanId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, motifId) => {
    e.preventDefault();
    const spanId = e.dataTransfer.getData('spanId');
    if (spanId) {
      classifySpan(spanId, motifId, e.shiftKey);
    }
  };

  const handleSplit = (motifId) => {
    const parentMotif = motifs.find(m => m.id === motifId);
    if (!parentMotif) return;

    const child1Id = uuidv4();
    const child2Id = uuidv4();
    const child1 = { id: child1Id, name: `${parentMotif.name} (Split 1)`, colorId: parentMotif.colorId };
    const child2 = { id: child2Id, name: `${parentMotif.name} (Split 2)`, colorId: parentMotif.colorId };

    const newSpans = spans.map(s => {
      if (s.motifId === motifId) {
        return { ...s, motifId: child1Id };
      }
      return s;
    });

    const newMotifs = motifs.map(m => m.id === motifId ? null : m).filter(Boolean);
    newMotifs.push(child1, child2);

    useStore.setState({ motifs: newMotifs, spans: newSpans });
  };

  const handleMerge = (motifId1, motifId2) => {
    const newSpans = spans.map(s => {
      if (s.motifId === motifId2) {
        return { ...s, motifId: motifId1 };
      }
      return s;
    });

    const newMotifs = motifs.filter(m => m.id !== motifId2);
    useStore.setState({ motifs: newMotifs, spans: newSpans });
  };

  return (
    <div className="bg-white border p-4 rounded shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Motif Taxonomy Workbench</h2>
        <div className="text-sm text-gray-500">Hold <kbd className="bg-gray-100 border px-1 rounded">Shift</kbd> while dropping to set as Counterexample</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {motifs.map((motif, index) => {
          const color = PALETTE.find(p => p.id === motif.colorId)?.value || '#ccc';
          const motifSpans = spans.filter(s => s.motifId === motif.id);

          return (
            <div
              key={motif.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, motif.id)}
              className="border rounded p-3 flex flex-col gap-2 relative bg-gray-50"
              style={{ borderTop: `4px solid ${color}` }}
            >
              <div className="flex justify-between items-center">
                <input
                  type="text"
                  value={motif.name}
                  onChange={(e) => updateMotif(motif.id, { name: e.target.value })}
                  className="font-bold bg-transparent outline-none border-b border-transparent focus:border-gray-300 w-[60%]"
                />
                <select
                  value={motif.colorId}
                  onChange={(e) => updateMotif(motif.id, { colorId: e.target.value })}
                  className="text-xs p-1 rounded bg-white border outline-none"
                >
                  {PALETTE.map(p => (
                    <option key={p.id} value={p.id}>{p.id}</option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-gray-600">
                {motifSpans.length} spans
              </div>

              <div className="flex gap-2 mt-auto pt-2 border-t border-dashed">
                <button
                  onClick={() => handleSplit(motif.id)}
                  className="text-xs bg-white hover:bg-gray-100 border px-2 py-1 rounded w-full"
                >
                  Split
                </button>
                <button
                  onClick={() => index > 0 && handleMerge(motifs[index-1].id, motif.id)}
                  disabled={index === 0}
                  className="text-xs bg-white hover:bg-gray-100 border px-2 py-1 rounded w-full disabled:opacity-50"
                  title="Merge into previous motif"
                >
                  Merge Left
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 border-t pt-4">
        <h3 className="font-semibold text-sm text-gray-700 mb-3">Unclassified Evidence <span className="font-normal text-xs text-gray-500">(Drag to classify)</span></h3>
        <div className="flex flex-wrap gap-2">
          {spans.filter(s => s.motifId === null).map(span => (
            <div
              key={span.id}
              draggable
              onDragStart={(e) => handleSpanDragStart(e, span.id)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded shadow-sm text-sm cursor-move hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              "{span.text}"
            </div>
          ))}
          {spans.filter(s => s.motifId === null).length === 0 && (
            <div className="text-sm text-gray-400 italic py-2">Select text in the Evidence Reader to create evidence spans.</div>
          )}
        </div>
      </div>
    </div>
  );
}
