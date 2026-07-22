import React from 'react';
import { useStore } from '../store/useStore';

export const RadialProfile: React.FC = () => {
   const { samples, selectedCoilId } = useStore();

   if (!selectedCoilId || !samples[selectedCoilId]) {
      return <div className="p-4 bg-white border">No coil selected for profile</div>;
   }

   const coilSamples = samples[selectedCoilId];

   return (
      <div className="p-4 bg-white border overflow-x-auto h-32 flex flex-row items-end gap-1">
         <h3 className="absolute text-sm text-gray-500">Radial Profile</h3>
         {coilSamples.map((s, _i) => {
            const height = (s.radiusNumerator / s.radiusDenominator) * 2;
            return (
               <div key={s.id} title={`Sample ${s.sampleIndex}: ${s.radiusNumerator}/${s.radiusDenominator}`}
                  className="w-1 bg-blue-500" style={{ height: `${height}px` }} />
            );
         })}
      </div>
   );
}
