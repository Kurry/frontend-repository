export interface Habit {
  id: string;
  name: string;
  icon: string;
  targetType: "once" | "count";
  targetCount: number; // only used when targetType === "count"
  categoryId: string | null;
  reminder: string;
  paused: boolean;
  // dateString -> count (for "once", 0 or 1; for "count", 0..targetCount)
  completions: Record<string, number>;
  order: number;
  createdAt: string; // ISO date
}

export interface Category {
  id: string;
  name: string;
}

export interface AppState {
  habits: Habit[];
  categories: Category[];
  activeCategoryFilter: string | null; // null = all
}

export type ViewMode = "habits" | "stats" | "heatmap";

export type ToastMessage = {
  id: string;
  text: string;
  type: "success" | "error" | "info";
};

export const EMOJI_PALETTE = [
  "💪", "🏃", "📚", "🧘", "💧", "🥗", "😴", "✍️",
  "🎯", "🎵", "🧹", "🌱", "💊", "🚶", "🧠", "❤️",
  "⭐", "🔥", "🎨", "📝", "🏋️", "🧑‍💻", "🌍", "🐕"
] as const;
