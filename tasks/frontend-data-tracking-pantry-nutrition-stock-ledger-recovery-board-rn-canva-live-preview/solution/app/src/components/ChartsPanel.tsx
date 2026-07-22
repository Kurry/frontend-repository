import { PieChart, Pie, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { DerivedStats } from '../types';

interface ChartsPanelProps {
  stats: DerivedStats;
}

const COLORS = {
  ready: '#22c55e',
  draft: '#94a3b8',
  changed: '#3b82f6',
  archived: '#64748b',
  conflict: '#ef4444',
};

export function ChartsPanel({ stats }: ChartsPanelProps) {
  const pieData = Object.entries(stats.statusCounts).map(([key, value]) => ({
    name: key,
    value,
    fill: COLORS[key as keyof typeof COLORS] || '#000'
  }));

  const macroData = [
    { name: 'Protein', value: stats.totalProtein, fill: '#3b82f6' },
    { name: 'Carbs', value: stats.totalCarbs, fill: '#22c55e' },
    { name: 'Fat', value: stats.totalFat, fill: '#ef4444' },
  ];

  return (
    <div className="bg-white p-4 border rounded shadow-sm">
      <h2 className="text-lg font-bold mb-4">Derived Summaries</h2>
      <div className="grid grid-cols-2 gap-4 h-48">
        <div>
          <h3 className="text-sm text-gray-500 mb-2">Status Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm text-gray-500 mb-2">Macros (g)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={macroData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t text-sm text-gray-600">
        <p className="flex justify-between items-center bg-gray-50 p-2 rounded">
          <span className="font-semibold">Timing Note:</span>
          <span>Ensure macros are balanced before finalizing prep.</span>
        </p>
      </div>
    </div>
  );
}
