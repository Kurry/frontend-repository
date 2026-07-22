import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppStore } from '../store';
import { WorkdayTaskSchema } from '../schemas';

export const TaskForm: React.FC = () => {
    const { state, dispatch } = useAppStore();
    const selectedTask = state.records.find(r => r.id === state.selectedTaskId);
    const isNew = state.selectedTaskId === 'NEW';

    const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof WorkdayTaskSchema>>({
        resolver: zodResolver(WorkdayTaskSchema),
        defaultValues: {
            id: '',
            title: '',
            status: 'draft',
            assignedCapacity: 0
        }
    });

    useEffect(() => {
        if (selectedTask) {
            reset(selectedTask);
        } else if (isNew) {
            reset({ id: `task-${Date.now()}`, title: '', status: 'draft', assignedCapacity: 10 });
        }
    }, [selectedTask, isNew, reset]);

    const onSubmit = (data: z.infer<typeof WorkdayTaskSchema>) => {
        if (isNew) {
            dispatch({ type: 'CREATE_TASK', payload: data });
            dispatch({ type: 'SELECT_TASK', payload: data.id });
        } else {
            dispatch({ type: 'UPDATE_TASK', payload: data });
        }
    };

    if (!selectedTask && !isNew) return null;

    return (
        <div className="bg-white p-4 border rounded-lg shadow-sm w-80 max-w-full shrink-0 h-fit">
            <h3 className="font-semibold mb-4 pb-2 border-b">{isNew ? 'Create Task' : 'Edit Task'}</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {!isNew && (
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Task ID</label>
                        <input type="text" {...register('id')} readOnly className="w-full text-sm bg-slate-50 border rounded p-1.5 text-slate-500" />
                    </div>
                )}
                {isNew && (
                    <input type="hidden" {...register('id')} />
                )}

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                    <input type="text" {...register('title')} className={`w-full text-sm border rounded p-1.5 focus:ring-1 focus:ring-green-500 ${errors.title ? 'border-red-500' : 'border-slate-300'}`} />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                    <select {...register('status')} className={`w-full text-sm border rounded p-1.5 bg-white ${errors.status ? 'border-red-500' : 'border-slate-300'}`}>
                        <option value="empty">Empty</option>
                        <option value="draft">Draft</option>
                        <option value="ready">Ready</option>
                        <option value="changed">Changed</option>
                        <option value="archived">Archived</option>
                    </select>
                    {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Capacity (0-100)</label>
                    <input type="number" {...register('assignedCapacity', { valueAsNumber: true })} className={`w-full text-sm border rounded p-1.5 focus:ring-1 focus:ring-green-500 ${errors.assignedCapacity ? 'border-red-500' : 'border-slate-300'}`} />
                    {errors.assignedCapacity && <p className="text-red-500 text-xs mt-1">{errors.assignedCapacity.message}</p>}
                </div>

                <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded text-sm font-medium transition-colors">
                        {isNew ? 'Create' : 'Save'}
                    </button>
                    {!isNew && (
                        <button
                            type="button"
                            onClick={() => {
                                if(window.confirm('Delete this task?')) {
                                    dispatch({ type: 'DELETE_TASK', payload: selectedTask!.id });
                                }
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 py-1.5 px-3 rounded text-sm font-medium transition-colors"
                        >
                            Delete
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => dispatch({ type: 'SELECT_TASK', payload: null })}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};
