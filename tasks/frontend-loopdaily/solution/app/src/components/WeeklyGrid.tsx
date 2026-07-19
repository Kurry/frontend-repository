import type { Habit } from "../types";
import { lastNDays, isDayComplete, isFuture, getDayCount, shortDayLabel } from "../utils/helpers";

interface WeeklyGridProps {
  habit: Habit;
}

export default function WeeklyGrid({ habit }: WeeklyGridProps) {
  const days = lastNDays(7).reverse(); // oldest first

  return (
    <div className="flex items-center gap-1">
      {days.map((day) => {
        const future = isFuture(day);
        const done = isDayComplete(habit, day);
        const count = getDayCount(habit, day);
        const partial = !done && count > 0 && habit.targetType === "count";
        const isToday = day === lastNDays(1)[0];

        let cellClass = "w-7 h-7 rounded flex items-center justify-center text-xs font-medium transition-colors";

        if (future) {
          cellClass += " bg-[#E2E8F0] text-[#94A3B8]";
        } else if (done) {
          cellClass += " bg-[#0F9D74] text-white";
        } else if (partial) {
          cellClass += " bg-[#0F9D74]/40 text-[#0F9D74]";
        } else {
          cellClass += " bg-[#E2E8F0] text-[#94A3B8]";
        }

        if (isToday && !future) {
          cellClass += " ring-2 ring-[#0F9D74] ring-offset-1";
        }

        return (
          <div key={day} className="flex flex-col items-center gap-0.5">
            <div className={cellClass}>
              {future ? "·" : done ? "✓" : partial ? count : ""}
            </div>
            <span className="text-[10px] text-[#64748B] leading-none">
              {shortDayLabel(day).slice(0, 2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
