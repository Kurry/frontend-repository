import { useAppStore } from '../store';
import type { InvoiceStatus } from '../types';
import { InvoiceStatusEnum } from '../types';
import { useDroppable, useDraggable, DndContext, pointerWithin, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils';
import type { DragEndEvent } from '@dnd-kit/core';

const STATUSES = InvoiceStatusEnum.options;

export function ConstraintCanvas() {
  const { invoices, filterStatus, moveInvoice } = useAppStore();

  const filteredInvoices = invoices.filter(inv => filterStatus === 'all' || inv.status === filterStatus);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const invoiceId = active.id as string;
      const newStatus = over.id as InvoiceStatus;
      moveInvoice(invoiceId, newStatus);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <div className="flex flex-row h-full w-full gap-4 overflow-x-auto p-4 items-start">
        {STATUSES.map(status => (
          <Lane key={status} status={status} items={filteredInvoices.filter(i => i.status === status)} />
        ))}
      </div>
    </DndContext>
  );
}

function Lane({ status, items }: { status: InvoiceStatus, items: any[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-72 flex-shrink-0 bg-canvas-lane rounded-lg p-3 min-h-[200px] max-h-full overflow-y-auto border-2 transition-colors duration-200",
        isOver ? "border-primary-500 bg-primary-50" : "border-transparent"
      )}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700 capitalize">{status}</h3>
        <span className="text-sm bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{items.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        <AnimatePresence>
          {items.map(item => (
            <DraggableInvoiceCard key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DraggableInvoiceCard({ item }: { item: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item }
  });
  const selectInvoice = useAppStore(state => state.selectInvoice);
  const selectedInvoiceId = useAppStore(state => state.selectedInvoiceId);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const isConflict = item.status === 'conflict';
  const isSelected = selectedInvoiceId === item.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          selectInvoice(item.id);
        }
      }}
      onClick={() => selectInvoice(item.id)}
      className={cn(
        "bg-white p-3 rounded shadow-sm border-l-4 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500",
        isConflict ? "border-l-red-500" : "border-l-primary-500",
        isDragging ? "opacity-50 z-50 ring-2 ring-primary-400" : "opacity-100",
        isSelected ? "ring-2 ring-primary-600 shadow-md" : ""
      )}
    >
      <div className="flex justify-between mb-2">
        <span className="font-medium text-sm truncate" title={item.clientName}>{item.clientName}</span>
        <span className="text-sm font-semibold">${item.amount.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{item.dueDate}</span>
        {isConflict && <span className="text-red-500 font-bold">Conflict</span>}
      </div>
    </motion.div>
  );
}
