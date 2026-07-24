import { createSignal, onCleanup, Show } from "solid-js";
import { recordMeditationSession } from "../store";
import { showToast } from "./Toast";

type Phase = "inhale" | "hold" | "exhale";

const PHASE_DURATION = 4; // seconds each
const CYCLE_DURATION = PHASE_DURATION * 3;

function getBreathPhase(elapsed: number): { phase: Phase; phaseElapsed: number } {
  const t = elapsed % CYCLE_DURATION;
  if (t < PHASE_DURATION) return { phase: "inhale", phaseElapsed: t };
  if (t < PHASE_DURATION * 2) return { phase: "hold", phaseElapsed: t - PHASE_DURATION };
  return { phase: "exhale", phaseElapsed: t - PHASE_DURATION * 2 };
}

function phaseLabel(p: Phase) {
  return p === "inhale" ? "Inhale" : p === "hold" ? "Hold" : "Exhale";
}

export function MeditateView() {
  const PRESETS = [3, 5, 10];
  const [selectedMinutes, setSelectedMinutes] = createSignal(5);
  const [running, setRunning] = createSignal(false);
  const [elapsed, setElapsed] = createSignal(0); // seconds elapsed
  const [complete, setComplete] = createSignal(false);

  let intervalRef: ReturnType<typeof setInterval> | null = null;

  const totalSeconds = () => selectedMinutes() * 60;
  const remaining = () => Math.max(0, totalSeconds() - elapsed());
  const progress = () => elapsed() / totalSeconds();

  const breathInfo = () => getBreathPhase(elapsed());

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function start() {
    if (complete()) return;
    setRunning(true);
    intervalRef = setInterval(() => {
      setElapsed(e => {
        const next = e + 1;
        if (next >= totalSeconds()) {
          clearInterval(intervalRef!);
          intervalRef = null;
          setRunning(false);
          setComplete(true);
          recordMeditationSession();
          showToast("Meditation session complete! Great job.");
          return totalSeconds();
        }
        return next;
      });
    }, 1000);
  }

  function pause() {
    if (intervalRef) {
      clearInterval(intervalRef);
      intervalRef = null;
    }
    setRunning(false);
  }

  function reset() {
    if (intervalRef) {
      clearInterval(intervalRef);
      intervalRef = null;
    }
    setRunning(false);
    setElapsed(0);
    setComplete(false);
  }

  onCleanup(() => {
    if (intervalRef) clearInterval(intervalRef);
  });

  // SVG circle progress
  const RADIUS = 90;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = () => CIRCUMFERENCE * (1 - progress());

  // Breathing circle scale
  const breathScale = () => {
    const bi = breathInfo();
    if (bi.phase === "inhale") return 0.4 + 0.6 * (bi.phaseElapsed / PHASE_DURATION);
    if (bi.phase === "hold") return 1.0;
    return 1.0 - 0.6 * (bi.phaseElapsed / PHASE_DURATION);
  };

  return (
    <div class="flex flex-col gap-6">
      <h2 style="font-size: 32px; color: #e2e8f0; font-weight: 700; margin: 0;">Meditate</h2>

      {/* Preset buttons */}
      <div class="flex gap-3 flex-wrap">
        {PRESETS.map(mins => (
          <button
            class="btn px-5 py-2"
            style={`font-size: 18px; ${selectedMinutes() === mins
              ? "background: var(--color-primary); color: white;"
              : "background: #0b1e27; color: #94a3b8; border: 1px solid #1e3a4a;"}`}
            onClick={() => { if (!running()) { setSelectedMinutes(mins); reset(); } }}
          >
            {mins} min
          </button>
        ))}
      </div>

      {/* Session Complete Banner */}
      <Show when={complete()}>
        <div
          class="rounded-lg p-5 text-center"
          style="background: #14532d; border: 1px solid #15803d; color: #86efac; font-size: 22px; font-weight: 600;"
          role="status"
          aria-live="polite"
        >
          Session Complete! 🎉
        </div>
      </Show>

      {/* Timer display */}
      <div class="flex justify-center">
        <div class="relative flex items-center justify-center" style="width: 220px; height: 220px;">
          <svg width="220" height="220" style="position: absolute; top: 0; left: 0; transform: rotate(-90deg);">
            <circle cx="110" cy="110" r={RADIUS} fill="none" stroke="#1e3a4a" stroke-width="10" />
            <circle
              cx="110" cy="110" r={RADIUS}
              fill="none"
              stroke="var(--color-primary)"
              stroke-width="10"
              stroke-linecap="round"
              stroke-dasharray={CIRCUMFERENCE}
              stroke-dashoffset={strokeDashoffset()}
              style="transition: stroke-dashoffset 0.9s linear;"
            />
          </svg>
          <span style="font-size: 42px; font-weight: 700; color: #e2e8f0; z-index: 1; font-family: monospace;">
            {formatTime(remaining())}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div class="flex gap-3 justify-center flex-wrap">
        <Show when={!running() && !complete()}>
          <button
            class="btn px-6 py-3 text-white"
            style="background: var(--color-primary); font-size: 18px;"
            onClick={start}
          >
            Start
          </button>
        </Show>
        <Show when={running()}>
          <button
            class="btn px-6 py-3 text-white"
            style="background: #854d0e; font-size: 18px;"
            onClick={pause}
          >
            Pause
          </button>
        </Show>
        <button
          class="btn px-6 py-3"
          style="background: #1e3a4a; color: #94a3b8; font-size: 18px;"
          onClick={reset}
        >
          Reset
        </button>
      </div>

      {/* Breathing overlay — shown when running */}
      <Show when={running()}>
        <div class="flex flex-col items-center gap-4 mt-2">
          <div
            class="relative flex items-center justify-center rounded-full"
            style={`
              width: 160px; height: 160px;
              background: radial-gradient(circle, rgba(56,103,139,0.6) 0%, rgba(51,122,183,0.3) 100%);
              border: 2px solid rgba(56,103,139,0.8);
              transform: scale(${breathScale()});
              transition: transform ${breathInfo().phase === "hold" ? "0.1s" : `${PHASE_DURATION}s`} ease-in-out;
            `}
          >
            <span
              style="font-size: 20px; font-weight: 600; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.7); text-align: center; z-index: 1;"
            >
              {phaseLabel(breathInfo().phase)}
            </span>
          </div>
          <p style="font-size: 14px; color: #64748b;">4 · 4 · 4 breathing</p>
        </div>
      </Show>
    </div>
  );
}
