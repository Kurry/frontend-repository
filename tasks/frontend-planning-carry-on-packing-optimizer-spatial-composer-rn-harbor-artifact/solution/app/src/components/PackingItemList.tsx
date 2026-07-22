import React, { useState } from 'react';
import { useStore } from 'zustand';
import { usePackingStore, type PackingItem, type Status } from '../store';

export function PackingItemList() {
  const store = useStore(usePackingStore);

  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [volume, setVolume] = useState('');
  const [status, setStatus] = useState<Status>('draft');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setWeight('');
    setVolume('');
    setStatus('draft');
    setEditingId(null);
    setError(null);
  };

  const handleEdit = (item: PackingItem) => {
    setEditingId(item.id);
    setName(item.name);
    setWeight(item.weight.toString());
    setVolume(item.volume.toString());
    setStatus(item.status);
    setError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const weightNum = parseFloat(weight);
    const volumeNum = parseFloat(volume);

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (isNaN(weightNum) || weightNum <= 0) {
      setError('Weight must be a positive number.');
      return;
    }
    if (isNaN(volumeNum) || volumeNum <= 0) {
      setError('Volume must be a positive number.');
      return;
    }

    if (editingId) {
      store.updateItem(editingId, {
        name: name.trim(),
        weight: weightNum,
        volume: volumeNum,
        status,
      });
    } else {
      store.addItem({
        name: name.trim(),
        weight: weightNum,
        volume: volumeNum,
        status,
        placed: false
      });
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
        store.deleteItem(id);
    }
  };

  const filteredItems = store.items.filter(item =>
    filterStatus === 'all' || item.status === filterStatus
  );

  return (
    <div className="bg-white p-4 rounded shadow-md border border-gray-200 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">Packing Items Collection</h2>

        <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Filter by Status:</label>
            <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
                className="border border-gray-300 rounded p-1"
            >
                <option value="all">All</option>
                <option value="empty">Empty</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="changed">Changed</option>
                <option value="archived">Archived</option>
            </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
          {/* List View */}
          <div className="flex-1">
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {filteredItems.length === 0 ? (
                    <p className="text-gray-500 italic">No items found.</p>
                ) : (
                    filteredItems.map(item => (
                        <div key={item.id} className="p-3 border rounded flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div>
                                <h3 className="font-semibold text-lg">{item.name}</h3>
                                <div className="text-sm text-gray-600 flex gap-3">
                                    <span>Status: <span className="font-medium text-indigo-700">{item.status}</span></span>
                                    <span>Weight: {item.weight}</span>
                                    <span>Volume: {item.volume}</span>
                                    <span>{item.placed ? 'Placed' : 'Unplaced'}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(item)}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm font-medium"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 text-sm font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>

          {/* Form View */}
          <div className="lg:w-1/3 bg-gray-50 p-4 rounded border">
              <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit Item' : 'Add New Item'}</h3>

              <form onSubmit={handleSave} className="space-y-4">
                  {error && (
                      <div aria-live="polite" className="p-2 bg-red-100 text-red-700 text-sm rounded">
                          {error}
                      </div>
                  )}

                  <div>
                      <label htmlFor="item-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                          id="item-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full border border-gray-300 rounded p-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                  </div>

                  <div className="flex gap-4">
                      <div className="flex-1">
                          <label htmlFor="item-weight" className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                          <input
                              id="item-weight"
                              type="number"
                              step="0.1"
                              value={weight}
                              onChange={(e) => setWeight(e.target.value)}
                              className="w-full border border-gray-300 rounded p-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                      </div>
                      <div className="flex-1">
                          <label htmlFor="item-volume" className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
                          <input
                              id="item-volume"
                              type="number"
                              step="0.1"
                              value={volume}
                              onChange={(e) => setVolume(e.target.value)}
                              className="w-full border border-gray-300 rounded p-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                      </div>
                  </div>

                  <div>
                      <label htmlFor="item-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                          id="item-status"
                          value={status}
                          onChange={(e) => setStatus(e.target.value as Status)}
                          className="w-full border border-gray-300 rounded p-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                          <option value="empty">Empty</option>
                          <option value="draft">Draft</option>
                          <option value="ready">Ready</option>
                          <option value="changed">Changed</option>
                          <option value="archived">Archived</option>
                      </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                      <button
                          type="submit"
                          className="flex-1 bg-indigo-600 text-white rounded p-2 hover:bg-indigo-700 font-medium"
                      >
                          {editingId ? 'Update Item' : 'Add Item'}
                      </button>
                      {editingId && (
                          <button
                              type="button"
                              onClick={resetForm}
                              className="px-4 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium"
                          >
                              Cancel
                          </button>
                      )}
                  </div>
              </form>
          </div>
      </div>
    </div>
  );
}
