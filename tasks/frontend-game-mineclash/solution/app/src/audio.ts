let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try { ctx = new AudioContext(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.25) {
  const c = ac();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + dur);
  } catch { /* silent */ }
}

export function playReveal(enabled: boolean) {
  if (!enabled) return;
  tone(660, 0.08);
}

export function playMineHit(enabled: boolean) {
  if (!enabled) return;
  tone(120, 0.35, 'sawtooth', 0.4);
  setTimeout(() => tone(80, 0.25, 'sawtooth', 0.3), 120);
}

export function playOreReveal(enabled: boolean) {
  if (!enabled) return;
  tone(880, 0.06);
  setTimeout(() => tone(1100, 0.08), 60);
}

export function playRoundEnd(enabled: boolean, won: boolean) {
  if (!enabled) return;
  if (won) {
    tone(523, 0.1); setTimeout(() => tone(659, 0.1), 130); setTimeout(() => tone(784, 0.25), 260);
  } else {
    tone(330, 0.2, 'sine', 0.3); setTimeout(() => tone(247, 0.35, 'sine', 0.3), 220);
  }
}
