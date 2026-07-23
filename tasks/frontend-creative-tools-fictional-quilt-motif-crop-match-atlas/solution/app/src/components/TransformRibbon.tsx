import React from 'react';
import { useStore } from '../store/useStore';
import { TRANSFORMS, applyTransform, calculateDistance } from '../lib/motif-math';

export const TransformRibbon = () => {
  const { motifs, selectedMotifId, previewQueryRows, canonicalCrop, inspectionTransform, setInspectionTransform } = useStore();

  if (!selectedMotifId) return null;
  const motif = motifs.find(m => m.id === selectedMotifId);
  if (!motif) return null;

  const queryRows = canonicalCrop?.queryRows || previewQueryRows;
  if (!queryRows) return null;

  const oriented = applyTransform(motif.canonicalRows, motif.canonicalOrientation);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-semibold">Transforms</div>
      <div className="flex gap-2 overflow-x-auto pb-2 px-1">
        {TRANSFORMS.map(t => {
          const transformed = applyTransform(oriented, t);
          const { distance } = calculateDistance(queryRows, transformed);
          const isSelected = t === inspectionTransform;

          return (
            <button
              key={t}
              onClick={() => setInspectionTransform(t)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 border rounded transition-colors ${
                isSelected ? 'border-primary bg-primary/5' : 'hover:bg-accent/50 border-border'
              }`}
            >
              <svg viewBox="0 0 8 8" className="w-10 h-10 text-foreground">
                {transformed.map((row, y) =>
                  row.split('').map((cell, x) =>
                    cell === '1' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" /> : null
                  )
                )}
              </svg>
              <div className="text-[10px] font-mono text-muted-foreground">{t}</div>
              <div className="text-xs font-mono font-medium">{distance}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
