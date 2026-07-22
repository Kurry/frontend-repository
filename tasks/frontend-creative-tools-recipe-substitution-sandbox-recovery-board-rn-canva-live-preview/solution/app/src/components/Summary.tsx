import React from 'react';
import { useStore } from '../store/useStore';
import { Archive, Edit3, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Summary: React.FC = () => {
  const derivedSummary = useStore(state => state.derivedSummary);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Linked Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div layout className="flex flex-col items-center p-3 bg-blue-50 rounded-md">
          <FileText className="text-blue-500 mb-1" size={20} />
          <span className="text-sm text-gray-500">Total</span>
          <span className="font-bold text-xl text-blue-700">{derivedSummary.total}</span>
        </motion.div>
        <motion.div layout className="flex flex-col items-center p-3 bg-green-50 rounded-md">
          <CheckCircle className="text-green-500 mb-1" size={20} />
          <span className="text-sm text-gray-500">Ready</span>
          <span className="font-bold text-xl text-green-700">{derivedSummary.readyCount}</span>
        </motion.div>
        <motion.div layout className="flex flex-col items-center p-3 bg-yellow-50 rounded-md">
          <Edit3 className="text-yellow-500 mb-1" size={20} />
          <span className="text-sm text-gray-500">Draft</span>
          <span className="font-bold text-xl text-yellow-700">{derivedSummary.draftCount}</span>
        </motion.div>
        <motion.div layout className="flex flex-col items-center p-3 bg-purple-50 rounded-md">
          <AlertCircle className="text-purple-500 mb-1" size={20} />
          <span className="text-sm text-gray-500">Changed</span>
          <span className="font-bold text-xl text-purple-700">{derivedSummary.changedCount}</span>
        </motion.div>
        <motion.div layout className="flex flex-col items-center p-3 bg-gray-50 rounded-md">
          <Archive className="text-gray-500 mb-1" size={20} />
          <span className="text-sm text-gray-500">Archived</span>
          <span className="font-bold text-xl text-gray-700">{derivedSummary.archivedCount}</span>
        </motion.div>
      </div>
    </div>
  );
};
