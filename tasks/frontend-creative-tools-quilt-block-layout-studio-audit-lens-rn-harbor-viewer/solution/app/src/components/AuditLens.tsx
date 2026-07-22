import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, FileText } from 'lucide-react';

export const AuditLens: React.FC = () => {
  const { getSelectedBlock, attachEvidenceAndResolve, updateBlock } = useStore();
  const selectedBlock = getSelectedBlock();

  const [evidenceInput, setEvidenceInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset input when selection changes
  useEffect(() => {
    if (selectedBlock && !selectedBlock.auditEvidence) {
      setEvidenceInput('');
    } else if (selectedBlock?.auditEvidence) {
      setEvidenceInput(selectedBlock.auditEvidence);
    }
    setError(null);
  }, [selectedBlock?.id]);

  if (!selectedBlock) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50/50">
        <FileText className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm font-medium">Select a quilt block to inspect and audit</p>
      </div>
    );
  }

  const handleResolve = () => {
    const res = attachEvidenceAndResolve(selectedBlock.id, evidenceInput);
    if (!res.success) {
      setError(res.error || 'Failed to resolve');
    } else {
      setError(null);
    }
  };

  const handleFieldChange = (field: string, value: string | number) => {
    // Basic boundaries check
    if (field === 'fabricCount') {
      const num = Number(value);
      if (isNaN(num) || num < 0) {
        setError('Fabric count must be a positive number');
        return;
      }
    }
    setError(null);
    updateBlock(selectedBlock.id, { [field]: value });
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedBlock.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              Audit Lens: {selectedBlock.name}
              {selectedBlock.auditDiscrepancyResolved && (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              )}
            </h2>

            <div className="space-y-6">
              {/* Properties Editor */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Properties</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={selectedBlock.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pattern Type</label>
                    <input
                      type="text"
                      value={selectedBlock.patternType}
                      onChange={(e) => handleFieldChange('patternType', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fabric Count</label>
                    <input
                      type="number"
                      min="0"
                      value={selectedBlock.fabricCount}
                      onChange={(e) => handleFieldChange('fabricCount', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Audit Resolution Area - The Canonical Mutation */}
              <div className="bg-white p-5 rounded-xl border-2 border-blue-100 shadow-sm relative overflow-hidden">
                {selectedBlock.auditDiscrepancyResolved && (
                  <div className="absolute inset-0 bg-green-50/50 pointer-events-none transition-colors duration-500" />
                )}

                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2 relative z-10">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  Audit Discrepancy Resolution
                </h3>

                <div className="relative z-10">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Evidence Link or Notes
                  </label>
                  <textarea
                    value={evidenceInput}
                    onChange={(e) => setEvidenceInput(e.target.value)}
                    disabled={selectedBlock.auditDiscrepancyResolved}
                    placeholder="Provide evidence to resolve discrepancy..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] disabled:bg-slate-50 disabled:text-slate-500 mb-4"
                    data-testid="evidence-input"
                  />

                  <div className="flex items-center justify-between">
                    {error ? (
                      <span className="text-sm text-red-600 font-medium">{error}</span>
                    ) : (
                      <span className="text-sm text-slate-500">
                        {selectedBlock.auditDiscrepancyResolved
                          ? 'Discrepancy resolved.'
                          : 'Requires valid evidence to resolve.'}
                      </span>
                    )}

                    <button
                      onClick={handleResolve}
                      disabled={selectedBlock.auditDiscrepancyResolved || !evidenceInput.trim()}
                      data-testid="resolve-button"
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {selectedBlock.auditDiscrepancyResolved ? 'Resolved' : 'Attach & Resolve'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
