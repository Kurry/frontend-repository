import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';

// Brief celebratory particle burst over the Match Complete screen. Fires only
// when rendered (the parent mounts it exclusively on a Player match win), then
// removes itself after the animation so it never lingers or repeats
// (motion 4.10 / anticheat: no ambient / loss / setup celebration). Pure CSS
// transform animation — no external confetti library — and collapses under the
// global prefers-reduced-motion rule.
const COLORS = ['#F59E0B', '#38BDF8', '#4ADE80', '#FB923C', '#FACC15', '#EF4444', '#FAFAF9'];

interface Piece { x: number; dx: number; rot: number; color: string; delay: number; size: number; }

function makePieces(): Piece[] {
  const out: Piece[] = [];
  for (let i = 0; i < 34; i++) {
    out.push({
      x: Math.random() * 100,
      dx: (Math.random() - 0.5) * 60,
      rot: Math.random() * 720 - 360,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.25,
      size: 6 + Math.random() * 6,
    });
  }
  return out;
}

export const Confetti = component$(() => {
  const pieces = useSignal<Piece[]>(makePieces());
  const alive = useSignal(true);

  useVisibleTask$(() => {
    const t = setTimeout(() => { alive.value = false; }, 1600);
    return () => clearTimeout(t);
  });

  if (!alive.value) return null;

  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {pieces.value.map((p, i) => (
        <span
          key={i}
          class="mc-confetti-piece"
          style={{
            position: 'absolute',
            top: '40%',
            left: `${p.x}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            background: p.color,
            borderRadius: '1px',
            ['--mc-dx' as string]: `${p.dx}vw`,
            ['--mc-rot' as string]: `${p.rot}deg`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
});
