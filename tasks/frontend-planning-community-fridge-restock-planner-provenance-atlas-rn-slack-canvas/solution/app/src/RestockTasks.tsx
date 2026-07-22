import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { Store } from './store.js';
import type { RestockRecord, Status } from './types.js';

export function RestockTasks({ store }: { store: Store }) {
  const [filter, setFilter] = useState<Status | 'all'>('all');

  const [newName, setNewName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newSource, setNewSource] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filtered = filter === 'all' ? store.records : store.records.filter(r => r.status === filter);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const qty = parseInt(newQuantity, 10);

    if (!newName.trim() || newName.length > 100) {
      setError('Name is required and must be <= 100 chars');
      return;
    }
    if (isNaN(qty) || qty < 0 || qty > 10000) {
      setError('Quantity must be between 0 and 10000');
      return;
    }
    if (!newSource.trim() || newSource.length > 100) {
      setError('Source is required and must be <= 100 chars');
      return;
    }

    store.addRecord({ name: newName, quantity: qty, source: newSource });
    setNewName('');
    setNewQuantity('');
    setNewSource('');
  };

  return (
    <div className="flex flex-col gap-4 border p-4 rounded bg-slate-50">
      <h2 className="text-xl font-bold">Restock Tasks</h2>

      <form onSubmit={handleAdd} className="flex flex-col gap-2 p-2 border bg-white rounded shadow-sm">
        <h3 className="font-semibold">Add Record</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input className="border p-1 rounded" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" />
          <input className="border p-1 rounded" type="number" value={newQuantity} onChange={e => setNewQuantity(e.target.value)} placeholder="Quantity" />
          <input className="border p-1 rounded" value={newSource} onChange={e => setNewSource(e.target.value)} placeholder="Source" />
          <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Create</button>
        </div>
        {error && <span className="text-red-500 text-sm">{error}</span>}
      </form>

      <div className="flex gap-2 items-center">
        <span>Filter:</span>
        {(['all', 'empty', 'draft', 'ready', 'changed', 'archived'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 text-sm rounded ${filter === f ? 'bg-blue-800 text-white' : 'bg-gray-200 text-black'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
        {filtered.map(r => (
          <motion.div key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-between items-center p-2 border bg-white rounded shadow-sm">
            <div>
              <div className="font-semibold">{r.name}</div>
              <div className="text-sm text-gray-600">Qty: {r.quantity} | Source: {r.source} | Status: {r.status}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => store.updateRecord(r.id, { status: 'archived' })} className="px-2 py-1 text-xs bg-gray-300 rounded">Archive</button>
              <button onClick={() => store.deleteRecord(r.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Delete</button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && <div className="text-gray-500 italic">No records found.</div>}
      </div>
    </div>
  );
}
