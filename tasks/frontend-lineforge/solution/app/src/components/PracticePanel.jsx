import { h } from 'preact';
import {
  practiceStreak, practiceAccuracy, practicePrompt, practiceMessage,
  startPractice
} from '../store';

export function PracticePanel() {
  const streak = practiceStreak.value;
  const accuracy = practiceAccuracy.value;
  const prompt = practicePrompt.value;
  const message = practiceMessage.value;
  const complete = prompt === 'Line complete';

  return (
    <div class="mt-3 p-3 rounded-[10px] bg-neutral-50 border border-neutral-400">
      <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div class="text-base font-semibold" role="status">
          {prompt || 'Your move'}
        </div>
        {message && (
          <div class="text-base font-semibold" style="color: var(--color-danger);" role="status">
            {message} — play the bundled move to continue
          </div>
        )}
      </div>
      <div class="flex gap-6 text-base stat-figures">
        <div>
          <span class="text-neutral-600">Streak: </span>
          <span class="font-bold text-[var(--color-primary)]">{streak}</span>
        </div>
        <div>
          <span class="text-neutral-600">Accuracy: </span>
          <span class="font-bold">{accuracy === null ? '—' : `${accuracy}%`}</span>
        </div>
      </div>
      {complete && (
        <button type="button" class="btn-primary mt-3" onClick={startPractice}>
          Practice again
        </button>
      )}
    </div>
  );
}
