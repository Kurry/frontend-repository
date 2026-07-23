import { useStore } from '../store/useStore';

export default function ScheduleRibbon() {
  const plan = useStore(state => state.plan);
  const setSelection = useStore(state => state.setSelection);
  const setTimelineBrush = useStore(state => state.setTimelineBrush);

  const start = new Date(plan.planStart).getTime();
  const finish = plan.schedule.finish ? new Date(plan.schedule.finish).getTime() : start + 3600000;
  const totalMinutes = Math.max(60, Math.round((finish - start) / 60000) + plan.schedule.reviewBufferMinutes);

  return (
    <div className="flex flex-col h-full text-sm relative">
      <h2 className="font-semibold mb-4 text-slate-800 sticky top-0 bg-white z-10 flex justify-between">
        <span>Earliest-Start Ribbon</span>
        <span className="font-normal text-xs text-slate-500">Brush to filter (5..360m)</span>
      </h2>

      <div
        className="flex-1 relative border-l border-slate-300 ml-4 cursor-crosshair"
        onMouseDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const percent = (e.clientY - rect.top) / rect.height;
          const minute = Math.round(percent * totalMinutes);
          setTimelineBrush(minute, Math.min(minute + 30, totalMinutes));
        }}
      >
        {plan.schedule.intervals.map(interval => {
          const s = new Date(interval.start).getTime();
          const f = new Date(interval.finish).getTime();
          const topPercent = Math.max(0, (s - start) / 60000) / totalMinutes * 100;
          const heightPercent = (f - s) / 60000 / totalMinutes * 100;
          const isSelected = plan.selection.ids.includes(interval.taskId);
          const isCritical = interval.critical;

          return (
            <div
              key={interval.taskId}
              onClick={() => setSelection('task', [interval.taskId], interval.taskId)}
              className={`absolute right-4 left-4 p-1 text-[10px] rounded border shadow-sm transition-colors cursor-pointer truncate
                ${isCritical ? 'bg-red-50 border-red-200 text-red-900' : 'bg-blue-50 border-blue-200 text-blue-900'}
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
              `}
              style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}
            >
              <div className="font-medium">{interval.taskId}</div>
              <div className="flex justify-between mt-1">
                <span>{new Date(interval.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                <span className="font-mono text-slate-500">Slack: {interval.slackMinutes}m</span>
              </div>
            </div>
          );
        })}

        {plan.timelineBrush && (
          <div
            className="absolute left-0 right-0 bg-blue-500/10 border-y border-blue-500 pointer-events-none"
            style={{
              top: `${(plan.timelineBrush.startMinute / totalMinutes) * 100}%`,
              height: `${((plan.timelineBrush.endMinute - plan.timelineBrush.startMinute) / totalMinutes) * 100}%`
            }}
          />
        )}
      </div>
    </div>
  );
}
