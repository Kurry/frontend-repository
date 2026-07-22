import React from 'react';
import { useStore } from '../store';
import { Clock, CheckCircle } from 'lucide-react';

export const OfferClock: React.FC = () => {
  const { logicalMinute, advanceLogicalClock, offers, acceptOffer } = useStore();

  const activeOffer = offers.find(o => o.status === 'offered');

  return (
    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-md shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 text-gray-700 font-mono text-sm border-r pr-4">
        <Clock size={16} />
        Minute {logicalMinute}
      </div>

      <div className="flex gap-2">
        <button onClick={() => advanceLogicalClock(1)} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">+1</button>
        <button onClick={() => advanceLogicalClock(5)} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">+5</button>
        <button onClick={() => advanceLogicalClock(6)} className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium rounded">+6 (Accept)</button>
        <button onClick={() => advanceLogicalClock(11)} className="px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 font-medium rounded">+11 (Expire)</button>
      </div>

      {activeOffer && (
        <div className="flex items-center gap-3 ml-4 border-l pl-4">
          <div className="text-xs">
            <span className="font-bold">{activeOffer.id}</span>
            <span className="text-gray-500 block">Expires: {activeOffer.expiresAtMinute}</span>
          </div>
          <button
            onClick={() => acceptOffer(activeOffer.id)}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700"
          >
            <CheckCircle size={14} /> Accept
          </button>
        </div>
      )}
    </div>
  );
};
