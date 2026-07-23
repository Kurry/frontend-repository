import { useState } from "react";
import { useAtom } from "jotai";
import { habitsAtom } from "../store";
import {
  getMonthDays,
  parseDateKey,
  getDayCount,
  isDayComplete,
  isFuture,
  todayKey,
  formatFullDate,
  calcStreakAt,
} from "../utils/helpers";

interface HeatmapViewProps {
  habitId: string;
  onBack: () => void;
}

export default function HeatmapView({ habitId, onBack }: HeatmapViewProps) {
  const [habits] = useAtom(habitsAtom);
  const habit = habits.find((h) => h.id === habitId);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  if (!habit) return null;

  const monthDays = getMonthDays();
  const today = todayKey();
  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const firstDow = parseDateKey(monthDays[0]).getDay();
  const padding: string[] = Array.from({ length: firstDow }, (_, i) => `pad-${i}`);

  const getCellIntensity = (day: string): string => {
    if (isFuture(day)) return "future";
    const count = getDayCount(habit, day);
    const done = isDayComplete(habit, day);

    if (done) return "full";
    if (count > 0 && habit.targetType === "count") {
      const ratio = count / habit.targetCount;
      if (ratio >= 0.5) return "high";
      return "low";
    }
    return "none";
  };

  const intensityClass = (level: string): string => {
    switch (level) {
      case "full":
        return "bg-[#0F9D74]";
      case "high":
        return "bg-[#0F9D74]/60";
      case "low":
        return "bg-[#0F9D74]/30";
      case "future":
        // Not-yet-elapsed: solid muted shade, visibly different from the
        // bordered not-done cells below.
        return "bg-[#E2E8F0]";
      default:
        // Not done: near-white with a border so it still reads as a cell.
        return "bg-[#F4F7F6] border border-[#E2E8F0]";
    }
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const buildTooltip = (day: string, intensity: string) => {
    const label = formatFullDate(day);
    if (intensity === "future") return `${label} — not yet elapsed`;
    const count = getDayCount(habit, day);
    const done = isDayComplete(habit, day);
    const streakAt = calcStreakAt(habit, day);
    if (done) {
      return `${label} — complete · streak ${streakAt}d`;
    }
    if (habit.targetType === "count" && count > 0) {
      return `${label} — partial ${count}/${habit.targetCount} · streak ${streakAt}d`;
    }
    return `${label} — not done · streak ${streakAt}d`;
  };

  return (
    <div className="bg-[#FFFFFF] rounded-[8px] p-4 md:p-6" data-view="heatmap" data-habit-id={habit.id}>
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="btn-icon text-[#475569] hover:text-[#1B2430] transition-colors"
          aria-label="Go back"
          data-action="back"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M13 4l-6 6 6 6" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-[#1B2430]">
          <span aria-hidden="true">{habit.icon}</span> {habit.name} — {monthLabel}
        </h2>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-[#64748B] py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 relative">
        {padding.map((p) => (
          <div key={p} className="aspect-square" />
        ))}
        {monthDays.map((day) => {
          const intensity = getCellIntensity(day);
          const isToday = day === today;
          const dateNum = parseDateKey(day).getDate();
          const tip = buildTooltip(day, intensity);

          return (
            <div
              key={day}
              role="img"
              aria-label={tip}
              title={tip}
              className={`aspect-square rounded-[8px] flex items-center justify-center text-xs font-medium transition-colors cursor-default ${intensityClass(
                intensity
              )} ${
                ["full", "high"].includes(intensity)
                  ? "text-white"
                  : intensity === "future"
                  ? "text-[#94A3B8]"
                  : "text-[#1B2430]"
              } ${isToday ? "ring-2 ring-[#0F9D74] ring-offset-1" : ""}`}
              data-day={day}
              data-intensity={intensity}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({
                  x: rect.left + rect.width / 2,
                  y: rect.top - 6,
                  text: tip,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
              onFocus={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({
                  x: rect.left + rect.width / 2,
                  y: rect.top - 6,
                  text: tip,
                });
              }}
              onBlur={() => setTooltip(null)}
              tabIndex={0}
            >
              {dateNum}
            </div>
          );
        })}
      </div>

      {tooltip && (
        <div
          className="hm-tooltip"
          style={{ left: tooltip.x, top: tooltip.y, opacity: 1 }}
          role="tooltip"
        >
          {tooltip.text}
        </div>
      )}

      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <span className="text-xs text-[#64748B]">Legend:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-[8px] bg-[#0F9D74]" />
          <span className="text-xs text-[#64748B]">Complete</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-[8px] bg-[#0F9D74]/60" />
          <span className="text-xs text-[#64748B]">Partial (≥50%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-[8px] bg-[#0F9D74]/30" />
          <span className="text-xs text-[#64748B]">Partial (&lt;50%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-[8px] bg-[#F4F7F6] border border-[#E2E8F0]" />
          <span className="text-xs text-[#64748B]">Not done</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-[8px] bg-[#E2E8F0]" />
          <span className="text-xs text-[#64748B]">Not yet elapsed</span>
        </div>
      </div>
    </div>
  );
}
