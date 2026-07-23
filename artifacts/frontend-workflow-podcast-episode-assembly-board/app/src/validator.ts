// Mix validator — every finding is computed from the live cut state
// (instances, gains, lane automation), never hardcoded.
import { AppState, lerpAutomation, SAMPLE_STEP, Instance } from './store';

export interface ValidationFinding {
  id: string;
  category: 'dialogue-band' | 'jump-threshold' | 'clipping' | 'ducking' | 'fade-continuity';
  status: 'pass' | 'fail';
  message: string;
}

type S = Pick<AppState, 'instances' | 'automation' | 'laneFlags'>;

const fmtT = (ms: number) => `${(ms / 1000).toFixed(0)}s`;

const levelAt = (s: S, lane: 'dialogue' | 'music' | 'ambient', t: number): number | null => {
  const clip = s.instances.find(i => i.lane === lane && !i.mute && i.start <= t && i.end > t);
  if (!clip || s.laneFlags[lane]?.mute) return null;
  return lerpAutomation(s.automation[lane] ?? [], t) + clip.gain;
};

export const runValidation = (s: S): ValidationFinding[] => {
  const findings: ValidationFinding[] = [];
  const times: number[] = [];
  for (let t = 0; t <= 300000; t += SAMPLE_STEP) times.push(t);

  // 1. Dialogue target band: sampled dialogue loudness must stay in [-19, -13] dB
  const dlgSamples = times
    .map(t => ({ t, v: levelAt(s, 'dialogue', t) }))
    .filter(x => x.v !== null) as { t: number; v: number }[];
  const outOfBand = dlgSamples.filter(x => x.v < -19 || x.v > -13);
  if (!dlgSamples.length) {
    findings.push({ id: 'band', category: 'dialogue-band', status: 'fail', message: 'Dialogue target band: no audible dialogue sampled — add or unmute a dialogue clip.' });
  } else if (outOfBand.length) {
    findings.push({ id: 'band', category: 'dialogue-band', status: 'fail', message: `Dialogue target band: ${outOfBand.length} sample(s) outside -19 to -13 dB (first at ${fmtT(outOfBand[0].t)}: ${outOfBand[0].v.toFixed(1)} dB).` });
  } else {
    findings.push({ id: 'band', category: 'dialogue-band', status: 'pass', message: `Dialogue target band: all ${dlgSamples.length} samples inside -19 to -13 dB (mean ${(dlgSamples.reduce((a, x) => a + x.v, 0) / dlgSamples.length).toFixed(1)} dB).` });
  }

  // 2. Jump thresholds: adjacent samples on any automated lane may not jump more than 6 dB
  let jump: { lane: string; t: number; d: number } | null = null;
  (['dialogue', 'music', 'ambient'] as const).forEach(lane => {
    for (let i = 1; i < times.length; i++) {
      const a = lerpAutomation(s.automation[lane] ?? [], times[i - 1]);
      const b = lerpAutomation(s.automation[lane] ?? [], times[i]);
      const d = Math.abs(b - a);
      if (d > 6 && (!jump || d > jump.d)) jump = { lane, t: times[i], d };
    }
  });
  findings.push(jump
    ? { id: 'jump', category: 'jump-threshold', status: 'fail', message: `Jump threshold: ${(jump as any).lane} automation jumps ${(jump as any).d.toFixed(1)} dB near ${fmtT((jump as any).t)} (limit 6 dB per ${SAMPLE_STEP / 1000}s).` }
    : { id: 'jump', category: 'jump-threshold', status: 'pass', message: 'Jump threshold: no automation jump exceeds 6 dB between samples.' });

  // 3. Clipping: sampled peak (loudness + lane peak offset) must stay below 0 dBFS
  const PEAK_OFFSET = { dialogue: 5, music: 3, ambient: 2 } as const;
  let clip: { lane: string; t: number; peak: number } | null = null;
  (['dialogue', 'music', 'ambient'] as const).forEach(lane => {
    times.forEach(t => {
      const v = levelAt(s, lane, t);
      if (v !== null) {
        const peak = v + PEAK_OFFSET[lane];
        if (peak >= 0 && (!clip || peak > clip.peak)) clip = { lane, t, peak };
      }
    });
  });
  findings.push(clip
    ? { id: 'clip', category: 'clipping', status: 'fail', message: `Clipping: ${(clip as any).lane} peaks at ${(clip as any).peak.toFixed(1)} dBFS at ${fmtT((clip as any).t)} — reduce gain or automation.` }
    : { id: 'clip', category: 'clipping', status: 'pass', message: 'Clipping: sampled peaks stay below 0 dBFS on every lane.' });

  // 4. Music-under-dialogue ducking: wherever both are audible, music must sit
  //    at least 6 dB under dialogue
  const overlapSamples = times
    .map(t => ({ t, d: levelAt(s, 'dialogue', t), m: levelAt(s, 'music', t) }))
    .filter(x => x.d !== null && x.m !== null) as { t: number; d: number; m: number }[];
  const duckFail = overlapSamples.filter(x => x.m > x.d - 6);
  if (!overlapSamples.length) {
    findings.push({ id: 'duck', category: 'ducking', status: 'pass', message: 'Ducking: no music-under-dialogue overlap sampled — nothing to duck.' });
  } else if (duckFail.length) {
    findings.push({ id: 'duck', category: 'ducking', status: 'fail', message: `Ducking: music is under-ducked at ${duckFail.length} sample(s) (at ${fmtT(duckFail[0].t)} music ${duckFail[0].m.toFixed(1)} dB vs dialogue ${duckFail[0].d.toFixed(1)} dB; need ≥ 6 dB below).` });
  } else {
    findings.push({ id: 'duck', category: 'ducking', status: 'pass', message: `Ducking: music sits ≥ 6 dB under dialogue across all ${overlapSamples.length} overlapping samples.` });
  }

  // 5. Fade continuity: fades must fit inside clip bounds; a crossfade needs a
  //    real overlap with the next clip on the lane
  const fadeProblems: string[] = [];
  s.instances.forEach((i: Instance) => {
    const dur = i.end - i.start;
    if (i.fadeIn + i.fadeOut > dur) fadeProblems.push(`${i.id}: fades (${i.fadeIn}+${i.fadeOut} ms) exceed the ${dur} ms clip`);
    if (i.crossfade) {
      const next = s.instances
        .filter(x => x.lane === i.lane && x.id !== i.id && x.start >= i.start)
        .sort((a, b) => a.start - b.start)[0];
      if (!next || next.start >= i.end) fadeProblems.push(`${i.id}: crossfade declared but no overlapping neighbor on ${i.lane}`);
    }
  });
  findings.push(fadeProblems.length
    ? { id: 'fade', category: 'fade-continuity', status: 'fail', message: `Fade continuity: ${fadeProblems.join('; ')}.` }
    : { id: 'fade', category: 'fade-continuity', status: 'pass', message: 'Fade continuity: every fade fits its clip bounds and every declared crossfade overlaps its neighbor.' });

  // 6. Cross-talk: overlapping dialogue clips must be declared on the cross-talk lane
  const dlg = s.instances.filter(i => i.lane === 'dialogue');
  let overlapPair: [string, string] | null = null;
  for (let i = 0; i < dlg.length && !overlapPair; i++) {
    for (let j = i + 1; j < dlg.length; j++) {
      if (dlg[i].start < dlg[j].end && dlg[i].end > dlg[j].start) { overlapPair = [dlg[i].id, dlg[j].id]; break; }
    }
  }
  findings.push(overlapPair
    ? { id: 'crosstalk', category: 'dialogue-band', status: 'fail', message: `Cross-talk: dialogue clips ${overlapPair[0]} and ${overlapPair[1]} overlap — move one to the cross-talk lane to declare it.` }
    : { id: 'crosstalk', category: 'dialogue-band', status: 'pass', message: 'Cross-talk: no undeclared dialogue overlaps; simultaneous speech lives on the cross-talk lane.' });

  return findings;
};
