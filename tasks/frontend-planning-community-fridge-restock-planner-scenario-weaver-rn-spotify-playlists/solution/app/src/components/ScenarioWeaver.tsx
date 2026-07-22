import React, { useState } from 'react';
import type { RestockTask } from '../types';
import { GitBranch, X, ArrowRight } from 'lucide-react';

interface ScenarioWeaverProps {
  task: RestockTask;
  onConfirm: (branchedTask: RestockTask) => void;
  onCancel: () => void;
}

export const ScenarioWeaver: React.FC<ScenarioWeaverProps> = ({ task, onConfirm, onCancel }) => {
  const [quantity, setQuantity] = useState(task.quantity.toString());
  const [category, setCategory] = useState(task.itemCategory);
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setError('Quantity must be a positive number.');
      return;
    }

    const changes: string[] = [];
    if (numQuantity !== task.quantity) changes.push(`Quantity changed from ${task.quantity} to ${numQuantity}`);
    if (category !== task.itemCategory) changes.push(`Category changed from ${task.itemCategory} to ${category}`);

    if (changes.length === 0) {
      setError('No changes detected in scenario.');
      return;
    }

    const branchedTask: RestockTask = {
      ...task,
      quantity: numQuantity,
      itemCategory: category,
      status: 'changed',
      scenarioState: {
        originalId: task.id,
        branchedAt: new Date().toISOString(),
        changes
      }
    };

    onConfirm(branchedTask);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close Scenario Weaver"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <GitBranch className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Scenario Weaver</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 relative">
          <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <ArrowRight className="text-gray-300 w-8 h-8" />
          </div>

          {/* Original State */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Original State</h3>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-500">Name</span>
                <p className="font-medium text-gray-900">{task.name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Category</span>
                <p className="font-medium text-gray-900">{task.itemCategory}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Quantity</span>
                <p className="font-medium text-gray-900">{task.quantity} {task.unit}</p>
              </div>
            </div>
          </div>

          {/* Proposed Scenario */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800 mb-4 uppercase tracking-wider">Proposed Scenario</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-blue-800 mb-1">Name</label>
                <input
                  type="text"
                  value={task.name}
                  disabled
                  className="w-full bg-blue-100/50 text-gray-500 px-3 py-2 rounded-md border border-blue-200 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-800 mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white px-3 py-2 rounded-md border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-blue-800 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="0.1"
                    step="0.1"
                    className="w-full bg-white px-3 py-2 rounded-md border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-xs font-medium text-blue-800 mb-1">Unit</label>
                  <input
                    type="text"
                    value={task.unit}
                    disabled
                    className="w-full bg-blue-100/50 text-gray-500 px-3 py-2 rounded-md border border-blue-200 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <GitBranch className="w-4 h-4" />
            Confirm Scenario
          </button>
        </div>
      </div>
    </div>
  );
};
