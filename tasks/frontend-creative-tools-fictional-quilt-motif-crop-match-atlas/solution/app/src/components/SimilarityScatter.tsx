import React from 'react';
import { useStore } from '../store/useStore';
import { applyTransform } from '../lib/motif-math';

export const SimilarityScatter = () => {
  const { globalRanking, motifs, canonicalCrop, previewQueryRows, selectedMotifId, selectCandidate } = useStore();

  const queryRows = canonicalCrop?.queryRows || previewQueryRows;

  if (!queryRows || globalRanking.length === 0) return null;

  const queryOccupied = queryRows.join('').split('').filter(c => c === '1').length;

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="text-sm font-semibold">Similarity Scatter</div>
      <div className="flex-1 min-h-[150px] border rounded bg-card relative overflow-hidden p-2">
        <svg viewBox="-64 0 128 64" className="w-full h-full" preserveAspectRatio="none">
          <line x1={-64} y1={64} x2={64} y2={64} stroke="currentColor" className="text-muted-foreground/30" strokeWidth={1} />
          <line x1={0} y1={0} x2={0} y2={64} stroke="currentColor" className="text-muted-foreground/30" strokeWidth={1} />

          {globalRanking.map(match => {
            const motif = motifs.find(m => m.id === match.motifId);
            if (!motif) return null;

            const oriented = applyTransform(motif.canonicalRows, motif.canonicalOrientation);
            const transformed = applyTransform(oriented, match.bestTransform);
            const candOccupied = transformed.join('').split('').filter(c => c === '1').length;

            const deltaOccupied = candOccupied - queryOccupied;
            const isSelected = selectedMotifId === match.motifId;

            return (
              <circle
                key={match.motifId}
                cx={deltaOccupied}
                cy={match.distance}
                r={isSelected ? 3 : 1.5}
                className={`transition-all cursor-pointer ${isSelected ? 'text-primary fill-current' : 'text-muted-foreground fill-current opacity-50 hover:opacity-100'}`}
                onClick={() => selectCandidate(match.motifId)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};
