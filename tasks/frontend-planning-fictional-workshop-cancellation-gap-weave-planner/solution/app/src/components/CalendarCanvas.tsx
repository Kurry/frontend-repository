import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';

export const CalendarCanvas: React.FC = () => {
  const { benches, bookings, setBrushedGapBounds, brushedGapBounds, repairPreview } = useStore();
  const canvasRef = useRef<HTMLDivElement>(null);

  const totalMinutes = 480; // 09:00 - 17:00

  const handlePointerDown = (e: React.PointerEvent, benchId: string) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const minute = Math.floor((x / rect.width) * totalMinutes);

    // Simplistic brushing logic for GAP-04
    if (benchId === 'BENCH-B' && minute >= 235 && minute <= 300) {
      setBrushedGapBounds({ start: 235, end: 300, benchId });
    }
  };

  return (
    <div className="flex flex-col border border-gray-300 rounded-md p-4 bg-white" aria-label="Calendar Canvas">
      <h2 className="text-lg font-semibold mb-4">Day Canvas</h2>
      <div className="relative w-full h-[300px]" ref={canvasRef}>
        {benches.map((bench, idx) => (
          <div key={bench} className="absolute w-full h-[80px] border-b border-gray-200" style={{ top: idx * 100 }}>
            <div className="text-sm font-medium text-gray-500 absolute -top-6 left-0">{bench}</div>

            <div
              className="absolute inset-0 z-0"
              onPointerDown={(e) => handlePointerDown(e, bench)}
              aria-label={`Bench lane ${bench}`}
            />

            {/* Render Bookings */}
            {bookings.filter(b => b.benchId === bench).map(booking => {
              const startPct = (booking.serviceStartMinute / totalMinutes) * 100;
              const widthPct = ((booking.serviceEndMinute - booking.serviceStartMinute) / totalMinutes) * 100;

              // Handle ripple preview ghosting
              const isMoving = repairPreview?.moves.find(m => m.bookingId === booking.id);

              if (isMoving) {
                const newStartPct = (isMoving.toStartMinute / totalMinutes) * 100;
                return (
                  <React.Fragment key={booking.id}>
                    <div
                      className="absolute h-[60px] top-[10px] bg-gray-100 border border-gray-300 rounded opacity-50 flex items-center justify-center text-xs text-gray-400"
                      style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                    >
                      {booking.id} (Old)
                    </div>
                    <motion.div
                      initial={{ left: `${startPct}%` }}
                      animate={{ left: `${newStartPct}%` }}
                      className="absolute h-[60px] top-[10px] bg-blue-100 border border-blue-400 rounded flex items-center justify-center text-xs font-bold text-blue-700 shadow-sm z-10"
                      style={{ width: `${widthPct}%` }}
                    >
                      {booking.id} +30
                    </motion.div>
                  </React.Fragment>
                );
              }

              if (booking.status === 'canceled') {
                return (
                  <div
                    key={booking.id}
                    className="absolute h-[60px] top-[10px] border border-dashed border-red-300 bg-red-50 rounded flex items-center justify-center text-xs text-red-400"
                    style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                  >
                    {booking.id} Canceled
                  </div>
                );
              }

              return (
                <div
                  key={booking.id}
                  className={`absolute h-[60px] top-[10px] border rounded flex items-center justify-center text-xs font-medium shadow-sm z-10 ${booking.status === 'held' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-green-100 border-green-400 text-green-800'}`}
                  style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                >
                  {booking.id}
                </div>
              );
            })}

            {/* Vacancy Lens / Brushed Gap */}
            {brushedGapBounds && brushedGapBounds.benchId === bench && (
              <div
                className="absolute h-[60px] top-[10px] border-2 border-indigo-500 bg-indigo-50/50 rounded flex items-center justify-center text-xs text-indigo-700 font-bold z-20 pointer-events-none"
                style={{
                  left: `${(brushedGapBounds.start / totalMinutes) * 100}%`,
                  width: `${((brushedGapBounds.end - brushedGapBounds.start) / totalMinutes) * 100}%`
                }}
              >
                GAP-04 Lens
              </div>
            )}
          </div>
        ))}
        {/* Ruler */}
        <div className="absolute w-full h-[20px] bottom-[-30px] border-t border-gray-400 flex justify-between text-xs text-gray-500">
          <span>09:00</span>
          <span>11:00</span>
          <span>13:00</span>
          <span>15:00</span>
          <span>17:00</span>
        </div>
      </div>
    </div>
  );
};
