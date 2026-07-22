import { CurveSampleRecord, ContactEdgeRecord, CoilRecord } from './types';

// Deterministic sampled spiral:
// direction table
export const DIRECTION_TABLE = [
  [1000, 0], [866, 500], [500, 866], [0, 1000],
  [-500, 866], [-866, 500], [-1000, 0], [-866, -500],
  [-500, -866], [0, -1000], [500, -866], [866, -500]
];

export function computeSamples(coil: CoilRecord, revId: string): CurveSampleRecord[] {
  const samplesCount = coil.turnCount * 12 + 1;
  const samples: CurveSampleRecord[] = [];
  const windingSign = coil.winding === 'clockwise' ? 1 : -1;

  for (let i = 0; i < samplesCount; i++) {
    // r(i) = innerRadius + (releaseRadius-innerRadius) * i / (turnCount*12)
    const rNumerator = coil.innerRadius * (coil.turnCount * 12) + (coil.releaseRadius - coil.innerRadius) * i;
    const rDenominator = coil.turnCount * 12;

    // directionIndex = (phaseIndex + windingSign*i) mod 12 (normalized to 0..11)
    let dirIdx = (coil.phaseIndex + windingSign * i) % 12;
    if (dirIdx < 0) dirIdx += 12;

    const [dirX, dirY] = DIRECTION_TABLE[dirIdx];

    // xFixed=centerX*1000 + roundHalfAway(rNumerator*dirX/rDenominator)

    // In JS Math.round is round half up (i.e. away from 0 for positive, towards 0 for negative)
    // Actually Math.round(-0.5) is -0, so it rounds towards +infinity.
    // roundHalfAway:
    const roundHalfAway = (val: number) => {
      if (val >= 0) return Math.round(val);
      const absRound = Math.round(Math.abs(val));
      return -absRound;
    };

    const xFixed = coil.centerX * 1000 + roundHalfAway((rNumerator * dirX) / rDenominator);
    const yFixed = coil.centerY * 1000 + roundHalfAway((rNumerator * dirY) / rDenominator);

    samples.push({
      id: `sample-${coil.id}-${i}`,
      coilId: coil.id,
      sampleIndex: i,
      directionIndex: dirIdx,
      radiusNumerator: rNumerator,
      radiusDenominator: rDenominator,
      xFixed,
      yFixed,
      xUnit: xFixed / 1000,
      yUnit: yFixed / 1000,
      revisionId: revId,
      sampleHash: `hash-sample-${coil.id}-${i}-${rNumerator}-${rDenominator}-${xFixed}-${yFixed}`
    });
  }

  return samples;
}

export function computeContact(coilA: CoilRecord, coilB: CoilRecord, revId: string): ContactEdgeRecord | null {
  const dx = coilA.centerX - coilB.centerX;
  const dy = coilA.centerY - coilB.centerY;
  const distanceSquared = dx * dx + dy * dy;
  const radiusSum = coilA.releaseRadius + coilB.releaseRadius;
  const radiusSumSquared = radiusSum * radiusSum;

  let relation: 'gap' | 'tangent' | 'overlap';
  if (distanceSquared > radiusSumSquared) {
    relation = 'gap';
  } else if (distanceSquared === radiusSumSquared) {
    relation = 'tangent';
  } else {
    relation = 'overlap';
  }

  let contactX = 0;
  let contactY = 0;

  // if exact tangent, calculate boundary point
  // contactXFixed=centerAX*1000 + roundHalfAway(releaseRadiusA*(centerBX-centerAX)*1000/distance)
  if (relation === 'tangent') {
    const distance = radiusSum;
    const roundHalfAway = (val: number) => {
      if (val >= 0) return Math.round(val);
      const absRound = Math.round(Math.abs(val));
      return -absRound;
    };

    const cxFixed = coilA.centerX * 1000 + roundHalfAway(coilA.releaseRadius * (coilB.centerX - coilA.centerX) * 1000 / distance);
    const cyFixed = coilA.centerY * 1000 + roundHalfAway(coilA.releaseRadius * (coilB.centerY - coilA.centerY) * 1000 / distance);

    contactX = cxFixed / 1000;
    contactY = cyFixed / 1000;
  } else if (relation === 'gap') {
     // for gap we don't have a contact point, but we could return null unless we want to track it
     // "Only tangent pairs create ContactEdgeRecord; overlap blocks preview/commit."
     return null;
  } else {
     // Overlap is rejected before contact point requested, but just in case
     return null;
  }

  // lexical ordering for IDs
  const [minId, _maxId] = [coilA.id, coilB.id].sort();
  const sortedCoilA = minId === coilA.id ? coilA : coilB;
  const sortedCoilB = minId === coilA.id ? coilB : coilA;

  return {
    id: `contact-${sortedCoilA.id}-${sortedCoilB.id}`,
    coilAId: sortedCoilA.id,
    coilBId: sortedCoilB.id,
    distanceSquared,
    radiusSumSquared,
    relation,
    contactX,
    contactY,
    revisionId: revId,
    edgeHash: `hash-edge-${sortedCoilA.id}-${sortedCoilB.id}-${distanceSquared}-${radiusSumSquared}-${relation}`
  };
}
