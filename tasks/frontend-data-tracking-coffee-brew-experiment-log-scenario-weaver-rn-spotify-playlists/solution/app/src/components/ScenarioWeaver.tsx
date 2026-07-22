import React, { useEffect, useState, KeyboardEvent } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Save, X, Activity } from 'lucide-react';
import { BrewExperiment } from '../types';

export const ScenarioWeaver: React.FC = () => {
  const { records, selection, setSelection, updateRecord, branchScenario, resolveScenario } = useStore();
  const [formData, setFormData] = useState<Partial<BrewExperiment>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedRecord = records.find(r => selection.includes(r.id) && r.scenarioState !== 'changed');
  const activeScenario = records.find(r => r.scenarioState === 'selected');
  const displayRecord = activeScenario || selectedRecord;

  useEffect(() => {
    if (displayRecord) {
      setFormData(displayRecord);
    }
  }, [displayRecord?.id]);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!displayRecord) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-text-muted">
        <Activity className="w-12 h-12 mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Scenario Weaver</h2>
        <p>Select an experiment to view details or branch into a scenario.</p>
      </div>
    );
  }

  const isScenario = displayRecord.scenarioState === 'selected';

  const handleChange = (field: keyof BrewExperiment, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title?.trim()) newErrors.title = 'Title is required';
    if (!formData.roastDate) newErrors.roastDate = 'Date is required';
    if (formData.dose === undefined || formData.dose < 0) newErrors.dose = 'Dose must be ≥ 0';
    if (formData.yield === undefined || formData.yield < 0) newErrors.yield = 'Yield must be ≥ 0';
    if (formData.time === undefined || formData.time < 0) newErrors.time = 'Time must be ≥ 0';
    if (formData.waterTemp === undefined || formData.waterTemp < 0 || formData.waterTemp > 150) newErrors.waterTemp = 'Temp must be 0-150';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateRecord(displayRecord.id, formData);
  };

  const handleBranch = () => {
    if (displayRecord) {
      branchScenario(displayRecord.id);
    }
  };

  const handleClose = () => {
    if (isScenario) {
        resolveScenario(displayRecord.id);
    } else {
        setSelection(selection.filter(id => id !== displayRecord.id));
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={displayRecord.id}
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
        className="flex flex-col h-full bg-surface"
        onKeyDown={handleKeyDown}
      >
        <header className="p-4 border-b border-border bg-secondary flex justify-between items-center sticky top-0">
          <div>
            <h2 className="text-lg font-bold text-primary-dark">
              {isScenario ? 'Scenario Draft' : 'Experiment Details'}
            </h2>
            {isScenario && <span className="text-xs text-accent font-semibold">Comparing against original</span>}
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-black/5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Title</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-primary outline-none ${errors.title ? 'border-red-500 bg-red-50' : 'border-border'}`}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Status</label>
                <select
                  value={formData.status || 'draft'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full p-2 border border-border rounded-md focus:ring-2 focus:ring-primary outline-none bg-white"
                >
                  <option value="empty">Empty</option>
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="changed">Changed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Roast Date</label>
                <input
                  type="date"
                  value={formData.roastDate || ''}
                  onChange={(e) => handleChange('roastDate', e.target.value)}
                  className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-primary outline-none ${errors.roastDate ? 'border-red-500 bg-red-50' : 'border-border'}`}
                />
                {errors.roastDate && <p className="text-xs text-red-500 mt-1">{errors.roastDate}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Bean</label>
              <input
                type="text"
                value={formData.bean || ''}
                onChange={(e) => handleChange('bean', e.target.value)}
                className="w-full p-2 border border-border rounded-md focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Dose (g)</label>
                <input
                  type="number"
                  value={formData.dose || 0}
                  onChange={(e) => handleChange('dose', parseFloat(e.target.value))}
                  className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-primary outline-none ${errors.dose ? 'border-red-500 bg-red-50' : 'border-border'}`}
                  min="0" step="0.1"
                />
                {errors.dose && <p className="text-xs text-red-500 mt-1">{errors.dose}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Yield (g)</label>
                <input
                  type="number"
                  value={formData.yield || 0}
                  onChange={(e) => handleChange('yield', parseFloat(e.target.value))}
                  className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-primary outline-none ${errors.yield ? 'border-red-500 bg-red-50' : 'border-border'}`}
                  min="0" step="0.1"
                />
                {errors.yield && <p className="text-xs text-red-500 mt-1">{errors.yield}</p>}
              </div>
            </div>

             <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Time (s)</label>
                <input
                  type="number"
                  value={formData.time || 0}
                  onChange={(e) => handleChange('time', parseInt(e.target.value, 10))}
                  className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-primary outline-none ${errors.time ? 'border-red-500 bg-red-50' : 'border-border'}`}
                  min="0"
                />
                {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Temp (°C)</label>
                <input
                  type="number"
                  value={formData.waterTemp || 0}
                  onChange={(e) => handleChange('waterTemp', parseFloat(e.target.value))}
                  className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-primary outline-none ${errors.waterTemp ? 'border-red-500 bg-red-50' : 'border-border'}`}
                />
                {errors.waterTemp && <p className="text-xs text-red-500 mt-1">{errors.waterTemp}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full p-2 border border-border rounded-md focus:ring-2 focus:ring-primary outline-none min-h-[100px]"
              />
            </div>
          </div>

          <div className="bg-background p-4 rounded-lg border border-border">
            <h3 className="text-sm font-semibold mb-2">Derived Stats</h3>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Ratio:</span>
              <span className="font-medium">{displayRecord.derived.ratio}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-text-muted">Est. Extraction:</span>
              <span className="font-medium">{displayRecord.derived.extractionEstimate}</span>
            </div>
          </div>
        </div>

        <footer className="p-4 border-t border-border bg-background flex justify-between gap-3 sticky bottom-0">
          {!isScenario && (
            <button
              onClick={handleBranch}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <GitBranch className="w-4 h-4" />
              Branch Scenario
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
};
