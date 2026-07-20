import { useAtom } from "jotai";
import { habitsAtom } from "../store";
import { calcStreak, calcBestStreak, getMonthCompletions, dateKey } from "../utils/helpers";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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

  // Chart data: last 14 days
  const chartData = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = dateKey(d);
    const totalCompletions = habits.reduce((acc, habit) => {
       const comp = habit.completions[dateStr] || 0;
       return acc + (habit.targetType === "once" ? (comp > 0 ? 1 : 0) : comp);
    }, 0);
    chartData.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      completions: totalCompletions
    });
  }

  if (habits.length === 0) {
    return (
      <div className="bg-[#FFFFFF] rounded-lg p-6 md:p-8 text-center">
        <div className="flex items-center gap-3 mb-4 justify-center">
          <button
            onClick={onBack}
            className="p-1 text-[#64748B] hover:text-[#1B2430] transition-colors"
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M13 4l-6 6 6 6" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-[#1B2430]">Stats</h2>
        </div>
        <div className="py-8">
          <span className="text-4xl mb-3 block" aria-hidden="true">📊</span>
          <p className="text-[#475569] text-sm">No habits yet. Create your first habit to start tracking stats!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] rounded-lg p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="btn-icon text-[#475569] hover:text-[#1B2430] transition-colors"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M13 4l-6 6 6 6" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-[#1B2430]">Stats Dashboard</h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#F4F7F6] rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-[#0F9D74]">{activeStreakCount}</div>
          <div className="text-xs text-[#64748B] mt-1">Active Streaks</div>
        </div>
        <div className="bg-[#F4F7F6] rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-[#FFB020]">{longestEver}</div>
          <div className="text-xs text-[#64748B] mt-1">Longest Streak Ever</div>
        </div>
        <div className="bg-[#F4F7F6] rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-[#0F9D74]">{totalMonthCompletions}</div>
          <div className="text-xs text-[#64748B] mt-1">{monthLabel} Completions</div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="mb-6">
        <h3 className="text-base font-bold text-[#1B2430] mb-3">Completions Trend (Last 14 Days)</h3>
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F9D74" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0F9D74" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{fontSize: 12, fill: "#64748B"}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: "#64748B"}} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  itemStyle={{ color: "#0F9D74", fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="completions" stroke="#0F9D74" strokeWidth={2} fillOpacity={1} fill="url(#colorCompletions)" />
              </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Per-habit breakdown */}
      {habitStats.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-[#1B2430] mb-3">Per-Habit Breakdown</h3>
          <div className="space-y-2">
            {habitStats.map(({ habit, streak, best, monthCount }) => (
              <div key={habit.id} className="flex items-center justify-between py-2 px-3 bg-[#F4F7F6] rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">{habit.icon}</span>
                  <span className="text-sm font-medium text-[#1B2430] truncate max-w-[150px]">{habit.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#64748B]">
                  <span><span aria-hidden="true">🔥</span> {streak}d streak</span>
                  <span><span aria-hidden="true">📅</span> {monthCount} this month</span>
                  <span><span aria-hidden="true">⭐</span> Best: {best}d</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
