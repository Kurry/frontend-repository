import React from 'react';
import { useStore } from '../store';
import { Info, Tag, Hash, Activity } from 'lucide-react';
import type { ApplianceStatus } from '../types';
import { cn } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function SummaryPanel() {
  const { records, derived } = useStore();
  const activeRecord = records.find(r => r.id === derived.activeSelectionId);

  const getStatusColor = (status: ApplianceStatus) => {
    switch (status) {
      case 'ready': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'draft': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'changed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'archived': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'empty': return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <Info className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">
          {activeRecord ? 'Record Details' : 'Collection Summary'}
        </h3>
      </div>

      <AnimatePresence mode="wait">
        {activeRecord ? (
          <motion.div
            key="record-details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xl font-bold text-slate-900 leading-tight">
                  {activeRecord.brand} {activeRecord.model}
                </h4>
                <div className="flex items-center gap-1 text-slate-500 mt-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span className="text-sm">{activeRecord.type}</span>
                </div>
              </div>
              <span className={cn("text-xs font-semibold px-2 py-1 rounded-full border uppercase tracking-wider", getStatusColor(activeRecord.status))}>
                {activeRecord.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Hash className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Serial Number</span>
                </div>
                <div className="font-mono text-sm text-slate-800 font-medium">
                  {activeRecord.serial_number || 'Not recorded'}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Timeline Checkpoint</span>
                </div>
                <div className="text-sm text-slate-800 font-medium truncate" title={activeRecord.timeline_checkpoint || 'Latest'}>
                  {activeRecord.timeline_checkpoint ? 'Restored Checkpoint' : 'Latest State'}
                </div>
              </div>
            </div>

            {activeRecord.metadata && Object.keys(activeRecord.metadata).length > 0 && (
              <div className="mt-2 border-t border-slate-200 pt-4">
                <h5 className="text-xs font-semibold uppercase text-slate-500 mb-2">Metadata</h5>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {Object.entries(activeRecord.metadata).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                      <dd className="font-medium text-slate-800">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="collection-summary"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-indigo-600">{derived.totalRecords}</span>
                <span className="text-xs font-medium text-indigo-800 uppercase tracking-wide mt-1">Total Records</span>
              </div>

              <div className="grid grid-rows-3 gap-2">
                {['ready', 'changed', 'archived'].map((status) => (
                   <div key={status} className="flex justify-between items-center text-sm px-3 py-1.5 bg-slate-50 rounded-md border border-slate-100">
                     <span className="capitalize text-slate-600">{status}</span>
                     <span className="font-semibold text-slate-800">{derived.recordsByStatus[status as ApplianceStatus] || 0}</span>
                   </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800 mt-2">
              <p className="font-medium mb-1">Drafts & Empty</p>
              <div className="flex gap-4">
                <span>Drafts: <strong>{derived.recordsByStatus.draft || 0}</strong></span>
                <span>Empty: <strong>{derived.recordsByStatus.empty || 0}</strong></span>
              </div>
            </div>

            <p className="text-sm text-slate-500 text-center mt-4 italic">
              Select a record from the workbench to view details and replay its timeline.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
