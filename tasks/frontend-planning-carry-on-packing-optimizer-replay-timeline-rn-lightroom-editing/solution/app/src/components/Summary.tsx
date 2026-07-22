import React from 'react';
import { DerivedSummary } from '../store';
import { BarChart3, Weight, Box } from 'lucide-react';
import { motion } from 'framer-motion';

interface SummaryProps {
  summary: DerivedSummary;
}

export function Summary({ summary }: SummaryProps) {
  const totalItemsCount = Object.values(summary.byStatus).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Derived Summary
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          className="bg-blue-50 p-4 rounded-lg border border-blue-100"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.3, key: summary.totalWeight }}
        >
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Weight className="w-4 h-4" />
            <span className="text-sm font-medium">Total Weight</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 font-mono">
            {(summary.totalWeight / 1000).toFixed(2)} <span className="text-base font-normal text-gray-500">kg</span>
          </p>
        </motion.div>

        <motion.div
          className="bg-green-50 p-4 rounded-lg border border-green-100"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.3, key: summary.totalItems }}
        >
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Box className="w-4 h-4" />
            <span className="text-sm font-medium">Active Items</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 font-mono">
            {summary.totalItems}
          </p>
        </motion.div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Status Distribution</h4>
        <div className="space-y-3">
          {(['draft', 'ready', 'changed', 'archived'] as const).map(status => {
            const count = summary.byStatus[status];
            const percentage = totalItemsCount > 0 ? (count / totalItemsCount) * 100 : 0;

            const colors = {
              draft: 'bg-gray-400',
              ready: 'bg-green-500',
              changed: 'bg-yellow-500',
              archived: 'bg-purple-500',
            };

            const labels = {
              draft: 'Draft',
              ready: 'Ready to Pack',
              changed: 'Changed',
              archived: 'Archived',
            };

            return (
              <div key={status}>
                <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                  <span>{labels[status]}</span>
                  <span>{count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className={`h-1.5 rounded-full ${colors[status]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
