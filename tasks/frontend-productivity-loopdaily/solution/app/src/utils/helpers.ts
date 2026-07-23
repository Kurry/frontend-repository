import type { Habit } from "../types";

/** Format a Date to YYYY-MM-DD string */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Get today as YYYY-MM-DD */
export function todayKey(): string {
  return dateKey(new Date());
}

/** Parse YYYY-MM-DD to a Date at local midnight */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Get dates for the last N days including today, newest first */
export function lastNDays(n: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    result.push(dateKey(d));
  }
  return result;
}

/** Check if a date key is in the future */
export function isFuture(key: string): boolean {
  const d = parseDateKey(key);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d > today;
}

/** Get number of completions for a given day */
export function getDayCount(habit: Habit, day: string): number {
  return habit.completions[day] || 0;
}

/** Check if a habit is complete for a given day */
export function isDayComplete(habit: Habit, day: string): boolean {
  const count = getDayCount(habit, day);
  if (habit.targetType === "once") return count >= 1;
  return count >= habit.targetCount;
}

/** Calculate current streak for a habit (consecutive days from yesterday/today backwards) */
export function calcStreak(habit: Habit): number {
  if (habit.paused) return 0;

  let streak = 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Start from today and go backwards
  // If today is complete, count it; if not, try yesterday as last active day
  let d = new Date(now);

  // Check if today is complete
  if (!isDayComplete(habit, dateKey(d))) {
    // Move to yesterday to see if streak continues from there
    d.setDate(d.getDate() - 1);
  }

  while (true) {
    const key = dateKey(d);
    if (isDayComplete(habit, key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/** Calculate the best (longest) streak ever for a habit */
export function calcBestStreak(habit: Habit): number {
  const keys = Object.keys(habit.completions).sort();
  if (keys.length === 0) return 0;

  let best = 0;
  let current = 0;
  let prevDate: Date | null = null;

  for (const key of keys) {
    const d = parseDateKey(key);
    if (isDayComplete(habit, key)) {
      if (prevDate) {
        const diff = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          current++;
        } else {
          current = 1;
        }
      } else {
        current = 1;
      }
      prevDate = d;
      best = Math.max(best, current);
    } else {
      current = 0;
      prevDate = null;
    }
  }

  return best;
}

/** Get total completions in the current calendar month */
export function getMonthCompletions(habit: Habit): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  let total = 0;

  for (const [key, count] of Object.entries(habit.completions)) {
    const d = parseDateKey(key);
    if (d.getFullYear() === year && d.getMonth() === month) {
      // For "once" habits, count each completed day as 1
      // For count habits, count actual completions
      total += count;
    }
  }

  return total;
}

/** Get all days in the current month */
export function getMonthDays(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result: string[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    result.push(dateKey(new Date(year, month, d)));
  }

  return result;
}

/** Get the day of week for a date key (0 = Sun, 6 = Sat) */
export function getDayOfWeek(key: string): number {
  return parseDateKey(key).getDay();
}

/** Generate a unique ID */
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/** Format month/year for display */
export function formatMonthYear(): string {
  const now = new Date();
  return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Human-readable full date for tooltips, e.g. "Tue, Jul 15, 2026". */
export function formatFullDate(key: string): string {
  return parseDateKey(key).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Streak length as of a given day (consecutive complete days ending on that day). */
export function calcStreakAt(habit: Habit, endKey: string): number {
  let streak = 0;
  const d = parseDateKey(endKey);
  for (let i = 0; i < 400; i++) {
    if (isDayComplete(habit, dateKey(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/** Get short day label for a date key */
export function shortDayLabel(key: string): string {
  const d = parseDateKey(key);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return "Today";
  if (diff === 1) return "Yest";

  return d.toLocaleDateString("en-US", { weekday: "short" });
}
