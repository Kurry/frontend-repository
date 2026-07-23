import { useStore } from '../store/useStore';

export default function CompactMobileView() {
  const plan = useStore(state => state.plan);

  return (
    <div className="md:hidden flex flex-col h-full bg-slate-50 overflow-auto w-[390px] mx-auto border-x border-slate-200">
      <div className="p-4 font-semibold border-b border-slate-200 bg-white">Mobile Dependency Spine</div>

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4 relative">
        {plan.tasks.map(task => {
          const isSelected = plan.selection.ids.includes(task.id);
          const isCritical = plan.schedule.criticalTaskIds.includes(task.id);

          return (
            <div
              key={task.id}
              className={`min-h-[100px] w-full bg-white rounded-lg border shadow-sm p-4 relative
                ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}
                ${isCritical ? 'border-l-4 border-l-red-500' : ''}
              `}
            >
              <div className="font-semibold text-lg">{task.label}</div>
              <div className="text-sm text-slate-500">{task.id} • {task.durationMinutes}m</div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 py-3 px-2 bg-slate-100 rounded text-sm text-center active:bg-slate-200 min-h-[44px]">
                  Choose Predecessor
                </button>
                <button className="flex-1 py-3 px-2 bg-blue-50 text-blue-700 rounded text-sm text-center active:bg-blue-100 min-h-[44px]">
                  Attach Clip
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-16 bg-white border-t border-slate-200 flex items-center justify-around shrink-0">
        <button className="text-sm font-medium px-4 py-2 min-h-[44px]">Clips</button>
        <button className="text-sm font-medium px-4 py-2 min-h-[44px]">Schedule</button>
        <button className="text-sm font-medium px-4 py-2 min-h-[44px]">Issues</button>
        <button className="text-sm font-medium px-4 py-2 min-h-[44px]">Proof</button>
      </div>
    </div>
  );
}
