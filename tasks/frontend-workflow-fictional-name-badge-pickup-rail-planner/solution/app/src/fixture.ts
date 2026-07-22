import type { Attendee, Badge, Hook, Arrival, FictionalPlan, HistoryEvent } from './types';

function generateAttendeesAndBadges() {
  const attendees: Attendee[] = [];
  const badges: Badge[] = [];

  let time = new Date('2035-05-17T09:00:00.000Z').getTime();

  for(let i=1; i<=48; i++) {
      const attendeeId = `ATT-${String(i).padStart(2, '0')}`;
      const badgeId = `BADGE-${String(i).padStart(2, '0')}`;
      const isMero = i === 27;

      const famKey = isMero ? 'MERO' : (i <= 12 ? 'BETA' : (i <= 24 ? 'KAPPA' : (i <= 36 ? 'RHO' : 'ZETA')));
      let targetHook = 'HOOK-AF';
      if (i > 12 && i <= 24) targetHook = 'HOOK-GL';
      if (i > 24 && i <= 36) targetHook = 'HOOK-MR';
      if (i > 36) targetHook = 'HOOK-SZ';

      time += 30000;
      let slot: number | null = isMero ? null : (i % 12 === 0 ? 12 : i % 12);

      if (targetHook === 'HOOK-MR' && !isMero) {
         if (i > 27) slot = (i - 1) % 12 === 0 ? 12 : (i - 1) % 12;
      }
      if (targetHook === 'HOOK-SZ') {
          slot = (i - 1) % 12 === 0 ? 12 : (i - 1) % 12;
      }

      attendees.push({
        id: attendeeId,
        displayName: isMero ? 'Nila Mero' : `Test ${famKey}`,
        familyNameKey: famKey,
        arrivalSequence: i,
        arrivalAt: new Date(time).toISOString(),
        symbol: '★',
        badgeId: badgeId,
      });

      if (isMero) {
        badges.push({
          id: badgeId,
          status: 'seeded-overflow',
          hookId: 'HOOK-GL',
          slotNumber: null,
          overflowOrdinal: 13,
          backMark: 'G–L/overflow',
        });
      } else {
         badges.push({
          id: badgeId,
          status: 'filed',
          hookId: targetHook,
          slotNumber: slot,
          overflowOrdinal: null,
          backMark: `${targetHook.replace('HOOK-', '')}/${String(slot).padStart(2, '0')}`,
        });
      }
  }

  return { attendees, badges };
}

export function getInitialPlan(): FictionalPlan {
  const { attendees, badges } = generateAttendeesAndBadges();

  const hooks: Hook[] = [
    { id: 'HOOK-AF', name: 'A–F', capacity: 12 },
    { id: 'HOOK-GL', name: 'G–L', capacity: 12 },
    { id: 'HOOK-MR', name: 'M–R', capacity: 12 },
    { id: 'HOOK-SZ', name: 'S–Z', capacity: 12 },
  ];

  const arrivals: Arrival[] = attendees.map(a => {
      const b = badges.find(bg => bg.id === a.badgeId)!;
      const canonicalHookId = a.familyNameKey.startsWith('M') ? 'HOOK-MR' : b.hookId!;
      const redirected = canonicalHookId !== b.hookId ? 1 : 0;
      return {
          sequence: a.arrivalSequence,
          arrivalId: `ARR-${a.id.split('-')[1]}`,
          attendeeId: a.id,
          badgeId: a.badgeId,
          arrivalAt: a.arrivalAt,
          storedHookId: b.hookId!,
          canonicalHookId,
          routeStepCount: 1 + redirected,
          redirected,
          predictedCompleteAt: new Date(new Date(a.arrivalAt).getTime() + (redirected ? 50000 : 20000)).toISOString()
      };
  });

  const evtAnchor: HistoryEvent = {
      id: 'EVT-40',
      type: 'anchor',
      actorId: 'system',
      logicalTime: '2035-05-17T08:30:40.000Z',
      payload: null,
      parentId: null
  };

  return {
    schema: "fictional-badge-pickup-rail/1.0",
    planId: "PLAN-01",
    revision: 18,
    attendees,
    badges,
    hooks,
    slots: [],
    arrivals,
    profile: {
        hookRows: [],
        redirects: 1,
        routeSteps: 49,
        predictedCompletion: "2035-05-17T09:24:20.000Z"
    },
    issues: [
      {
          id: 'ISSUE-05',
          status: 'open',
          title: 'wrong-range-Mero',
          description: 'Badge misfiled on G-L',
          affectedIds: ['BADGE-27']
      }
    ],
    comments: [],
    selection: { kind: "badge", ids: ["BADGE-27"], primaryId: "BADGE-27" },
    viewport: { x: 0, y: 0, zoom: 1 },
    arrivalBrush: { startSequence: 1, endSequence: 48 },
    rehearsal: { status: "not-run", cursor: 0, events: [], mark: null },
    history: { anchorEventId: "EVT-01", currentEventId: "EVT-40", events: [evtAnchor], branches: [] },
    approval: null,
    generatedAt: null,
    exportedAt: null
  };
}
