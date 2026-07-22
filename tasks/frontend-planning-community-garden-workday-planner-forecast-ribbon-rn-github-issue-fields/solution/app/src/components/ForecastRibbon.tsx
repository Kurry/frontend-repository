import { useStore, calculateDerivedStats } from '../store';
import type { RecordStatus } from '../types';
import { Undo2, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function ForecastRibbon() {
    const {
        records,
        selectedRecordId,
        ribbonOutcome,
        forecastRecord,
        updateForecast,
        applyForecast,
        undo
    } = useStore();

    const selectedRecord = records.find(r => r.id === selectedRecordId);

    // We compute derived stats here live
    const derivedStats = calculateDerivedStats(records, selectedRecordId, forecastRecord);

    const handleApply = () => {
        applyForecast();
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Derived Summary Panel */}
            <div className="flex flex-wrap gap-4 p-4 border border-slate-200 bg-white rounded-md shadow-sm">
                <div className="flex items-center gap-2">
                    <Activity className="text-blue-500" size={20} />
                    <span className="font-semibold text-slate-800">Forecast Summary</span>
                </div>
                <div className="flex gap-4 ml-auto items-center text-sm">
                    <div className="flex flex-col">
                        <span className="text-slate-500 text-xs uppercase font-medium">Total Effort</span>
                        <span className="font-mono text-slate-800">{derivedStats.totalEffort}h</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-500 text-xs uppercase font-medium">Ready</span>
                        <span className="font-mono text-green-600">{derivedStats.readyCount} tasks</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-500 text-xs uppercase font-medium">Draft</span>
                        <span className="font-mono text-amber-600">{derivedStats.draftCount} tasks</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-500 text-xs uppercase font-medium">Conflicts</span>
                        <span className="font-mono text-red-600">{derivedStats.conflictCount} days &gt;8h</span>
                    </div>
                </div>
            </div>

            {/* Forecast Ribbon Work Surface */}
            <div className="flex flex-col p-4 border border-slate-200 bg-slate-50 rounded-md shadow-inner gap-4 min-h-[160px]">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700">Forecast Ribbon</h3>
                    <button
                        onClick={undo}
                        className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-2 py-1 rounded shadow-sm hover:bg-slate-50 active:bg-slate-100"
                        title="Undo last mutation"
                    >
                        <Undo2 size={16} /> Undo
                    </button>
                </div>

                {selectedRecord && forecastRecord ? (
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-4 bg-white p-3 border rounded shadow-sm">
                            <span className="font-medium text-slate-800 shrink-0 w-full sm:w-auto">{selectedRecord.title}</span>

                            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded">
                                <span className="text-xs text-slate-500 font-medium">Status</span>
                                <select
                                    className="border border-slate-300 rounded px-2 py-1 text-sm bg-white"
                                    value={forecastRecord.status}
                                    onChange={(e) => updateForecast({ status: e.target.value as RecordStatus })}
                                >
                                    <option value="empty">Empty</option>
                                    <option value="draft">Draft</option>
                                    <option value="ready">Ready</option>
                                    <option value="changed">Changed</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded">
                                <span className="text-xs text-slate-500 font-medium">Effort</span>
                                <input
                                    type="number"
                                    className="border border-slate-300 rounded px-2 py-1 text-sm bg-white w-20"
                                    min={0}
                                    max={24}
                                    value={forecastRecord.effort}
                                    onChange={(e) => updateForecast({ effort: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded">
                                <span className="text-xs text-slate-500 font-medium">Date</span>
                                <input
                                    type="date"
                                    className="border border-slate-300 rounded px-2 py-1 text-sm bg-white w-36"
                                    value={forecastRecord.assignedDate}
                                    onChange={(e) => updateForecast({ assignedDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center p-3 rounded border"
                            style={{
                                backgroundColor: ribbonOutcome === 'conflict' ? '#fef2f2' : ribbonOutcome === 'changed' ? '#fdf4ff' : ribbonOutcome === 'resolved' ? '#f0fdf4' : 'transparent',
                                borderColor: ribbonOutcome === 'conflict' ? '#fca5a5' : ribbonOutcome === 'changed' ? '#e879f9' : ribbonOutcome === 'resolved' ? '#86efac' : 'transparent'
                            }}
                        >
                            <div className="flex items-center gap-2">
                                {ribbonOutcome === 'conflict' && <AlertTriangle className="text-red-500" size={20} />}
                                {ribbonOutcome === 'changed' && <Activity className="text-purple-500" size={20} />}
                                {ribbonOutcome === 'resolved' && <CheckCircle2 className="text-green-500" size={20} />}
                                <span className={`font-medium ${ribbonOutcome === 'conflict' ? 'text-red-800' : ribbonOutcome === 'changed' ? 'text-purple-800' : ribbonOutcome === 'resolved' ? 'text-green-800' : 'text-slate-500'}`}>
                                    {ribbonOutcome === 'conflict' && 'Conflict: Exceeds 8h effort for assigned date.'}
                                    {ribbonOutcome === 'changed' && 'Projected changes pending.'}
                                    {ribbonOutcome === 'resolved' && 'Changes applied successfully.'}
                                    {ribbonOutcome === 'selected' && 'Modify fields to compare projected outcome.'}
                                </span>
                            </div>

                            <button
                                onClick={handleApply}
                                disabled={ribbonOutcome === 'conflict' || ribbonOutcome === 'selected' || ribbonOutcome === 'resolved'}
                                className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Apply Forecast
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full flex-grow text-slate-400 text-sm">
                        Select a record from the Work Tasks list to adjust forecast.
                    </div>
                )}
            </div>
        </div>
    );
}
