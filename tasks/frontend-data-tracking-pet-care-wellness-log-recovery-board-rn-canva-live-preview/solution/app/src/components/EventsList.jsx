import React, { useState } from 'react';
import { Archive, Edit2, AlertCircle } from 'lucide-react';

export default function EventsList({
  events,
  onEdit,
  onArchive,
  onRecover,
  currentFilter,
  onFilterChange,
}) {
  const filteredEvents =
    currentFilter === 'all'
      ? events
      : events.filter((e) => e.status === currentFilter);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'empty':
        return <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">Empty</span>;
      case 'draft':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Draft</span>;
      case 'ready':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Ready</span>;
      case 'changed':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Changed</span>;
      case 'archived':
        return <span className="px-2 py-1 bg-gray-300 text-gray-800 rounded-full text-xs">Archived</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1"><AlertCircle size={12}/> Failed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Pet Care Events</h2>
        <div className="flex gap-2">
          <select
            value={currentFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter events by status"
          >
            <option value="all">All States</option>
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="failed">Failed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => onEdit(null)}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            New Event
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-0">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No events found.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredEvents.map((event) => (
              <li key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {event.title || 'Untitled Event'}
                      </h3>
                      {getStatusBadge(event.status)}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {event.date} • {event.petName || 'No pet'}
                    </p>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 ml-4">
                    {event.status === 'failed' ? (
                      <button
                        onClick={() => onRecover(event.id)}
                        className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label={`Recover event ${event.title}`}
                      >
                        Recover
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onEdit(event.id)}
                          className="text-gray-400 hover:text-blue-600 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label={`Edit event ${event.title}`}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => onArchive(event.id)}
                          className="text-gray-400 hover:text-gray-700 p-1 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                          aria-label={`Archive event ${event.title}`}
                        >
                          <Archive size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
