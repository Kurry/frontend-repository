// Generate deterministic fixture data: 72 local assets for "River Market Morning"

const ROLES = ['opening', 'place', 'people', 'detail', 'action', 'transition', 'closing'];

const generateFrames = () => {
  const frames = [];
  let frameId = 1;

  // 14 bursts (3-5 frames each)
  for (let b = 1; b <= 14; b++) {
    const numFrames = 3 + (b % 3);
    const burstId = `burst-${b}`;

    for (let f = 1; f <= numFrames; f++) {
      frames.push({
        id: `frame-${frameId}`,
        url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23${(frameId*123).toString(16).padStart(6, '0').substring(0, 6)}"/><text x="400" y="300" font-family="sans-serif" font-size="48" fill="white" text-anchor="middle">Frame ${frameId} (Burst ${b})</text></svg>`,
        dimensions: { width: 800, height: 600 },
        timestamp: new Date(2024, 5, 12, 8, 0, frameId * 5).toISOString(),
        metadata: { camera: 'Nikon Z8', focalLength: `${35 + (frameId % 3)*15}mm` },
        tags: [ROLES[frameId % ROLES.length], f % 2 === 0 ? 'sunny' : 'cloudy'],
        burstId,
        isDuplicatePair: null,
        isTechnicalReject: false,
        quality: 0.5 + ((frameId % 5) / 10),
      });
      frameId++;
    }
  }

  // 8 near-duplicate pairs (16 frames)
  for (let d = 1; d <= 8; d++) {
    const pairId = `dup-${d}`;
    for (let f = 1; f <= 2; f++) {
      frames.push({
        id: `frame-${frameId}`,
        url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23${(frameId*123).toString(16).padStart(6, '0').substring(0, 6)}"/><text x="400" y="300" font-family="sans-serif" font-size="48" fill="white" text-anchor="middle">Frame ${frameId} (Dup ${d})</text></svg>`,
        dimensions: { width: 800, height: 600 },
        timestamp: new Date(2024, 5, 12, 8, 30, frameId * 5).toISOString(),
        metadata: { camera: 'Nikon Z8', focalLength: '50mm' },
        tags: [ROLES[frameId % ROLES.length]],
        burstId: null,
        isDuplicatePair: pairId,
        isTechnicalReject: false,
        quality: 0.8,
      });
      frameId++;
    }
  }

  // 3 technical rejects
  for (let t = 1; t <= 3; t++) {
    frames.push({
      id: `frame-${frameId}`,
      url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23222"/><text x="400" y="300" font-family="sans-serif" font-size="48" fill="red" text-anchor="middle">Frame ${frameId} (Reject)</text></svg>`,
      dimensions: { width: 800, height: 600 },
      timestamp: new Date(2024, 5, 12, 9, 0, frameId * 5).toISOString(),
      metadata: { camera: 'Nikon Z8', focalLength: '50mm' },
      tags: ['detail'],
      burstId: null,
      isDuplicatePair: null,
      isTechnicalReject: true,
      quality: 0.1,
    });
    frameId++;
  }

  // Fill the rest to exactly 72
  while (frameId <= 72) {
    frames.push({
      id: `frame-${frameId}`,
      url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23${(frameId*123).toString(16).padStart(6, '0').substring(0, 6)}"/><text x="400" y="300" font-family="sans-serif" font-size="48" fill="white" text-anchor="middle">Frame ${frameId}</text></svg>`,
      dimensions: { width: 800, height: 600 },
      timestamp: new Date(2024, 5, 12, 9, 30, frameId * 5).toISOString(),
      metadata: { camera: 'Nikon Z8', focalLength: '50mm' },
      tags: [ROLES[frameId % ROLES.length]],
      burstId: null,
      isDuplicatePair: null,
      isTechnicalReject: false,
      quality: 0.7,
    });
    frameId++;
  }

  return frames;
};

export const FIXTURE_FRAMES = generateFrames();
