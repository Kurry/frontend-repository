import React, { useRef, type KeyboardEvent } from 'react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, MousePointerSquareDashed } from 'lucide-react';
import { TaskForm } from './TaskForm';

export const SpatialComposer: React.FC = () => {
    const { state, dispatch, derived } = useAppStore();
    const composerRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const selectedTask = state.selectedTaskId && state.selectedTaskId !== 'NEW'
        ? state.records.find(r => r.id === state.selectedTaskId)
        : null;

    const handlePlace = (x: number, y: number) => {
        if (!selectedTask) return;

        // Rebalance capacity: base rule just to mutate it deterministically
        const rebalanceCapacity = Math.min(100, Math.max(0, selectedTask.assignedCapacity + Math.floor((x / 100) * 5)));

        dispatch({
            type: 'PLACE_IN_COMPOSER',
            payload: {
                taskId: selectedTask.id,
                x: Math.round(x),
                y: Math.round(y),
                zone: 'primary',
                rebalanceCapacity
            }
        });
    };

    const handleComposerClick = (e: React.MouseEvent) => {
        if (!selectedTask) return;

        const rect = composerRef.current?.getBoundingClientRect();
        if (rect) {
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            handlePlace(x, y);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (!selectedTask) return;

        const currentPos = selectedTask['spatial-composerState'];
        let x = currentPos?.x ?? 50;
        let y = currentPos?.y ?? 50;

        const step = 20;
        let moved = false;

        switch(e.key) {
            case 'ArrowUp': y = Math.max(0, y - step); moved = true; break;
            case 'ArrowDown': y = Math.min(400, y + step); moved = true; break;
            case 'ArrowLeft': x = Math.max(0, x - step); moved = true; break;
            case 'ArrowRight': x = Math.min(600, x + step); moved = true; break;
            case 'Enter':
            case ' ':
                if (moved) {
                    handlePlace(x, y);
                }
                break;
        }

        if (moved) {
            e.preventDefault();
            handlePlace(x, y);
        }
    };

    React.useEffect(() => {
        const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                dispatch({ type: 'UNDO' });
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [dispatch]);

    const placedTasks = state.records.filter(r => r['spatial-composerState']?.placed);

    return (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-slate-50/50">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Spatial Composer</h2>
                    <p className="text-sm text-slate-500">Place selected tasks to rebalance capacity</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="bg-white px-4 py-2 rounded-lg border shadow-sm flex gap-6 text-sm">
                        <div>
                            <span className="text-slate-500 block text-xs uppercase font-bold">Total Capacity</span>
                            <span className="font-semibold text-lg text-slate-800">{derived.totalCapacity}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-xs uppercase font-bold">Placed</span>
                            <span className="font-semibold text-lg text-slate-800">{derived.placedCount}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => dispatch({ type: 'UNDO' })}
                        className="bg-white border hover:bg-slate-50 p-2 rounded-lg text-slate-600 transition-colors flex items-center gap-2"
                        title="Undo last action (Ctrl+Z)"
                    >
                        <Undo2 size={18} /> <span className="hidden lg:inline text-sm font-medium">Undo</span>
                    </button>
                </div>
            </div>

            <div className="flex gap-4 flex-col lg:flex-row items-start relative">
                <div
                    ref={composerRef}
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                    onClick={handleComposerClick}
                    className={`relative flex-1 w-full min-h-[500px] bg-white border-2 border-dashed rounded-xl shadow-inner overflow-hidden cursor-crosshair transition-colors focus:outline-none focus:ring-4 focus:ring-green-500/20 ${selectedTask ? 'border-green-400 bg-green-50/10' : 'border-slate-300'}`}
                >
                    {!selectedTask && placedTasks.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
                            <MousePointerSquareDashed size={48} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium text-slate-500">Select a task and click to place</p>
                            <p className="text-sm">Or use arrow keys when focused</p>
                        </div>
                    )}

                    <AnimatePresence>
                        {placedTasks.map(task => {
                            const pos = task['spatial-composerState'];
                            if (!pos || pos.x === undefined || pos.y === undefined) return null;

                            const isSelected = state.selectedTaskId === task.id;

                            return (
                                <motion.div
                                    key={task.id}
                                    layout={!prefersReducedMotion}
                                    initial={prefersReducedMotion ? false : { scale: 0.8, opacity: 0 }}
                                    animate={prefersReducedMotion ? false : { scale: 1, opacity: 1, x: pos.x, y: pos.y }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    className={`absolute w-32 p-3 bg-white rounded-lg border-2 shadow-md cursor-pointer ${isSelected ? 'border-green-500 ring-2 ring-green-200 z-10' : 'border-slate-200 hover:border-green-300'}`}
                                    style={prefersReducedMotion ? { left: pos.x, top: pos.y } : { left: 0, top: 0 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        dispatch({ type: 'SELECT_TASK', payload: task.id });
                                    }}
                                >
                                    <div className="font-semibold text-sm truncate" title={task.title}>{task.title}</div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs bg-slate-100 text-slate-600 px-1 rounded">{task.status}</span>
                                        <span className="text-xs font-bold text-green-700">{task.assignedCapacity}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {(state.selectedTaskId === 'NEW' || selectedTask) && (
                    <div className="lg:w-80 w-full shrink-0">
                        <TaskForm />
                    </div>
                )}
            </div>
        </div>
    );
};
