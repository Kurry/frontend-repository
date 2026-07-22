import React from 'react';
import { ScenarioRecord } from '../types';
import { useStore } from '../store';
import { Clock, Users, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScenarioCardProps {
  record: ScenarioRecord;
  isOverlay?: boolean;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ record, isOverlay }) => {
  const { selectedRecordId, setSelectedRecordId } = useStore();
  const isSelected = selectedRecordId === record.id;

  return (
    <motion.div
      layoutId={!isOverlay ? record.id : undefined}
      onClick={() => setSelectedRecordId(record.id)}
      className={`bg-white p-3 rounded-lg shadow-sm border cursor-grab active:cursor-grabbing hover:border-blue-300 transition-colors ${
        isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
      } ${isOverlay ? 'shadow-xl rotate-2' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 text-sm">{record.title || 'Untitled'}</h4>
        {record.status === 'conflict' && (
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
        )}
      </div>
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{record.description || 'No description'}</p>

      <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {record.duration}m
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {record.requiredPlayers}
        </div>
      </div>
      {record.conflictReason && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 p-1.5 rounded border border-red-100">
          {record.conflictReason}
        </div>
      )}
    </motion.div>
  );
};
