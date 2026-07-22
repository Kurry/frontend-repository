import React, { useState } from 'react';
import { useStore } from './store.js';
import { TEXTS, PALETTE } from './fixture.js';
import { cn } from './utils.js';

export function MatrixRadar() {
  const motifs = useStore(state => state.motifs);
  const spans = useStore(state => state.spans);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const textIds = Object.keys(TEXTS);

  const handleCellClick = (motifId, textId) => {
    const node = { motifId, textId };
    setSelectedNodes(prev => {
      const exists = prev.find(n => n.motifId === motifId && n.textId === textId);
      if (exists) return prev.filter(n => n !== exists);
      const next = [...prev, node];
      if (next.length > 2) next.shift();
      return next;
    });
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      <div className="bg-white border p-4 rounded shadow-sm flex-1 overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">Recurrence Matrix</h2>
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr>
              <th className="p-2 border-b border-gray-300 font-semibold text-gray-600">Motif \ Text</th>
              {textIds.map(textId => (
                <th key={textId} className="p-2 border-b border-gray-300 text-xs font-normal text-gray-500 w-10 text-center" title={textId}>
                  {textId.replace('t', '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {motifs.map(motif => {
              const color = PALETTE.find(p => p.id === motif.colorId)?.value || '#ccc';
              return (
                <tr key={motif.id}>
                  <td className="p-2 border-b border-gray-100 font-medium" style={{ color }}>{motif.name}</td>
                  {textIds.map(textId => {
                    const cellSpans = spans.filter(s => s.motifId === motif.id && s.textId === textId);
                    const isSelected = selectedNodes.some(n => n.motifId === motif.id && n.textId === textId);

                    let bgClass = "bg-transparent";
                    let inner = null;

                    if (cellSpans.length > 0) {
                      const hasDirect = cellSpans.some(s => !s.isCounterexample);
                      const hasCounter = cellSpans.some(s => s.isCounterexample);

                      if (hasDirect && hasCounter) inner = "±";
                      else if (hasDirect) inner = "✓";
                      else if (hasCounter) inner = "✗";
                    }

                    return (
                      <td
                        key={textId}
                        className={cn("p-1 border-b border-gray-100 text-center cursor-pointer transition-colors", isSelected ? "ring-2 ring-inset ring-blue-500 bg-blue-50" : "hover:bg-gray-50")}
                        onClick={() => handleCellClick(motif.id, textId)}
                      >
                        <div
                          className="mx-auto w-6 h-6 flex items-center justify-center rounded"
                          style={{ backgroundColor: cellSpans.length > 0 ? `${color}40` : 'transparent', color: cellSpans.length > 0 ? color : 'inherit', fontWeight: 'bold' }}
                        >
                          {inner}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-white border p-4 rounded shadow-sm w-full xl:w-1/3 min-w-[300px] flex flex-col">
        <h2 className="text-xl font-bold mb-4">Feature Radar</h2>
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {selectedNodes.length === 0 ? (
            <div className="text-gray-400 italic text-center">Select up to two cells in the matrix to compare features.</div>
          ) : (
            <div className="w-full max-w-[250px] aspect-square border-4 border-gray-100 rounded-full relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-[1px] bg-gray-200 absolute"></div>
                <div className="w-[1px] h-full bg-gray-200 absolute"></div>
              </div>

              {selectedNodes.map((node, i) => {
                const motif = motifs.find(m => m.id === node.motifId);
                const textFeats = TEXTS[node.textId].features;
                const color = PALETTE.find(p => p.id === motif?.colorId)?.value || (i === 0 ? 'blue' : 'red');

                const x = (textFeats.sentiment - 0.5) * 100;
                const y = (0.5 - textFeats.complexity) * 100;

                return (
                  <div
                    key={i}
                    className="absolute w-4 h-4 rounded-full shadow-md z-10"
                    style={{
                      backgroundColor: color,
                      transform: `translate(${x}px, ${y}px)`,
                      border: '2px solid white'
                    }}
                    title={`${motif?.name} in ${node.textId}`}
                  />
                )
              })}

              <span className="absolute top-2 text-[10px] text-gray-500 font-bold">Low Complexity</span>
              <span className="absolute bottom-2 text-[10px] text-gray-500 font-bold">High Complexity</span>
              <span className="absolute left-2 text-[10px] text-gray-500 font-bold -rotate-90 origin-left translate-y-[20px]">Low Sentiment</span>
              <span className="absolute right-2 text-[10px] text-gray-500 font-bold rotate-90 origin-right translate-y-[20px] -translate-x-[20px]">High Sentiment</span>
            </div>
          )}
        </div>

        {selectedNodes.length > 0 && (
          <div className="mt-4 flex gap-2 text-xs justify-center flex-wrap">
            {selectedNodes.map((node, i) => {
              const motif = motifs.find(m => m.id === node.motifId);
              const color = PALETTE.find(p => p.id === motif?.colorId)?.value || '#000';
              return (
                <div key={i} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="font-semibold">{motif?.name}</span>
                  <span className="text-gray-500">({node.textId})</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
