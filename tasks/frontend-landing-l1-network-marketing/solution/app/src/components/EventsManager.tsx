import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import {
  $events, $eventsManagerOpen, $eventsFilter, $eventsSort,
  $selectedEventIds, deleteEvents, undoEventAction, redoEventAction,
  $historyUndo, $historyRedo, RidgeEvent
} from '../store';
import { X, Plus, Trash, ArrowUUpLeft, ArrowUUpRight, ArrowUp, ArrowDown } from 'phosphor-react';
import EventForm from './EventForm';

export default function EventsManager() {
  const isOpen = useStore($eventsManagerOpen);
  const events = useStore($events);
  const filter = useStore($eventsFilter);
  const sort = useStore($eventsSort);
  const selectedIds = useStore($selectedEventIds);
  const undoStack = useStore($historyUndo);
  const redoStack = useStore($historyRedo);

  const [editingEvent, setEditingEvent] = useState<RidgeEvent | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [exitingIds, setExitingIds] = useState<string[]>([]);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const previousRows = useRef(new Map<string, DOMRect>());

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstFocusRef.current?.focus(), 100);
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isFormOpen) {
          $eventsManagerOpen.set(false);
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, isFormOpen]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (filter.status && e.status !== filter.status) return false;
      if (filter.category && e.category !== filter.category) return false;
      return true;
    }).sort((a, b) => {
      let valA = a[sort.by];
      let valB = b[sort.by];
      if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [events, filter, sort]);

  const stats = {
    upcoming: events.filter(e => e.status === 'upcoming').length,
    featured: events.filter(e => e.status === 'featured').length,
    past: events.filter(e => e.status === 'past').length,
  };

  useLayoutEffect(() => {
    const currentRows = new Map<string, DOMRect>();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    rowRefs.current.forEach((row, id) => {
      const next = row.getBoundingClientRect();
      const previous = previousRows.current.get(id);
      currentRows.set(id, next);
      if (reduceMotion) return;
      if (!previous) {
        row.animate(
          [{ opacity: 0, transform: 'translateY(-10px) scale(0.98)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }],
          { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        );
      } else {
        const deltaY = previous.top - next.top;
        if (Math.abs(deltaY) > 1) {
          row.animate(
            [{ transform: `translateY(${deltaY}px)` }, { transform: 'translateY(0)' }],
            { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
          );
        }
      }
    });

    previousRows.current = currentRows;
  }, [filteredEvents]);

  const handleToggleSort = (field: 'date' | 'title') => {
    if (sort.by === field) {
      $eventsSort.set({ by: field, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      $eventsSort.set({ by: field, direction: 'asc' });
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      $selectedEventIds.set(filteredEvents.map(ev => ev.id));
    } else {
      $selectedEventIds.set([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      $selectedEventIds.set([...selectedIds, id]);
    } else {
      $selectedEventIds.set(selectedIds.filter(sId => sId !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0 || exitingIds.length > 0) return;
    const ids = [...selectedIds];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
      setExitingIds(ids);
      const animations = ids.flatMap(id => {
        const row = rowRefs.current.get(id);
        if (!row) return [];
        return [row.animate(
          [{ opacity: 1, transform: 'translateX(0) scale(1)' }, { opacity: 0, transform: 'translateX(18px) scale(0.98)' }],
          { duration: 180, easing: 'ease-in', fill: 'forwards' },
        ).finished];
      });
      await Promise.allSettled(animations);
    }
    deleteEvents(ids);
    setExitingIds([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-surface w-full max-w-6xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col border border-white/10 overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-void/50">
          <h2 className="text-2xl font-bold display-font">Events Manager</h2>
          <button ref={firstFocusRef} className="btn btn-square btn-ghost text-current" onClick={() => $eventsManagerOpen.set(false)} aria-label="Close Events Manager">
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 flex flex-wrap gap-4 items-center justify-between border-b border-white/10 bg-surface/50">
          <div className="flex flex-wrap gap-4 items-center">
            <button className="btn btn-primary btn-sm notch-br gap-2" onClick={() => { setEditingEvent(null); setIsFormOpen(true); }}>
              <Plus size={16} /> Create
            </button>
            <button className="btn btn-error btn-sm notch-br gap-2" disabled={selectedIds.length === 0} onClick={handleDeleteSelected}>
              <Trash size={16} /> Delete Selected
            </button>

            <div className="flex gap-2 border-l border-white/10 pl-4">
              <button className="btn btn-ghost btn-sm notch-br px-2" disabled={undoStack.length === 0} onClick={undoEventAction} aria-label="Undo">
                <ArrowUUpLeft size={18} />
              </button>
              <button className="btn btn-ghost btn-sm notch-br px-2" disabled={redoStack.length === 0} onClick={redoEventAction} aria-label="Redo">
                <ArrowUUpRight size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex gap-2">
              <span className="badge badge-neutral">Upcoming: {stats.upcoming}</span>
              <span className="badge badge-accent">Featured: {stats.featured}</span>
              <span className="badge">Past: {stats.past}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 flex flex-wrap gap-4 items-center border-b border-white/10 bg-surface/30 text-sm">
          <select
            className="select select-sm select-bordered notch-br"
            value={filter.status}
            onChange={e => $eventsFilter.set({ ...filter, status: e.target.value as any })}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="featured">Featured</option>
            <option value="past">Past</option>
          </select>

          <select
            className="select select-sm select-bordered notch-br"
            value={filter.category}
            onChange={e => $eventsFilter.set({ ...filter, category: e.target.value as any })}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            <option value="Summit">Summit</option>
            <option value="Meetup">Meetup</option>
            <option value="Workshop">Workshop</option>
            <option value="Hackathon">Hackathon</option>
            <option value="Webinar">Webinar</option>
          </select>

          {(filter.status || filter.category) && (
            <button className="btn btn-ghost btn-sm text-gray-400" onClick={() => $eventsFilter.set({ status: '', category: '' })}>Clear filters</button>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4 bg-void">
          {events.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <p className="text-xl text-gray-400 mb-4">No events found in the catalog.</p>
              <button className="btn btn-primary notch-br" onClick={() => { setEditingEvent(null); setIsFormOpen(true); }}>Create your first event</button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <p className="text-xl text-gray-400 mb-4">No events match the current filters.</p>
              <button className="btn btn-outline notch-br" onClick={() => $eventsFilter.set({ status: '', category: '' })}>Clear filters</button>
            </div>
          ) : (
            <table className="table w-full">
              <thead>
                <tr>
                  <th>
                    <label>
                      <input type="checkbox" className="checkbox checkbox-sm notch-br"
                        checked={filteredEvents.length > 0 && selectedIds.length === filteredEvents.length}
                        onChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </label>
                  </th>
                  <th className="cursor-pointer hover:bg-white/5" onClick={() => handleToggleSort('title')}>
                    <div className="flex items-center gap-1">
                      Title {sort.by === 'title' && (sort.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>)}
                    </div>
                  </th>
                  <th className="cursor-pointer hover:bg-white/5" onClick={() => handleToggleSort('date')}>
                    <div className="flex items-center gap-1">
                      Date {sort.by === 'date' && (sort.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>)}
                    </div>
                  </th>
                  <th>City</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(event => (
                  <tr
                    key={event.id}
                    ref={row => {
                      if (row) rowRefs.current.set(event.id, row);
                      else rowRefs.current.delete(event.id);
                    }}
                    className="hover:bg-white/5 transition-colors group"
                    aria-busy={exitingIds.includes(event.id) || undefined}
                  >
                    <td>
                      <label>
                        <input type="checkbox" className="checkbox checkbox-sm notch-br"
                          checked={selectedIds.includes(event.id)}
                          onChange={e => handleSelectOne(event.id, e.target.checked)}
                          aria-label={`Select ${event.title}`}
                        />
                      </label>
                    </td>
                    <td className="font-medium">{event.title}</td>
                    <td>{event.date}</td>
                    <td>{event.city}</td>
                    <td>{event.category}</td>
                    <td>
                      <div className={`badge badge-sm notch-br ${
                        event.status === 'featured' ? 'badge-accent' :
                        event.status === 'past' ? 'badge-neutral' : 'badge-primary'
                      }`}>
                        {event.status}
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-xs btn-ghost opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" onClick={() => { setEditingEvent(event); setIsFormOpen(true); }}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isFormOpen && (
        <EventForm
          eventToEdit={editingEvent}
          onClose={() => { setIsFormOpen(false); setEditingEvent(null); }}
        />
      )}
    </div>
  );
}
