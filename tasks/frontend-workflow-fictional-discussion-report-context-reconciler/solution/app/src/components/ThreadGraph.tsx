import React from 'react';
import { useAppStore } from '../store/useAppStore';

export const ThreadGraph: React.FC = () => {
  const store = useAppStore();
  const messages = store.threads;
  const report = store.reports.find(r => r.id === 'RP-07');

  if (!report || !report.contextWindow) return null;
  const includedIds = new Set(report.contextWindow.includedMessageIds);

  return (
    <div className="w-full h-64 border border-gray-200 rounded-lg overflow-hidden bg-white p-4 relative overflow-y-auto">
      <svg className="w-full h-full min-h-[400px]" viewBox="0 0 800 400">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#9CA3AF" />
          </marker>
        </defs>

        {messages.map((m, i) => {
          const x = 50 + (m.sequence * 30);
          const y = 50 + ((i % 5) * 40);

          let parentX = 0, parentY = 0;
          if (m.parentId) {
            const parent = messages.find(p => p.id === m.parentId);
            if (parent) {
              const parentIndex = messages.indexOf(parent);
              parentX = 50 + (parent.sequence * 30);
              parentY = 50 + ((parentIndex % 5) * 40);
            }
          }

          const isIncluded = includedIds.has(m.id);
          const isTarget = m.id === 'MSG-17';
          const isTombstone = m.status === 'tombstone';

          return (
            <g key={m.id}>
              {m.parentId && (
                <line x1={parentX} y1={parentY} x2={x} y2={y} stroke="#E5E7EB" strokeWidth="2" />
              )}
              <circle
                cx={x} cy={y} r="12"
                fill={isTombstone ? '#9CA3AF' : isTarget ? '#EF4444' : isIncluded ? '#3B82F6' : '#FFFFFF'}
                stroke={isIncluded ? '#2563EB' : '#D1D5DB'}
                strokeWidth="2"
              />
              <text x={x} y={y + 24} fontSize="10" textAnchor="middle" fill="#6B7280">{m.sequence}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
