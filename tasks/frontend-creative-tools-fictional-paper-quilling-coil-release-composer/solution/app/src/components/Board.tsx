import React from 'react';
import { useStore } from '../store/useStore';

export const Board: React.FC = () => {
   const { coils, samples, contacts, selectedCoilId, selectCoil, previewRadius, previewOverlapError, commitReleaseRadius, previewReleaseRadius, cancelReleaseRadius, renderer, setRenderer } = useStore();

   return (
      <div className="flex flex-col w-[900px]">
         <div className="flex gap-2 mb-2 p-2 bg-slate-200 rounded items-center">
            <span className="font-bold">Renderer:</span>
            <label><input type="radio" name="renderer" value="svg" checked={renderer === 'svg'} onChange={() => setRenderer('svg')} /> SVG</label>
            <label><input type="radio" name="renderer" value="canvas" checked={renderer === 'canvas'} onChange={() => setRenderer('canvas')} /> Canvas</label>
         </div>
         <div className="relative w-[900px] h-[600px] bg-[var(--color-board)] overflow-hidden border-2 border-slate-300" data-testid="logical-board">
            {renderer === 'svg' ? (
               <svg width="100%" height="100%" viewBox="0 0 900 600" className="absolute inset-0">
                  {Object.values(coils).map(coil => {
                     if (coil.status !== 'active') return null;
                     const isActive = selectedCoilId === coil.id;
                     const currentRadius = isActive && previewRadius !== null ? previewRadius : coil.releaseRadius;
                     const coilSamples = isActive && previewRadius !== null ? samples[coil.id] : samples[coil.id];

                     return (
                        <g key={coil.id} onClick={() => selectCoil(coil.id)} className="cursor-pointer">
                           <circle cx={coil.centerX} cy={coil.centerY} r={currentRadius} fill="none" stroke={isActive ? 'blue' : 'gray'} strokeWidth="1" strokeDasharray="4 4" />
                           <circle cx={coil.centerX} cy={coil.centerY} r={coil.innerRadius} fill="none" stroke="gray" strokeWidth="0.5" />
                           <circle cx={coil.centerX} cy={coil.centerY} r="2" fill={isActive ? 'blue' : 'black'} />

                           {coilSamples && coilSamples.length > 0 && (
                              <path
                                 d={`M ${coilSamples[0].xUnit} ${coilSamples[0].yUnit} ` + coilSamples.slice(1).map(s => `L ${s.xUnit} ${s.yUnit}`).join(' ')}
                                 fill="none"
                                 stroke="var(--color-strip-coral)"
                                 strokeWidth="2"
                              />
                           )}

                           {isActive && (
                              <circle
                                 cx={coil.centerX + currentRadius}
                                 cy={coil.centerY}
                                 r="6"
                                 fill="white"
                                 stroke="blue"
                                 strokeWidth="2"
                                 className="cursor-ew-resize outline-none"
                                 tabIndex={0}
                                 onKeyDown={(e) => {
                                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                                       const delta = e.key === 'ArrowRight' ? 5 : -5;
                                       previewReleaseRadius(coil.id, currentRadius + delta);
                                    } else if (e.key === 'Enter') {
                                       if (previewRadius !== null) commitReleaseRadius(coil.id, previewRadius);
                                       else previewReleaseRadius(coil.id, coil.releaseRadius);
                                    } else if (e.key === 'Escape') {
                                       cancelReleaseRadius();
                                    }
                                 }}
                              />
                           )}
                        </g>
                     );
                  })}
                  {contacts.map(c => c.relation === 'tangent' && <circle key={c.id} cx={c.contactX} cy={c.contactY} r="4" fill="red" />)}
               </svg>
            ) : (
               <div className="absolute inset-0 flex items-center justify-center text-gray-500">Canvas Renderer (Placeholder)</div>
            )}

            {/* Simple handle controls for E2E testing */}
            {selectedCoilId && (
               <div className="absolute bottom-4 left-4 bg-white p-4 rounded shadow border border-slate-400">
                  <h3 className="font-bold text-sm">Selected: {selectedCoilId}</h3>
                  {previewOverlapError && <p className="text-red-500 text-xs my-1">{previewOverlapError}</p>}
                  <div className="flex gap-2 mt-2">
                     <button onClick={() => previewReleaseRadius(selectedCoilId, (previewRadius ?? coils[selectedCoilId].releaseRadius) + 5)} className="px-2 py-1 bg-gray-200 text-sm">Radius +5</button>
                     <button onClick={() => previewReleaseRadius(selectedCoilId, (previewRadius ?? coils[selectedCoilId].releaseRadius) - 5)} className="px-2 py-1 bg-gray-200 text-sm">Radius -5</button>
                     <button onClick={() => { if (previewRadius !== null) commitReleaseRadius(selectedCoilId, previewRadius); }} className="px-2 py-1 bg-blue-500 text-white text-sm">Confirm</button>
                     <button onClick={cancelReleaseRadius} className="px-2 py-1 bg-red-500 text-white text-sm">Cancel</button>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};
