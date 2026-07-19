import type { Habit } from "../types";
import { calcStreak } from "../utils/helpers";

interface FlameIconProps {
  habit: Habit;
}

export default function FlameIcon({ habit }: FlameIconProps) {
  const streak = calcStreak(habit);

  // Milestone levels
  let flameClass = "";
  let flameLabel = "";

  if (streak >= 30) {
    flameClass = "text-[#FFB020] drop-shadow-[0_0_6px_rgba(255,176,32,0.6)]";
    flameLabel = `${streak}🔥`;
  } else if (streak >= 7) {
    flameClass = "text-[#FF6B20] drop-shadow-[0_0_4px_rgba(255,107,32,0.4)]";
    flameLabel = `${streak}🔥`;
  } else {
    flameClass = "text-[#FF8C42]";
    flameLabel = streak > 0 ? `${streak}🔥` : "🔥";
  }

  return (
    <div className="flex items-center gap-1" title={`${streak} day streak`}>
      <span className={`text-lg leading-none ${flameClass}`}>
        {streak >= 30 ? "🏆" : "🔥"}
      </span>
      <span className={`text-xs font-semibold ${streak === 0 ? "text-[#64748B]" : "text-[#1B2430]"}`}>
        {streak}
      </span>
    </div>
  );
}
