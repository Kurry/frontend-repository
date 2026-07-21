import { useEffect, useRef } from 'preact/hooks';

// Brief, self-clearing easter-egg canvases layered over the wallpaper.
// Confetti burst on the Konami sequence / /konami; green digital rain on /matrix.
export default function EasterCanvas({ kind, onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!kind) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const W = () => canvas.width / dpr;
    const H = () => canvas.height / dpr;

    let raf = 0;
    const duration = reduce ? 250 : 1800;
    const start = performance.now();
    const done = () => { cancelAnimationFrame(raf); ctx.clearRect(0, 0, W(), H()); onDone?.(); };

    if (reduce) {
      // Single static frame so the effect is observable without motion.
      if (kind === 'confetti') drawConfetti(ctx, W(), H(), makeConfetti(W()), 1);
      else drawMatrix(ctx, W(), H(), makeMatrix(W(), H()), 0.6);
      const t = setTimeout(done, duration);
      return () => { clearTimeout(t); cancelAnimationFrame(raf); };
    }

    if (kind === 'confetti') {
      const parts = makeConfetti(W());
      const tick = (now) => {
        const t = (now - start) / duration;
        ctx.clearRect(0, 0, W(), H());
        drawConfetti(ctx, W(), H(), parts, t);
        if (t < 1) raf = requestAnimationFrame(tick); else done();
      };
      raf = requestAnimationFrame(tick);
    } else {
      const cols = makeMatrix(W(), H());
      const tick = (now) => {
        const t = (now - start) / duration;
        drawMatrix(ctx, W(), H(), cols, t);
        if (t < 1) raf = requestAnimationFrame(tick); else done();
      };
      raf = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(raf);
  }, [kind]);

  if (!kind) return null;
  return <canvas ref={canvasRef} className="easter-canvas" aria-hidden="true" />;
}

const COLORS = ['#38bdf8', '#ff6600', '#4ade80', '#f472b6', '#fbbf24', '#a78bfa'];

function makeConfetti(W) {
  const n = 140;
  return Array.from({ length: n }, () => ({
    x: Math.random() * W,
    y: -20 - Math.random() * 120,
    vx: (Math.random() - 0.5) * 2.4,
    vy: 2 + Math.random() * 4,
    size: 5 + Math.random() * 7,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    color: COLORS[(Math.random() * COLORS.length) | 0],
  }));
}

function drawConfetti(ctx, W, H, parts, t) {
  const fade = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
  ctx.globalAlpha = Math.max(fade, 0);
  for (const p of parts) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.06;
    p.rot += p.vr;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function makeMatrix(W, H) {
  const fontSize = 14;
  const cols = Math.ceil(W / fontSize);
  const drops = Array.from({ length: cols }, () => Math.random() * -50);
  return { fontSize, drops };
}

function drawMatrix(ctx, W, H, m, t) {
  const fade = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `rgba(74,222,128,${0.9 * Math.max(fade, 0)})`;
  ctx.font = `${m.fontSize}px monospace`;
  for (let i = 0; i < m.drops.length; i += 1) {
    const ch = String.fromCharCode(0x30A0 + Math.random() * 96);
    const x = i * m.fontSize;
    const y = m.drops[i] * m.fontSize;
    ctx.fillText(ch, x, y);
    if (y > H && Math.random() > 0.975) m.drops[i] = 0;
    m.drops[i] += 1;
  }
}
