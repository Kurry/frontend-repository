import { useAtom } from "jotai";
import { habitsAtom } from "../store";
import type { Habit } from "../types";
import { getMonthDays, parseDateKey, getDayCount, isDayComplete, isFuture, todayKey } from "../utils/helpers";

interface HeatmapViewProps {
  habitId: string;
  onBack: () => void;
}

export default function HeatmapView({ habitId, onBack }: HeatmapViewProps) {
  const [habits] = useAtom(habitsAtom);
  const habit = habits.find((h) => h.id === habitId);

  if (!habit) return null;

  const monthDays = getMonthDays();
  const today = todayKey();
  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Get day of week of the 1st to determine padding
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
        return "bg-[#E2E8F0]";
      default:
        return "bg-[#F4F7F6]";
    }
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-[#FFFFFF] rounded-lg p-4 md:p-6" data-view="heatmap" data-habit-id={habit.id}>
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="btn-icon text-[#475569] hover:text-[#1B2430] transition-colors"
          aria-label="Go back"
          data-action="back"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 4l-6 6 6 6" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-[#1B2430]">
          {habit.icon} {habit.name} — {monthLabel}
        </h2>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-[#64748B] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {padding.map((p) => (
          <div key={p} className="aspect-square" />
        ))}
        {monthDays.map((day) => {
          const intensity = getCellIntensity(day);
          const isToday = day === today;
          const dateNum = parseDateKey(day).getDate();

          return (
            <div
              key={day}
              className={`aspect-square rounded flex items-center justify-center text-xs font-medium transition-colors ${intensityClass(
                intensity
              )} ${
                ["full", "high"].includes(intensity) ? "text-white" : "text-[#1B2430]"
              } ${isToday ? "ring-2 ring-[#0F9D74] ring-offset-1" : ""}`}
              title={`${day}: ${
                intensity === "full"
                  ? "Complete"
                  : intensity === "high" || intensity === "low"
                  ? `Partial (${getDayCount(habit, day)}/${habit.targetCount})`
                  : intensity === "future"
                  ? "Future"
                  : "Not done"
              }`}
            >
              {dateNum}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <span className="text-xs text-[#64748B]">Legend:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-[#0F9D74]" />
          <span className="text-xs text-[#64748B]">Complete</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-[#0F9D74]/60" />
          <span className="text-xs text-[#64748B]">Partial (≥50%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-[#0F9D74]/30" />
          <span className="text-xs text-[#64748B]">Partial (&lt;50%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-[#F4F7F6] border border-[#E2E8F0]" />
          <span className="text-xs text-[#64748B]">Not done</span>
        </div>
      </div>
    </div>
  );
}
