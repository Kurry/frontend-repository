import React from 'react';
import { useStore } from '../store/useStore';

export const Timeline: React.FC = () => {
   const { decisions, annotations } = useStore();

   return (
      <div className="p-4 bg-white border max-h-64 overflow-y-auto">
         <h3 className="font-bold border-b pb-2 mb-2">Decisions & Annotations</h3>
         <div>
            <h4 className="font-semibold text-sm">Decisions</h4>
            {decisions.length === 0 ? <p className="text-xs">No decisions recorded.</p> : decisions.map(d => (
               <div key={d.id} className="text-xs bg-gray-100 p-2 my-1 rounded">
                  <span className="font-bold">{d.status}</span>: {d.rationale} <br />
                  <span className="text-gray-500">Sources: {d.sourceIds.join(', ')}</span>
               </div>
            ))}
         </div>
         <div className="mt-4">
            <h4 className="font-semibold text-sm">Annotations</h4>
            {annotations.length === 0 ? <p className="text-xs">No annotations.</p> : annotations.map(a => (
               <div key={a.id} className="text-xs bg-yellow-50 p-2 my-1 rounded border border-yellow-200">
                  <span className="font-bold">{a.targetType} ({a.targetId})</span>: {a.text}
               </div>
            ))}
         </div>
      </div>
   );
}
