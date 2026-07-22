import React from 'react';
import { useStore } from '../store/index';
import { ProofRenderer } from './ProofRenderer';
import { FORMATS } from '../store/data';

export const ProofPanel: React.FC = () => {
  const currentRevisionId = useStore((state) => state.currentRevisionId);
  const revisions = useStore((state) => state.revisions);
  const activeFormatId = useStore((state) => state.activeFormatId);
  const zoom = useStore((state) => state.proofZoom);
  const renderer = useStore((state) => state.proofRenderer);
  const lineBrush = useStore((state) => state.lineBrush);

  const currentRevision = revisions[currentRevisionId];

  if (!currentRevision) return null;

  return (
    <div className="bg-gray-100 p-6 flex flex-col h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-2">
        <h3 className="font-semibold text-gray-700 uppercase tracking-wider text-sm">Physical Proofs</h3>

        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Format:</span>
            <select
              value={activeFormatId}
              onChange={(e) => useStore.setState({ activeFormatId: e.target.value })}
              className="text-sm border-gray-300 rounded"
            >
              {Object.values(FORMATS).map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Renderer:</span>
            <select
              value={renderer}
              onChange={(e) => useStore.setState({ proofRenderer: e.target.value as 'svg' | 'canvas' })}
              className="text-sm border-gray-300 rounded"
            >
              <option value="svg">SVG</option>
              <option value="canvas">Canvas</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex justify-center items-start">
        {/* Render only the active format proof for simplicity, though the PRD mentions a "triad"
            we can toggle them or show all. The PRD says "Wall, rail, and mobile proofs render from one current token stream"
            and "each proof shows prospective line breaks". We will render the active one prominently,
            or all three side-by-side if space allows. Let's just render the selected one for now to save space,
            or all three stacked. Stacking all three is safer for the requirements. */}
        <div className="space-y-10 w-full flex flex-col items-center">
          {Object.values(FORMATS).map(f => (
            <div key={f.id} className={`${f.id === activeFormatId ? 'ring-2 ring-blue-500 ring-offset-4' : 'opacity-70 grayscale'}`}>
               <ProofRenderer
                 formatId={f.id}
                 tokens={currentRevision.tokens}
                 rendererType={renderer}
                 zoom={zoom}
                 brushedLine={lineBrush}
               />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
