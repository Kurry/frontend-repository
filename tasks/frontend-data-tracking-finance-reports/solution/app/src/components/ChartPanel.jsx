import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { chartTabMode, setChartTab, filteredTransactions, displayCurrency } from '../state.js';
import Chart from 'chart.js/auto';
import { SankeyController, Flow } from 'chartjs-chart-sankey';

Chart.register(SankeyController, Flow);

export function ChartPanel() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const mode = chartTabMode.value;

  useEffect(() => {
    if (chartInstance.current) chartInstance.current.destroy();

    if (filteredTransactions.value.length === 0) return;

    const ctx = chartRef.current.getContext('2d');
    const expenses = filteredTransactions.value.filter(t => t.amount < 0);

    if (mode === 'breakdown') {
        const data = expenses.map(t => ({
            from: t.account || 'Checking',
            to: t.category,
            flow: Math.abs(t.amount)
        }));

        chartInstance.current = new Chart(ctx, {
            type: 'sankey',
            data: {
                datasets: [{
                    label: 'Cash Flow',
                    data: data.length > 0 ? data : [{ from: 'No Data', to: 'No Data', flow: 1 }],
                    colorFrom: () => '#4ade80',
                    colorTo: () => '#2dd4bf',
                    colorMode: 'gradient',
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    } else {
        const categories = {};
        expenses.forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
        });

        chartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories).length ? Object.keys(categories) : ['No Data'],
                datasets: [{
                    data: Object.values(categories).length ? Object.values(categories) : [1],
                    backgroundColor: ['#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [filteredTransactions.value, mode, displayCurrency.value]);

  return (
    <div class="p-6 h-96 flex flex-col">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-bold">Insights</h2>
        <div class="join bg-base-200">
          <button class={`join-item btn btn-sm ${mode === 'breakdown' ? 'btn-active bg-primary text-primary-content font-bold' : ''}`} onClick={() => setChartTab('breakdown')}>Breakdown</button>
          <button class={`join-item btn btn-sm ${mode === 'trends' ? 'btn-active bg-primary text-primary-content font-bold' : ''}`} onClick={() => setChartTab('trends')}>Trends</button>
        </div>
      </div>
      <div class="flex-1 relative">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}
