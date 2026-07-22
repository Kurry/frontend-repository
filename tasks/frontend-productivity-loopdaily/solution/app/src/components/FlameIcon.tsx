import type { Habit } from "../types";
import { calcStreak } from "../utils/helpers";
import { useId } from "react";

interface FlameIconProps {
  habit: Habit;
}

export type FlameTier = "plain" | "bright" | "gold";

export function flameTier(streak: number): FlameTier {
  if (streak >= 30) return "gold";
  if (streak >= 7) return "bright";
  return "plain";
}

// A real flame glyph (not an emoji) drawn in three visually distinct tiers.
// Every tier carries a #FFB020 fill so the secondary milestone accent reads in
// computed styles, while the tier treatments stay clearly different.
function FlameGlyph({ tier }: { tier: FlameTier }) {
  const goldGlowId = `flame-gold-${useId().replaceAll(":", "")}`;
  if (tier === "gold") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#FFB020" }}>
        <defs>
          <radialGradient id={goldGlowId} cx="50%" cy="60%" r="60%">
            <stop offset="0%" stopColor="#FFE08A" />
            <stop offset="100%" stopColor="#FFB020" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="12" cy="13" r="11" fill={`url(#${goldGlowId})`} opacity="0.55" />
        <path
          d="M12 2c1.6 3.2 5.2 4.6 5.2 9.2A5.2 5.2 0 0 1 12 16.4a5.2 5.2 0 0 1-5.2-5.2C6.8 7 9.4 6 10.4 3.6 10.8 4.9 11.6 5.7 12 6.6 12.7 5.1 12 3.4 12 2Z"
          fill="#FFB020"
        />
        <path
          d="M12 8.4c.9 1.6 2.6 2.4 2.6 4.6a2.6 2.6 0 0 1-5.2 0c0-1.6 1.1-2.2 1.7-3.4.3.7.7 1.2.9 1.7.4-.9 0-2 0-2.9Z"
          fill="#FF8C42"
        />
        <path d="m18.6 3.2 0.6 1.4 1.4 0.6 -1.4 0.6 -0.6 1.4 -0.6 -1.4 -1.4 -0.6 1.4 -0.6Z" fill="#FFD34D" />
      </svg>
    );
  }
  if (tier === "bright") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#FFB020" }}>
        <path
          d="M12 2.5c1.5 3 4.8 4.3 4.8 8.6A4.8 4.8 0 0 1 12 15.9a4.8 4.8 0 0 1-4.8-4.8C7.2 7.4 9.6 6.5 10.5 4.2c.4 1.2 1.1 2 1.5 2.8.6-1.4 0-3 0-4.5Z"
          fill="#FFB020"
        />
        <path
          d="M12 9c.8 1.4 2.2 2.1 2.2 4a2.2 2.2 0 0 1-4.4 0c0-1.4 1-1.9 1.5-3 .3.6.6 1 .7 1.5.4-.8 0-1.7 0-2.5Z"
          fill="#FFE08A"
        />
      </svg>
    );
  }
  // plain
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#FFB020" }}>
      <path
        d="M12 3c1.4 2.8 4.4 4 4.4 8A4.4 4.4 0 0 1 12 15.4 4.4 4.4 0 0 1 7.6 11c0-3.2 2.2-4.1 3-6.2.4 1.1 1 1.8 1.4 2.6.6-1.3 0-2.8 0-4.4Z"
        fill="#CBD5E1"
      />
      <path
        d="M12 9.4c.7 1.2 2 1.8 2 3.5a2 2 0 0 1-4 0c0-1.2.9-1.7 1.4-2.7.3.5.5.9.6 1.3.3-.7 0-1.5 0-2.1Z"
        fill="#FFB020"
      />
    </svg>
  );
}

export default function FlameIcon({ habit }: FlameIconProps) {
  const streak = calcStreak(habit);
  const tier = flameTier(streak);

  const tierLabel = tier === "gold" ? "gold milestone" : tier === "bright" ? "bright milestone" : "building";
  const tierText =
    tier === "gold" ? "text-[#B45309]" : tier === "bright" ? "text-[#D97706]" : "text-[#64748B]";
  const glow =
    tier === "gold"
      ? "drop-shadow-[0_0_8px_rgba(255,176,32,0.85)]"
      : tier === "bright"
      ? "drop-shadow-[0_0_5px_rgba(255,176,32,0.6)]"
      : "";

  return (
    <div
      className="flex items-center gap-1"
      role="img"
      aria-label={`${streak} day streak, ${tierLabel}`}
      data-flame-tier={tier}
      data-streak={streak}
    >
      <span className={`leading-none transition-all duration-300 ${glow}`}>
        <FlameGlyph tier={tier} />
      </span>
      <span className={`text-xs font-bold tabular-nums ${tierText}`}>{streak}</span>
    </div>
  );
}
