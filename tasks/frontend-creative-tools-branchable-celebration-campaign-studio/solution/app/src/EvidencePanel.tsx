import React from 'react';
import { QueueItem } from './types';

export default function EvidencePanel({ queue, setQueue }: { queue: QueueItem[], setQueue: React.Dispatch<React.SetStateAction<QueueItem[]>> }) {

  const addRehearsal = () => {
    setQueue([...queue, {
      id: `sim-${Date.now()}`,
      recipientId: `rec-${Date.now() % 100}`,
      status: 'queued',
      logs: ['Added to batch']
    }]);
  };

  const failRandom = () => {
    if (queue.length > 0) {
      setQueue(prev => prev.map((q, i) => i === 0 ? { ...q, status: 'failed', logs: [...q.logs, 'Rate limit exceeded'] } : q));
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b bg-gray-50 flex justify-between items-center">
        <span className="font-medium">Evidence & Review Panel</span>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6 bg-white">

        {/* Suggestion & Evidence */}
        <div className="border border-blue-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-blue-50 p-2 font-semibold text-blue-800 text-sm border-b border-blue-200">
            Current Suggestion Rationale
          </div>
          <div className="p-3 text-sm text-gray-700 space-y-2">
            <p><strong>Rationale:</strong> Adjusted artwork for "Lantern Supper" to include accessible contrast ratios for older recipients in Household B.</p>
            <div>
              <strong>Citations:</strong>
              <blockquote className="border-l-2 border-blue-300 pl-2 ml-2 italic text-gray-600 bg-gray-50 p-1 rounded mt-1">
                "Ensure text overlay on background image exceeds 4.5:1 ratio." (Fixture Source: Accessibility Guidelines)
              </blockquote>
            </div>
            <div className="flex justify-end gap-2 pt-2">
               <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Reject Exception</button>
               <button className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Approve Artwork</button>
            </div>
          </div>
        </div>

        {/* Delivery Rehearsal Queue */}
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-gray-100 p-2 font-semibold text-gray-800 text-sm border-b border-gray-200 flex justify-between items-center">
            <span>Delivery Rehearsal Simulation</span>
            <div className="space-x-1">
               <button onClick={addRehearsal} className="text-[10px] px-1.5 py-0.5 bg-white border rounded shadow-sm hover:bg-gray-50">Queue Item</button>
               <button onClick={failRandom} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded shadow-sm hover:bg-red-100">Sim Fail</button>
            </div>
          </div>
          <div className="p-0 text-sm">
            {queue.length === 0 ? (
              <div className="p-4 text-center text-gray-500 italic bg-white">Queue empty. Start rehearsal.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {queue.map(q => (
                  <li key={q.id} className="p-2 hover:bg-gray-50 flex flex-col gap-1 bg-white">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 truncate w-32" title={q.recipientId}>{q.recipientId}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        q.status === 'queued' ? 'bg-blue-100 text-blue-700' :
                        q.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                      }`}>{q.status}</span>
                    </div>
                    {q.logs.length > 0 && <div className="text-[10px] text-gray-500 font-mono">Last log: {q.logs[q.logs.length - 1]}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
