import React from 'react';
import { useStore } from '../store';

export const ResourceStrips: React.FC = () => {
  const { facilitators, tools, bookings } = useStore();
  const totalMinutes = 480;

  const renderStrip = (title: string, items: string[], type: 'facilitator' | 'tool') => (
    <div className="bg-white border rounded-md p-4 mb-4">
      <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">{title}</h3>
      <div className="flex flex-col gap-3">
        {items.map(item => (
          <div key={item} className="flex items-center gap-4">
            <span className="w-24 text-xs font-medium text-gray-500">{item}</span>
            <div className="relative flex-1 h-6 bg-gray-50 border border-gray-200 rounded">
              {bookings.map(booking => {
                if (booking.status === 'canceled') return null;
                const hasClaim = type === 'facilitator'
                  ? booking.facilitatorClaims.includes(item)
                  : booking.toolClaims.includes(item);

                if (!hasClaim) return null;

                const startPct = (booking.serviceStartMinute / totalMinutes) * 100;
                const widthPct = ((booking.serviceEndMinute - booking.serviceStartMinute) / totalMinutes) * 100;

                return (
                  <div
                    key={`${booking.id}-${item}`}
                    className={`absolute h-full border-x opacity-70 ${
                      booking.status === 'held' ? 'bg-yellow-400 border-yellow-500' : 'bg-gray-400 border-gray-500'
                    }`}
                    style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                    title={`${booking.id}: ${booking.serviceStartMinute} - ${booking.serviceEndMinute}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full mt-6" aria-label="Resource Strips">
      <h2 className="text-lg font-semibold mb-4">Resource Utilization</h2>
      <div className="grid grid-cols-2 gap-6">
        {renderStrip('Facilitators', facilitators, 'facilitator')}
        {renderStrip('Shared Tools', tools, 'tool')}
      </div>
    </div>
  );
};
