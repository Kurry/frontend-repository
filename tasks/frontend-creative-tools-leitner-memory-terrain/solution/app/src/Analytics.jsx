import React from 'react';
import { useStore } from './store';

export function Analytics() {
  const { cards } = useStore();
  const boxCounts = [0, 0, 0, 0, 0];
  cards.forEach(c => {
    if (c.box >= 1 && c.box <= 5) {
      boxCounts[c.box - 1]++;
    }
  });

  return (
    <div className="flex flex-col gap-4">
       <div className="border p-4 rounded bg-white shadow-sm">
         <h3 className="font-bold mb-2">Mastery Radial (Sunburst)</h3>
         <div className="flex items-end h-24 gap-2">
            {boxCounts.map((count, i) => (
              <div key={i} className="flex-1 bg-blue-500 relative group flex flex-col justify-end" style={{ height: Math.max(10, (count / cards.length) * 100) + '%' }}>
                <span className="text-xs text-white text-center pb-1">{count}</span>
                <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs p-1 rounded whitespace-nowrap">
                  Box {i+1}
                </div>
              </div>
            ))}
         </div>
       </div>

       <div className="border p-4 rounded bg-white shadow-sm">
          <h3 className="font-bold mb-2">Error Clusters</h3>
          <div className="flex flex-wrap gap-2">
             {cards.filter(c => c.box === 1).map(c => (
               <div key={c.id} className="text-xs p-1 border rounded bg-red-50 text-red-900 truncate w-32 cursor-pointer">
                  [Again] {c.front}
               </div>
             ))}
             {cards.filter(c => c.box === 2).map(c => (
               <div key={c.id} className="text-xs p-1 border rounded bg-orange-50 text-orange-900 truncate w-32 cursor-pointer">
                  [Hard] {c.front}
               </div>
             ))}
          </div>
       </div>
    </div>
  );
}
