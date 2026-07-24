import { createMemo } from "solid-js";
import { getVirtueStats, Virtue } from "../store";

const VIRTUE_COLORS: Record<Virtue, { bar: string; text: string; bg: string }> = {
  Wisdom: { bar: "#2563eb", text: "#93c5fd", bg: "#1e3a5f" },
  Courage: { bar: "#be185d", text: "#f9a8d4", bg: "#3b1f2b" },
  Justice: { bar: "#15803d", text: "#86efac", bg: "#1a3324" },
  Temperance: { bar: "#b45309", text: "#fde68a", bg: "#2e2a0e" },
};

export function StatsView() {
  const stats = createMemo(() => getVirtueStats());
  const maxCount = createMemo(() => Math.max(...stats().map(s => s.count), 1));

  return (
    <div class="flex flex-col gap-6">
      <h2 style="font-size: 32px; color: #e2e8f0; font-weight: 700; margin: 0;">Virtue Stats</h2>

      <div class="rounded-lg p-5 flex flex-col gap-5" style="background: #0b1e27; border: 1px solid #1e3a4a;">
        {stats().map(({ virtue, count }) => {
          const c = VIRTUE_COLORS[virtue as Virtue];
          const pct = count === 0 ? 0 : (count / maxCount()) * 100;
          return (
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span style={`font-size: 18px; font-weight: 600; color: ${c.text};`}>{virtue}</span>
                <span style={`font-size: 18px; font-weight: 700; color: ${c.text};`}>{count}</span>
              </div>
              <div class="rounded-full overflow-hidden" style="height: 14px; background: #0f2535;">
                <div
                  class="rounded-full"
                  style={`height: 100%; width: ${pct}%; background: ${c.bar}; transition: width 0.5s ease;`}
                />
              </div>
            </div>
          );
        })}

        {stats().every(s => s.count === 0) && (
          <p style="color: #64748b; font-size: 16px; text-align: center;">
            Save journal entries to see your virtue breakdown here.
          </p>
        )}
      </div>

      <div class="rounded-lg p-5" style="background: #0b1e27; border: 1px solid #1e3a4a;">
        <p style="font-size: 16px; color: #64748b; margin: 0;">
          Total entries: <span style="color: #e2e8f0; font-weight: 700;">{stats().reduce((a, s) => a + s.count, 0)}</span>
        </p>
      </div>
    </div>
  );
}
