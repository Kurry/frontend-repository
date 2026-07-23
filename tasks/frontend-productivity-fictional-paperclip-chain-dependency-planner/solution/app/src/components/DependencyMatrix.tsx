import { useStore } from '../store/useStore';

export default function DependencyMatrix() {
  const plan = useStore(state => state.plan);
  const setSelection = useStore(state => state.setSelection);

  return (
    <div className="flex flex-col h-full text-sm relative">
      <h2 className="font-semibold mb-4 text-slate-800 sticky top-0 bg-white z-10">Dependency Matrix</h2>

      <div className="overflow-auto border border-slate-200 rounded text-xs bg-slate-50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-2 border-b border-r bg-white sticky top-0 left-0 z-20">Task</th>
              {plan.tasks.map(t => (
                <th key={t.id} className="p-2 border-b border-slate-200 font-mono font-normal bg-white sticky top-0 whitespace-nowrap z-10" title={t.label}>
                  {t.id.split('-')[1]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plan.tasks.map(rowTask => (
              <tr key={rowTask.id}>
                <th className="p-2 border-b border-r border-slate-200 bg-white sticky left-0 font-medium whitespace-nowrap z-10">
                  {rowTask.id}
                </th>
                {plan.tasks.map(colTask => {
                  const clip = plan.clips.find(c => c.status === 'committed' && c.sourceTaskId === rowTask.id && c.targetTaskId === colTask.id);
                  const isSelected = clip && plan.selection.ids.includes(clip.id);

                  return (
                    <td
                      key={colTask.id}
                      onClick={() => clip && setSelection('clip', [clip.id], clip.id)}
                      className={`p-2 border-b border-slate-200 text-center
                        ${clip ? 'bg-blue-50 cursor-pointer hover:bg-blue-100' : 'bg-transparent'}
                        ${isSelected ? 'ring-inset ring-2 ring-blue-500' : ''}
                      `}
                    >
                      {clip ? '→' : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
