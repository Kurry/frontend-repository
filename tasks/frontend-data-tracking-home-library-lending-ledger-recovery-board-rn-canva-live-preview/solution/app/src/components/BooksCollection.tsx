import React, { useState } from 'react';
import { useStore } from '../store';
import { BookRecord, BookStatus } from '../types';
import { AlertCircle, FileEdit, Trash2 } from 'lucide-react';

const STATUSES: BookStatus[] = ['empty', 'draft', 'ready', 'changed', 'archived', 'recovery'];

export const BooksCollection: React.FC = () => {
  const { state, dispatch } = useStore();
  const [filter, setFilter] = useState<BookStatus | 'all'>('all');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BookRecord>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredRecords = state.records.filter((r) => filter === 'all' || r.status === filter);

  const handleSave = (id?: string) => {
    setErrorMsg(null);
    if (!editForm.title || !editForm.author || !editForm.isbn) {
      setErrorMsg('Missing required fields: title, author, or isbn.');
      return;
    }
    if (editForm.pageCount !== undefined && editForm.pageCount < 0) {
      setErrorMsg('Page count must be greater than or equal to 0.');
      return;
    }

    const newRecord: BookRecord = {
      id: id || Date.now().toString(),
      title: editForm.title,
      author: editForm.author,
      isbn: editForm.isbn,
      pageCount: editForm.pageCount || 0,
      status: editForm.status || 'ready',
      condition: editForm.condition || 'Good',
    };

    if (id) {
      dispatch({ type: 'UPDATE_RECORD', payload: newRecord });
    } else {
      dispatch({ type: 'CREATE_RECORD', payload: newRecord });
    }

    setIsEditing(null);
    setEditForm({});
  };

  const startEdit = (record: BookRecord) => {
    setIsEditing(record.id);
    setEditForm(record);
    setErrorMsg(null);
  };

  const startCreate = () => {
    setIsEditing('new');
    setEditForm({ status: 'draft' });
    setErrorMsg(null);
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_RECORD', payload: id });
  };

  return (
    <div className="flex flex-col gap-4 w-full" data-testid="books-collection">
      <div className="flex justify-between items-center bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold">Books Collection</h2>
        <div className="flex gap-2">
          <select
            className="border p-2 rounded"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            aria-label="Filter books by status"
          >
            <option value="all">All</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            onClick={startCreate}
          >
            Add Book
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-3">Title</th>
              <th className="p-3">Author</th>
              <th className="p-3">ISBN</th>
              <th className="p-3">Pages</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isEditing === 'new' && (
              <tr className="border-b bg-blue-50">
                <td className="p-3"><input className="border w-full p-1" placeholder="Title" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} /></td>
                <td className="p-3"><input className="border w-full p-1" placeholder="Author" value={editForm.author || ''} onChange={e => setEditForm({...editForm, author: e.target.value})} /></td>
                <td className="p-3"><input className="border w-full p-1" placeholder="ISBN" value={editForm.isbn || ''} onChange={e => setEditForm({...editForm, isbn: e.target.value})} /></td>
                <td className="p-3"><input type="number" className="border w-full p-1" placeholder="Pages" value={editForm.pageCount || ''} onChange={e => setEditForm({...editForm, pageCount: parseInt(e.target.value) || 0})} /></td>
                <td className="p-3">
                   <select className="border p-1" value={editForm.status || 'draft'} onChange={e => setEditForm({...editForm, status: e.target.value as BookStatus})}>
                     {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                </td>
                <td className="p-3 flex gap-2">
                  <button className="text-green-600 font-bold" onClick={() => handleSave()}>Save</button>
                  <button className="text-gray-600" onClick={() => { setIsEditing(null); setErrorMsg(null); }}>Cancel</button>
                </td>
              </tr>
            )}

            {filteredRecords.map(record => (
              <tr key={record.id} className={`border-b transition-colors duration-200 ${state.selectedRecordId === record.id ? 'bg-orange-50' : ''}`}>
                {isEditing === record.id ? (
                  <>
                    <td className="p-3"><input className="border w-full p-1" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} /></td>
                    <td className="p-3"><input className="border w-full p-1" value={editForm.author || ''} onChange={e => setEditForm({...editForm, author: e.target.value})} /></td>
                    <td className="p-3"><input className="border w-full p-1" value={editForm.isbn || ''} onChange={e => setEditForm({...editForm, isbn: e.target.value})} /></td>
                    <td className="p-3"><input type="number" className="border w-full p-1" value={editForm.pageCount || ''} onChange={e => setEditForm({...editForm, pageCount: parseInt(e.target.value) || 0})} /></td>
                    <td className="p-3">
                       <select className="border p-1" value={editForm.status || 'ready'} onChange={e => setEditForm({...editForm, status: e.target.value as BookStatus})}>
                         {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </td>
                    <td className="p-3 flex gap-2">
                      <button className="text-green-600 font-bold" onClick={() => handleSave(record.id)}>Save</button>
                      <button className="text-gray-600" onClick={() => { setIsEditing(null); setErrorMsg(null); }}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3">{record.title}</td>
                    <td className="p-3">{record.author}</td>
                    <td className="p-3 font-mono text-sm">{record.isbn}</td>
                    <td className="p-3">{record.pageCount}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
                        ${record.status === 'ready' ? 'bg-green-100 text-green-800' : ''}
                        ${record.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
                        ${record.status === 'recovery' ? 'bg-red-100 text-red-800' : ''}
                        ${record.status === 'empty' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${record.status === 'changed' ? 'bg-blue-100 text-blue-800' : ''}
                        ${record.status === 'archived' ? 'bg-purple-100 text-purple-800' : ''}
                      `}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2 items-center">
                      <button className="text-blue-600 hover:text-blue-800" onClick={() => startEdit(record)} aria-label="Edit book">
                        <FileEdit size={18} />
                      </button>
                      <button className="text-gray-600 hover:text-red-600" onClick={() => handleDelete(record.id)} aria-label="Delete book">
                        <Trash2 size={18} />
                      </button>
                      {record.status !== 'recovery' && (
                         <button
                          className="text-orange-600 hover:text-orange-800 font-semibold text-sm flex items-center gap-1 flag-btn"
                          onClick={() => {
                             dispatch({ type: 'MOVE_TO_RECOVERY', payload: { id: record.id, reason: 'Manual flag' } })
                          }}
                          aria-label="Move to Recovery"
                         >
                           <AlertCircle size={16} /> Flag
                         </button>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
            {filteredRecords.length === 0 && isEditing !== 'new' && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {errorMsg && (
          <div className="p-3 bg-red-100 text-red-800 border-t border-red-200 flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
