import React, { useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

export default function BooksList() {
  const { books, selectedBookIds, toggleSelection, addBook, updateBook, deleteBook } = useStore();
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ title: '', author: '', status: 'draft' });
  const [formError, setFormError] = useState('');

  const filteredBooks = books.filter(b => filterStatus === 'all' || b.status === filterStatus);

  const handleSave = (id) => {
    if (!formData.title.trim()) {
      setFormError('Title is required');
      return;
    }
    setFormError('');
    if (id === 'new') {
      addBook({ id: Date.now().toString(), ...formData });
      setIsAdding(false);
    } else {
      updateBook(id, formData);
      setEditingId(null);
    }
  };

  const startEdit = (book) => {
    setEditingId(book.id);
    setFormData({ title: book.title, author: book.author, status: book.status });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters and Actions */}
      <div className="flex justify-between items-center bg-gray-50 p-2 rounded border">
        <div className="flex gap-2">
          <span className="text-sm font-medium self-center px-2">Filter:</span>
          {['all', 'draft', 'ready', 'archived'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded text-sm capitalize ${filterStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {status}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setIsAdding(true); setFormData({ title: '', author: '', status: 'draft' }); }}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
        >
          Add Book
        </button>
      </div>

      {/* Adding Form */}
      {isAdding && (
        <div className="p-4 border border-green-200 bg-green-50 rounded flex flex-col gap-2">
          <input className="border p-1" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          <input className="border p-1" placeholder="Author" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
          <select className="border p-1" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="archived">Archived</option>
          </select>
          {formError && <span className="text-red-500 text-sm">{formError}</span>}
          <div className="flex gap-2 mt-2">
            <button className="bg-green-600 text-white px-3 py-1 rounded text-sm" onClick={() => handleSave('new')}>Save</button>
            <button className="bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm" onClick={() => setIsAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-2">
        {filteredBooks.length === 0 && <p className="text-gray-500 italic p-4 text-center">No books found for this status.</p>}
        <AnimatePresence>
          {filteredBooks.map(book => {
            const isSelected = selectedBookIds.includes(book.id);
            const isEditing = editingId === book.id;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={book.id}
                className={`p-3 border rounded flex items-center gap-4 transition-colors ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelection(book.id)}
                  className="w-5 h-5 text-blue-600"
                  aria-label={`Select ${book.title}`}
                />

                {isEditing ? (
                  <div className="flex-1 flex gap-2">
                    <input className="border p-1 flex-1" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    <input className="border p-1 flex-1" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
                    <select className="border p-1 w-24" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="draft">Draft</option>
                      <option value="ready">Ready</option>
                      <option value="archived">Archived</option>
                    </select>
                    <button className="bg-blue-600 text-white px-3 rounded text-sm" onClick={() => handleSave(book.id)}>Save</button>
                    <button className="bg-gray-300 px-3 rounded text-sm" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 flex flex-col">
                      <span className="font-semibold">{book.title}</span>
                      <span className="text-sm text-gray-500">{book.author}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full capitalize font-medium ${book.status === 'ready' ? 'bg-green-100 text-green-800' : book.status === 'archived' ? 'bg-gray-200 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {book.status}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(book)} className="text-blue-600 hover:underline text-sm">Edit</button>
                      <button
                        onClick={() => { if(window.confirm('Are you sure you want to delete this?')) deleteBook(book.id) }}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
