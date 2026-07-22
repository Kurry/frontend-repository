import React, { useState } from 'react';
import { useAppStore } from '../store';
import { PlusCircle, Search, Filter } from 'lucide-react';

export const WorkTasksList: React.FC = () => {
    const { state, dispatch } = useAppStore();
    const [search, setSearch] = useState('');

    const statuses = ['all', 'empty', 'draft', 'ready', 'changed', 'archived'];

    const filteredRecords = state.records.filter(r => {
        if (state.filterStatus && state.filterStatus !== 'all' && r.status !== state.filterStatus) return false;
        if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col h-full md:h-auto overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex flex-col gap-3 shrink-0 bg-slate-50">
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-slate-800">Work Tasks</h2>
                    <button
                        onClick={() => dispatch({ type: 'SELECT_TASK', payload: 'NEW' })}
                        className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm font-medium transition-colors"
                        aria-label="Create task"
                    >
                        <PlusCircle size={16} /> New
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Filter size={14} className="text-slate-500" />
                    <select
                        className="bg-transparent border-none text-slate-600 text-sm focus:ring-0 cursor-pointer w-full p-0"
                        value={state.filterStatus || 'all'}
                        onChange={e => dispatch({ type: 'SET_FILTER', payload: e.target.value === 'all' ? null : e.target.value })}
                        aria-label="Filter status"
                    >
                        {statuses.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredRecords.length === 0 ? (
                    <div className="text-center p-6 text-sm text-slate-500">
                        No tasks found matching current filters.
                    </div>
                ) : (
                    filteredRecords.map(record => (
                        <div
                            key={record.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${state.selectedTaskId === record.id ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-slate-200 bg-white hover:border-green-300 hover:shadow-sm'}`}
                            onClick={() => dispatch({ type: 'SELECT_TASK', payload: record.id })}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-medium text-slate-800 text-sm leading-tight pr-2">{record.title}</h3>
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm tracking-wider ${
                                    record.status === 'empty' ? 'bg-slate-100 text-slate-500' :
                                    record.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                                    record.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                                    record.status === 'changed' ? 'bg-purple-100 text-purple-700' :
                                    'bg-slate-200 text-slate-600'
                                }`}>
                                    {record.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="text-xs text-slate-500">
                                    Capacity: <span className="font-semibold text-slate-700">{record.assignedCapacity}</span>
                                </div>
                                {record['spatial-composerState']?.placed && (
                                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded flex items-center">
                                        Placed
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
