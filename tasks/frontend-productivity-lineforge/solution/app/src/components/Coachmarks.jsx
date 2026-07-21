import { h } from 'preact';
import { useState, useLayoutEffect, useEffect } from 'preact/hooks';
import { coachStep, currentOpening, COACH_STEPS } from '../store';

const STEPS = [
  { id: 'coach-practice', title: 'Practice this line', body: 'Practice this line hides the upcoming moves and quizzes you from memory. A correct move flashes the board green and advances; a wrong legal move flashes red and reverts so you can retry.' },
  { id: 'coach-save', title: 'Save this line', body: 'Save this line stores the position on the board as a named SavedLine — with tags and notes — that you can reload, rename or bulk-edit later from My Saved Lines.' },
  { id: 'coach-export', title: 'Export center', body: 'Export center compiles your session into a Study pack JSON and the Current line PGN, lets you copy or download them, and imports a pack back in to restore favorites, theme and saved lines.' }
];

export function Coachmarks() {
  const step = coachStep.value;
  const [rect, setRect] = useState(null);

  // First opening selection in a session starts the tour exactly once.
  useEffect(() => {
    if (step === 0 && currentOpening.value) coachStep.value = 1;
  }, [currentOpening.value]);

  const active = step >= 1 && step <= COACH_STEPS;
  const def = active ? STEPS[step - 1] : null;

  useLayoutEffect(() => {
    if (!active) { setRect(null); return; }
    const measure = () => {
      const el = document.getElementById(def.id);
      if (el) setRect(el.getBoundingClientRect());
      else setRect(null);
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [active, def]);

  if (!active || !def) return null;

  const next = () => { coachStep.value = step >= COACH_STEPS ? -1 : step + 1; };
  const back = () => { coachStep.value = Math.max(1, step - 1); };
  const skip = () => { coachStep.value = -1; };

  // Popover placement: prefer below the target, flip above if it would clip.
  const place = rect ? {
    top: rect.bottom + 12 > window.innerHeight - 12 ? Math.max(12, rect.top - 12) : rect.bottom + 12,
    left: Math.min(Math.max(12, rect.left), window.innerWidth - 320),
    transform: rect.bottom + 12 > window.innerHeight - 12 ? 'translateY(-100%)' : 'none'
  } : { top: 80, left: Math.max(12, window.innerWidth / 2 - 150), transform: 'none' };

  return (
    <div class="coach-layer" aria-live="polite">
      {rect && <div class="coach-ring" style={`top:${rect.top - 4}px;left:${rect.left - 4}px;width:${rect.width + 8}px;height:${rect.height + 8}px;`} aria-hidden="true" />}
      <div class="coach-card coach-enter" role="dialog" aria-label={`Tour step ${step} of ${COACH_STEPS}: ${def.title}`} style={`top:${place.top}px;left:${place.left}px;transform:${place.transform};`}>
        <div class="coach-kicker">Tour · step {step} of {COACH_STEPS}</div>
        <h3 class="coach-title">{def.title}</h3>
        <p class="coach-body">{def.body}</p>
        <div class="coach-actions">
          <button type="button" class="btn-secondary btn-compact" onClick={skip}>Skip tour</button>
          <div class="coach-spacer" />
          {step > 1 && <button type="button" class="btn-secondary btn-compact" onClick={back}>Back</button>}
          <button type="button" class="btn-primary btn-compact" onClick={next}>{step >= COACH_STEPS ? 'Finish' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}
