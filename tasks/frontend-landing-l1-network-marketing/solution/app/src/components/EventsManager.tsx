import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import {
  $events, $eventsManagerOpen, $eventsFilter, $eventsSort,
  $selectedEventIds, deleteEvents, undoEventAction, redoEventAction,
  $historyUndo, $historyRedo, RidgeEvent, formatEventDate, announce
} from '../store';
import { X, Plus, Trash, ArrowUUpLeft, ArrowUUpRight, ArrowUp, ArrowDown } from 'phosphor-react';
import EventForm from './EventForm';

let managerCoachSeen = false;

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
  const [closing, setClosing] = useState(false);
  const [leavingIds, setLeavingIds] = useState<string[]>([]);
  const [leavingEvents, setLeavingEvents] = useState<RidgeEvent[]>([]);
  const [showCoach, setShowCoach] = useState(false);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const visible = isOpen || closing;

  const requestClose = () => {
    if (closing || isFormOpen) return;
    setClosing(true);
    window.setTimeout(() => {
      $eventsManagerOpen.set(false);
      setClosing(false);
      lastFocused.current?.focus({ preventScroll: true });
      lastFocused.current = null;
    }, 200);
  };

  useEffect(() => {
    if (isOpen) {
      lastFocused.current = document.activeElement as HTMLElement | null;
      const t = window.setTimeout(() => firstFocusRef.current?.focus(), 80);
      const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isFormOpen) { e.preventDefault(); requestClose(); } };
      window.addEventListener('keydown', handleEscape);
      // Show once per page lifetime without browser persistence; this genre is
      // intentionally in-memory only.
      if (!managerCoachSeen) { managerCoachSeen = true; setShowCoach(true); }
      return () => { window.removeEventListener('keydown', handleEscape); window.clearTimeout(t); };
    }
  }, [isOpen, isFormOpen]);

  const filteredEvents = useMemo(() => {
    const displayedEvents = [...events, ...leavingEvents.filter(leaving => !events.some(event => event.id === leaving.id))];
    return displayedEvents.filter(e => {
      if (filter.status && e.status !== filter.status) return false;
      if (filter.category && e.category !== filter.category) return false;
      return true;
    }).sort((a, b) => {
      const va = String(a[sort.by]).toLowerCase();
      const vb = String(b[sort.by]).toLowerCase();
      const comp = va.localeCompare(vb);
      return sort.direction === 'asc' ? comp : -comp;
    });
  }, [events, leavingEvents, filter, sort]);

  const stats = {
    upcoming: events.filter(e => e.status === 'upcoming').length,
    featured: events.filter(e => e.status === 'featured').length,
    past: events.filter(e => e.status === 'past').length,
  };
  const catalogPulse = useMemo(() => {
    const cities = new Set(events.map(event => event.city.trim()).filter(Boolean)).size;
    const next = events
      .filter(event => event.status !== 'past')
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    return { cities, next };
  }, [events]);

  const handleToggleSort = (field: 'date' | 'title') => {
    if (sort.by === field) {
      $eventsSort.set({ by: field, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      $eventsSort.set({ by: field, direction: 'asc' });
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    $selectedEventIds.set(e.target.checked ? filteredEvents.map(ev => ev.id) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) $selectedEventIds.set([...selectedIds, id]);
    else $selectedEventIds.set(selectedIds.filter(sId => sId !== id));
  };

  // Commit immediately so Undo targets this deletion, while a local snapshot
  // keeps the removed row mounted only for its exit transition.
  const requestDelete = (ids: string[]) => {
    if (ids.length === 0) return;
    const rows = events.filter(event => ids.includes(event.id));
    if (rows.length === 0) return;
    setLeavingEvents(prev => [...prev.filter(event => !ids.includes(event.id)), ...rows]);
    setLeavingIds(prev => Array.from(new Set([...prev, ...ids])));
    deleteEvents(ids);
    announce(`Deleted ${ids.length} event${ids.length === 1 ? '' : 's'}. Use Undo to restore.`);
    window.setTimeout(() => {
      setLeavingEvents(prev => prev.filter(event => !ids.includes(event.id)));
      setLeavingIds(prev => prev.filter(x => !ids.includes(x)));
    }, 300);
  };

  const handleDeleteSelected = () => requestDelete(selectedIds);

  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const f = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
    if (f.length === 0) return;
    const first = f[0], last = f[f.length - 1];
    const active = document.activeElement as HTMLElement;
    if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  };

  if (!visible) return null;

  const sortAria = (field: 'date' | 'title'): 'ascending' | 'descending' | 'none' =>
    sort.by === field ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm ${closing ? 'backdrop-out' : 'backdrop-in'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Events Manager"
      onMouseDown={(e) => { if (e.target === e.currentTarget) requestClose(); }}
    >
      <div
        ref={dialogRef}
        onKeyDown={trapFocus}
        className={`surface-copy bg-surface w-full max-w-6xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col border border-current/10 overflow-hidden ${closing ? 'overlay-out' : 'overlay-in'}`}
      >

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-current/10 bg-surface">
          <h2 className="text-2xl font-bold display-font">Events Manager</h2>
          <button ref={firstFocusRef} className="btn btn-square btn-ghost text-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={requestClose} aria-label="Close Events Manager">
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 flex flex-wrap gap-4 items-center justify-between border-b border-white/10 bg-surface/50">
          <div className="flex flex-wrap gap-4 items-center">
            <button className="btn btn-primary btn-sm notch-br gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => { setEditingEvent(null); setIsFormOpen(true); }}>
              <Plus size={16} /> Create event
            </button>

            <div className="flex gap-2 border-l border-white/10 pl-4">
              <button className="btn btn-ghost btn-sm notch-br px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" disabled={undoStack.length === 0} onClick={() => { undoEventAction(); announce('Undo applied across manager, rollups, and listings.'); }} aria-label="Undo last change">
                <ArrowUUpLeft size={18} />
              </button>
              <button className="btn btn-ghost btn-sm notch-br px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" disabled={redoStack.length === 0} onClick={() => { redoEventAction(); announce('Redo applied across manager, rollups, and listings.'); }} aria-label="Redo last change">
                <ArrowUUpRight size={18} />
              </button>
            </div>

            {/* Always-present bulk control: activating it with zero rows selected
                is inert (no confirmation dialog, no count change) — deliberately
                clickable so that inertness stays observable. */}
            <button
              className={`btn btn-ghost btn-sm notch-br gap-2 border-l border-white/10 pl-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${selectedIds.length === 0 ? 'opacity-50' : 'text-error'}`}
              onClick={handleDeleteSelected}
            >
              <Trash size={16} /> Delete selected{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm" aria-live="polite">
            <span className="badge badge-neutral">Upcoming: {stats.upcoming}</span>
            <span className="badge badge-accent">Featured: {stats.featured}</span>
            <span className="badge">Past: {stats.past}</span>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-white/10 bg-ink/10 text-xs flex flex-wrap gap-x-5 gap-y-1" aria-label="Catalog pulse">
          <span><strong>Catalog pulse:</strong> {catalogPulse.cities} active {catalogPulse.cities === 1 ? 'city' : 'cities'}</span>
          <span>{catalogPulse.next ? `Next: ${catalogPulse.next.title} on ${formatEventDate(catalogPulse.next.date)}` : 'No upcoming event scheduled'}</span>
        </div>

        {/* Animated bulk action bar — mounts with an entrance when selection is non-empty */}
        {selectedIds.length > 0 && (
          <div className="bulk-bar-in overflow-hidden px-4 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-accent/30 bg-accent/10" role="region" aria-label="Bulk selection actions">
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
            <button className="btn btn-error btn-sm notch-br gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={handleDeleteSelected}>
              <Trash size={16} /> Delete selected
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="p-4 flex flex-wrap gap-4 items-center border-b border-white/10 bg-surface/30 text-sm">
          <select
            className="select select-bordered h-11 min-h-11 notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            value={filter.status}
            onChange={e => $eventsFilter.set({ status: e.target.value as any, category: '' })}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="featured">Featured</option>
            <option value="past">Past</option>
          </select>

          <select
            className="select select-bordered h-11 min-h-11 notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            value={filter.category}
            onChange={e => $eventsFilter.set({ status: '', category: e.target.value as any })}
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
            <button className="btn btn-ghost btn-sm opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => $eventsFilter.set({ status: '', category: '' })}>Clear filters</button>
          )}
        </div>

        {/* First-run coachmark */}
        {showCoach && (
          <div className="px-4 py-3 flex items-center justify-between gap-4 bg-ink/20 border-b border-white/10 text-sm" role="note">
            <span>Tip: select rows to bulk-delete, filter by status or category, sort by column, and press <kbd className="kbd kbd-xs">Ctrl</kbd>+<kbd className="kbd ksd-xs">K</kbd> to jump anywhere.</span>
            <button className="btn btn-ghost btn-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => setShowCoach(false)} aria-label="Dismiss tip">Got it</button>
          </div>
        )}

        {/* Table */}
        <div className="void-copy flex-1 overflow-auto p-4 bg-void">
          {events.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <p className="text-xl opacity-70 mb-4">No events found in the catalog. Create your first event to start building the schedule.</p>
              <button className="btn btn-primary notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => { setEditingEvent(null); setIsFormOpen(true); }}>Create event</button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <p className="text-xl opacity-70 mb-4">No events match the current filters.</p>
              <button className="btn btn-outline notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => $eventsFilter.set({ status: '', category: '' })}>Clear filters</button>
            </div>
          ) : (
            <table className="table w-full text-white">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" className="checkbox checkbox-sm notch-br"
                      checked={filteredEvents.length > 0 && selectedIds.length === filteredEvents.length}
                      onChange={handleSelectAll}
                      aria-label="Select all events"
                    />
                  </th>
                  <th>
                    <button type="button" className="flex items-center gap-1 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => handleToggleSort('title')} aria-sort={sortAria('title')}>
                      Title {sort.by === 'title' && (sort.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>)}
                    </button>
                  </th>
                  <th>
                    <button type="button" className="flex items-center gap-1 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => handleToggleSort('date')} aria-sort={sortAria('date')}>
                      Date {sort.by === 'date' && (sort.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>)}
                    </button>
                  </th>
                  <th className="hidden sm:table-cell">City</th>
                  <th className="hidden sm:table-cell">Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(event => {
                  const leaving = leavingIds.includes(event.id);
                  return (
                    <tr key={event.id} data-event-row={event.id} className={`group hover:bg-surface/50 transition-colors ${leaving ? 'row-exit' : 'row-enter'}`}>
                      <td>
                        <input type="checkbox" className="checkbox checkbox-sm notch-br"
                          disabled={leaving}
                          checked={selectedIds.includes(event.id)}
                          onChange={e => handleSelectOne(event.id, e.target.checked)}
                          aria-label={`Select ${event.title}`}
                        />
                      </td>
                      <td className="font-medium max-w-[9rem] truncate sm:max-w-none">{event.title}</td>
                      <td className="tabular-nums">{formatEventDate(event.date)}</td>
                      <td className="hidden sm:table-cell">{event.city}</td>
                      <td className="hidden sm:table-cell">{event.category}</td>
                      <td>
                        <div className={`badge badge-sm notch-br ${
                          event.status === 'featured' ? 'badge-accent' :
                          event.status === 'past' ? 'badge-neutral' : 'badge-primary'
                        }`}>
                          {event.status}
                        </div>
                      </td>
                      <td className="flex gap-1">
                        <button disabled={leaving} className="btn btn-xs btn-ghost opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => { setEditingEvent(event); setIsFormOpen(true); }}>
                          Edit
                        </button>
                        <button disabled={leaving} className="btn btn-xs btn-ghost text-error opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => requestDelete([event.id])} aria-label={`Delete ${event.title}`}>
                          <Trash size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
