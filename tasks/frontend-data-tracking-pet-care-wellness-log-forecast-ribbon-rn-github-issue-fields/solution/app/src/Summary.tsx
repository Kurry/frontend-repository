import { useAppStore } from './store';
import { CalendarCheck, ListTodo, Archive, Layers } from 'lucide-react';
import { useMemo } from 'react';

export function Summary() {
  const records = useAppStore(state => state.records);
  const getDerivedState = useAppStore(state => state.getDerivedState);

  const stats = useMemo(() => getDerivedState().summary, [records, getDerivedState]);

  const items = [
    { label: 'Total Events', value: stats.totalEvents, icon: <Layers className="w-4 h-4 text-gray-500" /> },
    { label: 'Upcoming', value: stats.upcomingEvents, icon: <ListTodo className="w-4 h-4 text-blue-500" /> },
    { label: 'Completed', value: stats.completedEvents, icon: <CalendarCheck className="w-4 h-4 text-green-500" /> },
    { label: 'Archived', value: stats.archivedEvents, icon: <Archive className="w-4 h-4 text-purple-500" /> },
  ];

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Derived Summary</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map(item => (
          <div key={item.label} className="p-3 bg-gray-50 rounded border flex items-center gap-3">
            <div className="p-2 bg-white rounded shadow-sm border border-gray-100">
              {item.icon}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{item.label}</p>
              <p className="text-xl font-semibold text-gray-900 leading-tight">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
