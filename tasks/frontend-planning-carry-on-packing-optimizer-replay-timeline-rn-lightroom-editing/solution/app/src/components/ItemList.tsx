import React, { useState } from 'react';
import { PackingItemWithHistory, PackingStatus, PackingItem } from '../store';
import { Package, Trash2, Edit2, Play, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ItemListProps {
  records: PackingItemWithHistory[];
  selectedItemId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<PackingItem>) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<PackingStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  changed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  archived: 'bg-purple-100 text-purple-800 border-purple-200',
};

const statusLabels: Record<PackingStatus, string> = {
  draft: 'Draft',
  ready: 'Ready to Pack',
  changed: 'Changed',
  archived: 'Archived',
};

export function ItemList({ records, selectedItemId, onSelect, onUpdate, onDelete }: ItemListProps) {
  const [filter, setFilter] = useState<PackingStatus | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Local state for inline editing
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editWeight, setEditWeight] = useState(0);
  const [editQuantity, setEditQuantity] = useState(1);

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  const startEdit = (e: React.MouseEvent, item: PackingItem) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditWeight(item.weight);
    setEditQuantity(item.quantity);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const saveEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editName.trim() && editWeight >= 0 && editQuantity >= 1) {
      onUpdate(id, {
        name: editName,
        category: editCategory,
        weight: editWeight,
        quantity: editQuantity
      });
      setEditingId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full max-h-[800px]">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Packing Items
        </h2>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'draft', 'ready', 'changed', 'archived'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All Items' : statusLabels[f as PackingStatus]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredRecords.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
            <Package className="w-12 h-12 opacity-50" />
            <p>No items found. Add some packing items to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filteredRecords.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    if (editingId !== item.id) onSelect(item.id);
                  }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedItemId === item.id
                      ? 'border-blue-500 shadow-md ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  {editingId === item.id ? (
                    <div className="flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Name"
                        />
                        <select
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value)}
                          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option>Clothes</option>
                          <option>Electronics</option>
                          <option>Toiletries</option>
                          <option>Documents</option>
                        </select>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Weight:</span>
                            <input
                              type="number"
                              value={editWeight}
                              onChange={e => setEditWeight(parseInt(e.target.value) || 0)}
                              className="w-16 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              min="0"
                            />
                            <span className="text-xs text-gray-500">g</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Qty:</span>
                            <input
                              type="number"
                              value={editQuantity}
                              onChange={e => setEditQuantity(parseInt(e.target.value) || 1)}
                              className="w-12 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              min="1"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={e => saveEdit(e, item.id)} className="text-green-600 hover:text-green-700 bg-green-50 p-1.5 rounded">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEdit} className="text-red-600 hover:text-red-700 bg-red-50 p-1.5 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{item.category} • {item.weight}g × {item.quantity}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <select
                          value={item.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            onUpdate(item.id, { status: e.target.value as PackingStatus });
                          }}
                          onClick={e => e.stopPropagation()}
                          className={`text-xs font-semibold rounded-full px-2.5 py-1 border outline-none cursor-pointer ${statusColors[item.status]}`}
                        >
                          <option value="draft">Draft</option>
                          <option value="ready">Ready to Pack</option>
                          <option value="changed">Changed</option>
                          <option value="archived">Archived</option>
                        </select>

                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={(e) => startEdit(e, item)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect(item.id);
                            }}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title="Scrub Timeline"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if(confirm('Are you sure you want to delete this item?')) {
                                onDelete(item.id);
                              }
                            }}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
