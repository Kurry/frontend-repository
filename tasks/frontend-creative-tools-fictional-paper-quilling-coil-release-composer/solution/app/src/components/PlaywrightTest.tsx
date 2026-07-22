import React from 'react';
import { useStore } from '../store/useStore';
import { exportSamplePacket } from '../lib/export';

// A tiny helper to programmatically trigger the steps for e2e recording
export const PlaywrightTest: React.FC = () => {
   const { selectCoil, previewReleaseRadius, commitReleaseRadius, createDecision, addAnnotation, approveComposition } = useStore();

   return (
      <div className="p-4 border shadow rounded bg-slate-100">
         <h2 className="font-bold">E2E Helpers</h2>
         <button id="e2e-start" onClick={async () => {
            selectCoil('coil-07');
            await new Promise(r => setTimeout(r, 500));
            previewReleaseRadius('coil-07', 50);
            await new Promise(r => setTimeout(r, 500));
            commitReleaseRadius('coil-07', 50);
            await new Promise(r => setTimeout(r, 500));
            createDecision({
               parentDecisionId: null,
               status: 'working',
               rationale: 'the exact tangent closes the haven bloom without spending another strip',
               confidence: 'working',
               sourceIds: ['strip-coral-r2', 'motif-haven-bloom-r4'],
               curveHash: 'mock', contactHash: 'mock', motifHash: 'mock', metricsHash: 'mock'
            });
            await new Promise(r => setTimeout(r, 500));
            addAnnotation({
               targetId: 'contact-coil-07-coil-12',
               targetType: 'contact',
               text: 'retain this exact tangent in the sample card'
            });
            await new Promise(r => setTimeout(r, 500));
            approveComposition();
            await exportSamplePacket();
         }} className="bg-black text-white px-2 py-1">
            Run e2e flow
         </button>
      </div>
   );
};
