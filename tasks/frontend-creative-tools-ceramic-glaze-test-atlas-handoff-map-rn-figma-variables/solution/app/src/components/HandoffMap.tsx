import React from 'react';
import { useStore, OwnerType, ReadinessType } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Activity, ArrowRight, CornerUpLeft } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

const OWNERS: { value: OwnerType; label: string; color: string }[] = [
  { value: 'studio-lead', label: 'Studio Lead', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'technician', label: 'Technician', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'chemist', label: 'Chemist', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'none', label: 'Unassigned', color: 'bg-gray-100 text-gray-800 border-gray-200' },
];

const READINESS: { value: ReadinessType; label: string; color: string }[] = [
  { value: 'ready', label: 'Ready', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'changed', label: 'Changed', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'none', label: 'Not Ready', color: 'bg-gray-100 text-gray-800 border-gray-200' },
];

export const HandoffMap: React.FC = () => {
  const { records, selectedId, mutateHandoff, history, undo } = useStore();

  const selectedRecord = records.find((r) => r.id === selectedId);
  const prefersReducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  if (!selectedRecord) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-500">
        Select a glaze test to assign handoff
      </div>
    );
  }

  const handleMutation = (owner: OwnerType, readiness: ReadinessType) => {
    mutateHandoff(selectedId, owner, readiness);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Handoff Map</h2>
          <p className="text-sm text-gray-500 mt-1">
            Connect the selected record to an owner and update its readiness.
          </p>
        </div>
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Undo last handoff map mutation"
        >
          <CornerUpLeft size={16} className="mr-2" />
          Undo
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row items-stretch lg:items-center justify-center gap-12 max-w-5xl mx-auto w-full">
        {/* Source Token */}
        <motion.div
          layout={!prefersReducedMotion}
          className="w-full lg:w-72 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center"
        >
          <div
            className="w-24 h-24 rounded-full border-4 border-white shadow-md mb-4"
            style={{ backgroundColor: selectedRecord.baseColor }}
          />
          <h3 className="font-semibold text-lg text-gray-900 truncate w-full">
            {selectedRecord.name}
          </h3>
          <p className="text-sm text-gray-500 capitalize">{selectedRecord.status}</p>
        </motion.div>

        {/* Connection Visual */}
        <div className="hidden lg:flex items-center justify-center text-gray-400">
          <ArrowRight size={32} />
        </div>

        {/* Destination Mapping Controls */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <div className="flex items-center mb-4 text-gray-700">
              <User size={18} className="mr-2" />
              <h4 className="font-medium">Assign Owner</h4>
            </div>
            <div className="flex flex-col space-y-2">
              {OWNERS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => handleMutation(o.value, selectedRecord.readiness)}
                  className={twMerge(
                    clsx(
                      "px-4 py-3 text-sm font-medium rounded-lg border text-left transition-all",
                      selectedRecord.owner === o.value
                        ? `ring-2 ring-indigo-500 ${o.color}`
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                    )
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center mb-4 text-gray-700">
              <Activity size={18} className="mr-2" />
              <h4 className="font-medium">Set Readiness</h4>
            </div>
            <div className="flex flex-col space-y-2">
              {READINESS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => handleMutation(selectedRecord.owner, r.value)}
                  className={twMerge(
                    clsx(
                      "px-4 py-3 text-sm font-medium rounded-lg border text-left transition-all",
                      selectedRecord.readiness === r.value
                        ? `ring-2 ring-indigo-500 ${r.color}`
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                    )
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
