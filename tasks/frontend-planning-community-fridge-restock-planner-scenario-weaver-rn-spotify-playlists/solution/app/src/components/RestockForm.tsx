import React, { useState, useEffect } from 'react';
import type { RestockTask } from '../types';
import { X } from 'lucide-react';

interface RestockFormProps {
  onSave: (task: RestockTask) => void;
  onCancel: () => void;
  initialData?: RestockTask | null;
}

export const RestockForm: React.FC<RestockFormProps> = ({ onSave, onCancel, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [itemCategory, setItemCategory] = useState(initialData?.itemCategory || '');
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || '');
  const [unit, setUnit] = useState(initialData?.unit || '');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setItemCategory(initialData.itemCategory);
      setQuantity(initialData.quantity.toString());
      setUnit(initialData.unit);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !itemCategory || !quantity || !unit) {
      setError('All fields are required.');
      return;
    }

    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setError('Quantity must be a positive number.');
      return;
    }

    const newTask: RestockTask = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      name,
      itemCategory,
      quantity: numQuantity,
      unit,
      status: initialData?.status || 'draft',
      scenarioState: initialData?.scenarioState
    };

    onSave(newTask);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close form"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          {initialData ? 'Edit Restock Task' : 'New Restock Task'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Organic Apples"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Produce"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0.1"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., lbs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
