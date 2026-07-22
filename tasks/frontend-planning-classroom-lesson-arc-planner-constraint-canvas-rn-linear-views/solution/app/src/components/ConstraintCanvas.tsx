import React, { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { useAppStore, LANES } from '../store';
import { Lane } from './Lane';
import { LessonBlockItem } from './LessonBlockItem';
import type { LessonBlock } from '../types';

interface ConstraintCanvasProps {
    onEditBlock: (block: LessonBlock) => void;
}

export function ConstraintCanvas({ onEditBlock }: ConstraintCanvasProps) {
    const { records, updateRecord, getDerivedSummary } = useAppStore();
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: (event, { currentCoordinates }) => {
                // Not standard keyboard accessibility - we will handle true keyboard nav via custom onKeyDown in App
                return currentCoordinates;
            }
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && over.id) {
            const laneId = over.id as string;
            const blockId = active.id as string;
            const block = records.find(r => r.id === blockId);

            if (block && block.lane !== laneId) {
                updateRecord(blockId, { lane: laneId });

                // Live announcement for screen readers
                const liveRegion = document.getElementById('live-region');
                if (liveRegion) {
                    liveRegion.textContent = `Moved ${block.title} to ${laneId}`;
                }
            }
        }
    };

    const activeBlock = records.find(r => r.id === activeId);
    const summary = getDerivedSummary();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, block: LessonBlock) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const currentIndex = LANES.indexOf(block.lane);
            if (currentIndex === -1) return;

            let newIndex = currentIndex;
            if (e.key === 'ArrowRight' && currentIndex < LANES.length - 1) {
                newIndex = currentIndex + 1;
            } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                newIndex = currentIndex - 1;
            }

            if (newIndex !== currentIndex) {
                const targetLane = LANES[newIndex];
                updateRecord(block.id, { lane: targetLane });

                const liveRegion = document.getElementById('live-region');
                if (liveRegion) {
                    liveRegion.textContent = `Moved ${block.title} to ${targetLane} via keyboard`;
                }
            }
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            onEditBlock(block);
        }
    };

    const dropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.4',
                },
            },
        }),
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col md:flex-row flex-1 gap-6 p-6 overflow-x-auto h-full items-stretch md:items-start bg-slate-50 min-h-[500px]">
                {LANES.map(lane => {
                    const isConflict = summary[lane]?.isConflict;
                    return (
                        <Lane
                            key={lane}
                            id={lane}
                            title={`${lane} (${summary[lane]?.count || 0})`}
                            isConflict={isConflict}
                        >
                            {records.filter(r => r.lane === lane).map(block => (
                                <LessonBlockItem
                                    key={block.id}
                                    block={block}
                                    onEdit={onEditBlock}
                                    onKeyDown={handleKeyDown}
                                />
                            ))}
                        </Lane>
                    );
                })}
            </div>

            {/* In reduced motion mode, we might not want the drag overlay animation, but for now we rely on the CSS transforms avoiding transitions if needed */}
            <DragOverlay dropAnimation={dropAnimation}>
                {activeBlock ? (
                    <LessonBlockItem
                        block={activeBlock}
                        onEdit={onEditBlock}
                        isActive
                    />
                ) : null}
            </DragOverlay>

            {/* Live region for accessibility announcements */}
            <div
                id="live-region"
                className="sr-only"
                aria-live="polite"
                aria-atomic="true"
            ></div>
        </DndContext>
    );
}
