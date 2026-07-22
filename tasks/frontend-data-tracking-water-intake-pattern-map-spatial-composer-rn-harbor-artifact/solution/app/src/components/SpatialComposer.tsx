import React, { useRef, useSyncExternalStore, useState, useEffect } from 'react';
import { store } from '../store';
import { motion } from 'framer-motion';
import { Undo2, XCircle } from 'lucide-react';
import clsx from 'clsx';
import type { SpatialPosition } from '../store';

export const SpatialComposer = ({ selectedId }: { selectedId: string | null }) => {
  const state = useSyncExternalStore(store.subscribe.bind(store), () => store.state);
  const containerRef = useRef<HTMLDivElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedRecord = state.records.find(r => r.id === selectedId);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedRecord) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (x < 5 || x > 95 || y < 5 || y > 95) {
      setErrorMsg("Cannot place near the boundary edge. Move inward.");
      return;
    }

    const newCapacity = Math.round(100 - y);

    store.placeInComposer(selectedRecord.id, { x, y }, newCapacity);
  };

  const hasHistory = state.history.length > 0;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={() => store.undo()}
          disabled={!hasHistory}
          className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded bg-white border shadow-sm font-medium text-sm transition-colors focus:ring-2 focus:ring-blue-500 outline-none",
            hasHistory ? "border-slate-300 text-slate-700 hover:bg-slate-50" : "border-slate-200 text-slate-400 cursor-not-allowed"
          )}
          aria-label="Undo last mutation"
        >
          <Undo2 className="w-4 h-4" />
          Undo
        </button>
      </div>

      <div className="absolute top-4 right-4 z-10">
        {errorMsg && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 text-sm rounded shadow-sm border border-red-200" role="alert">
            <XCircle className="w-4 h-4" />
            {errorMsg}
          </div>
        )}
      </div>

      <div className="flex-1 p-8 flex flex-col">
        <div className="text-center mb-4">
          <h1 className="text-xl font-light text-slate-600">Spatial Composer</h1>
          <p className="text-sm text-slate-400">Place a selected record in the spatial composer and rebalance capacity.</p>
        </div>

        <div
          ref={containerRef}
          className={clsx(
            "flex-1 border-2 border-dashed rounded-2xl relative overflow-hidden transition-colors outline-none focus:ring-2 focus:ring-blue-500",
            selectedRecord ? "border-blue-300 bg-blue-50/50 cursor-crosshair" : "border-slate-200 bg-white"
          )}
          onClick={handleAreaClick}
          tabIndex={0}
          role="button"
          aria-label="Composer canvas"
        >
          {state.records.filter(r => r.position).map(r => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              className={clsx(
                "absolute flex flex-col items-center justify-center rounded-full shadow-md w-16 h-16 border-2 font-medium text-xs transition-colors",
                r.id === selectedId
                  ? "border-blue-600 bg-blue-100 text-blue-900 z-20"
                  : "border-slate-300 bg-white text-slate-600 z-10 opacity-60"
              )}
              style={{
                left: `${r.position!.x}%`,
                top: `${r.position!.y}%`,
              }}
            >
              <div className="leading-tight">{r.amount}</div>
              <div className="text-[10px] opacity-70">C:{r.capacity}</div>
            </motion.div>
          ))}

          {!selectedRecord && state.records.filter(r => r.position).length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 pointer-events-none">
              Select a record from the list to begin
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
