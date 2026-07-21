import React, { useState, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { filteredEventsAtom, categoryTallyAtom, bulkSetCategoryAtom, bulkDeleteAtom, selectedEventIdAtom, resetFiltersAtom } from '../store.js';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MT_DATA } from '../data.js';
import { Checkbox, Button, Menu, ActionIcon, Group, Modal } from '@mantine/core';
import { IconDots, IconEdit, IconTrash } from '@tabler/icons-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

function formatYear(y) {
  if (y < 1) return `${Math.abs(y)} BCE`;
  return `${y} CE`;
}

export function Library({ onEdit }) {
  const events = useAtomValue(filteredEventsAtom);
  const categoryTally = useAtomValue(categoryTallyAtom);
  const setSelectedId = useSetAtom(selectedEventIdAtom);
  const bulkSetCategory = useSetAtom(bulkSetCategoryAtom);
  const bulkDelete = useSetAtom(bulkDeleteAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);
  const reduceMotion = useReducedMotion();

  const [checkedIds, setCheckedIds] = useState(new Set());
  const [confirmReq, setConfirmReq] = useState(null); // { ids: string[] }
  const parentRef = useRef(null);

  // Chronological sort
  const sortedEvents = [...events].sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));

  const rowVirtualizer = useVirtualizer({
    count: sortedEvents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  const allChecked = sortedEvents.length > 0 && checkedIds.size === sortedEvents.length;
  const indeterminate = checkedIds.size > 0 && !allChecked;

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(sortedEvents.map(e => e.id)));
    }
  };

  const toggleRow = (id) => {
    const next = new Set(checkedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedIds(next);
  };

  const handleBulkSetCategory = (catId) => {
    if (checkedIds.size === 0) return;
    bulkSetCategory({ eventIds: Array.from(checkedIds), categoryId: catId });
    setCheckedIds(new Set());
  };

  const handleBulkDelete = () => {
    if (checkedIds.size === 0) return;
    setConfirmReq({ ids: Array.from(checkedIds) });
  };

  const confirmDelete = () => {
    if (!confirmReq) return;
    bulkDelete(confirmReq.ids);
    setCheckedIds(new Set());
    setConfirmReq(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50/80 sticky top-0 z-10 shrink-0">
        <Checkbox
          checked={allChecked}
          indeterminate={indeterminate}
          onChange={toggleAll}
          aria-label="Select all"
          color="cyan"
        />
        <h2 className="font-semibold text-sm mr-auto text-gray-700 m-0">Library ({sortedEvents.length})</h2>

        {checkedIds.size > 0 && (
          <Group gap="xs">
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button variant="default" size="xs">Set category</Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Append category to {checkedIds.size} events</Menu.Label>
                {MT_DATA.categories.map(cat => (
                  <Menu.Item key={cat.id} onClick={() => handleBulkSetCategory(cat.id)}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                      {cat.label}
                    </div>
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
            <Button variant="light" color="red" size="xs" onClick={handleBulkDelete}>
              Delete selected
            </Button>
          </Group>
        )}

        <Button size="xs" color="cyan" onClick={() => onEdit(null)}>
          Add event
        </Button>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 px-6 py-2 border-b border-cyan-100 bg-cyan-50/60 shrink-0" aria-label="Visible category tally">
        {MT_DATA.categories.map((category) => (
          <span key={category.id} className="inline-flex items-center gap-1.5 text-xs text-gray-700">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
            {category.label}: <strong>{categoryTally[category.id]}</strong>
          </span>
        ))}
      </div>

      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
      >
        {sortedEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <p className="mb-4">No events match this range and filters.</p>
            <Button variant="outline" color="cyan" onClick={() => resetFilters()}>
              Reset filters
            </Button>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            <AnimatePresence initial={false}>
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const ev = sortedEvents[virtualItem.index];
              const isChecked = checkedIds.has(ev.id);
              const cat = MT_DATA.categories.find(c => c.id === ev.categories[0]);
              const color = cat ? cat.color : '#000';

              return (
                <motion.div
                  key={ev.id}
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
                  className={`library-row absolute top-0 left-0 w-full flex items-center gap-4 px-6 py-3 border-b border-gray-100 hover:bg-cyan-50/70 hover:shadow-[inset_3px_0_0_var(--c-brand)] transition-all duration-150 cursor-pointer ${isChecked ? 'bg-cyan-50' : ''}`}
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,
                    transition: reduceMotion ? 'none' : 'transform 220ms var(--ease-settle)',
                  }}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: 'easeOut' }}
                  onClick={() => setSelectedId(ev.id)}
                >
                  <Checkbox
                    checked={isChecked}
                    onChange={() => toggleRow(ev.id)}
                    onClick={e => e.stopPropagation()}
                    color="cyan"
                    aria-label={`Select ${ev.title}`}
                  />

                  <div className="w-1.5 h-full absolute left-0 top-0" style={{ backgroundColor: color }}></div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{ev.title}</div>
                    <div className="text-xs text-gray-500 flex gap-2">
                      <span>{ev.type}</span>
                      <span>·</span>
                      <span>{formatYear(ev.year)}</span>
                      <span>·</span>
                      <span className="truncate">{ev.place}</span>
                    </div>
                  </div>

                  <Menu shadow="sm" withinPortal onClick={e => e.stopPropagation()}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray" onClick={e => e.stopPropagation()} aria-label="Event actions">
                        <IconDots size={18} aria-hidden />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconEdit size={14} aria-hidden />} onClick={() => onEdit(ev)}>Edit event</Menu.Item>
                      <Menu.Item color="red" leftSection={<IconTrash size={14} aria-hidden />} onClick={() => setConfirmReq({ ids: [ev.id] })}>
                        Delete event
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Modal
        opened={!!confirmReq}
        onClose={() => setConfirmReq(null)}
        title="Delete events"
        zIndex={120}
        centered
        size="sm"
      >
        <p className="text-sm text-gray-700 mb-4">
          {confirmReq && confirmReq.ids.length === 1
            ? 'This removes 1 event from the timeline.'
            : `This removes ${confirmReq ? confirmReq.ids.length : 0} events from the timeline.`}
          {' '}You can restore it with Undo in the header afterward.
        </p>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setConfirmReq(null)}>Cancel</Button>
          <Button color="red" onClick={confirmDelete} autoFocus>Delete</Button>
        </Group>
      </Modal>
    </div>
  );
}
