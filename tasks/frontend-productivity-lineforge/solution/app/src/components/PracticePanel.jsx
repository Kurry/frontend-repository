import { h } from 'preact';
import {
  practiceStreak, practiceAccuracy, practicePrompt, practiceMessage,
  practiceEval, PRACTICE_ILLUSTRATIVE_DEPTH, startPractice
} from '../store';
import { Sparkline } from './Sparkline';

function fmtEval(v) {
  const s = v >= 0 ? '+' : '';
  return `${s}${v.toFixed(1)}`;
}

export function PracticePanel() {
  const streak = practiceStreak.value;
  const accuracy = practiceAccuracy.value;
  const prompt = practicePrompt.value;
  const message = practiceMessage.value;
  const complete = prompt === 'Line complete';
  const ev = practiceEval.value;

  return (
    <div class="mt-3 p-3 rounded-[10px] practice-panel">
      <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div class="text-base font-semibold" role="status" aria-live="polite">
          {prompt || 'Your move'}
        </div>
        {message && (
          <div class="text-base font-semibold" style="color: var(--color-danger);" role="status" aria-live="polite">
            {message} — play the bundled move to continue
          </div>
        )}
      </div>
      <div class="flex gap-6 text-base stat-figures" aria-live="polite">
        <div>
          <span class="text-neutral-600">Streak: </span>
          <span class="font-bold text-[var(--color-primary)]">{streak}</span>
        </div>
        <div>
          <span class="text-neutral-600">Accuracy: </span>
          <span class="font-bold">{accuracy === null ? '—' : `${accuracy}%`}</span>
        </div>
      </div>

      {/* Beyond-spec: illustrative, offline evaluation readout for practice. */}
      <div class="mt-3">
        <div class="flex items-center justify-between gap-2 mb-1 flex-wrap">
          <span class="text-sm font-semibold text-[var(--color-primary)]">Illustrative evaluation</span>
          <span class="text-sm text-neutral-600 stat-figures">Depth {PRACTICE_ILLUSTRATIVE_DEPTH} · offline sample</span>
        </div>
        {ev.length > 0 ? (
          <Sparkline
            values={ev}
            color="var(--color-primary)"
            baseline={0}
            formatValue={v => fmtEval(v)}
            labelFn={i => `Attempt ${i + 1}: illustrative eval ${fmtEval(ev[i])}`}
          />
        ) : (
          <p class="text-sm text-neutral-600">Make a practice move to plot the illustrative eval swing. These numbers are sample data, not a live engine.</p>
        )}
      </div>

      {complete && (
        <button type="button" class="btn-primary mt-3" onClick={startPractice}>
          Practice again
        </button>
      )}
    </div>
  );
}
