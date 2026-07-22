import React, { useRef, useState } from 'react';
import type { EnergyReading } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ForecastRibbonProps {
  selectedRecord: EnergyReading | null;
  onMutateForecast: (id: string, projection: number) => void;
  className?: string;
}

export function ForecastRibbon({ selectedRecord, onMutateForecast, className }: ForecastRibbonProps) {
  const [localValue, setLocalValue] = useState<number | null>(null);
  const isDragging = useRef(false);

  const displayValue = localValue !== null ? localValue : (selectedRecord?.forecastProjection ?? selectedRecord?.value ?? 0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!selectedRecord) return;
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateValueFromEvent(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !selectedRecord) return;
    updateValueFromEvent(e);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !selectedRecord) return;
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    if (localValue !== null) {
      onMutateForecast(selectedRecord.id, localValue);
      setLocalValue(null);
    }
  };

  const updateValueFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    // Forecast range: -50 to +300 arbitrarily for the demo
    const min = -50;
    const max = 300;
    const value = Math.round(min + (percentage * (max - min)));
    setLocalValue(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!selectedRecord) return;
    const step = 5;
    let newValue = displayValue;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      newValue += step;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      newValue -= step;
    }

    if (newValue !== displayValue) {
      newValue = Math.max(-50, Math.min(300, newValue));
      onMutateForecast(selectedRecord.id, newValue);
    }
  };

  if (!selectedRecord) {
    return (
      <div className={twMerge(clsx("border border-gray-200 rounded-md p-6 bg-gray-50 flex items-center justify-center text-gray-400 select-none", className))}>
        Select a record to adjust its forecast
      </div>
    );
  }

  const min = -50;
  const max = 300;
  const percentage = Math.max(0, Math.min(100, ((displayValue - min) / (max - min)) * 100));

  return (
    <div className={twMerge(clsx("border border-gray-200 rounded-md p-6 bg-white shadow-sm flex flex-col gap-4", className))}>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Forecast Ribbon</h3>
        <span className="text-sm text-gray-500">Record #{selectedRecord.id}</span>
      </div>

      <div className="flex justify-between items-end mb-2">
        <div className="text-3xl font-bold text-blue-600 tabular-nums">
          {displayValue} <span className="text-base font-normal text-gray-500">kWh</span>
        </div>
        <div className="text-sm text-gray-500">
          Base: {selectedRecord.value} kWh
        </div>
      </div>

      <div
        className="relative h-12 bg-gray-100 rounded-full cursor-pointer touch-none select-none overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={displayValue}
        aria-label="Adjust forecast projection"
      >
        <div
          className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-75 ease-out"
          style={{ width: `${percentage}%` }}
        />

        {/* Base value marker */}
        <div
          className="absolute inset-y-0 w-0.5 bg-gray-800 z-10 opacity-30"
          style={{ left: `${((selectedRecord.value - min) / (max - min)) * 100}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
