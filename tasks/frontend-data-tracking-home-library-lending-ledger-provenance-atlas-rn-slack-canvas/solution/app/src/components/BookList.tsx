import { useState } from 'react';
import type { BookRecord } from '../types';
import type { Action } from '../store';
import { BookCard } from './BookCard';
import { Plus } from 'lucide-react';

interface BookListProps {
  records: BookRecord[];
  onSelect: (id: string) => void;
  selectedId: string | null;
  dispatch: React.Dispatch<Action>;
}

export function BookList({ records, onSelect, selectedId, dispatch }: BookListProps) {
  const [filter, setFilter] = useState<string>('all');

  const filteredRecords = filter === 'all'
    ? records
    : records.filter((r) => r.status === filter);

  const handleCreate = () => {
    const title = prompt("Enter book title:");
    if (!title) return;
    const author = prompt("Enter author name:") || "Unknown";
    dispatch({ type: 'CREATE_BOOK', payload: { title, author } });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Library Collection</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
            <option value="quarantined">Quarantined</option>
          </select>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Add Book
          </button>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-200 rounded-lg p-8">
          <p className="mb-2">No books found.</p>
          <p className="text-sm">Click "Add Book" to populate the collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max overflow-y-auto pb-8">
          {filteredRecords.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              isSelected={book.id === selectedId}
              onSelect={() => onSelect(book.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
