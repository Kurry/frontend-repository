import { signal } from '@preact/signals';

// Optional, subtle sound cues (beyond-spec polish). Generated entirely in-page
// with the WebAudio API — no asset files, no network. Default is ON unless the
// user prefers reduced motion, and there is a header toggle (the user
// preference). Sounds only ever fire in response to a user gesture, so the
// AudioContext is created/resumed lazily inside those handlers.

let prefersReduced = false;
if (typeof window !== 'undefined' && window.matchMedia) {
  try { prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* ignore */ }
}

export const soundsOn = signal(!prefersReduced);

let ctx = null;

function audioCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  } catch { ctx = null; }
  return ctx;
}

export function ensureAudio() {
  const c = audioCtx();
  if (c && c.state === 'suspended') { try { c.resume(); } catch { /* ignore */ } }
}

export function toggleSounds() {
  soundsOn.value = !soundsOn.value;
  if (soundsOn.value) { ensureAudio(); play('click'); }
}

// tone: short sine/triangle blip. type selects a small character set.
export function play(type) {
  if (!soundsOn.value) return;
  const c = audioCtx();
  if (!c) return;
  if (c.state === 'suspended') { try { c.resume(); } catch { /* ignore */ } }
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  let freq = 330;
  let wave = 'sine';
  let dur = 0.09;
  if (type === 'move') { freq = 392; wave = 'triangle'; dur = 0.07; }
  else if (type === 'capture') { freq = 247; wave = 'square'; dur = 0.1; }
  else if (type === 'correct') { freq = 660; wave = 'sine'; dur = 0.14; }
  else if (type === 'incorrect') { freq = 174; wave = 'sawtooth'; dur = 0.16; }
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, now);
  if (type === 'correct') osc.frequency.linearRampToValueAtTime(880, now + dur);
  if (type === 'incorrect') osc.frequency.linearRampToValueAtTime(120, now + dur);
  const peak = 0.06;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}
