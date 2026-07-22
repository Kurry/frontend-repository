import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScenarioRecord } from '../types';
import { ScenarioCard } from './ScenarioCard';

interface SortableCardProps {
  record: ScenarioRecord;
}

export const SortableCard: React.FC<SortableCardProps> = ({ record }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: record.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ScenarioCard record={record} />
    </div>
  );
};
