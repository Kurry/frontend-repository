import { useState } from 'react';
import { useStore } from '../store/useStore';
import ClipInteraction from './ClipInteraction';

export default function DeskView() {
  const plan = useStore(state => state.plan);
  const updateClipStatus = useStore(state => state.updateClipStatus);
  const cancelClip = useStore(state => state.cancelClip);
  const setSelection = useStore(state => state.setSelection);

  const [dragState, setDragState] = useState<{
    clipId: string | null;
    activeJaw: 'source' | 'target' | null;
    sourceTaskId: string | null;
    mouseX: number;
    mouseY: number;
  }>({
    clipId: null,
    activeJaw: null,
    sourceTaskId: null,
    mouseX: 0,
    mouseY: 0
  });

  const [previewTargetId, setPreviewTargetId] = useState<string | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.clipId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragState(prev => ({ ...prev, mouseX: x, mouseY: y }));

    let foundTarget = null;
    if (dragState.activeJaw === 'target') {
      for (const task of plan.tasks) {
        const inputX = task.x;
        const inputY = task.y + 52;
        const dist = Math.sqrt(Math.pow(inputX - x, 2) + Math.pow(inputY - y, 2));
        if (dist <= 16) {
          foundTarget = task.id;
          break;
        }
      }
    } else if (dragState.activeJaw === 'source') {
      for (const task of plan.tasks) {
        const outputX = task.x + 180;
        const outputY = task.y + 52;
        const dist = Math.sqrt(Math.pow(outputX - x, 2) + Math.pow(outputY - y, 2));
        if (dist <= 16) {
          foundTarget = task.id;
          break;
        }
      }
    }
    setPreviewTargetId(foundTarget);
  };

  const handleMouseUp = () => {
    if (dragState.clipId && dragState.activeJaw === 'target' && dragState.sourceTaskId && previewTargetId) {
      updateClipStatus(dragState.clipId, dragState.sourceTaskId, previewTargetId);
    } else if (dragState.clipId && dragState.activeJaw === 'source' && previewTargetId) {
      setDragState(prev => ({ ...prev, activeJaw: 'target', sourceTaskId: previewTargetId }));
      return;
    } else if (dragState.clipId) {
      cancelClip(dragState.clipId);
    }

    if (dragState.activeJaw === 'target' || !previewTargetId) {
      setDragState({ clipId: null, activeJaw: null, sourceTaskId: null, mouseX: 0, mouseY: 0 });
      setPreviewTargetId(null);
    }
  };

  const startClipDrag = (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.closest('.desk-canvas')?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragState({
      clipId,
      activeJaw: 'source',
      sourceTaskId: null,
      mouseX: x,
      mouseY: y
    });
    setSelection('clip', [clipId], clipId);
  };

  return (
    <div
      className="desk-canvas w-[1200px] h-[720px] bg-white relative shadow-sm border border-slate-300 m-8"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg className="absolute inset-0 pointer-events-none" width="1200" height="720">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#e2e8f0" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {plan.clips.filter(c => c.status === 'committed').map(c => {
          if (!c.routePoints || c.routePoints.length === 0) return null;
          const points = c.routePoints.map(p => `${p.x},${p.y}`).join(' ');
          const isSelected = plan.selection.ids.includes(c.id);
          return (
            <polyline
              key={c.id}
              points={points}
              fill="none"
              stroke={isSelected ? "#3b82f6" : "#94a3b8"}
              strokeWidth={isSelected ? 4 : 2}
              strokeLinejoin="round"
            />
          );
        })}

        {dragState.clipId && dragState.activeJaw === 'target' && dragState.sourceTaskId && (
          <line
            x1={plan.tasks.find(t => t.id === dragState.sourceTaskId)!.x + 180}
            y1={plan.tasks.find(t => t.id === dragState.sourceTaskId)!.y + 52}
            x2={dragState.mouseX}
            y2={dragState.mouseY}
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        )}
      </svg>

      {plan.tasks.map(task => {
        const isCritical = plan.schedule.criticalTaskIds.includes(task.id);
        const interval = plan.schedule.intervals.find(i => i.taskId === task.id);
        const hasIssue = plan.issues.some(i => i.taskId === task.id && !i.resolved);
        const isSelected = plan.selection.ids.includes(task.id);

        return (
          <div
            key={task.id}
            tabIndex={0}
            onClick={() => setSelection('task', [task.id], task.id)}
            className={`absolute w-[180px] h-[104px] bg-amber-50 border shadow-sm flex flex-col p-2 cursor-pointer transition-colors
              ${isCritical ? 'border-red-400 border-2' : 'border-slate-300'}
              ${hasIssue ? 'bg-red-50' : ''}
              ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
            `}
            style={{ left: task.x, top: task.y }}
          >
            <div className="font-semibold text-sm truncate">{task.label}</div>
            <div className="text-xs text-slate-500">{task.id} • {task.durationMinutes}m</div>
            <div className="mt-auto flex justify-between text-[10px] text-slate-400">
              {interval && (
                <>
                  <span>{new Date(interval.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span>{new Date(interval.finish).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </>
              )}
            </div>

            <div className={`absolute -left-3 top-[46px] w-6 h-6 rounded-full border border-slate-300 bg-white ${previewTargetId === task.id && dragState.activeJaw === 'target' ? 'ring-4 ring-blue-300' : ''}`}></div>
            <div className={`absolute -right-3 top-[46px] w-6 h-6 rounded-full border border-slate-300 bg-white ${previewTargetId === task.id && dragState.activeJaw === 'source' ? 'ring-4 ring-blue-300' : ''}`}></div>
          </div>
        );
      })}

      <div className="absolute right-4 bottom-4 w-48 h-32 bg-slate-200 border border-slate-300 rounded p-2 overflow-hidden shadow-inner flex flex-wrap gap-2 content-start">
        <div className="text-xs text-slate-500 font-medium w-full uppercase mb-1 tracking-wider">Tray</div>
        {plan.clips.filter(c => c.status === 'loose').map(clip => (
          <div
            key={clip.id}
            onMouseDown={(e) => startClipDrag(clip.id, e)}
            className="w-8 h-8 rounded bg-slate-400 cursor-grab hover:bg-slate-500 active:cursor-grabbing border border-slate-600 shadow-sm flex items-center justify-center text-[10px] text-white font-mono"
            style={{
              position: clip.trayCoordinate ? 'absolute' : 'relative',
              left: clip.trayCoordinate?.x ? clip.trayCoordinate.x - 1000 : 'auto',
              top: clip.trayCoordinate?.y ? clip.trayCoordinate.y - 600 : 'auto'
            }}
          >
            📎
          </div>
        ))}
      </div>

      <ClipInteraction
        active={dragState.clipId !== null}
        activeJaw={dragState.activeJaw}
        previewTargetId={previewTargetId}
      />
    </div>
  );
}
