import type { DerivedSummary } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SummaryPanelProps {
  summary: DerivedSummary;
  className?: string;
}

export function SummaryPanel({ summary, className }: SummaryPanelProps) {
  const delta = summary.averageProjection - summary.averageValue;
  const isPositive = delta > 0;

  return (
    <div className={twMerge(clsx("bg-gray-900 text-white rounded-md p-6 flex flex-col gap-6", className))}>
      <h3 className="font-semibold text-gray-300 uppercase tracking-wider text-sm">Derived Consequence</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-gray-400 text-sm">Total Records</span>
          <span className="text-2xl font-bold">{summary.totalReadings}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-gray-400 text-sm">Base Avg</span>
          <span className="text-2xl font-bold">{summary.averageValue.toFixed(1)}</span>
        </div>

        <div className="flex flex-col gap-1 col-span-2 mt-2 pt-4 border-t border-gray-700">
          <span className="text-gray-400 text-sm">Projected Avg</span>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold tabular-nums text-blue-400">
              {summary.averageProjection.toFixed(1)}
            </span>
            {delta !== 0 && (
              <span className={clsx(
                "text-sm font-medium",
                isPositive ? "text-red-400" : "text-green-400"
              )}>
                {isPositive ? '+' : ''}{delta.toFixed(1)} from base
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
