import React from 'react';
import { useStore } from '../store/useStore';
import { applyTransform, calculateDistance } from '../lib/motif-math';

export const OverlayLoupe = () => {
  const { motifs, selectedMotifId, canonicalCrop, previewQueryRows, inspectionTransform, decisions } = useStore();

  const queryRows = canonicalCrop?.queryRows || previewQueryRows;

  if (!selectedMotifId || !queryRows || !inspectionTransform) {
    return <div className="border border-dashed rounded p-4 text-center text-sm text-muted-foreground h-48 flex items-center justify-center">Select a result to inspect</div>;
  }

  const motif = motifs.find(m => m.id === selectedMotifId);
  if (!motif) return null;

  const oriented = applyTransform(motif.canonicalRows, motif.canonicalOrientation);
  const transformed = applyTransform(oriented, inspectionTransform);
  const { distance, mismatches } = calculateDistance(queryRows, transformed);

  const _decision = decisions.find(d => d.motifId === selectedMotifId && d.decisionStatus);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">Overlay Loupe</span>
        <span className="text-muted-foreground font-mono text-xs">Dist: {distance}/64</span>
      </div>

      <div className="aspect-square w-full max-w-[200px] border shadow-sm mx-auto bg-card relative">
        <svg viewBox="0 0 8 8" className="w-full h-full">
          <g className="text-muted/20">
            {[...Array(8)].map((_, i) => (
              <line key={`v${i}`} x1={i} y1={0} x2={i} y2={8} stroke="currentColor" strokeWidth={0.02} />
            ))}
            {[...Array(8)].map((_, i) => (
              <line key={`h${i}`} x1={0} y1={i} x2={8} y2={i} stroke="currentColor" strokeWidth={0.02} />
            ))}
          </g>

          {queryRows.map((qRow, y) =>
            qRow.split('').map((qCell, x) => {
              const cCell = transformed[y][x];
              const _isMismatch = qCell !== cCell;

              if (qCell === '1' && cCell === '1') {
                return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" className="text-foreground" />;
              } else if (qCell === '1' && cCell === '0') {
                return (
                  <g key={`${x}-${y}`}>
                    <rect x={x} y={y} width={1} height={1} fill="currentColor" className="text-blue-500/50" />
                    <text x={x+0.5} y={y+0.7} fontSize="0.6" textAnchor="middle" fill="currentColor" className="text-blue-700 font-bold">Q</text>
                  </g>
                );
              } else if (qCell === '0' && cCell === '1') {
                return (
                  <g key={`${x}-${y}`}>
                    <rect x={x} y={y} width={1} height={1} fill="currentColor" className="text-red-500/50" />
                    <text x={x+0.5} y={y+0.7} fontSize="0.6" textAnchor="middle" fill="currentColor" className="text-red-700 font-bold">C</text>
                  </g>
                );
              }
              return null;
            })
          )}
        </svg>
      </div>

      {mismatches.length > 0 && (
        <div className="text-xs text-muted-foreground mt-1">
          Mismatches: <span className="font-mono">{mismatches.join(', ')}</span>
        </div>
      )}
    </div>
  );
};
