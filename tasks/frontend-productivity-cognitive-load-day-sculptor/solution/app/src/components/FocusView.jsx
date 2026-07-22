import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Play, Pause, Square } from 'lucide-react';

export function FocusView({
  focusState,
  blocks,
  tasks,
  onTick,
  onToggleTimer,
  onLogInterruption,
  onExit
}) {
  const { activeBlockId, elapsedMinutes, timerRunning } = focusState;
  const activeBlock = blocks.find(b => b.id === activeBlockId);
  const activeTask = activeBlock ? tasks.find(t => t.id === activeBlock.taskId) : null;

  const [showInterruption, setShowInterruption] = useState(false);

  if (!activeBlock || !activeTask) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8 h-full rounded-xl border">
        <p className="text-gray-500">No active focus block.</p>
        <button
          onClick={onExit}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded shadow"
        >
          Return to Planning
        </button>
      </div>
    );
  }

  const plannedMinutes = activeBlock.duration * 15;
  const progressPercent = Math.min(100, (elapsedMinutes / plannedMinutes) * 100);

  const handlePause = () => {
    if (timerRunning) {
      onToggleTimer();
    }
    setShowInterruption(true);
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full rounded-xl border shadow p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Focus Mode</h2>
        <button
          onClick={onExit}
          className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50"
        >
          Exit Focus
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900">{activeTask.title}</h1>
          <p className="text-gray-500 mt-2">Load: {activeTask.load} / 10</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-4 mb-4 overflow-hidden relative">
          <div
            className="bg-blue-600 h-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex justify-between w-full text-sm text-gray-600 font-mono mb-12">
          <span>{elapsedMinutes}m elapsed</span>
          <span>{plannedMinutes}m planned</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={onToggleTimer}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95",
              timerRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
            )}
          >
            {timerRunning ? <Pause size={32} /> : <Play size={32} />}
          </button>

          <button
            onClick={handlePause}
            className="w-16 h-16 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center hover:bg-yellow-200 transition-colors"
            title="Log Interruption"
          >
            <Square size={24} />
          </button>
        </div>

        {/* WebMCP Verifier Timer Controls (Required by spec) */}
        <div className="mt-16 p-4 border rounded bg-gray-50 w-full flex justify-between items-center opacity-50 hover:opacity-100 transition-opacity">
          <span className="text-xs text-gray-500 font-mono">Verifier Clock Controls</span>
          <div className="flex gap-2">
            <button onClick={() => onTick(1)} className="px-2 py-1 text-xs border rounded bg-white">+1m</button>
            <button onClick={() => onTick(5)} className="px-2 py-1 text-xs border rounded bg-white">+5m</button>
            <button onClick={() => onTick(15)} className="px-2 py-1 text-xs border rounded bg-white">+15m</button>
          </div>
        </div>
      </div>

      {showInterruption && (
        <InterruptionSheet
          onClose={() => setShowInterruption(false)}
          onLog={(category, lost, recovery) => {
            onLogInterruption(activeBlock.id, category, lost, recovery);
            setShowInterruption(false);
          }}
        />
      )}
    </div>
  );
}

function InterruptionSheet({ onClose, onLog }) {
  const [category, setCategory] = useState('internal');
  const [lost, setLost] = useState(5);
  const [recovery, setRecovery] = useState('resume');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b bg-yellow-50">
          <h3 className="text-lg font-bold text-yellow-800">Log Interruption</h3>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full border rounded p-2 bg-white"
            >
              <option value="internal">Internal (Distraction)</option>
              <option value="external">External (Colleague/Alert)</option>
              <option value="urgent">Urgent Fire</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Lost Minutes</label>
            <input
              type="number"
              value={lost}
              onChange={e => setLost(parseInt(e.target.value) || 0)}
              className="w-full border rounded p-2"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Recovery Choice</label>
            <select
              value={recovery}
              onChange={e => setRecovery(e.target.value)}
              className="w-full border rounded p-2 bg-white"
            >
              <option value="resume">Resume Block</option>
              <option value="reschedule">Reschedule</option>
              <option value="rollover">Rollover to Tomorrow</option>
              <option value="drop">Drop Task</option>
            </select>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
          <button
            onClick={() => onLog(category, lost, recovery)}
            className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
          >
            Log Decision
          </button>
        </div>
      </div>
    </div>
  );
}
