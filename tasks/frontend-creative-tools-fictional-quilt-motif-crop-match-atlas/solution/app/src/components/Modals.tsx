import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { exportMatchPacket } from '../lib/export';

export const Modals = () => {
  const {
    canonicalCrop, previewCrop, previewQueryRows,
    commitCrop, cancelCrop,
    selectedMotifId, globalRanking, inspectionTransform, commitDecision,
    corrections, commitRevalidation, decisions,
    advanceLogicalClock
  } = useStore();

  const [accepting, setAccepting] = useState(false);
  const [rationale, setRationale] = useState('edge rhythm and occupied cells agree');

  const [revalidating, setRevalidating] = useState<string | null>(null);

  if (previewCrop && previewQueryRows && (!canonicalCrop || canonicalCrop.x !== previewCrop.x || canonicalCrop.width !== previewCrop.width)) {
    return (
      <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50">
        <div className="bg-card border shadow-lg rounded-lg p-6 max-w-md w-full flex flex-col gap-4" tabIndex={-1}>
          <h2 className="font-bold text-lg">Confirm Crop</h2>
          <div className="text-sm">
            Bounds: [{previewCrop.x}, {previewCrop.y}, {previewCrop.width}, {previewCrop.height}]
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={cancelCrop} className="px-4 py-2 text-sm hover:bg-accent rounded">Cancel</button>
            <button onClick={commitCrop} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90">Commit</button>
          </div>
        </div>
      </div>
    );
  }

  if (accepting && selectedMotifId && canonicalCrop) {
    const match = globalRanking.find(m => m.motifId === selectedMotifId);
    if (match) {
      return (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50">
          <div className="bg-card border shadow-lg rounded-lg p-6 max-w-md w-full flex flex-col gap-4">
            <h2 className="font-bold text-lg">Accept Match</h2>
            <div className="text-sm text-muted-foreground">
              Proposing <strong>{selectedMotifId}</strong> at distance {match.distance}/64 using transform {inspectionTransform}.
            </div>
            <textarea
              className="w-full border rounded p-2 text-sm bg-background"
              value={rationale}
              onChange={e => setRationale(e.target.value)}
              placeholder="Rationale..."
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setAccepting(false)} className="px-4 py-2 text-sm hover:bg-accent rounded">Cancel</button>
              <button onClick={() => {
                commitDecision({ motifId: selectedMotifId, rationale, decisionStatus: 'supported', bestTransform: inspectionTransform! });
                setAccepting(false);
              }} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90">Confirm Accept</button>
            </div>
          </div>
        </div>
      );
    }
  }

  if (revalidating) {
    const baseDecision = decisions.find(d => d.decisionId === revalidating);
    return (
      <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50">
        <div className="bg-card border shadow-lg rounded-lg p-6 max-w-md w-full flex flex-col gap-4">
          <h2 className="font-bold text-lg">Revalidate under correction</h2>
          <div className="text-sm">
            Correction corr-04 changed canonical orientation. Re-evaluating transform composition...
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setRevalidating(null)} className="px-4 py-2 text-sm hover:bg-accent rounded">Cancel</button>
            <button onClick={() => {
              commitRevalidation(baseDecision!.motifId, baseDecision!.decisionId!);
              setRevalidating(null);
            }} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90">Confirm</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 flex gap-2 z-40">
      {selectedMotifId && canonicalCrop && (
        <button
          onClick={() => setAccepting(true)}
          className="px-4 py-2 bg-primary text-primary-foreground shadow rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Accept Match
        </button>
      )}

      {corrections.length === 0 && decisions.length > 0 && (
        <button
          onClick={advanceLogicalClock}
          className="px-4 py-2 bg-secondary text-secondary-foreground shadow rounded-full text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          Reveal Correction corr-04
        </button>
      )}

      {corrections.some(c => c.id === 'corr-04') && decisions.some(d => d.motifId === 'motif-23' && d.decisionStatus && !d.parentCorrectionId) && (
        <button
          onClick={() => {
            const staleDecision = decisions.find(d => d.motifId === 'motif-23' && !d.parentCorrectionId);
            if (staleDecision) setRevalidating(staleDecision.decisionId!);
          }}
          className="px-4 py-2 bg-yellow-500 text-black shadow rounded-full text-sm font-medium hover:bg-yellow-400 transition-colors"
        >
          Revalidate under correction
        </button>
      )}

      <button
        onClick={async () => {
          await exportMatchPacket();
        }}
        className="px-4 py-2 bg-accent text-accent-foreground shadow rounded-full text-sm font-medium hover:bg-accent/80 transition-colors"
      >
        Export
      </button>
    </div>
  );
};
