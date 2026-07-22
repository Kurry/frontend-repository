import React, { useState } from 'react';
import { useStore } from './store.js';
import { COLLECTIONS, PALETTE, TEXTS } from './fixture.js';
import { cn } from './utils.js';

export function Loom() {
  const motifs = useStore(state => state.motifs);
  const stages = useStore(state => state.stages);
  const relations = useStore(state => state.relations);
  const addStage = useStore(state => state.addStage);
  const moveStage = useStore(state => state.moveStage);
  const addRelation = useStore(state => state.addRelation);
  const spans = useStore(state => state.spans);

  const [linkingSource, setLinkingSource] = useState(null);

  const getStageY = (motifId, collectionId) => {
    const stage = stages.find(s => s.motifId === motifId && s.collectionId === collectionId);
    if (stage) return stage.y;
    const index = motifs.findIndex(m => m.id === motifId);
    return index * 40 + 40;
  };

  const handleStageClick = (motifId, collectionId) => {
    if (!linkingSource) {
      const existing = stages.find(s => s.motifId === motifId && s.collectionId === collectionId);
      if (!existing) {
        addStage({ motifId, collectionId, y: getStageY(motifId, collectionId) });
      }
      setLinkingSource({ motifId, collectionId });
    } else {
      if (linkingSource.motifId === motifId && linkingSource.collectionId !== collectionId) {
        const type = window.prompt("Relation type (continues, reverses, echoes, resolves):", "continues");
        if (type) {
          addRelation({
            sourceMotifId: linkingSource.motifId,
            sourceCollectionId: linkingSource.collectionId,
            targetMotifId: motifId,
            targetCollectionId: collectionId,
            type
          });
        }
      }
      setLinkingSource(null);
    }
  };

  const handleDragStart = (e, motifId, collectionId) => {
    e.dataTransfer.setData('motifId', motifId);
    e.dataTransfer.setData('collectionId', collectionId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, collectionId) => {
    e.preventDefault();
    const motifId = e.dataTransfer.getData('motifId');
    const sourceCollectionId = e.dataTransfer.getData('collectionId');
    if (motifId && sourceCollectionId === collectionId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;

      const existing = stages.find(s => s.motifId === motifId && s.collectionId === collectionId);
      if (!existing) {
        addStage({ motifId, collectionId, y });
      } else {
        moveStage(motifId, collectionId, y);
      }
    }
  };

  return (
    <div className="bg-white border p-4 rounded shadow-sm relative overflow-hidden flex flex-col h-[400px]">
      <h2 className="text-xl font-bold mb-4 z-10">Collection-Stage Loom</h2>
      {linkingSource && (
        <div className="text-sm bg-blue-100 text-blue-800 p-2 rounded mb-2 w-max z-10">
          Linking {motifs.find(m => m.id === linkingSource.motifId)?.name} in {COLLECTIONS.find(c => c.id === linkingSource.collectionId)?.name}. Click target stage.
          <button onClick={() => setLinkingSource(null)} className="ml-4 font-bold">Cancel</button>
        </div>
      )}

      <div className="flex-1 flex gap-4 relative isolate">
        {COLLECTIONS.map(collection => (
          <div
            key={collection.id}
            className="flex-1 border-r border-dashed border-gray-200 relative bg-gray-50/50 rounded"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, collection.id)}
          >
            <div className="text-center font-semibold text-gray-500 py-2 bg-gray-100/50">{collection.name}</div>

            {motifs.map(motif => {
              const color = PALETTE.find(p => p.id === motif.colorId)?.value || '#ccc';
              const y = getStageY(motif.id, collection.id);

              const hasEvidence = spans.some(s => s.motifId === motif.id && TEXTS[s.textId] && COLLECTIONS.find(c => c.id === collection.id)?.texts.includes(s.textId));
              const isStage = stages.find(s => s.motifId === motif.id && s.collectionId === collection.id);
              const isActive = hasEvidence || isStage;

              return (
                <div
                  key={motif.id}
                  draggable={isActive}
                  onDragStart={(e) => handleDragStart(e, motif.id, collection.id)}
                  onClick={() => isActive && handleStageClick(motif.id, collection.id)}
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 cursor-pointer shadow flex items-center justify-center text-xs font-bold text-white transition-transform hover:scale-110",
                    isActive ? "opacity-100" : "opacity-20 border-dashed pointer-events-none",
                    linkingSource?.motifId === motif.id && linkingSource?.collectionId === collection.id ? "ring-4 ring-blue-400" : ""
                  )}
                  style={{ top: y, backgroundColor: color, borderColor: isActive ? '#fff' : color }}
                  title={`${motif.name} (Drag to reorder, Click to link)`}
                >
                  {motif.name[0]}
                </div>
              )
            })}
          </div>
        ))}

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {relations.map((rel, i) => {
            const sourceColIndex = COLLECTIONS.findIndex(c => c.id === rel.sourceCollectionId);
            const targetColIndex = COLLECTIONS.findIndex(c => c.id === rel.targetCollectionId);
            const sourceY = getStageY(rel.sourceMotifId, rel.sourceCollectionId);
            const targetY = getStageY(rel.targetMotifId, rel.targetCollectionId);
            const color = PALETTE.find(p => p.id === motifs.find(m => m.id === rel.sourceMotifId)?.colorId)?.value || '#000';

            const sourceX = `calc(${(sourceColIndex + 0.5) * 25}% )`;
            const targetX = `calc(${(targetColIndex + 0.5) * 25}% )`;

            return (
              <g key={i}>
                <line
                  x1={sourceX} y1={sourceY + 16}
                  x2={targetX} y2={targetY + 16}
                  stroke={color}
                  strokeWidth="4"
                  strokeOpacity="0.4"
                  strokeDasharray={rel.type === 'echoes' ? '5,5' : 'none'}
                />
                <text
                  x={`calc(${(sourceColIndex + targetColIndex + 1) * 12.5}% )`}
                  y={(sourceY + targetY) / 2 + 16 - 10}
                  fill={color}
                  className="text-[10px] font-bold"
                  textAnchor="middle"
                >
                  {rel.type}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  );
}
