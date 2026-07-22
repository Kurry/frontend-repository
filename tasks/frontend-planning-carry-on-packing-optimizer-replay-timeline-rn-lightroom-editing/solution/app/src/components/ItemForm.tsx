import React, { useState } from 'react';
import { PackingStatus, usePackingStore } from '../store';

interface ItemFormProps {
  onAdd: (item: any) => void;
}

export function ItemForm({ onAdd }: ItemFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Clothes');
  const [weight, setWeight] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [status, setStatus] = useState<PackingStatus>('draft');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (weight < 0) {
      setError('Weight must be non-negative.');
      return;
    }
    if (quantity < 1) {
      setError('Quantity must be at least 1.');
      return;
    }

    onAdd({ name, category, weight, quantity, status });
    setName('');
    setWeight(0);
    setQuantity(1);
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Add New Item</h3>
      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Jacket" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500">
            <option>Clothes</option>
            <option>Electronics</option>
            <option>Toiletries</option>
            <option>Documents</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (g)</label>
          <input type="number" value={weight} onChange={e => setWeight(parseInt(e.target.value) || 0)} className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500" min="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
          <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500" min="1" />
        </div>
        <div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors">
            Add Item
          </button>
        </div>
      </div>
    </form>
  );
}
