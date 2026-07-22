import React from 'react';
import { useStore } from './store.js';
import { COLLECTIONS, TEXTS, PALETTE } from './fixture.js';

export function Visualizations() {
  const motifs = useStore(state => state.motifs);
  const spans = useStore(state => state.spans);

  const getCentroid = (motifId, collectionId) => {
    const texts = COLLECTIONS.find(c => c.id === collectionId)?.texts || [];
    const relevantSpans = spans.filter(s => s.motifId === motifId && texts.includes(s.textId));

    if (relevantSpans.length === 0) return null;

    let totalSentiment = 0;
    let totalComplexity = 0;

    relevantSpans.forEach(s => {
      const feats = TEXTS[s.textId].features;
      totalSentiment += s.isCounterexample ? (1 - feats.sentiment) : feats.sentiment;
      totalComplexity += s.isCounterexample ? (1 - feats.complexity) : feats.complexity;
    });

    return {
      sentiment: totalSentiment / relevantSpans.length,
      complexity: totalComplexity / relevantSpans.length
    };
  };

  return (
    <div className="bg-white border p-4 rounded shadow-sm relative overflow-hidden flex flex-col h-[300px]">
      <h2 className="text-xl font-bold mb-4 z-10">Narrative Arc</h2>
      <div className="flex-1 flex gap-4 relative isolate items-center">
        {COLLECTIONS.map((collection) => (
          <div key={collection.id} className="flex-1 border-r border-dashed border-gray-200 h-full relative" />
        ))}

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {motifs.map(motif => {
            const color = PALETTE.find(p => p.id === motif.colorId)?.value || '#000';
            let path = "";
            let first = true;

            COLLECTIONS.forEach((collection, i) => {
              const centroid = getCentroid(motif.id, collection.id);
              if (centroid) {
                const x = (i + 0.5) * 25;
                const y = (1 - centroid.sentiment) * 100;

                if (first) {
                  path += `M ${x} ${y} `;
                  first = false;
                } else {
                  path += `L ${x} ${y} `;
                }
              }
            });

            return path ? (
              <path
                key={motif.id}
                d={path}
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                className="transition-all duration-300"
                style={{ vectorEffect: 'non-scaling-stroke' }}
              />
            ) : null;
          })}

          {motifs.map(motif => {
            const color = PALETTE.find(p => p.id === motif.colorId)?.value || '#000';
            return COLLECTIONS.map((collection, i) => {
              const centroid = getCentroid(motif.id, collection.id);
              if (centroid) {
                const x = `calc(${(i + 0.5) * 25}%)`;
                const y = `calc(${(1 - centroid.sentiment) * 100}%)`;
                return <circle key={`${motif.id}-${collection.id}`} cx={x} cy={y} r="5" fill={color} />;
              }
              return null;
            });
          })}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2 px-12">
        <span>Low Sentiment</span>
        <span>High Sentiment</span>
      </div>
    </div>
  );
}
