import React from 'react';
import { useStore } from '../store';

export default function WitnessSensors() {
  const { witnesses, placeWitness } = useStore();

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md">
      <h2 className="text-xl font-bold">Witness & Sensor Placement</h2>

      <div className="flex flex-col gap-2">
        {witnesses.map(witness => (
          <div key={witness.id} className="flex gap-4 items-center p-2 border rounded">
             <span className="font-semibold w-24">{witness.id}</span>
             <div className="flex flex-col">
               <label className="text-xs">Shelf ID</label>
               <input
                 className="border p-1 text-sm"
                 value={witness.shelfId}
                 onChange={e => placeWitness(witness.id, e.target.value, witness.x, witness.y, witness.zone)}
               />
             </div>
             <div className="flex flex-col">
               <label className="text-xs">Zone</label>
               <select
                 className="border p-1 text-sm"
                 value={witness.zone}
                 onChange={e => placeWitness(witness.id, witness.shelfId, witness.x, witness.y, e.target.value)}
               >
                 <option value="low">Low</option>
                 <option value="mid">Mid</option>
                 <option value="high">High</option>
               </select>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
