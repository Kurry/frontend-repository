import React from 'react';
import { useStore } from '../Store';
import { Smartphone } from 'lucide-react';

export const MobilePreview = () => {
  const { records } = useStore();

  return (
    <div className="bg-black p-4 rounded-3xl border-8 border-gray-800 shadow-xl w-64 h-[500px] flex flex-col mx-auto shrink-0 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-10"></div>

      <div className="flex-1 bg-white rounded-xl overflow-y-auto pt-6 pb-4 px-3 flex flex-col gap-3 scrollbar-hide">
        <div className="flex items-center gap-2 mb-2 text-gray-800 border-b pb-2">
          <Smartphone size={16} />
          <span className="font-semibold text-sm">Live Preview</span>
        </div>

        {records.map(r => (
          <div key={r.id} className="bg-gray-50 border border-gray-200 p-2 rounded shadow-sm text-xs">
            <p className="font-medium text-gray-800 mb-1 leading-snug">{r.content}</p>
            <div className="flex justify-between items-center text-[10px] text-gray-500">
              <span className={`px-1 rounded bg-opacity-20 ${r.status === 'conflict' ? 'bg-red-500 text-red-700' : 'bg-gray-500 text-gray-700'}`}>
                {r.status}
              </span>
              <span>{r.timing}s</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
