import React from 'react';
import { useStore } from '../store/useStore';

export const SampledVertexTable: React.FC = () => {
   const { samples, selectedCoilId } = useStore();

   if (!selectedCoilId || !samples[selectedCoilId]) return null;

   const coilSamples = samples[selectedCoilId].slice(0, 5); // Just show top 5

   return (
      <div className="p-4 bg-white border h-48 overflow-y-auto">
         <h3 className="font-bold">Sampled Vertex Table (Preview)</h3>
         <table className="w-full text-xs">
            <thead>
               <tr><th>ID</th><th>Radius</th><th>Fixed X</th><th>Fixed Y</th></tr>
            </thead>
            <tbody>
               {coilSamples.map(s => (
                  <tr key={s.id}>
                     <td>{s.id}</td>
                     <td>{s.radiusNumerator}/{s.radiusDenominator}</td>
                     <td>{s.xFixed}</td>
                     <td>{s.yFixed}</td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
   );
}
