import { useAtom } from "jotai";
import { habitsAtom } from "../store";
import { calcStreak, calcBestStreak, getMonthCompletions } from "../utils/helpers";

interface StatsViewProps {
  onBack: () => void;
}

export default function StatsView({ onBack }: StatsViewProps) {
  const [habits] = useAtom(habitsAtom);
  const activeHabits = habits.filter((h) => !h.paused);
  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-US", { month: "long" });

  // Calculate stats
  const currentStreaks = activeHabits.map((h) => calcStreak(h));
  const activeStreakCount = currentStreaks.filter((s) => s > 0).length;

  const longestEver = activeHabits.reduce((best, h) => {
    return Math.max(best, calcBestStreak(h));
  }, 0);

  const totalMonthCompletions = habits.reduce((total, h) => {
    return total + getMonthCompletions(h);
  }, 0);

  // Per-habit breakdown
  const habitStats = activeHabits
    .map((h) => ({
      habit: h,
      streak: calcStreak(h),
      best: calcBestStreak(h),
      monthCount: getMonthCompletions(h),
    }))
    .sort((a, b) => b.streak - a.streak);

  if (habits.length === 0) {
    return (
      <div className="bg-[#FFFFFF] rounded-[8px] p-6 md:p-8 text-center" data-view="stats">
        <div className="flex items-center gap-3 mb-4 justify-center">
          <button
            onClick={onBack}
            className="p-1 text-[#64748B] hover:text-[#1B2430] transition-colors"
            aria-label="Go back"
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 4l-6 6 6 6" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-[#1B2430]">Stats</h2>
        </div>
        <div className="py-8">
          <span className="text-4xl mb-3 block">📊</span>
          <p className="text-[#475569] text-sm" data-empty-stats>No habits yet. Create your first habit to start tracking stats!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] rounded-[8px] p-4 md:p-6" data-view="stats">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="btn-icon text-[#475569] hover:text-[#1B2430] transition-colors"
          aria-label="Go back"
        >
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 4l-6 6 6 6" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-[#1B2430]">Stats Dashboard</h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#F4F7F6] rounded-[8px] p-4 text-center">
          <div className="text-3xl font-bold text-[#0F9D74]">{activeStreakCount}</div>
          <div className="text-xs text-[#64748B] mt-1">Active Streaks</div>
        </div>
        <div className="bg-[#F4F7F6] rounded-[8px] p-4 text-center">
          <div className="text-3xl font-bold text-[#FFB020]">{longestEver}</div>
          <div className="text-xs text-[#64748B] mt-1">Longest Streak Ever</div>
        </div>
        <div className="bg-[#F4F7F6] rounded-[8px] p-4 text-center">
          <div className="text-3xl font-bold text-[#0F9D74]">{totalMonthCompletions}</div>
          <div className="text-xs text-[#64748B] mt-1">{monthLabel} Completions</div>
        </div>
      </div>

      {/* Per-habit breakdown */}
      {habitStats.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-[#1B2430] mb-3">Per-Habit Breakdown</h3>
          <div className="space-y-2">
            {habitStats.map(({ habit, streak, best, monthCount }) => (
              <div key={habit.id} className="flex items-center justify-between py-2 px-3 bg-[#F4F7F6] rounded-[8px]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{habit.icon}</span>
                  <span className="text-sm font-medium text-[#1B2430] truncate max-w-[150px]">{habit.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#64748B]">
                  <span>🔥 {streak}d streak</span>
                  <span>📅 {monthCount} this month</span>
                  <span>⭐ Best: {best}d</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
