import type { Habit } from "../types";
import { lastNDays, isDayComplete, isFuture, getDayCount, shortDayLabel } from "../utils/helpers";

interface WeeklyGridProps {
  habit: Habit;
}

export default function WeeklyGrid({ habit }: WeeklyGridProps) {
  const days = lastNDays(7).reverse(); // oldest first
  const trackedFrom = habit.createdAt.slice(0, 10); // YYYY-MM-DD

  return (
    <div className="flex items-center gap-1" data-weekly-grid>
      {days.map((day) => {
        // A day is "not yet elapsed" when it is in the future or before the
        // habit started being tracked; elapsed-but-empty days are "missed".
        const notElapsed = isFuture(day) || day < trackedFrom;
        const done = isDayComplete(habit, day);
        const count = getDayCount(habit, day);
        const partial = !done && count > 0 && habit.targetType === "count";
        const isToday = day === lastNDays(1)[0];
        const missed = !notElapsed && !done && !partial;

        let cellClass =
          "w-7 h-7 rounded flex items-center justify-center text-xs font-medium transition-colors";
        let cellState = "not-elapsed";

        if (done) {
          cellClass += " bg-[#0F9D74] text-white";
          cellState = "done";
        } else if (partial) {
          cellClass += " bg-[#0F9D74]/40 text-[#0F9D74]";
          cellState = "partial";
        } else if (missed) {
          // Missed: hollow cell with a border and a dash — clearly different
          // from the solid not-yet-elapsed shade.
          cellClass += " bg-[#FFFFFF] border border-[#E2E8F0] text-[#CBD5E1]";
          cellState = "missed";
        } else {
          cellClass += " bg-[#E2E8F0] text-[#94A3B8]";
        }

        if (isToday) {
          cellClass += " ring-2 ring-[#0F9D74] ring-offset-1";
        }

        return (
          <div key={day} className="flex flex-col items-center gap-0.5">
            <div
              className={cellClass}
              data-day={day}
              data-day-state={cellState}
              title={`${shortDayLabel(day)} — ${
                cellState === "done"
                  ? "done"
                  : cellState === "partial"
                  ? `partial ${count}/${habit.targetCount}`
                  : cellState === "missed"
                  ? "missed"
                  : "not yet elapsed"
              }`}
            >
              {done ? "✓" : partial ? count : missed ? "–" : "·"}
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
